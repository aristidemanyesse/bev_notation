-- =========================================================
-- SUPABASE / POSTGRES - ONE-SHOT CLEAN INIT SCRIPT
-- (Schéma + Index + Fonctions + Triggers + RLS + Policies + Vues)
--
-- Exigences intégrées :
-- 1) Base saine, exécutable sur DB vide
-- 2) Auto-évaluation AUTORISÉE
-- 3) Evaluations générées dès création d’une campagne (form),
--    même si form.is_active = false (donc rien à faire à l’activation)
-- 4) Scores PONDÉRÉS par questions.weight
-- 5) RPC pour seed le 1er admin (car sinon policies bloquent)
-- =========================================================

-- ===============================
-- EXTENSIONS
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- TABLES
-- ===============================

-- Roles métier
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

-- Catégories de questions
CREATE TABLE IF NOT EXISTS public.question_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,      -- TECH, COMPORTEMENT, DISCIPLINE...
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Agents (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  matricule text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,

  role_id uuid NOT NULL REFERENCES public.roles(id),
  is_active boolean NOT NULL DEFAULT true,

  username text NOT NULL,
  username_lower text GENERATED ALWAYS AS (lower(username)) STORED,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agents_username_lower_unique
ON public.agents (username_lower);

-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  weight int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  category_id uuid REFERENCES public.question_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campagnes / formulaires
CREATE TABLE IF NOT EXISTS public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  period text NOT NULL,              -- ex: 2025-Q1
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un seul form actif par période
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_form_per_period
ON public.forms (period)
WHERE is_active = true;

-- Questions par form
CREATE TABLE IF NOT EXISTS public.form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  position int NOT NULL,
  UNIQUE (form_id, question_id)
);

-- Evaluations (auto-évaluation autorisée)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  evaluated_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  submitted_at timestamptz,
  UNIQUE (form_id, evaluator_id, evaluated_id)
);

-- Réponses
CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  UNIQUE (evaluation_id, question_id)
);

-- Index utiles (performance)
CREATE INDEX IF NOT EXISTS idx_evaluations_form_id ON public.evaluations(form_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON public.evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluated_id ON public.evaluations(evaluated_id);
CREATE INDEX IF NOT EXISTS idx_answers_evaluation_id ON public.answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions(category_id);

-- ===============================
-- FUNCTIONS (HELPERS / RPC)
-- ===============================

-- Helper: is_admin(uid)
CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agents a
    JOIN public.roles r ON r.id = a.role_id
    WHERE a.id = p_uid
      AND r.code = 'ADMIN'
      AND a.is_active = true
  );
$$;

