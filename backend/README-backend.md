# Backend Boutique KALEO GROUPE — Guide de déploiement

Ce backend gère le catalogue produits, les commandes et le paiement Mobile Money (CinetPay). Il est séparé du site principal (`site-pro/`) qui reste hébergé tel quel sur Plesk.

## 1. Créer les comptes nécessaires (à faire toi-même)

Ces comptes demandent tes informations personnelles/professionnelles, je ne peux pas les créer à ta place.

### a) Base de données — Neon.tech
1. Va sur https://neon.tech, crée un compte gratuit.
2. Crée un nouveau projet (nom : `kaleo-groupe`).
3. Copie la **Connection string** (elle ressemble à `postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require`).

### b) Hébergement du backend — Render.com
1. Va sur https://render.com, crée un compte gratuit (tu peux te connecter avec GitHub).
2. Mets ce dossier `backend/` dans un dépôt GitHub (voir étape 3 ci-dessous).
3. Sur Render : **New +** → **Web Service** → connecte ton dépôt GitHub.
4. Render détecte Node.js automatiquement. Renseigne :
   - **Root Directory** : `backend` (si le dépôt contient tout `site-pro/`)
   - **Build Command** : `npm install && npx prisma generate`
   - **Start Command** : `npm start`
5. Ajoute les variables d'environnement (voir section 2 ci-dessous) dans l'onglet **Environment**.
6. Une fois déployé, Render te donne une URL du type `https://kaleo-groupe-backend.onrender.com`.

> Sur le plan gratuit, le service se met en veille après 15 min d'inactivité et met ~30-60s à redémarrer sur la première requête suivante. C'est acceptable pour démarrer ; tu pourras passer au plan payant (~7$/mois) plus tard si besoin.

### c) Paiement — CinetPay
1. Va sur https://cinetpay.com, crée un compte marchand.
2. Complète la vérification (KYC) avec tes documents d'identité/entreprise — le mode **test** est disponible immédiatement après inscription, avant même la validation, pour développer et tester.
3. Dans le tableau de bord CinetPay → **Intégration** → récupère `API_KEY` et `SITE_ID`.
4. Garde `CINETPAY_TEST_MODE=true` tant que le compte n'est pas validé en production.

### d) Images produits — Cloudinary
1. Va sur https://cloudinary.com, crée un compte gratuit.
2. Dans le tableau de bord, récupère `Cloud name`, `API Key`, `API Secret`.

## 2. Variables d'environnement à configurer sur Render

Copie `.env.example` et remplis les valeurs réelles récupérées à l'étape 1 :

| Variable | Où la trouver |
|---|---|
| `DATABASE_URL` | Neon.tech → Connection string |
| `FRONTEND_URL` | `https://app.kaleogroupe.com` (ton domaine réel) |
| `BACKEND_URL` | L'URL Render une fois le service créé |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET` | Tableau de bord CinetPay |
| `CINETPAY_TEST_MODE` | `true` en développement, `false` une fois validé |
| `JWT_SECRET` | Une longue chaîne aléatoire (ex: générée avec `openssl rand -hex 32`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Tes identifiants admin (seulement utilisés une fois, pour créer le compte) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Tableau de bord Cloudinary |

## 3. Mettre le backend sur GitHub (nécessaire pour Render)

```bash
cd backend
git init
git add .
git commit -m "Backend boutique KALEO GROUPE"
git branch -M main
git remote add origin <URL_DE_TON_DEPOT_GITHUB>
git push -u origin main
```

## 4. Initialiser la base de données et le compte admin

Une fois `DATABASE_URL` configuré (en local ou sur Render, via son terminal "Shell") :

```bash
npx prisma migrate deploy   # crée les tables
npm run seed                 # crée le compte admin à partir de ADMIN_EMAIL / ADMIN_PASSWORD
```

## 5. Mettre à jour le frontend avec l'URL réelle du backend

Dans `site-pro/js/config.js`, remplace :
```js
: 'https://kaleo-groupe-backend.onrender.com/api';
```
par l'URL Render réelle obtenue à l'étape 1b.

Dans `site-pro/.htaccess`, fais la même mise à jour dans la ligne `connect-src` de la Content-Security-Policy.

Redéploie ensuite le site statique sur Plesk comme d'habitude (voir `DEPLOYMENT_PLESK.md`).

## 6. Ajouter tes premiers produits

Connecte-toi sur `https://app.kaleogroupe.com/admin/login` avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`, puis ajoute tes produits (nom, description, prix, catégorie, photo, stock).

## 7. Avant de passer en production réelle

1. Fais valider ton compte CinetPay (KYC complet).
2. Passe `CINETPAY_TEST_MODE=false` et remplace les clés de test par les clés de production sur Render.
3. Fais une vraie commande test avec un petit montant pour vérifier que tout le circuit fonctionne (commande → paiement → webhook → statut "paid" → stock décrémenté).

## Développement local

```bash
cd backend
cp .env.example .env   # puis remplis les valeurs (au moins DATABASE_URL et les clés CinetPay en mode test)
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Le serveur écoute sur `http://localhost:4000`. Le frontend (`site-pro/`, ouvert avec Live Server par ex.) détecte automatiquement `localhost` et pointe vers ce backend local (voir `js/config.js`).
