// ============================================
// PAGE INSCRIPTION CLIENT
// ============================================
if (getCustomerToken()) window.location.href = '/compte/commandes';

document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  var errorEl = document.getElementById('registerError');
  errorEl.style.display = 'none';
  var btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

  fetch(window.API_BASE_URL + '/customers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('regName').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      password: document.getElementById('regPassword').value
    })
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) {
      if (!result.ok) throw new Error(result.data.error || 'Impossible de créer le compte');
      setCustomerSession(result.data.token, result.data.customer);
      window.location.href = getSafeNextUrl('/compte/commandes');
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.innerHTML = 'Créer mon compte';
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    });
});
