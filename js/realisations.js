// ============================================
// RÉALISATIONS — DONNÉES ET FILTRES
// ============================================

var categoryLabel = {
  cameras:      'Caméras',
  construction: 'Construction',
  split:        'Climatisation',
  menuiserie:   'Menuiserie Alu',
  electricite:  'Électricité'
};

var categoryIcon = {
  cameras:      'fas fa-video',
  construction: 'fas fa-helmet-safety',
  split:        'fas fa-wind',
  menuiserie:   'fas fa-door-open',
  electricite:  'fas fa-bolt'
};

var projets = [
  {
    id: 1, category: 'cameras',
    titre: 'Vidéosurveillance Supermarché Dabou',
    desc: 'Installation de caméras IP dôme extérieures avec vision nocturne pour la sécurisation d\'un supermarché à Dabou.',
    lieu: 'Dabou', date: 'Mars 2025',
    img: '../camera.png',
    imgPos: 'center center'
  },
  {
    id: 2, category: 'construction',
    titre: 'Réhabilitation immeuble Bingerville',
    desc: 'Installation de garde-corps câblés inox sur les terrasses d\'une villa R+1 réhabilitée : pose des montants, tension des câbles et finitions.',
    lieu: 'Bingerville', date: 'Janvier 2025',
    img: '../construction.png',
    imgPos: 'center center'
  },
  {
    id: 3, category: 'split',
    titre: 'Climatisation Bureaux Plateau',
    desc: 'Fourniture et installation de 12 unités split pour des bureaux de 600m² au Plateau.',
    lieu: 'Plateau, Abidjan', date: 'Février 2025',
    img: '../climatisseur.png',
    imgPos: 'center center'
  },
  {
    id: 5, category: 'cameras',
    titre: 'Pose de caméra Résidence Marcory',
    desc: 'Installation d\'une caméra bullet IR en façade pour une résidence privée. Câblage encastré, boîtier étanche et vision nocturne inclus.',
    lieu: 'Marcory, Abidjan', date: 'Avril 2025',
    img: '../pose camera.png',
    imgPos: 'center 35%'
  }
];

function renderProjects(filter) {
  var grid = document.querySelector('.projects-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var filtered = filter === 'all' ? projets : projets.filter(function(p) { return p.category === filter; });
  filtered.forEach(function(p) {
    var card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-cat', p.category);
    card.innerHTML =
      '<div class="project-thumb ' + p.category + '">' +
        '<img src="' + p.img + '" alt="' + p.titre + '" class="project-img" loading="lazy"' +
          ' style="object-position:' + (p.imgPos || 'center center') + '"' +
          ' onerror="this.style.display=\'none\';this.parentNode.classList.add(\'thumb-fallback\')"/>' +
        '<div class="project-thumb-overlay"></div>' +
        '<i class="' + categoryIcon[p.category] + ' thumb-fallback-icon"></i>' +
        '<span class="project-tag ' + p.category + '">' +
          '<i class="' + categoryIcon[p.category] + '"></i>' +
          categoryLabel[p.category] +
        '</span>' +
      '</div>' +
      '<div class="project-info">' +
        '<h3>' + p.titre + '</h3>' +
        '<p>' + p.desc + '</p>' +
        '<div class="project-meta">' +
          '<span><i class="fas fa-map-marker-alt"></i>' + p.lieu + '</span>' +
          '<span><i class="fas fa-calendar"></i>' + p.date + '</span>' +
        '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

// Init
renderProjects('all');

// Filtres
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderProjects(btn.dataset.filter);
  });
});