-- RPC: seed le 1er admin (ne fonctionne que si aucun admin n'existe)
CREATE OR REPLACE FUNCTION public.seed_initial_admin(
  p_user_id uuid,
  p_matricule text,
  p_first_name text,
  p_last_name text,
  p_username text DEFAULT NULL
)
RETURNS public.agents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role_id uuid;
  v_exists_admin boolean;
  v_row public.agents;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.agents a
    JOIN public.roles r ON r.id = a.role_id
    WHERE r.code = 'ADMIN'
  ) INTO v_exists_admin;

  IF v_exists_admin THEN
    RAISE EXCEPTION 'seed_initial_admin: un ADMIN existe déjà. Opération refusée.';
  END IF;

  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE code = 'ADMIN';

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'seed_initial_admin: rôle ADMIN introuvable.';
  END IF;

  INSERT INTO public.agents (
    id, matricule, first_name, last_name, role_id, is_active, username
  )
  VALUES (
    p_user_id,
    p_matricule,
    p_first_name,
    p_last_name,
    v_admin_role_id,
    true,
    COALESCE(p_username, p_matricule)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_initial_admin(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_initial_admin(uuid, text, text, text, text) TO authenticated;

-- Génération des évaluations pour un form donné :
-- crée toutes les paires (evaluator, evaluated) incluant auto-évaluation
CREATE OR REPLACE FUNCTION public.generate_evaluations_for_form(p_form_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.evaluations (form_id, evaluator_id, evaluated_id)
  SELECT p_form_id, a1.id, a2.id
  FROM public.agents a1
  CROSS JOIN public.agents a2
  WHERE a1.is_active = true
    AND a2.is_active = true
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_evaluations_for_form(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_evaluations_for_form(uuid) TO authenticated;

-- Trigger agents: quand un agent est créé, on complète les évaluations
-- pour TOUS les forms (actifs ou non) afin que tout soit prêt d’avance.
CREATE OR REPLACE FUNCTION public.trg_agents_generate_evaluations_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1) Agents existants -> NEW (pour tous les forms)
  INSERT INTO public.evaluations (form_id, evaluator_id, evaluated_id)
  SELECT f.id, a.id, NEW.id
  FROM public.forms f
  CROSS JOIN public.agents a
  WHERE a.is_active = true
  ON CONFLICT DO NOTHING;

  -- 2) NEW -> Agents existants (pour tous les forms)
  INSERT INTO public.evaluations (form_id, evaluator_id, evaluated_id)
  SELECT f.id, NEW.id, a.id
  FROM public.forms f
  CROSS JOIN public.agents a
  WHERE a.is_active = true
  ON CONFLICT DO NOTHING;

  -- 3) Auto-évaluation NEW -> NEW (pour tous les forms)
  INSERT INTO public.evaluations (form_id, evaluator_id, evaluated_id)
  SELECT f.id, NEW.id, NEW.id
  FROM public.forms f
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agents_on_insert ON public.agents;
CREATE TRIGGER trg_agents_on_insert
AFTER INSERT ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.trg_agents_generate_evaluations_on_insert();

-- Trigger forms: quand une campagne est créée, générer immédiatement toutes les évaluations
-- (même si is_active=false) => rien à faire lors de l’activation.
CREATE OR REPLACE FUNCTION public.trg_forms_generate_evaluations_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_evaluations_for_form(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forms_on_insert ON public.forms;
CREATE TRIGGER trg_forms_on_insert
AFTER INSERT ON public.forms
FOR EACH ROW
EXECUTE FUNCTION public.trg_forms_generate_evaluations_on_insert();

-- ===============================
-- RLS ENABLE
-- ===============================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- ===============================
-- POLICIES (SIMPLIFIÉES / PROPRES)
-- ===============================

-- ROLES: lecture admin uniquement
DROP POLICY IF EXISTS roles_select_admin ON public.roles;
CREATE POLICY roles_select_admin
ON public.roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- QUESTION CATEGORIES: lecture pour tous, écriture admin
DROP POLICY IF EXISTS qc_select_all ON public.question_categories;
CREATE POLICY qc_select_all
ON public.question_categories
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS qc_write_admin ON public.question_categories;
CREATE POLICY qc_write_admin
ON public.question_categories
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- QUESTIONS: lecture pour tous, écriture admin
DROP POLICY IF EXISTS questions_select_all ON public.questions;
CREATE POLICY questions_select_all
ON public.questions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS questions_write_admin ON public.questions;
CREATE POLICY questions_write_admin
ON public.questions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- FORM_QUESTIONS: lecture pour tous, écriture admin
DROP POLICY IF EXISTS fq_select_all ON public.form_questions;
CREATE POLICY fq_select_all
ON public.form_questions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS fq_write_admin ON public.form_questions;
CREATE POLICY fq_write_admin
ON public.form_questions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- AGENTS: l’agent voit son profil, admin voit tout. CRUD admin.
DROP POLICY IF EXISTS agents_read ON public.agents;
CREATE POLICY agents_read
ON public.agents
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS agents_insert_admin ON public.agents;
CREATE POLICY agents_insert_admin
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS agents_update_admin ON public.agents;
CREATE POLICY agents_update_admin
ON public.agents
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS agents_delete_admin ON public.agents;
CREATE POLICY agents_delete_admin
ON public.agents
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- FORMS: agents lisent forms actifs, admin full access
DROP POLICY IF EXISTS forms_select_active_or_admin ON public.forms;
CREATE POLICY forms_select_active_or_admin
ON public.forms
FOR SELECT
TO authenticated
USING (
  is_active = true
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS forms_write_admin ON public.forms;
CREATE POLICY forms_write_admin
ON public.forms
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- EVALUATIONS:
-- - INSERT: seulement si evaluator_id = auth.uid() (y compris auto-évaluation)
-- - SELECT: evaluator ou evaluated ou admin
-- - UPDATE: evaluator ou admin (ex: submitted_at)
DROP POLICY IF EXISTS evaluation_insert ON public.evaluations;
CREATE POLICY evaluation_insert
ON public.evaluations
FOR INSERT
TO authenticated
WITH CHECK (evaluator_id = auth.uid());

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

DROP POLICY IF EXISTS evaluations_update ON public.evaluations;
CREATE POLICY evaluations_update
ON public.evaluations
FOR UPDATE
TO authenticated
USING (
  evaluator_id = auth.uid()
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  evaluator_id = auth.uid()
  OR public.is_admin(auth.uid())
);

-- ANSWERS:
-- - SELECT: admin OU impliqué (évaluateur/évalué)
-- - INSERT/UPDATE: admin OU évaluateur
-- - DELETE: admin
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

DROP POLICY IF EXISTS answers_insert ON public.answers;
CREATE POLICY answers_insert
ON public.answers
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND e.evaluator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS answers_update ON public.answers;
CREATE POLICY answers_update
ON public.answers
FOR UPDATE
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND e.evaluator_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.evaluations e
    WHERE e.id = answers.evaluation_id
      AND e.evaluator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS answers_delete_admin ON public.answers;
CREATE POLICY answers_delete_admin
ON public.answers
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- ===============================
-- VIEWS (PONDÉRÉES par questions.weight)
-- ===============================

-- Score global pondéré par agent et campagne
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

-- Sous-scores pondérés par catégorie
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

-- Stats évaluations agent (reçues / faites)
CREATE OR REPLACE VIEW public.agent_evaluation_stats AS
SELECT
  ag.id AS agent_id,
  f.id AS form_id,
  COUNT(DISTINCT e1.evaluator_id) FILTER (WHERE e1.submitted_at IS NOT NULL) AS evaluations_received,
  COUNT(DISTINCT e2.evaluated_id) FILTER (WHERE e2.submitted_at IS NOT NULL) AS evaluations_done
FROM public.agents ag
CROSS JOIN public.forms f
LEFT JOIN public.evaluations e1
  ON e1.evaluated_id = ag.id
 AND e1.form_id = f.id
LEFT JOIN public.evaluations e2
  ON e2.evaluator_id = ag.id
 AND e2.form_id = f.id
GROUP BY ag.id, f.id;

-- Résumé dashboard agent
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

-- ADMIN: stats par campagne
CREATE OR REPLACE VIEW public.admin_campaign_stats AS
SELECT
  f.id AS form_id,
  f.title,
  f.period,
  COUNT(DISTINCT ag.id) AS total_agents,
  COUNT(DISTINCT ag.id) * (COUNT(DISTINCT ag.id) - 1) AS total_expected_evaluations,
  COUNT(DISTINCT e.id) FILTER (WHERE e.submitted_at IS NOT NULL) AS total_submitted_evaluations,
  ROUND(
    COUNT(DISTINCT e.id) FILTER (WHERE e.submitted_at IS NOT NULL)::numeric
    / NULLIF(COUNT(DISTINCT ag.id) * (COUNT(DISTINCT ag.id) - 1), 0) * 100,
    2
  ) AS completion_rate
FROM public.forms f
CROSS JOIN public.agents ag
LEFT JOIN public.evaluations e ON e.form_id = f.id
GROUP BY f.id, f.title, f.period;

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

-- Pending evaluations (campagne active uniquement)
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
-- REVOKE (vues admin)
-- ===============================
REVOKE ALL ON public.admin_campaign_stats FROM PUBLIC;
REVOKE ALL ON public.admin_campaign_agent_stats FROM PUBLIC;
REVOKE ALL ON public.admin_campaign_category_scores FROM PUBLIC;
