-- ===============================
-- SCRIPT DE PEUPLEMENT CORRIGÉ
-- Plateforme d'évaluation interne
-- Structure: FORMS (pas campaigns)
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
) AS q(label, description, category, weight);

-- ===============================
-- VÉRIFICATION
-- ===============================
-- Voir toutes les questions par catégorie:
SELECT qc.label as categorie, q.label, q.weight, q.is_active
FROM questions q 
JOIN question_categories qc ON q.category_id = qc.id 
ORDER BY qc.label, q.weight DESC;
