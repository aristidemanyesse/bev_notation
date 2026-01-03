-- ===============================
-- SCRIPT COMPLET DE PEUPLEMENT
-- Plateforme d'évaluation interne
-- ===============================

-- ===============================
-- 1. CATÉGORIES DE QUESTIONS
-- ===============================
INSERT INTO question_categories (code, label) VALUES
('TECH', 'Compétences Techniques'),
('COMPORTEMENT', 'Comportement Professionnel'),
('DISCIPLINE', 'Rigueur et Discipline'),
('COMMUNICATION', 'Communication'),
('COLLABORATION', 'Travail d''équipe')
ON CONFLICT (code) DO NOTHING;

-- ===============================
-- 2. QUESTIONS
-- ===============================
INSERT INTO questions (label, description, category_id, weight, is_active)
SELECT 
  q.label,
  q.description,
  (SELECT id FROM question_categories WHERE code = q.category),
  q.weight,
  true
FROM (VALUES
  ('Maîtrise des outils techniques', 'Capacité à utiliser efficacement les outils et technologies requis', 'TECH', 3),
  ('Qualité du travail fourni', 'Précision et excellence dans les livrables', 'TECH', 3),
  ('Résolution de problèmes', 'Aptitude à identifier et résoudre les problèmes de manière autonome', 'TECH', 2),
  ('Ponctualité et assiduité', 'Respect des horaires et présence régulière', 'DISCIPLINE', 2),
  ('Respect des procédures', 'Application rigoureuse des processus établis', 'DISCIPLINE', 2),
  ('Communication orale', 'Clarté et efficacité dans les échanges verbaux', 'COMMUNICATION', 2),
  ('Communication écrite', 'Qualité des rapports et documents produits', 'COMMUNICATION', 2),
  ('Esprit d''équipe', 'Capacité à collaborer efficacement avec les collègues', 'COLLABORATION', 3),
  ('Partage de connaissances', 'Volonté de transmettre son savoir aux autres', 'COLLABORATION', 2),
  ('Attitude professionnelle', 'Comportement respectueux et professionnel', 'COMPORTEMENT', 3),
  ('Gestion du stress', 'Capacité à maintenir son efficacité sous pression', 'COMPORTEMENT', 2),
  ('Initiative et proactivité', 'Prise d''initiatives positives pour améliorer le travail', 'COMPORTEMENT', 2)
) AS q(label, description, category, weight)
ON CONFLICT DO NOTHING;

-- ===============================
-- 3. CRÉATION D'UNE CAMPAGNE D'ÉVALUATION
-- ===============================
INSERT INTO campaigns (
  title, 
  description, 
  start_date, 
  end_date, 
  status,
  created_at
) VALUES (
  'Évaluation Trimestrielle Q1 2025',
  'Évaluation par les pairs pour le premier trimestre 2025. Chaque agent évalue ses collègues selon les critères définis.',
  '2025-01-15',
  '2025-02-15',
  'active',
  now()
) ON CONFLICT DO NOTHING;

-- ===============================
-- 4. ASSOCIATION DES QUESTIONS À LA CAMPAGNE
-- ===============================
-- Sélectionne toutes les questions actives pour cette campagne
INSERT INTO campaign_questions (campaign_id, question_id)
SELECT 
  (SELECT id FROM campaigns WHERE title = 'Évaluation Trimestrielle Q1 2025'),
  q.id
FROM questions q
WHERE q.is_active = true
ON CONFLICT DO NOTHING;

-- ===============================
-- 5. AGENTS DE TEST
-- ===============================
-- Note: Dans Supabase, vous devez d'abord créer les utilisateurs dans l'interface Auth
-- Ensuite, utilisez leurs UUIDs ici pour créer les agents correspondants

-- INSTRUCTIONS POUR CRÉER LES UTILISATEURS:
-- ==========================================
-- Allez dans Supabase Dashboard > Authentication > Users > Add User
-- Créez les utilisateurs suivants:

-- ADMINISTRATEURS:
-- 1. admin@entreprise.com | Mot de passe: Admin123!
-- 2. directeur@entreprise.com | Mot de passe: Direct123!

-- AGENTS:
-- 3. marie.dupont@entreprise.com | Mot de passe: Marie123!
-- 4. jean.martin@entreprise.com | Mot de passe: Jean123!
-- 5. sophie.bernard@entreprise.com | Mot de passe: Sophie123!
-- 6. pierre.dubois@entreprise.com | Mot de passe: Pierre123!
-- 7. lucie.thomas@entreprise.com | Mot de passe: Lucie123!
-- 8. marc.robert@entreprise.com | Mot de passe: Marc123!

-- Après création, récupérez leurs UUIDs et exécutez ce qui suit:

