-- ===============================
-- EXTENSIONS
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================
-- ROLES
-- ===============================
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,      -- ADMIN, AGENT
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO roles (code, label) VALUES
('ADMIN', 'Administrateur'),
('AGENT', 'Agent');

-- ===============================
-- AGENTS (extension de auth.users)
-- ===============================
CREATE TABLE agents (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricule text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ===============================
-- QUESTIONS
-- ===============================
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  weight int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ===============================
-- FORMULAIRES (trimestriels)
-- ===============================
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  period text NOT NULL,        -- ex: 2025-Q1
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES agents(id),
  created_at timestamptz DEFAULT now()
);

-- Un seul formulaire actif par période
CREATE UNIQUE INDEX unique_active_form_per_period
ON forms (period)
WHERE is_active = true;

-- ===============================
-- QUESTIONS PAR FORMULAIRE
-- ===============================

CREATE TABLE form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id),
  position int NOT NULL,
  UNIQUE (form_id, question_id)
);

CREATE TABLE question_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,   -- ex: TECH, COMPORTEMENT, DISCIPLINE
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);


ALTER TABLE questions
ADD COLUMN category_id uuid REFERENCES question_categories(id);

-- ===============================
-- EVALUATIONS
-- Agent A évalue Agent B pour un formulaire
-- ===============================
CREATE TABLE evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id),
  evaluator_id uuid NOT NULL REFERENCES agents(id),
  evaluated_id uuid NOT NULL REFERENCES agents(id),
  submitted_at timestamptz,

  CONSTRAINT evaluator_not_self CHECK (evaluator_id <> evaluated_id),
  UNIQUE (form_id, evaluator_id, evaluated_id)
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;


-- ===============================
-- REPONSES
-- ===============================
CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id),
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text
);

ALTER TABLE answers
ADD CONSTRAINT answers_evaluation_question_unique
UNIQUE (evaluation_id, question_id);


-- ===============================
-- SECURITY : RLS
-- ===============================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- ===============================
-- HELPER : IS_ADMIN
-- ===============================
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM agents a
    JOIN roles r ON r.id = a.role_id
    WHERE a.id = uid
      AND r.code = 'ADMIN'
  );
$$ LANGUAGE sql STABLE;

-- ===============================
-- POLICIES
-- ===============================

-- Agents : lecture
CREATE POLICY agent_read
ON agents
FOR SELECT
USING (id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY agent_insert_admin
ON agents
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY agent_update_admin
ON agents
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY agent_delete_admin
ON agents
FOR DELETE
USING (is_admin(auth.uid()));


-- Autoriser uniquement les admins à créer des forms
CREATE POLICY "forms_insert_admin"
ON forms
FOR INSERT
WITH CHECK (
  auth.role() = 'admin'
);


CREATE POLICY "forms_select_admin" 
ON forms
FOR SELECT
USING (
  auth.role() = 'ADMIN'
);
-- Evaluations : création
-- Evaluations : création (fixed)
DROP POLICY IF EXISTS evaluation_insert ON evaluations;

CREATE POLICY evaluation_insert
ON evaluations
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND evaluator_id = (SELECT auth.uid())
);

-- Evaluations : lecture
CREATE POLICY evaluation_read
ON evaluations
FOR SELECT
USING (
  evaluator_id = auth.uid()
  OR evaluated_id = auth.uid()
  OR is_admin(auth.uid())
);

-- Answers : gestion
CREATE POLICY answers_manage
ON answers
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM evaluations e
    WHERE e.id = answers.evaluation_id
      AND e.evaluator_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_select_agents"
ON forms
FOR SELECT
USING (is_active = true);


ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_read_all"
ON agents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "answers_insert_by_evaluator"
ON answers
FOR INSERT
TO authenticated
WITH CHECK (
  evaluation_id IN (
    SELECT id FROM evaluations
    WHERE evaluator_id = auth.uid()
  )
);


CREATE POLICY "answers_update_by_evaluator"
ON answers
FOR UPDATE
TO authenticated
USING (
  evaluation_id IN (
    SELECT id FROM evaluations
    WHERE evaluator_id = auth.uid()
  )
)
WITH CHECK (
  evaluation_id IN (
    SELECT id FROM evaluations
    WHERE evaluator_id = auth.uid()
  )
);


CREATE POLICY "evaluations_update_by_evaluator"
ON evaluations
FOR UPDATE
TO authenticated
USING (evaluator_id = auth.uid())
WITH CHECK (evaluator_id = auth.uid());


-- exemple pour autoriser l'update à l'utilisateur admin
CREATE POLICY "forms_update_admin" 
ON public.forms
FOR UPDATE
USING (auth.role() = 'ADMIN');


ALTER TABLE form_questions
DROP CONSTRAINT form_questions_question_id_fkey;

ALTER TABLE form_questions
ADD CONSTRAINT form_questions_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE CASCADE;


ALTER TABLE answers
DROP CONSTRAINT answers_question_id_fkey;

ALTER TABLE answers
ADD CONSTRAINT answers_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE CASCADE;
