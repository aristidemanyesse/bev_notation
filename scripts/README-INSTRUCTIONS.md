# Instructions pour peupler la base de données

## Étape 1 : Exécuter le script SQL de base

Exécutez le fichier `seed-data-fixed.sql` dans le SQL Editor de Supabase.

Ce script va créer :
- Les catégories de questions (Technique, Comportement, etc.)
- 12 questions d'évaluation prêtes à l'emploi

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

## Étape 3 : Créer les agents via l'interface

Une fois les utilisateurs créés dans Supabase Auth :

1. Connectez-vous avec **admin@entreprise.com**
2. Allez dans **Agents > Nouvel agent**
3. Pour chaque utilisateur créé, remplissez :
   - **Email** : l'email de l'utilisateur Supabase
   - **Matricule** : AGT001, AGT002, etc.
   - **Prénom et Nom** : selon la liste ci-dessus
   - **Rôle** : Administrateur ou Agent
   - **Agent actif** : Oui

## Étape 4 : Créer une campagne d'évaluation

1. Allez dans **Campagnes > Nouvelle campagne**
2. Remplissez :
   - **Titre** : Évaluation Trimestrielle T1 2025
   - **Période** : 2025-T1
   - **Sélectionnez toutes les questions** que vous voulez inclure
   - **Activer la campagne immédiatement** : Oui

3. Cliquez sur **Créer la campagne**

Le système va automatiquement :
- Associer les questions sélectionnées au formulaire
- Créer toutes les évaluations croisées entre agents (chaque agent évalue tous les autres)

## Étape 5 : Tester le système

### En tant qu'agent :
1. Déconnectez-vous
2. Connectez-vous avec **marie.dupont@entreprise.com**
3. Vous verrez les évaluations à compléter
4. Remplissez une évaluation pour tester

### En tant qu'admin :
1. Connectez-vous avec **admin@entreprise.com**
2. Consultez les statistiques dans **Vue d'ensemble**
3. Explorez les **Campagnes** pour voir la progression
4. Consultez la **Performance des agents**

## Notes importantes

- Les agents ne peuvent évaluer que d'autres agents (pas eux-mêmes)
- Les administrateurs peuvent voir toutes les données mais ne participent pas aux évaluations
- Une seule campagne peut être active par période à la fois
- Les scores vont de 1 à 5 pour chaque question

## Requêtes SQL utiles

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
ORDER BY global_score DESC;