-- EXEMPLE D'INSERTION (remplacez les UUIDs):
/*
INSERT INTO agents (id, matricule, first_name, last_name, role_id, is_active) VALUES
('REMPLACER-PAR-UUID-ADMIN', 'ADM001', 'Admin', 'Principal', (SELECT id FROM roles WHERE code = 'ADMIN'), true),
('REMPLACER-PAR-UUID-DIRECTEUR', 'DIR001', 'Directeur', 'Général', (SELECT id FROM roles WHERE code = 'ADMIN'), true),
('REMPLACER-PAR-UUID-MARIE', 'AGT001', 'Marie', 'Dupont', (SELECT id FROM roles WHERE code = 'AGENT'), true),
('REMPLACER-PAR-UUID-JEAN', 'AGT002', 'Jean', 'Martin', (SELECT id FROM roles WHERE code = 'AGENT'), true),
('REMPLACER-PAR-UUID-SOPHIE', 'AGT003', 'Sophie', 'Bernard', (SELECT id FROM roles WHERE code = 'AGENT'), true),
('REMPLACER-PAR-UUID-PIERRE', 'AGT004', 'Pierre', 'Dubois', (SELECT id FROM roles WHERE code = 'AGENT'), true),
('REMPLACER-PAR-UUID-LUCIE', 'AGT005', 'Lucie', 'Thomas', (SELECT id FROM roles WHERE code = 'AGENT'), true),
('REMPLACER-PAR-UUID-MARC', 'AGT006', 'Marc', 'Robert', (SELECT id FROM roles WHERE code = 'AGENT'), true);
*/

-- ===============================
-- 6. GÉNÉRATION AUTOMATIQUE DES ÉVALUATIONS
-- ===============================
-- Cette partie génère automatiquement toutes les évaluations croisées entre agents
-- Chaque agent doit évaluer tous les autres agents (sauf lui-même)

-- EXEMPLE pour générer les évaluations (à exécuter après insertion des agents):
/*
INSERT INTO evaluations (campaign_id, evaluator_id, evaluated_id, status)
SELECT 
  (SELECT id FROM campaigns WHERE title = 'Évaluation Trimestrielle Q1 2025'),
  evaluator.id,
  evaluated.id,
  'pending'
FROM agents evaluator
CROSS JOIN agents evaluated
WHERE evaluator.id != evaluated.id
  AND evaluator.role_id = (SELECT id FROM roles WHERE code = 'AGENT')
  AND evaluated.role_id = (SELECT id FROM roles WHERE code = 'AGENT')
ON CONFLICT DO NOTHING;
*/

-- ===============================
-- 7. EXEMPLES D'ÉVALUATIONS COMPLÉTÉES
-- ===============================
-- Voici comment créer quelques évaluations déjà remplies pour tester

-- EXEMPLE: Marie évalue Jean (à adapter avec les vrais UUIDs):
/*
-- Marquer l'évaluation comme soumise
UPDATE evaluations 
SET status = 'completed', submitted_at = now()
WHERE evaluator_id = 'UUID-MARIE' 
  AND evaluated_id = 'UUID-JEAN'
  AND campaign_id = (SELECT id FROM campaigns WHERE title = 'Évaluation Trimestrielle Q1 2025');

-- Ajouter les réponses
INSERT INTO answers (evaluation_id, question_id, score, comment)
SELECT 
  (SELECT id FROM evaluations WHERE evaluator_id = 'UUID-MARIE' AND evaluated_id = 'UUID-JEAN'),
  q.id,
  CASE 
    WHEN random() < 0.2 THEN 5
    WHEN random() < 0.5 THEN 4
    WHEN random() < 0.8 THEN 3
    ELSE 2
  END, -- Score aléatoire entre 2 et 5
  CASE 
    WHEN random() < 0.5 THEN 'Excellent travail, continue comme ça!'
    ELSE NULL
  END
FROM questions q
WHERE q.is_active = true;
*/

-- ===============================
-- RÉSUMÉ DES ÉTAPES
-- ===============================
-- 1. Exécuter ce script SQL jusqu'à la section 4 (incluse)
-- 2. Créer les utilisateurs manuellement dans Supabase Auth UI
-- 3. Récupérer leurs UUIDs
-- 4. Décommenter et adapter les sections 5-7 avec les vrais UUIDs
-- 5. Exécuter les sections restantes

-- ===============================
-- REQUÊTES UTILES POUR VÉRIFIER
-- ===============================
-- Voir toutes les questions par catégorie:
-- SELECT qc.label as categorie, q.label, q.weight 
-- FROM questions q 
-- JOIN question_categories qc ON q.category_id = qc.id 
-- ORDER BY qc.label, q.weight DESC;

-- Voir la progression de la campagne:
-- SELECT * FROM campaign_progress;

-- Voir les évaluations d'un agent:
-- SELECT * FROM agent_evaluations WHERE agent_id = 'UUID-AGENT';
