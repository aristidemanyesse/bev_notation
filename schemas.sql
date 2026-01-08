-- ============================================================
-- SCHEMA COMPLET (ONE-SHOT) - Supabase/Postgres
-- - Auto-évaluation incluse (N² évaluations attendues)
-- - Génération des évaluations à la création d'une campagne (active ou non)
-- - Génération des évaluations à la création d'un agent
-- - Scores pondérés (questions.weight) dans les vues
-- - Vues utilitaires: dashboard + admin + export PDF (evaluation_summary)
-- ============================================================

BEGIN;

-- ===============================
-- EXTENSIONS
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- TABLES: ROLES
-- ===============================
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,      -- ADMIN, AGENT
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.roles (code, label)
VALUES
  ('ADMIN', 'Administrateur'),
  ('AGENT', 'Agent')
ON CONFLICT (code) DO NOTHING;

-- ===============================
-- TABLES: AGENTS (extension de auth.users)
-- ===============================
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role_id uuid NOT NULL REFERENCES public.roles(id),
  is_active boolean NOT NULL DEFAULT true,
  username text NOT NULL,
  username_lower text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- username = matricule par défaut
UPDATE public.agents
SET
  username = matricule,
  username_lower = lower(matricule)
WHERE (username IS NULL OR username = '')
   OR (username_lower IS NULL OR username_lower = '');

CREATE UNIQUE INDEX IF NOT EXISTS agents_username_lower_unique
ON public.agents (username_lower);

-- ===============================
-- TABLES: CATEGORIES DE QUESTIONS
-- ===============================
CREATE TABLE IF NOT EXISTS public.question_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,   -- ex: TECH, COMPORTEMENT, DISCIPLINE
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.question_categories (code, label)
VALUES
  ('TECH',        'Compétences techniques'),
  ('QUALITE',     'Qualité du travail'),
  ('COMPORTEMENT','Comportement professionnel'),
  ('DISCIPLINE',  'Discipline et respect des règles'),
  ('COMMUNICATION','Communication et collaboration')
ON CONFLICT (code) DO NOTHING;


-- ===============================
-- TABLES: QUESTIONS
-- ===============================
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  weight int NOT NULL DEFAULT 1,
  category_id uuid REFERENCES public.question_categories(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===============================
-- TABLES: FORMULAIRES / CAMPAGNES
-- ===============================
CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  period text NOT NULL,        -- ex: 2025-Q1
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.agents(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un seul formulaire actif par période
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_form_per_period
ON public.forms (period)
WHERE is_active = true;

-- ===============================
-- TABLES: QUESTIONS PAR FORMULAIRE
-- ===============================
CREATE TABLE IF NOT EXISTS public.form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position int NOT NULL,
  UNIQUE (form_id, question_id)
);

-- ===============================
-- TABLES: EVALUATIONS
-- Auto-évaluation autorisée => pas de contrainte evaluator_not_self
-- ===============================
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  evaluated_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  submitted_at timestamptz,

  UNIQUE (form_id, evaluator_id, evaluated_id)
);

-- ===============================
-- TABLES: ANSWERS
-- ===============================
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  UNIQUE (evaluation_id, question_id)
);

-- ===============================
-- TRIGGERS: sync username_lower
-- ===============================
CREATE OR REPLACE FUNCTION public.sync_username_lower()
RETURNS trigger AS $$
BEGIN
  NEW.username_lower := lower(NEW.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_username_lower ON public.agents;

CREATE TRIGGER trg_sync_username_lower
BEFORE INSERT OR UPDATE OF username
ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.sync_username_lower();

-- ===============================
-- HELPER: is_admin(uid)
-- ===============================
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agents a
    JOIN public.roles r ON r.id = a.role_id
    WHERE a.id = uid
      AND r.code = 'ADMIN'
  );
$$ LANGUAGE sql STABLE;

-- ===============================
-- GENERATION EVALUATIONS (N², auto-éval incluse)
-- - utilisé lors de création agent et création campagne
-- ===============================

CREATE OR REPLACE FUNCTION public.generate_evaluations_for_form(p_form_id uuid)
RETURNS void AS $$
DECLARE
  a1 record;
  a2 record;
