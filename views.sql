

-- ===============================
-- VUES (DASHBOARD)
-- ===============================

-- Score moyen par agent et formulaire
CREATE VIEW agent_scores AS
SELECT
  e.evaluated_id,
  e.form_id,
  ROUND(AVG(a.score)::numeric, 2) AS avg_score,
  COUNT(DISTINCT e.evaluator_id) AS total_reviews
FROM evaluations e
JOIN answers a ON a.evaluation_id = e.id
GROUP BY e.evaluated_id, e.form_id;

-- Détail des notes reçues
CREATE VIEW received_notes AS
SELECT
  e.evaluated_id,
  e.evaluator_id,
  e.form_id,
  a.question_id,
  a.score,
  a.comment
FROM evaluations e
JOIN answers a ON a.evaluation_id = e.id;

-- ===============================
-- SOUS-SCORES PAR CATEGORIE
-- ===============================


CREATE VIEW agent_category_scores AS
SELECT
  e.evaluated_id AS agent_id,
  e.form_id,
  qc.id AS category_id,
  qc.code AS category_code,
  qc.label AS category_label,
  ROUND(AVG(a.score)::numeric, 2) AS avg_score,
  COUNT(a.id) AS total_answers
FROM evaluations e
JOIN answers a ON a.evaluation_id = e.id
JOIN questions q ON q.id = a.question_id
JOIN question_categories qc ON qc.id = q.category_id
GROUP BY
  e.evaluated_id,
  e.form_id,
  qc.id,
  qc.code,
  qc.label;

-- ===============================
-- STATS EVALUATIONS AGENT
-- ===============================
CREATE VIEW agent_evaluation_stats AS
SELECT
  a.id AS agent_id,
  f.id AS form_id,
  COUNT(DISTINCT e1.evaluator_id) AS evaluations_received,
  COUNT(DISTINCT e2.evaluated_id) AS evaluations_done
FROM agents a
CROSS JOIN forms f
LEFT JOIN evaluations e1
  ON e1.evaluated_id = a.id
 AND e1.form_id = f.id
 AND e1.submitted_at IS NOT NULL
LEFT JOIN evaluations e2
  ON e2.evaluator_id = a.id
 AND e2.form_id = f.id
 AND e2.submitted_at IS NOT NULL
GROUP BY a.id, f.id;


CREATE VIEW agent_dashboard_summary AS
SELECT
  s.agent_id,
  s.form_id,
  s.evaluations_received,
  s.evaluations_done,
  sc.avg_score AS global_score,
  sc.total_reviews
FROM agent_evaluation_stats s
LEFT JOIN agent_scores sc
  ON sc.evaluated_id = s.agent_id
 AND sc.form_id = s.form_id;


-- ===============================
-- ADMIN : HISTORIQUE PAR CAMPAGNE
-- ===============================

CREATE VIEW admin_campaign_stats AS
SELECT
  f.id AS form_id,
  f.title,
  f.period,
  COUNT(DISTINCT a.id) AS total_agents,
  COUNT(DISTINCT a.id) * (COUNT(DISTINCT a.id) - 1) AS total_expected_evaluations,
  COUNT(DISTINCT e.id) FILTER (WHERE e.submitted_at IS NOT NULL)
    AS total_submitted_evaluations,
  ROUND(
    COUNT(DISTINCT e.id) FILTER (WHERE e.submitted_at IS NOT NULL)::numeric
    / NULLIF(
        COUNT(DISTINCT a.id) * (COUNT(DISTINCT a.id) - 1),
        0
      ) * 100,
    2
  ) AS completion_rate
FROM forms f
CROSS JOIN agents a
LEFT JOIN evaluations e ON e.form_id = f.id
GROUP BY f.id, f.title, f.period;

CREATE VIEW admin_campaign_agent_stats AS
SELECT
  f.id AS form_id,
  f.period,
  ag.id AS agent_id,
  ag.matricule,
  ag.first_name,
  ag.last_name,
  COUNT(DISTINCT e1.evaluator_id)
    FILTER (WHERE e1.submitted_at IS NOT NULL)
    AS evaluations_received,
  COUNT(DISTINCT e2.evaluated_id)
    FILTER (WHERE e2.submitted_at IS NOT NULL)
    AS evaluations_done,
  sc.avg_score AS global_score
FROM forms f
JOIN agents ag ON true
LEFT JOIN evaluations e1
  ON e1.form_id = f.id AND e1.evaluated_id = ag.id
LEFT JOIN evaluations e2
  ON e2.form_id = f.id AND e2.evaluator_id = ag.id
LEFT JOIN agent_scores sc
  ON sc.form_id = f.id AND sc.evaluated_id = ag.id
GROUP BY
  f.id,
  f.period,
  ag.id,
  ag.matricule,
  ag.first_name,
  ag.last_name,
  sc.avg_score;

CREATE VIEW admin_campaign_category_scores AS
SELECT
  e.form_id,
  e.evaluated_id AS agent_id,
  qc.code AS category_code,
  qc.label AS category_label,
  ROUND(AVG(a.score)::numeric, 2) AS avg_score,
  COUNT(a.id) AS total_answers
FROM evaluations e
JOIN answers a ON a.evaluation_id = e.id
JOIN questions q ON q.id = a.question_id
JOIN question_categories qc ON qc.id = q.category_id
GROUP BY
  e.form_id,
  e.evaluated_id,
  qc.code,
  qc.label;


REVOKE ALL ON admin_campaign_stats FROM PUBLIC;
REVOKE ALL ON admin_campaign_agent_stats FROM PUBLIC;
REVOKE ALL ON admin_campaign_category_scores FROM PUBLIC;


CREATE OR REPLACE VIEW agent_pending_evaluations AS
SELECT
  e.*,
  f.title AS form_title,
  f.period AS form_period,
  f.created_at AS form_created_at
FROM evaluations e
JOIN forms f ON f.id = e.form_id
WHERE f.is_active = true
  AND e.submitted_at IS NULL;
