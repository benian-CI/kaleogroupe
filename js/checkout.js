// ============================================
// CHECKOUT — CRÉATION DE COMMANDE + PAIEMENT
// ============================================
var INSTALLATION_FEE = 30000;

// Compte optionnel façon Jumia : si connecté, on pré-remplit et on lie la
// commande au compte ; sinon on laisse la commande "invité" fonctionner normalement.
function renderGuestBanner(banner) {
  banner.innerHTML =
    '<p class="checkout-banner">' +
      '<i class="fas fa-circle-info"></i> Vous commandez en tant qu\'invité. <a href="/compte/connexion?next=/checkout">Connectez-vous</a> pour retrouver vos commandes plus tard.' +
    '</p>';
}

function renderAccountBanner() {
  var banner = document.getElementById('checkoutAccountBanner');
  if (!banner) return;
  if (!getCustomerToken()) return renderGuestBanner(banner);
  banner.innerHTML =
    '<p class="checkout-banner checkout-banner-ok">' +
      '<i class="fas fa-circle-check"></i> Connecté en tant que <strong>' + escapeHtml(getCustomerName()) + '</strong> — cette commande sera ajoutée à votre historique.' +
    '</p>';
  // Appel direct (pas customerFetch) : si la session a expiré, on bascule en
  // commande invité au lieu de renvoyer le client vers la page de connexion.
  fetch(window.API_BASE_URL + '/customers/me', { headers: { Authorization: 'Bearer ' + getCustomerToken() } })
    .then(function (res) {
      if (res.status === 401) { clearCustomerSession(); renderGuestBanner(banner); return null; }
      return res.ok ? res.json() : null;
    })
    .then(function (c) {
      if (!c) return;
      if (!document.getElementById('coName').value) document.getElementById('coName').value = c.name || '';
      if (!document.getElementById('coPhone').value) document.getElementById('coPhone').value = c.phone || '';
      if (!document.getElementById('coEmail').value) document.getElementById('coEmail').value = c.email || '';
    })
    .catch(function () {});
}
renderAccountBanner();

function isInstallationRequested() {
  var checkbox = document.getElementById('coInstallation');
  return !!(checkbox && checkbox.checked);
}

function renderRecap() {
  var cart = getCart();
  if (cart.length === 0) {
    window.location.href = '/panier';
    return;
  }
  var recap = document.getElementById('checkoutRecap');
  var total = getCartTotal() + (isInstallationRequested() ? INSTALLATION_FEE : 0);
  recap.innerHTML = cart.map(function (item) {
    var unit = item.unit || 'unite';
    return '<div class="recap-item"><span>' + formatQuantity(item.quantity, unit) + (unit === 'unite' ? '×' : '') + ' ' + escapeHtml(item.name) + '</span><span>' + formatFCFA(item.price * item.quantity) + '</span></div>';
  }).join('') +
    (isInstallationRequested() ? '<div class="recap-item"><span>Installation par notre équipe</span><span>' + formatFCFA(INSTALLATION_FEE) + '</span></div>' : '') +
    '<div class="cart-summary-total"><span>Total</span><span>' + formatFCFA(total) + '</span></div>';
}

function showCheckoutError(message) {
  var el = document.getElementById('checkoutError');
  el.textContent = message;
  el.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideCheckoutError() {
  document.getElementById('checkoutError').style.display = 'none';
}

function getSelectedPaymentMethod() {
  var checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : 'cinetpay';
}

function updatePaymentUi() {
  var isCash = getSelectedPaymentMethod() === 'cash';
  var submitBtn = document.getElementById('checkoutSubmit');
  var note = document.getElementById('checkoutSecurityNote');
  submitBtn.innerHTML = isCash
    ? '<i class="fas fa-check"></i> Confirmer ma commande'
    : '<i class="fas fa-lock"></i> Payer maintenant';
  note.innerHTML = isCash
    ? '<i class="fas fa-truck"></i> Vous payerez en espèces directement au livreur, à la réception de votre commande.'
    : '<i class="fas fa-shield-halved"></i> Paiement sécurisé par CinetPay — Orange Money, MTN Money, Moov Money, Wave et carte bancaire.';
}

document.querySelectorAll('input[name="paymentMethod"]').forEach(function (radio) {
  radio.addEventListener('change', updatePaymentUi);
});

var installationCheckbox = document.getElementById('coInstallation');
if (installationCheckbox) {
  installationCheckbox.addEventListener('change', renderRecap);
}

var checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();
    hideCheckoutError();

    var cart = getCart();
    if (cart.length === 0) {
      window.location.href = '/panier';
      return;
    }

    var paymentMethod = getSelectedPaymentMethod();
    var payload = {
      items: cart.map(function (i) { return { productId: i.productId, quantity: i.quantity }; }),
      paymentMethod: paymentMethod,
      installation: isInstallationRequested(),
      customer: {
        name: document.getElementById('coName').value.trim(),
        phone: document.getElementById('coPhone').value.trim(),
        email: document.getElementById('coEmail').value.trim(),
        address: document.getElementById('coAddress').value.trim(),
        city: document.getElementById('coCity').value.trim()
      }
    };

    if (!payload.customer.name || !payload.customer.phone || !payload.customer.address) {
      showCheckoutError('Merci de renseigner votre nom, votre téléphone et votre adresse de livraison.');
      return;
    }

    var submitBtn = document.getElementById('checkoutSubmit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (paymentMethod === 'cash' ? 'Enregistrement...' : 'Redirection vers le paiement...');

    var orderHeaders = { 'Content-Type': 'application/json' };
    if (getCustomerToken()) orderHeaders.Authorization = 'Bearer ' + getCustomerToken();

    fetch(window.API_BASE_URL + '/orders', {
      method: 'POST',
      headers: orderHeaders,
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || 'Une erreur est survenue.');
        // Le panier est vidé seulement après confirmation du paiement (page paiement-succes),
        // pas ici, au cas où le client abandonne la page de paiement.
        if (result.data.paymentUrl) {
          window.location.href = result.data.paymentUrl;
        } else {
          window.location.href = '/paiement-succes?ref=' + encodeURIComponent(result.data.ref);
        }
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        updatePaymentUi();
        showCheckoutError(err.message || 'Impossible de traiter la commande. Réessayez.');
      });
  });
}

renderRecap();
refreshCartFromCatalog(renderRecap);
