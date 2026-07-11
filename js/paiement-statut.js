// ============================================
// PAGES DE RETOUR PAIEMENT — STATUT RÉEL DE LA COMMANDE
// ============================================
// Important : on affiche toujours le statut réel renvoyé par le backend
// (qui l'a lui-même vérifié auprès de CinetPay), jamais une supposition
// basée sur l'URL de retour sur laquelle le client atterrit.

var paymentPollAttempts = 0;
var PAYMENT_POLL_MAX_ATTEMPTS = 15; // ~45s à 3s d'intervalle

function renderPaymentStatus(order) {
  var box = document.getElementById('paymentResult');

  if (order.status === 'paid') {
    clearCart();
    box.className = 'payment-result success';
    box.innerHTML =
      '<i class="fas fa-circle-check"></i>' +
      '<h1>Paiement confirmé !</h1>' +
      '<p>Merci <strong>' + escapeHtml(order.customerName) + '</strong>, votre commande <strong>' + escapeHtml(order.ref) + '</strong> d\'un montant de <strong>' + formatFCFA(order.totalAmount) + '</strong> a bien été payée. Nous préparons votre livraison' +
      (order.installationRequested ? ' et l\'installation par notre équipe' : '') + '.</p>' +
      '<a href="/boutique" class="btn-primary">Continuer mes achats</a>';
  } else if (order.status === 'failed' || order.status === 'cancelled') {
    box.className = 'payment-result failed';
    box.innerHTML =
      '<i class="fas fa-circle-xmark"></i>' +
      '<h1>Paiement non abouti</h1>' +
      '<p>Le paiement de votre commande <strong>' + escapeHtml(order.ref) + '</strong> n\'a pas pu être finalisé. Votre panier a été conservé, vous pouvez réessayer.</p>' +
      '<a href="/panier" class="btn-primary">Retour au panier</a>';
  } else if (order.paymentMethod === 'cash') {
    // Commande "espèces à la livraison" : rien à vérifier en ligne, la commande
    // est déjà enregistrée et le stock réservé. Pas de polling ici.
    clearCart();
    box.className = 'payment-result success';
    box.innerHTML =
      '<i class="fas fa-circle-check"></i>' +
      '<h1>Commande enregistrée !</h1>' +
      '<p>Merci <strong>' + escapeHtml(order.customerName) + '</strong>, votre commande <strong>' + escapeHtml(order.ref) + '</strong> d\'un montant de <strong>' + formatFCFA(order.totalAmount) + '</strong> est confirmée. Vous paierez en espèces à la livraison' +
      (order.installationRequested ? ', installation par notre équipe comprise' : '') + '.</p>' +
      '<a href="/boutique" class="btn-primary">Continuer mes achats</a>';
  } else if (paymentPollAttempts >= PAYMENT_POLL_MAX_ATTEMPTS) {
    box.className = 'payment-result pending';
    box.innerHTML =
      '<i class="fas fa-hourglass-half"></i>' +
      '<h1>La vérification prend plus de temps que prévu</h1>' +
      '<p>Si le paiement a bien été débité, contactez-nous avec la référence <strong>' + escapeHtml(order.ref) + '</strong> et nous confirmerons votre commande manuellement.</p>' +
      '<a href="/contact" class="btn-primary">Nous contacter</a>';
  } else {
    paymentPollAttempts++;
    box.className = 'payment-result pending';
    box.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i>' +
      '<h1>Paiement en cours de vérification</h1>' +
      '<p>Nous confirmons votre paiement, cela ne prend que quelques instants...</p>';
    setTimeout(function () { loadPaymentStatus(); }, 3000);
  }
}

function loadPaymentStatus() {
  var params = new URLSearchParams(window.location.search);
  var ref = params.get('ref');
  var box = document.getElementById('paymentResult');

  if (!ref) {
    box.className = 'payment-result failed';
    box.innerHTML = '<i class="fas fa-circle-xmark"></i><h1>Commande introuvable</h1><p>Référence de commande manquante.</p><a href="/boutique" class="btn-primary">Retour à la boutique</a>';
    return;
  }

  fetch(window.API_BASE_URL + '/orders/' + encodeURIComponent(ref) + '/status')
    .then(function (res) { if (!res.ok) throw new Error('not found'); return res.json(); })
    .then(renderPaymentStatus)
    .catch(function () {
      box.className = 'payment-result failed';
      box.innerHTML = '<i class="fas fa-circle-xmark"></i><h1>Commande introuvable</h1><p>Impossible de retrouver cette commande.</p><a href="/boutique" class="btn-primary">Retour à la boutique</a>';
    });
}

loadPaymentStatus();
