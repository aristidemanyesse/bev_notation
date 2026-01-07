# Instructions pour peupler la base de données

## Étape 1 : Exécuter le script SQL de base

Exécutez le fichier `seed-data.sql` dans le SQL Editor de Supabase.

Ce script va créer :
- Les catégories de questions (Technique, Comportement, Discipline, Communication, Collaboration)
- 12 questions d'évaluation prêtes à l'emploi
- Un formulaire d'évaluation pour Q1 2025
- Les associations entre le formulaire et les questions

## Étape 2 : Créer les utilisateurs dans Supabase Auth

Allez dans **Supabase Dashboard > Authentication > Users > Add User**

### Administrateurs à créer :
1. **Email:** admin@entreprise.com | **Mot de passe:** Admin123!
2. **Email:** directeur@entreprise.com | **Mot de passe:** Direct123!

### Agents à créer :
3. **Email:** marie.dupont@entreprise.com | **Mot de passe:** Marie123!
4. **Email:** jean.martin@entreprise.com | **Mot de passe:** Jean123!
5. **Email:** sophie.bernard@entreprise.com | **Mot de passe:** Sophie123!
6. **Email:** pierre.dubois@entreprise.com | **Mot de passe:** Pierre123!
7. **Email:** lucie.thomas@entreprise.com | **Mot de passe:** Lucie123!
8. **Email:** marc.robert@entreprise.com | **Mot de passe:** Marc123!

## Étape 3 : Créer les agents via l'interface de l'application

Une fois les utilisateurs créés dans Supabase Auth :

1. **Connectez-vous** avec **admin@entreprise.com** / **Admin123!**
2. Allez dans **Agents > Nouvel agent**
3. Pour chaque utilisateur créé, remplissez le formulaire :
   - **Email** : l'email exact de l'utilisateur Supabase
   - **Matricule** : AGT001, AGT002, AGT003, etc.
   - **Prénom et Nom** : selon la liste ci-dessus
   - **Rôle** : Administrateur ou Agent
   - **Agent actif** : Coché

**Exemple pour Marie Dupont :**
- Email: marie.dupont@entreprise.com
- Matricule: AGT001
- Prénom: Marie
- Nom: Dupont
- Rôle: Agent
- Agent actif: Oui

Répétez pour tous les utilisateurs.

## Étape 4 : Créer une campagne d'évaluation

1. Allez dans **Campagnes > Nouvelle campagne**
2. Remplissez le formulaire :
   - **Titre** : Évaluation Trimestrielle T1 2025
   - **Période** : 2025-T1
   - **Sélectionnez toutes les questions** que vous voulez inclure
   - **Activer la campagne immédiatement** : Oui si vous voulez que les agents puissent commencer

3. Cliquez sur **Créer la campagne**

Le système va automatiquement :
- Associer les questions sélectionnées au formulaire
- Créer toutes les évaluations croisées entre agents (chaque agent évalue tous les autres sauf lui-même)

## Étape 5 : Tester le système

### En tant qu'agent :
1. Déconnectez-vous
2. Connectez-vous avec **marie.dupont@entreprise.com** / **Marie123!**
3. Vous verrez le tableau de bord agent avec les évaluations à compléter
4. Cliquez sur une évaluation et remplissez le formulaire pour tester

### En tant qu'admin :
1. Connectez-vous avec **admin@entreprise.com** / **Admin123!**
2. Consultez les statistiques dans **Vue d'ensemble**
3. Explorez **Campagnes** pour voir la progression
4. Consultez **Agents** pour gérer les utilisateurs
5. Consultez **Questions** pour gérer les questions d'évaluation

## Notes importantes

- Les agents ne peuvent évaluer que d'autres agents (pas eux-mêmes)
- Les administrateurs peuvent voir toutes les données mais ne participent pas aux évaluations
- Une seule campagne peut être active par période à la fois
- Les scores vont de 1 à 5 pour chaque question
- Les commentaires sont optionnels

## Requêtes SQL utiles pour déboguer

```sql
-- Voir toutes les évaluations d'une campagne
SELECT 
  e.id,
  eval.first_name || ' ' || eval.last_name as evaluateur,
  evald.first_name || ' ' || evald.last_name as evalué,
  e.submitted_at,
  f.title
FROM evaluations e
JOIN agents eval ON e.evaluator_id = eval.id
JOIN agents evald ON e.evaluated_id = evald.id
JOIN forms f ON e.form_id = f.id
ORDER BY e.submitted_at DESC NULLS LAST;

-- Voir les statistiques d'une campagne
SELECT * FROM admin_campaign_stats;

-- Voir les scores par agent
SELECT * FROM admin_campaign_agent_stats 
ORDER BY global_score DESC NULLS LAST;

-- Vérifier les catégories et questions
SELECT qc.label as categorie, q.label, q.weight, q.is_active
FROM questions q 
JOIN question_categories qc ON q.category_id = qc.id 
ORDER BY qc.label, q.weight DESC;
```

## Dépannage

**Problème : "Aucun utilisateur trouvé avec cet email"**
- Solution : Assurez-vous d'avoir créé l'utilisateur dans Supabase Auth d'abord

**Problème : "Le matricule existe peut-être déjà"**
- Solution : Chaque matricule doit être unique. Utilisez AGT001, AGT002, etc.

**Problème : "Aucune notation trouvée"**
- Solution : Créez une campagne via l'interface admin

**Problème : L'agent ne voit pas ses évaluations**
- Solution : Vérifiez que la campagne est active et que l'agent est actif