BEGIN
  -- N² évaluations: chaque agent évalue chaque agent (auto-évaluation incluse)
  FOR a1 IN SELECT id FROM public.agents LOOP
    FOR a2 IN SELECT id FROM public.agents LOOP
      INSERT INTO public.evaluations(form_id, evaluator_id, evaluated_id)
      VALUES (p_form_id, a1.id, a2.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger: à la création d'une campagne, générer toutes les évaluations (même si is_active=false)
CREATE OR REPLACE FUNCTION public.on_form_created_generate_evaluations()
RETURNS trigger AS $$
BEGIN
  PERFORM public.generate_evaluations_for_form(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_form_created_generate_evaluations ON public.forms;

CREATE TRIGGER trg_form_created_generate_evaluations
AFTER INSERT ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.on_form_created_generate_evaluations();

-- Trigger: à la création d'un agent, générer toutes les évaluations pour toutes les campagnes existantes
CREATE OR REPLACE FUNCTION public.on_agent_created_generate_evaluations()
RETURNS trigger AS $$
DECLARE
  f record;
  a record;
BEGIN
  FOR f IN SELECT id FROM public.forms LOOP
    -- les agents existants (dont le nouveau) évaluent le nouveau + le nouveau évalue tout le monde
    FOR a IN SELECT id FROM public.agents LOOP
      INSERT INTO public.evaluations(form_id, evaluator_id, evaluated_id)
      VALUES (f.id, a.id, NEW.id)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.evaluations(form_id, evaluator_id, evaluated_id)
      VALUES (f.id, NEW.id, a.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- auto-évaluation explicite (au cas où)
  INSERT INTO public.evaluations(form_id, evaluator_id, evaluated_id)
  SELECT f.id, NEW.id, NEW.id
  FROM public.forms f
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_created_generate_evaluations ON public.agents;

CREATE TRIGGER trg_agent_created_generate_evaluations
AFTER INSERT ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.on_agent_created_generate_evaluations();

-- ===============================
-- RLS
-- ===============================
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- ===============================
-- POLICIES
-- ===============================

-- Agents: lecture (self ou admin)
DROP POLICY IF EXISTS agents_read ON public.agents;
CREATE POLICY agents_read
ON public.agents
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()));

-- Agents: update admin
DROP POLICY IF EXISTS agents_update_admin ON public.agents;
CREATE POLICY agents_update_admin
ON public.agents
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Agents: insert admin
DROP POLICY IF EXISTS agents_insert_admin ON public.agents;
CREATE POLICY agents_insert_admin
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Agents: delete admin
DROP POLICY IF EXISTS agents_delete_admin ON public.agents;
CREATE POLICY agents_delete_admin
ON public.agents
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Forms: select
DROP POLICY IF EXISTS forms_select_agents ON public.forms;
CREATE POLICY forms_select_agents
ON public.forms
FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin(auth.uid()));

-- Forms: insert admin
DROP POLICY IF EXISTS forms_insert_admin ON public.forms;
CREATE POLICY forms_insert_admin
ON public.forms
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Forms: update admin
DROP POLICY IF EXISTS forms_update_admin ON public.forms;
CREATE POLICY forms_update_admin
ON public.forms
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Questions + Categories: lecture pour tous authentifiés
DROP POLICY IF EXISTS questions_read ON public.questions;
CREATE POLICY questions_read
ON public.questions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS categories_read ON public.question_categories;
CREATE POLICY categories_read
ON public.question_categories
FOR SELECT
TO authenticated
USING (true);

-- Form_questions: lecture pour tous authentifiés
DROP POLICY IF EXISTS form_questions_read ON public.form_questions;
CREATE POLICY form_questions_read
ON public.form_questions
FOR SELECT
TO authenticated
USING (true);

-- Evaluations: insert par l'évaluateur (self)
DROP POLICY IF EXISTS evaluation_insert ON public.evaluations;
CREATE POLICY evaluation_insert
ON public.evaluations
FOR INSERT
TO authenticated
WITH CHECK (evaluator_id = auth.uid());

-- Evaluations: lecture (évaluateur, évalué, ou admin)
DROP POLICY IF EXISTS evaluation_read ON public.evaluations;
CREATE POLICY evaluation_read
ON public.evaluations
FOR SELECT
TO authenticated
USING (
  evaluator_id = auth.uid()
  OR evaluated_id = auth.uid()
  OR public.is_admin(auth.uid())
);

