// ============================================
// PAGE SERVICES — affichage d'un seul service via l'ancre (#cameras, #split...)
// ============================================
const servicesMeta = {
  cameras:      { eyebrow: 'Service 01', title: 'Caméras de <span class="accent">Surveillance</span>' },
  construction: { eyebrow: 'Service 02', title: 'Construction & <span class="accent">Réhabilitation</span>' },
  split:        { eyebrow: 'Service 03', title: 'Climatisation <span class="accent">Split</span>' },
  menuiserie:   { eyebrow: 'Service 04', title: 'Portes & Fenêtres <span class="accent">Aluminium</span>' },
  electricite:  { eyebrow: 'Service 05', title: '<span class="accent">Électricité</span>' },
};

const hash = window.location.hash.replace('#', '');
const allSections = document.querySelectorAll('.service-detail');
const allSeparators = document.querySelectorAll('.section-separator');

if (hash && servicesMeta[hash]) {
  allSections.forEach(s => {
    s.style.display = s.id === hash ? 'block' : 'none';
  });
  allSeparators.forEach(s => s.style.display = 'none');

  const ctaSection = document.querySelector('.cta-section');
  if (ctaSection) ctaSection.style.display = 'none';

  document.getElementById('service-eyebrow').textContent = servicesMeta[hash].eyebrow;
  document.getElementById('service-page-title').innerHTML = servicesMeta[hash].title;
  document.getElementById('service-page-desc').style.display = 'none';
  document.getElementById('btn-back-all').style.display = 'inline-flex';
}
