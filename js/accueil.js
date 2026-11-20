// KALEO GROUPE — affiche de l'accueil

// Cliquer sur le rideau d'intro le fait disparaître tout de suite
const intro = document.getElementById('intro');
if (intro) {
  intro.addEventListener('click', () => intro.classList.add('intro-passee'));
}

// Montage photo : léger effet de profondeur qui suit la souris
const collage = document.getElementById('collage');
const affiche = document.getElementById('affiche');
const mouvementOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sourisFine = window.matchMedia('(pointer: fine)').matches;

if (collage && affiche && mouvementOk && sourisFine) {
  collage.querySelectorAll('.tuile[data-prof]').forEach((tuile) => {
    tuile.style.setProperty('--prof', tuile.dataset.prof);
  });

  let prevu = false;
  affiche.addEventListener('pointermove', (e) => {
    if (prevu) return;
    prevu = true;
    requestAnimationFrame(() => {
      const r = affiche.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;   // -0,5 … 0,5
      const y = (e.clientY - r.top) / r.height - 0.5;
      collage.style.setProperty('--mx', (-x).toFixed(3));
      collage.style.setProperty('--my', (-y).toFixed(3));
      prevu = false;
    });
  });
  affiche.addEventListener('pointerleave', () => {
    collage.style.setProperty('--mx', 0);
    collage.style.setProperty('--my', 0);
  });
}
