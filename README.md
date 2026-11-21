# Guide d'utilisation

## Présentation

Cette application sert à suivre la formation des stagiaires SPV : séances, compétences, entretiens et vœux de stages. Elle peut être utilisée sur ordinateur, tablette ou téléphone.

Chaque personne se connecte avec son adresse e-mail et son mot de passe. Les menus visibles dépendent de son rôle :

- **Stagiaire** : consulte et complète son propre livret.
- **Formateur** : suit les stagiaires et renseigne les livrets.
- **Administrateur** : gère aussi les comptes, les groupes, les modules et les séances.

## Commencer

Sur l'écran de connexion, choisissez **Créer un compte**, puis renseignez votre nom, votre prénom, votre adresse e-mail personnelle et un mot de passe. Les adresses `@sdis01.fr` ne sont pas acceptées. Choisissez **Stagiaire** ou **Formateur**. Le rôle administrateur est attribué séparément.

Après connexion, le menu permet d'ouvrir l'accueil, le calendrier, les ressources et **Mon compte**. Les autres rubriques apparaissent selon votre rôle. Sur téléphone, ouvrez le menu avec le bouton en haut à gauche.

Dans **Mon compte**, chacun peut corriger son nom, son prénom ou son adresse e-mail. Pour changer l'adresse e-mail, saisissez aussi votre mot de passe actuel. Pour un mot de passe oublié, utilisez **Mot de passe oublié ?** sur l'écran de connexion.

## Fonctions communes

### Calendrier et séances

Dans **Calendrier**, changez de mois avec les flèches, choisissez un type de séance si besoin, puis sélectionnez une séance pour voir ses détails et ses documents. Un stagiaire peut aussi y envoyer un message pour prévenir d'une absence; les formateurs et administrateurs peuvent consulter les messages de chaque séance. Seul l'administrateur peut ajouter, modifier ou supprimer une séance.

### Ressources

Dans **Ressources**, recherchez un document par son titre ou filtrez par module. Les documents sont des liens vers des espaces de partage externes. Les formateurs et administrateurs peuvent ajouter un lien. Un formateur peut supprimer les liens qu'il a ajoutés; un administrateur peut supprimer tous les liens.

## Stagiaire

### Consulter son livret

Ouvrez **Mon livret**. Les onglets disponibles sont :

- **Compétences** : consultez vos modules, les compétences et leur progression. Les validations sont faites par un formateur ou un administrateur.
- **Entretiens** : consultez les comptes rendus et choisissez **Signer** pour apposer votre visa.
- **Vœux de stage** : saisissez vos trois choix pour chaque stage et, si nécessaire, vos contraintes. Pensez à enregistrer.

Vous ne pouvez consulter et modifier que votre propre livret et vos propres vœux.

## Formateur

Dans **Stagiaires**, recherchez une personne ou filtrez la liste par groupe. Ouvrez sa fiche pour consulter son livret.

Dans l'onglet **Compétences**, choisissez les niveaux validés. Vous pouvez aussi déclarer un module terminé. Une validation que vous avez faite peut être retirée par vous; l'administrateur peut corriger toutes les validations.

Dans **Entretiens**, vous pouvez créer, modifier et supprimer un compte rendu, dans la limite de trois entretiens par stagiaire et par année scolaire. Le stagiaire et un formateur peuvent chacun signer leur partie.

Dans **Ressources**, choisissez **Ajouter** et renseignez le titre et le lien du document. Vous pouvez associer le lien à un module ou à une séance.

## Administrateur

L'administrateur dispose aussi des fonctions du formateur et peut gérer l'application.

- **Utilisateurs** : recherchez et filtrez les comptes, créez un compte, modifiez son nom, son prénom, son rôle ou son état actif, et envoyez un lien de réinitialisation du mot de passe.
- **Groupes** : créez, modifiez et supprimez un groupe, indiquez sa promotion et choisissez son référent. Vous pouvez affecter un stagiaire à un groupe ou l'en retirer.
- **Modules** : ajoutez des modules et leurs compétences, modifiez-les et réorganisez-les. Vous pouvez masquer une compétence sans la supprimer, la réafficher ou la supprimer.
- **Calendrier** : ajoutez, modifiez ou supprimez une séance. Sa suppression efface également ses liens de documents associés.

Désactiver un compte retire son accès à l'application sans supprimer son compte. Pour supprimer définitivement une personne, contactez le développeur afin que son profil et son compte de connexion soient supprimés ensemble.

## Nettoyage des anciennes données

Après le déploiement de cette version, la migration suivante supprime de Firestore les anciennes données qui ne sont plus utilisées :

- émulateur : `npm run db:cleanup -- --emulator` (l'émulateur Firestore doit être démarré);
- projet Firebase : `npm run db:cleanup -- --production --confirm-production --project-id=<project-id>` avec les identifiants Admin SDK du projet voulu.

Cette migration supprime définitivement les anciens appels, la fiche complémentaire retirée et les champs associés des profils, modules et vœux. Vérifiez le projet Firebase ciblé avant de l'exécuter.

## Besoin d'aide ?

Si une rubrique ou un bouton n'apparaît pas, vérifiez votre rôle auprès de l'administrateur.
