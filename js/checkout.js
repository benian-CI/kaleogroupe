// ============================================
// CHECKOUT — CRÉATION DE COMMANDE + PAIEMENT
// ============================================
var INSTALLATION_FEE = 30000;

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
    return '<div class="recap-item"><span>' + item.quantity + '× ' + escapeHtml(item.name) + '</span><span>' + formatFCFA(item.price * item.quantity) + '</span></div>';
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

    fetch(window.API_BASE_URL + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
