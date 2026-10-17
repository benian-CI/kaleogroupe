// ============================================
// PAGE CONNEXION CLIENT
// ============================================
if (getCustomerToken()) window.location.href = '/compte/commandes';

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var errorEl = document.getElementById('loginError');
  errorEl.style.display = 'none';
  var btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

  fetch(window.API_BASE_URL + '/customers/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value
    })
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Identifiants invalides');
      setCustomerSession(result.data.token, result.data.customer);
      window.location.href = getSafeNextUrl('/compte/commandes');
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.innerHTML = 'Se connecter';
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    });
});
