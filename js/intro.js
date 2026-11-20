// KALEO GROUPE — intro de l'accueil
// Chargé dans <head> : l'intro ne se joue qu'une fois par onglet.
// Si elle a déjà été vue, la classe .intro-vue la masque avant l'affichage.
(function () {
  try {
    if (sessionStorage.getItem('kaleo-intro-vue')) {
      document.documentElement.classList.add('intro-vue');
    } else {
      sessionStorage.setItem('kaleo-intro-vue', '1');
    }
  } catch (e) { /* stockage indisponible : l'intro se joue normalement */ }
})();
