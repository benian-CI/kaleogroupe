// ============================================
// CONFIGURATION API BOUTIQUE
// ============================================
// En local (Live Server, etc.) on parle au backend lancé sur localhost:4000.
// En production, on parle au backend déployé (à mettre à jour une fois déployé sur Render).
window.API_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:4000/api'
  : 'https://kaleo-groupe-backend.onrender.com/api';

var categoryLabels = {
  cameras: 'Caméras',
  construction: 'Construction',
  climatisation: 'Climatisation',
  menuiserie: 'Menuiserie Alu',
  electricite: 'Électricité',
  autres: 'Autres'
};

// Échappe le texte inséré dynamiquement dans du innerHTML (noms de produits,
// noms/téléphones de clients...) pour empêcher qu'une donnée saisie par un admin
// ou un client (ex: dans le formulaire de commande) ne soit interprétée comme
// du HTML/JS quand elle est réaffichée ailleurs (boutique, panier, tableau admin).
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
