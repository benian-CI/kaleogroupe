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

## Paramètres de sécurité (en-têtes HTTP)

Sur Plesk, nginx sert directement les fichiers du site : les en-têtes de sécurité
du `.htaccess` ne s'appliquent donc pas toujours. Ils doivent aussi être définis
dans Plesk : **Sites Web & Domaines → app.kaleogroupe.com → Paramètres Apache & nginx
→ Directives supplémentaires nginx**. Remplacez les anciennes lignes `add_header`
(celles qui mentionnent encore EmailJS ou `cdn.jsdelivr.net`) par ce bloc :

```nginx
# En-têtes de sécurité — KALEO GROUPE (identiques au .htaccess)
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=(), browsing-topics=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-site" always;
add_header X-Permitted-Cross-Domain-Policies "none" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://www.gstatic.com https://res.cloudinary.com; connect-src 'self' https://api.kaleogroupe.com https://kaleo-groupe-backend.onrender.com; frame-src https://www.google.com https://recaptcha.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'none'; manifest-src 'self'; upgrade-insecure-requests" always;

# Ne pas annoncer la technologie du serveur
server_tokens off;
proxy_hide_header X-Powered-By;
fastcgi_hide_header X-Powered-By;
```


Si une ressource externe est ajoutée au site (nouveau script, police, image hébergée
ailleurs), il faut l'autoriser à la fois ici et dans le `.htaccess`, sinon le
navigateur la bloque.

### Autres réglages Plesk recommandés
- **SSL/TLS** : certificat Let's Encrypt actif, « Redirection HTTP → HTTPS » cochée,
  TLS 1.2 minimum (Outils & paramètres → Paramètres SSL/TLS).
- **PHP** : désactivé pour ce domaine (site statique, PHP inutile = surface d'attaque en moins).
- **Pare-feu applicatif (ModSecurity)** et **Fail2Ban** : activés si disponibles chez l'hébergeur.
- **Accès** : mot de passe Plesk fort et authentification à deux facteurs.
