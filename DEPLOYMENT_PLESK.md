# Déploiement sur Plesk

Ce site est un site statique HTML/CSS/JavaScript. Il peut être déployé directement dans le dossier racine du domaine sur Plesk.

## Étapes

1. Ouvrez Plesk et sélectionnez votre domaine.
2. Allez dans File Manager.
3. Ouvrez le dossier de publication du site (généralement httpdocs ou wwwroot).
4. Téléversez tous les fichiers du projet à la racine de ce dossier.
5. Vérifiez que le fichier index.html est bien à la racine.
6. Ouvrez votre domaine dans le navigateur pour vérifier l’affichage.

## Important

- Aucune base de données n’est nécessaire pour le site statique.
- Les liens utilisent des chemins relatifs, donc le site fonctionne sans configuration supplémentaire.
- Si vous avez un sous-domaine ou un dossier spécifique, téléversez les fichiers dans ce dossier et configurez-le comme racine du site.
- **Ne téléversez pas le dossier `backend/`** sur Plesk : il s'agit de l'API de la boutique, qui se déploie séparément (voir `backend/README-backend.md`). Seuls les fichiers HTML/CSS/JS/images du site vont sur Plesk.

## Si le site ne s’affiche pas

- Vérifiez que le dossier de publication contient bien index.html.
- Vérifiez la permission du dossier (lecture/lecture-écriture selon le serveur).
- Videz le cache navigateur si nécessaire.
