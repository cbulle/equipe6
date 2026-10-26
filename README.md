# Livret de l'apprenant SPV / JSP

Application web & mobile (PWA) de dématérialisation du livret d'apprenant
Sapeur-Pompier Volontaire & Jeunes Sapeurs-Pompiers — Équipe 6.

**Stack** : React 18 · Vite · TypeScript · Tailwind CSS 4 · Firebase (Auth, Firestore, Hosting) · react-i18next · PWA (offline).

**100 % gratuit** : l'application tient dans l'offre Firebase **Spark**, sans carte bancaire. Elle n'utilise ni Cloud Functions ni Storage.

## Démarrage rapide (émulateurs locaux)

Prérequis : Node 22+, Java 11+ (requis par l'émulateur Firestore), Firebase CLI (`npm i -g firebase-tools`).

```bash
npm install
cp .env.example .env.local          # VITE_USE_EMULATORS=true par défaut

npm run emulators                   # terminal 1 : Auth + Firestore
npm run seed:emulator               # terminal 2 : référentiel + comptes de démo
npm run dev                         # terminal 3 : http://localhost:5173
```

Comptes de démo créés par le seed :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin@spv.local` | `Admin1234!` |
| Formateur (référent Équipe 6) | `formateur@spv.local` | `Formateur1234!` |
| Stagiaire SPV | `spv@spv.local` | `Stagiaire1234!` |
| Stagiaire JSP 3 | `jsp@spv.local` | `Stagiaire1234!` |
| Stagiaire JSP 4 sans groupe | `sansgroupe@spv.local` | `Stagiaire1234!` |

## Mise en production (plan Spark gratuit)

1. Créer le projet Firebase, puis activer **Authentication** (fournisseur e-mail / mot de passe) et **Firestore** (région `europe-west1` par exemple).
2. Ajouter une application Web et reporter ses clés dans `.env.local` (`VITE_USE_EMULATORS=false`), puis renseigner l'identifiant du projet dans `.firebaserc`.
3. Créer le premier administrateur et le référentiel. Il faut une clé de compte de service : *Paramètres du projet > Comptes de service > Générer une nouvelle clé privée*. Ne la commitez jamais.
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
   SEED_ADMIN_EMAIL=admin@mon-sdis.fr SEED_ADMIN_PASSWORD='***' npm run seed
   ```
4. `npm run build && firebase deploy`. Cela déploie les règles Firestore et l'hébergement.

Quotas gratuits Firestore : 50 000 lectures et 20 000 écritures par jour, 1 Go stocké. Le cache hors ligne limite les relectures. Une équipe de quelques dizaines de personnes reste très en dessous.

## Fonctionnement sans Cloud Functions

- **Rôles** : ils sont stockés dans le profil `users/{uid}` (`role`, `active`) et vérifiés par [firestore.rules](firestore.rules). Seul un administrateur peut écrire un profil, et il ne peut ni changer son propre rôle ni se désactiver.
- **Création de compte** : l'admin crée le compte depuis l'application, via une instance Auth secondaire, sans être déconnecté. Il écrit ensuite le profil.
- **Mot de passe** : chacun peut demander un lien depuis « Mot de passe oublié ? » sur l'écran de connexion, et l'admin peut l'envoyer depuis la fiche utilisateur. Avec les émulateurs, aucun e-mail n'est envoyé : le lien apparaît dans la console de l'émulateur Auth. L'adresse de connexion n'est pas modifiable depuis l'app.
- **Suppression / désactivation** : supprimer le profil ou décocher « Compte actif » retire immédiatement tout accès. L'identifiant de connexion reste listé dans la console Firebase (*Authentication*), d'où on peut le supprimer définitivement.
- **Documents** : les PDF et fiches sont hébergés sur votre espace de partage (Google Drive, SharePoint, site officiel…). L'application ne stocke que les liens. L'accès aux fichiers dépend donc des droits de partage de cet espace.

## Architecture

```
src/
  config/        initialisation Firebase (cache offline persistant, instance Auth secondaire, émulateurs)
  types/         modèles de données + énumérations (rôles, statuts, échelles…)
  services/      accès Firestore / Auth, un fichier par domaine
  hooks/         abonnements temps réel (useCollectionData, useDocumentData) et hooks métier
  contexts/      AuthProvider (utilisateur, profil, rôle)
  components/
    ui/          design system (Button, Modal, FormFields, Tabs, SegmentedControl…)
    layout/      AppLayout (sidebar / menu mobile), sélecteur de langue
    routing/     RequireAuth, RequireRole
    booklet/     livret : en-tête, grilles N1/N2/N3, fiche JSP, présences, entretiens, vœux
    sessions/    carte et formulaire de séance
  pages/         pages routées (chargées à la demande) ; pages/admin pour le super-CRUD
  i18n/          configuration + locales/fr.json, locales/en.json
scripts/seed.mjs référentiel des grilles du livret, planning 2026-2027, groupe Équipe 6
```

### Modèle Firestore

| Collection | Contenu |
|---|---|
| `users` | profil, `role`, `active`, `apprenticeType` (`SPV` / `JSP_N3` / `JSP_N4`), `groupId` (null = sans groupe), `fireStation` (CIS) |
| `groups` | `label`, `referentId` (formateur ou administrateur référent), `promoYear`, `active` |
| `modules` | `code`, `label`, `targetType` (`ALL` / `SPV_ONLY` / `JSP_ONLY`), `evaluationScale` (`levels` = N1/N2/N3, `status` = En cours/Acquis/À revoir) |
| `competencies` | cases des grilles : `moduleId`, `code` (OS 2, C1…), `label`, `criteria`, `order`, `active` |
| `sessions` | séances créées par l'admin : `date`, horaires, `title`, `theme`, `moduleId`, `type` (`course` / `sport` / `opening`) |
| `resources` | liens vers les documents (`title`, `url`), éventuellement liés à une séance et/ou un module |
| `attendances` | `{sessionId}_{userId}` : `status` (`present` / `absent` / `excused`), `note` |
| `evaluations` | une case cochée = un document avec le visa (`validatedBy`, `validatedByName`, `validatedAt`) ; `{userId}_{moduleId}_module` (niveau `MODULE_COMPLETED`) = module déclaré terminé sans que toutes les cases soient cochées |
| `interviews` | 3 entretiens par année scolaire, visas formateur / apprenant |
| `internshipWishes` | `{userId}` : 3 vœux par stage, dispense (JSP), contraintes |

### Droits (RBAC)

- **Admin** : super-CRUD (profils, groupes et référents, séances et documents, modules et cases), correction de toute validation. Il peut lui-même être référent d'un groupe et modifier la fiche d'un apprenant depuis son livret.
- **Formateur** : accès transversal à tous les groupes. Il fait l'appel, valide les grilles, marque un module terminé et ajoute des liens de ressources. Il ne peut retirer que ses propres validations.
- **Stagiaire** : lecture de son livret, de son référent et des ressources. Il signe ses entretiens et saisit ses vœux.

## Traductions

Le français est la langue par défaut, l'anglais est disponible via le sélecteur. Les clés sont typées :
une clé absente de `fr.json` ou de `en.json` fait échouer `npm run typecheck`.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | vérification TypeScript + build de production (PWA) |
| `npm run lint` | ESLint |
| `npm run emulators` | émulateurs Firebase, avec données persistées dans `.emulator-data` |
| `npm run seed` / `seed:emulator` | initialisation du référentiel et du premier administrateur |
