// ============================================
// PAGE NOUVEAU MOT DE PASSE (lien reçu par email)
// ============================================
var resetToken = new URLSearchParams(window.location.search).get('token') || '';
// On retire le jeton de la barre d'adresse (historique, partage d'écran...).
if (resetToken) history.replaceState(null, '', window.location.pathname);

var resetErrorEl = document.getElementById('resetError');

function showResetError(message) {
  resetErrorEl.textContent = message;
  resetErrorEl.style.display = 'block';
}

if (!/^[0-9a-f]{64}$/.test(resetToken)) {
  document.getElementById('resetForm').style.display = 'none';
  showResetError('Lien de réinitialisation invalide. Faites une nouvelle demande depuis « Mot de passe oublié ».');
}

document.getElementById('resetForm').addEventListener('submit', function (e) {
  e.preventDefault();
  resetErrorEl.style.display = 'none';
  var password = document.getElementById('resetPassword').value;
  if (password.length < 8) return showResetError('Le mot de passe doit contenir au moins 8 caractères.');
  if (password !== document.getElementById('resetPasswordConfirm').value) {
    return showResetError('Les deux mots de passe ne correspondent pas.');
  }

  var btn = document.getElementById('resetBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

  fetch(window.API_BASE_URL + '/customers/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken, password: password })
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Impossible de modifier le mot de passe');
      // L'ancienne session éventuelle de ce navigateur vient d'être révoquée.
      clearCustomerSession();
      document.getElementById('resetForm').style.display = 'none';
      var successEl = document.getElementById('resetSuccess');
      successEl.innerHTML = escapeHtml(result.data.message) + ' <a href="/compte/connexion" class="accent" style="text-decoration:underline;">Se connecter</a>';
      successEl.style.display = 'block';
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.innerHTML = 'Enregistrer';
      showResetError(err.message);
    });
});
