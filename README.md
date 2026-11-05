# Guide d'utilisation

## Présentation

Cette application sert à suivre la formation des stagiaires SPV et JSP : séances, appels, progression dans les compétences, entretiens et vœux de stages. Elle peut être utilisée sur ordinateur, tablette ou téléphone.

Chaque personne se connecte avec son adresse e-mail et son mot de passe. Les menus visibles dépendent de son rôle :

- **Stagiaire** : consulte et complète son propre livret.
- **Formateur** : suit les stagiaires, fait l'appel et renseigne les livrets.
- **Administrateur** : gère aussi les comptes, les groupes, les modules et les séances.

## Commencer

### Créer un compte

Sur l'écran de connexion, choisissez **Créer un compte**, puis renseignez votre nom, votre prénom, votre adresse e-mail personnelle et un mot de passe. Les adresses `@sdis01.fr` ne sont pas acceptées. Choisissez **Stagiaire** ou **Formateur**. Le rôle administrateur est attribué séparément.

Un administrateur peut également créer un compte depuis **Utilisateurs** et choisir son rôle. Le mot de passe doit comporter au moins huit caractères. Il peut envoyer un e-mail de réinitialisation du mot de passe depuis la fiche de la personne.

### Se connecter et naviguer

Après connexion, le menu permet d'ouvrir l'accueil, le calendrier, les ressources et **Mon compte**. Les autres rubriques apparaissent selon votre rôle. Sur téléphone, ouvrez le menu avec le bouton en haut à gauche.

L'accueil affiche les prochaines séances. Pour changer la langue, utilisez le sélecteur en bas du menu. Pour quitter l'application, choisissez **Déconnexion**.

### Modifier ses informations

Dans **Mon compte**, chacun peut corriger son nom, son prénom ou son adresse e-mail. Pour changer l'adresse e-mail, saisissez aussi votre mot de passe actuel. Pour un mot de passe oublié, utilisez **Mot de passe oublié ?** sur l'écran de connexion.

## Fonctions communes

### Calendrier et séances

Dans **Calendrier**, changez de mois avec les flèches, choisissez un type de séance si besoin, puis sélectionnez une séance pour voir ses détails et ses documents.

Les stagiaires peuvent consulter le calendrier et voir leur statut de présence aux séances passées. Les formateurs et administrateurs peuvent aussi ouvrir la feuille d'appel. Seul l'administrateur peut ajouter, modifier ou supprimer une séance.

### Ressources

Dans **Ressources**, recherchez un document par son titre ou filtrez par module. Sélectionnez son titre ou le bouton d'ouverture pour consulter le document dans un nouvel onglet. Les documents sont des liens vers des espaces de partage externes.

Les formateurs et administrateurs peuvent ajouter un lien. Un formateur peut supprimer les liens qu'il a ajoutés; un administrateur peut supprimer tous les liens.

## Stagiaire

### Consulter son livret

Ouvrez **Mon livret**. Les onglets disponibles sont :

- **Compétences** : consultez vos modules, les compétences et leur progression. Les validations sont faites par un formateur ou un administrateur.
- **Fiche JSP** : pour les JSP, consultez l'état d'avancement de la fiche. Seul l'encadrement peut modifier les statuts.
- **Présences** : consultez vos présences, absences, excuses et votre taux de présence.
- **Entretiens** : consultez les comptes rendus et choisissez **Signer** pour apposer votre visa.
- **Vœux de stage** : saisissez vos trois choix pour chaque stage et, si nécessaire, vos contraintes. Les JSP concernés peuvent indiquer une dispense. Pensez à enregistrer.

Vous ne pouvez consulter et modifier que votre propre livret et vos propres vœux.

## Formateur

### Suivre les stagiaires

Dans **Stagiaires**, recherchez une personne ou filtrez la liste par groupe et par type de formation. Ouvrez sa fiche pour consulter son livret.

