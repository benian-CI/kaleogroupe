// ============================================
// PAGE MOT DE PASSE OUBLIÉ
// ============================================
document.getElementById('forgotForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var errorEl = document.getElementById('forgotError');
  var successEl = document.getElementById('forgotSuccess');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';
  var btn = document.getElementById('forgotBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

  fetch(window.API_BASE_URL + '/customers/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: document.getElementById('forgotEmail').value.trim() })
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Impossible d\'envoyer le lien');
      document.getElementById('forgotForm').style.display = 'none';
      successEl.textContent = result.data.message + ' Pensez à vérifier vos spams.';
      successEl.style.display = 'block';
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.innerHTML = 'Envoyer le lien';
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    });
});
