# KALEO GROUPE — Site Web

## Structure du projet

```
site-pro/
├── index.html              ← Page d'accueil
├── pages/
│   ├── services.html       ← Page des 4 services
│   ├── realisations.html   ← Galerie / portfolio
│   ├── devis.html          ← Formulaire de devis (3 étapes)
│   └── contact.html        ← Page contact
├── css/
│   ├── style.css           ← Styles principaux + composants
│   ├── animations.css      ← Animations & reveal on scroll
│   ├── services.css        ← Styles page services
│   ├── devis.css           ← Styles formulaire devis
│   ├── realisations.css    ← Styles galerie + filtres
│   └── contact.css         ← Styles page contact
├── js/
│   ├── main.js             ← Navbar, menu mobile, scroll reveal
│   ├── devis.js            ← Logique formulaire multi-étapes
│   └── realisations.js     ← Données projets + filtre dynamique
└── images/                 ← Dossier pour vos photos

```

## Comment ouvrir dans VS Code

1. Ouvrez VS Code
2. Fichier → Ouvrir un dossier → sélectionnez `site-pro`
3. Installez l'extension **Live Server** (recommandé)
4. Clic droit sur `index.html` → "Open with Live Server"

## Personnalisation rapide

### Changer le nom de l'entreprise
Déjà fait : `KALEO GROUPE` est utilisé dans tous les fichiers HTML.

### Changer les coordonnées
Coordonnées actuelles (dans `pages/contact.html` notamment) :
- Email : `kaleogroupe@gmail.com`
- Adresse : `Cocody, Riviera Palmeraie, Abidjan, Côte d'Ivoire`

### Changer les couleurs
Dans `css/style.css`, modifier les variables CSS en haut du fichier :
```css
:root {
  --accent: #FF6B2B;       /* Orange principal */
  --bg-dark: #0B1120;      /* Fond sombre */
  --blue-steel: #1A2B4A;   /* Bleu acier */
}
```

### Ajouter de vrais projets (réalisations)
Dans `js/realisations.js`, modifier le tableau `projets` :
- `category` : cameras | construction | split | menuiserie
- `titre`, `desc`, `lieu`, `date` : vos vrais projets
- Pour ajouter des images : remplacer `.project-thumb` par une balise `<img>`

### Connecter le formulaire de devis
Dans `js/devis.js`, remplacer le bloc `devisForm.addEventListener('submit', ...)` 
par un appel à votre backend (PHP, Node.js, EmailJS, Formspree, etc.)

### Ajouter vos photos
Placez vos images dans le dossier `images/` et référencez-les dans le HTML.

## Technologies utilisées
- HTML5 / CSS3 / JavaScript Vanilla
- Google Fonts (Inter + Barlow Condensed)
- Font Awesome 6.5 (icônes)
- Aucune dépendance JS externe
