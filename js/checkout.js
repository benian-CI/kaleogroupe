// ============================================
// CHECKOUT — CRÉATION DE COMMANDE + PAIEMENT
// ============================================
function renderRecap() {
  var cart = getCart();
  if (cart.length === 0) {
    window.location.href = '/panier';
    return;
  }
  var recap = document.getElementById('checkoutRecap');
  recap.innerHTML = cart.map(function (item) {
    return '<div class="recap-item"><span>' + item.quantity + '× ' + item.name + '</span><span>' + formatFCFA(item.price * item.quantity) + '</span></div>';
  }).join('') + '<div class="cart-summary-total"><span>Total</span><span>' + formatFCFA(getCartTotal()) + '</span></div>';
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

    var payload = {
      items: cart.map(function (i) { return { productId: i.productId, quantity: i.quantity }; }),
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
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirection vers le paiement...';

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
        window.location.href = result.data.paymentUrl;
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Payer maintenant';
        showCheckoutError(err.message || 'Impossible de traiter la commande. Réessayez.');
      });
  });
}

renderRecap();