-- Evaluations: update (évaluateur uniquement) ou admin
DROP POLICY IF EXISTS evaluations_update_by_evaluator ON public.evaluations;
CREATE POLICY evaluations_update_by_evaluator
ON public.evaluations
FOR UPDATE
TO authenticated
USING (evaluator_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (evaluator_id = auth.uid() OR public.is_admin(auth.uid()));

-- Answers: insert/update par l'évaluateur de l'évaluation, ou admin
DROP POLICY IF EXISTS answers_insert_by_evaluator ON public.answers;
CREATE POLICY answers_insert_by_evaluator
ON public.answers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND (e.evaluator_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

DROP POLICY IF EXISTS answers_update_by_evaluator ON public.answers;
CREATE POLICY answers_update_by_evaluator
ON public.answers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND (e.evaluator_id = auth.uid() OR public.is_admin(auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND (e.evaluator_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);

-- Answers: select (évaluateur, évalué ou admin)
DROP POLICY IF EXISTS answers_select ON public.answers;
CREATE POLICY answers_select
ON public.answers
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND (e.evaluator_id = auth.uid() OR e.evaluated_id = auth.uid())
  )
);

-- ===============================
-- VUE: agents_public (utile front pour éviter RLS trop strict)
-- ===============================
CREATE OR REPLACE VIEW public.agents_public AS
SELECT
  a.id,
  a.matricule,
  a.first_name,
  a.last_name,
  a.is_active,
  a.created_at,
  r.code AS role_code,
  r.label AS role_label
FROM public.agents a
JOIN public.roles r ON r.id = a.role_id;

GRANT SELECT ON public.agents_public TO authenticated;

-- ===============================
-- VUES (DASHBOARD / STATS)
-- ===============================

-- Score moyen pondéré par agent et formulaire
CREATE OR REPLACE VIEW public.agent_scores AS
SELECT
  e.evaluated_id,
  e.form_id,
  ROUND(
    (
      SUM((ans.score::numeric) * COALESCE(q.weight, 1))
      / NULLIF(SUM(COALESCE(q.weight, 1))::numeric, 0)
    ),
    2
  ) AS avg_score,
  COUNT(DISTINCT e.evaluator_id) AS total_reviews
FROM public.evaluations e
JOIN public.answers ans ON ans.evaluation_id = e.id
JOIN public.questions q ON q.id = ans.question_id
GROUP BY e.evaluated_id, e.form_id;

-- Détail des notes reçues
CREATE OR REPLACE VIEW public.received_notes AS
SELECT
  e.evaluated_id,
  e.evaluator_id,
  e.form_id,
  ans.question_id,
  ans.score,
  ans.comment
FROM public.evaluations e
JOIN public.answers ans ON ans.evaluation_id = e.id;

-- Sous-scores par catégorie (pondéré)
CREATE OR REPLACE VIEW public.agent_category_scores AS
SELECT
  e.evaluated_id AS agent_id,
  e.form_id,
  qc.id AS category_id,
  qc.code AS category_code,
  qc.label AS category_label,
  ROUND(
    (
      SUM((ans.score::numeric) * COALESCE(q.weight, 1))
      / NULLIF(SUM(COALESCE(q.weight, 1))::numeric, 0)
    ),
    2
  ) AS avg_score,
  COUNT(ans.id) AS total_answers
FROM public.evaluations e
JOIN public.answers ans ON ans.evaluation_id = e.id
JOIN public.questions q ON q.id = ans.question_id
JOIN public.question_categories qc ON qc.id = q.category_id
GROUP BY
  e.evaluated_id,
  e.form_id,
  qc.id,
  qc.code,
  qc.label;

-- Stats evaluations agent (auto-évaluation incluse)
CREATE OR REPLACE VIEW public.agent_evaluation_stats AS
SELECT
  a.id AS agent_id,
  f.id AS form_id,
  COUNT(DISTINCT e1.evaluator_id) FILTER (WHERE e1.submitted_at IS NOT NULL) AS evaluations_received,
  COUNT(DISTINCT e2.evaluated_id) FILTER (WHERE e2.submitted_at IS NOT NULL) AS evaluations_done
FROM public.agents a
CROSS JOIN public.forms f
LEFT JOIN public.evaluations e1
  ON e1.evaluated_id = a.id
 AND e1.form_id = f.id
LEFT JOIN public.evaluations e2
  ON e2.evaluator_id = a.id
 AND e2.form_id = f.id
GROUP BY a.id, f.id;

CREATE OR REPLACE VIEW public.agent_dashboard_summary AS
SELECT
  s.agent_id,
  s.form_id,
  s.evaluations_received,
  s.evaluations_done,
  sc.avg_score AS global_score,
  sc.total_reviews
FROM public.agent_evaluation_stats s
LEFT JOIN public.agent_scores sc
  ON sc.evaluated_id = s.agent_id
 AND sc.form_id = s.form_id;

-- ===============================
-- ADMIN : HISTORIQUE PAR CAMPAGNE (auto-éval incluse => N²)
-- ===============================
CREATE OR REPLACE VIEW public.admin_campaign_stats AS
SELECT
  f.id AS form_id,
  f.title,
  f.period,
  f.is_active,
  COUNT(DISTINCT a.id) AS total_agents,
  (COUNT(DISTINCT a.id) * COUNT(DISTINCT a.id)) AS total_expected_evaluations,
  COUNT(DISTINCT e.id) FILTER (WHERE e.submitted_at IS NOT NULL) AS total_submitted_evaluations,
  ROUND(
    COUNT(DISTINCT e.id) FILTER (WHERE e.submitted_at IS NOT NULL)::numeric
    / NULLIF((COUNT(DISTINCT a.id) * COUNT(DISTINCT a.id))::numeric, 0) * 100,
    2
  ) AS completion_rate
FROM public.forms f
CROSS JOIN public.agents a
LEFT JOIN public.evaluations e ON e.form_id = f.id
GROUP BY f.id, f.title, f.period, f.is_active;

CREATE OR REPLACE VIEW public.admin_campaign_agent_stats AS
SELECT
  f.id AS form_id,
  f.period,
  ag.id AS agent_id,
  ag.matricule,
  ag.first_name,
  ag.last_name,
  COUNT(DISTINCT e1.evaluator_id) FILTER (WHERE e1.submitted_at IS NOT NULL) AS evaluations_received,
  COUNT(DISTINCT e2.evaluated_id) FILTER (WHERE e2.submitted_at IS NOT NULL) AS evaluations_done,
  sc.avg_score AS global_score
FROM public.forms f
JOIN public.agents ag ON true
LEFT JOIN public.evaluations e1
  ON e1.form_id = f.id AND e1.evaluated_id = ag.id
LEFT JOIN public.evaluations e2
  ON e2.form_id = f.id AND e2.evaluator_id = ag.id
LEFT JOIN public.agent_scores sc
  ON sc.form_id = f.id AND sc.evaluated_id = ag.id
GROUP BY
  f.id,
  f.period,
  ag.id,
  ag.matricule,
  ag.first_name,
  ag.last_name,
  sc.avg_score;

CREATE OR REPLACE VIEW public.admin_campaign_category_scores AS
SELECT
  e.form_id,
  e.evaluated_id AS agent_id,
  qc.code AS category_code,
  qc.label AS category_label,
  ROUND(
    (
      SUM((ans.score::numeric) * COALESCE(q.weight, 1))
      / NULLIF(SUM(COALESCE(q.weight, 1))::numeric, 0)
    ),
    2
  ) AS avg_score,
  COUNT(ans.id) AS total_answers
FROM public.evaluations e
JOIN public.answers ans ON ans.evaluation_id = e.id
JOIN public.questions q ON q.id = ans.question_id
JOIN public.question_categories qc ON qc.id = q.category_id
GROUP BY
  e.form_id,
  e.evaluated_id,
  qc.code,
  qc.label;

REVOKE ALL ON public.admin_campaign_stats FROM PUBLIC;
REVOKE ALL ON public.admin_campaign_agent_stats FROM PUBLIC;
REVOKE ALL ON public.admin_campaign_category_scores FROM PUBLIC;

-- ===============================
-- PENDING EVALUATIONS (campagne active + non soumise)
-- ===============================
CREATE OR REPLACE VIEW public.agent_pending_evaluations AS
SELECT
  e.*,
  f.title AS form_title,
  f.period AS form_period,
  f.created_at AS form_created_at
FROM public.evaluations e
JOIN public.forms f ON f.id = e.form_id
WHERE f.is_active = true
  AND e.submitted_at IS NULL;

-- ===============================
-- EXPORT / PDF: evaluation_summary (pondéré + complétion)
-- ===============================
CREATE OR REPLACE VIEW public.evaluation_summary AS
SELECT
  e.id AS evaluation_id,
  e.form_id,
  e.evaluator_id,
  e.evaluated_id,
  e.submitted_at,

  COUNT(a.id) AS answered_count,

  (SELECT COUNT(*) FROM public.form_questions fq WHERE fq.form_id = e.form_id) AS total_questions,

  CASE
    WHEN (SELECT COUNT(*) FROM public.form_questions fq WHERE fq.form_id = e.form_id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(a.id)::numeric
        / (SELECT COUNT(*) FROM public.form_questions fq WHERE fq.form_id = e.form_id)::numeric
      ) * 100
    )::int
  END AS completion_pct,

  ROUND(
    (
      SUM((a.score::numeric) * COALESCE(q.weight, 1))
      / NULLIF(SUM(COALESCE(q.weight, 1))::numeric, 0)
    ),
    2
  ) AS weighted_avg_score

FROM public.evaluations e
LEFT JOIN public.answers a ON a.evaluation_id = e.id
LEFT JOIN public.questions q ON q.id = a.question_id
GROUP BY e.id, e.form_id, e.evaluator_id, e.evaluated_id, e.submitted_at;

COMMIT;