Dans l'onglet **Compétences**, choisissez les niveaux validés. Dans la fiche JSP, mettez à jour les statuts proposés. Vous pouvez aussi déclarer un module terminé. Une validation que vous avez faite peut être retirée par vous; l'administrateur peut corriger toutes les validations.

Dans **Entretiens**, vous pouvez créer, modifier et supprimer un compte rendu, dans la limite de trois entretiens par stagiaire et par année scolaire. Le stagiaire et un formateur peuvent chacun signer leur partie.

### Faire l'appel

Dans **Calendrier**, ouvrez une séance puis choisissez **Faire l'appel**. Pour chaque stagiaire, indiquez **Présent**, **Absent** ou **Excusé**. Vous pouvez ajouter une remarque. **Tous présents** marque uniquement les stagiaires dont le statut n'est pas encore renseigné.

Les lignes des formateurs et administrateurs sont séparées : vous pouvez y renseigner leur présence, mais elle ne compte pas dans les statistiques des stagiaires.

#### Exporter la feuille d'appel en PDF

Le bouton **Exporter en PDF** est réservé aux formateurs et administrateurs. Il devient disponible lorsque **tous les stagiaires actifs** ont un statut : présent, absent ou excusé. Il n'est pas nécessaire de renseigner la présence des formateurs ou des administrateurs.

Le PDF s'ouvre dans un nouvel onglet. Il contient tous les stagiaires et membres de l'encadrement actifs, avec les statuts renseignés. Un statut d'encadrement non renseigné reste vide. Si le nouvel onglet ne s'ouvre pas, autorisez les fenêtres pop-up pour le site.

### Ajouter des ressources

Dans **Ressources**, choisissez **Ajouter** et renseignez le titre et le lien du document. Vous pouvez associer le lien à un module ou à une séance. Vous pouvez supprimer vos propres liens.

## Administrateur

L'administrateur dispose aussi des fonctions du formateur et peut gérer l'application.

### Gérer les utilisateurs

Dans **Utilisateurs**, vous pouvez rechercher et filtrer les comptes, créer un compte, modifier son nom, son prénom, son rôle ou son état actif, et envoyer un lien de réinitialisation du mot de passe. Pour un stagiaire, vous pouvez également choisir son type SPV/JSP et son groupe.

Désactiver un compte retire son accès à l'application sans supprimer son compte. Pour supprimer définitivement une personne, **ne cliquez pas sur Supprimer** : prévenez le développeur. Il doit retirer correctement son profil et son compte de connexion; ne supprimez pas seulement l'un des deux.

### Gérer les groupes

Dans **Groupes**, vous pouvez créer, modifier et supprimer un groupe, indiquer sa promotion et choisir son référent. Vous pouvez affecter un stagiaire à un groupe ou le retirer d'un groupe. Lorsqu'un groupe est supprimé, ses stagiaires sont conservés sans groupe.

### Gérer les modules et les compétences

Dans **Modules**, choisissez **Ajouter un module** pour saisir son code, son nom, les personnes concernées et le type d'évaluation. Sélectionnez ensuite le module pour ajouter ou modifier ses compétences et leurs critères.

Vous pouvez masquer une compétence sans la supprimer, la réafficher, ou réorganiser les modules et les compétences en les faisant glisser. Les boutons de modification et de suppression sont sur chaque module ou compétence.

### Gérer les séances

Dans **Calendrier**, choisissez **Ajouter une séance**. Renseignez son titre, son type, sa date et ses horaires. Le thème, le module associé et les liens de documents sont facultatifs. Pour corriger une séance, ouvrez-la puis choisissez **Modifier**. Sa suppression efface également son appel et ses liens de documents associés.

### Corriger les livrets

Dans **Stagiaires**, ouvrez une fiche pour consulter ou corriger les compétences, la fiche JSP, les présences, les entretiens et les vœux. Contrairement au formateur, l'administrateur peut retirer toute validation.

## Besoin d'aide ?

Si une rubrique ou un bouton n'apparaît pas, vérifiez votre rôle auprès de l'administrateur. Pour une suppression définitive de compte, contactez le développeur avant toute action.
