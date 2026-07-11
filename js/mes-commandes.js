// ============================================
// PAGE "MES COMMANDES" — HISTORIQUE CLIENT
// ============================================
if (!getCustomerToken()) {
  window.location.href = '/compte/connexion?next=/compte/commandes';
}

var statusLabels = {
  pending: 'En attente',
  paid: 'Payée',
  failed: 'Échouée',
  cancelled: 'Annulée'
};

function orderCardHtml(o) {
  var itemsHtml = o.items.map(function (i) {
    return '<div class="recap-item"><span>' + i.quantity + '× ' + escapeHtml(i.product.name) + '</span><span>' + formatFCFA(i.quantity * i.unitPrice) + '</span></div>';
  }).join('');
  return (
    '<div class="form-card" style="margin-bottom: 20px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">' +
        '<h3 style="font-size:16px;">' + escapeHtml(o.ref) + '</h3>' +
        '<span class="admin-status ' + o.status + '">' + (statusLabels[o.status] || o.status) + '</span>' +
      '</div>' +
      itemsHtml +
      (o.installationRequested ? '<div class="recap-item"><span>Installation</span><span>' + formatFCFA(o.installationFee) + '</span></div>' : '') +
      '<div class="cart-summary-total"><span>Total</span><span>' + formatFCFA(o.totalAmount) + '</span></div>' +
      '<p style="font-size:12px; color:var(--text-muted); margin-top:10px;">' +
        '<i class="fas fa-truck"></i> ' + escapeHtml(o.deliveryAddress) +
        ' &nbsp;·&nbsp; <i class="fas fa-calendar"></i> ' + new Date(o.createdAt).toLocaleDateString('fr-FR') +
      '</p>' +
    '</div>'
  );
}

function loadMyOrders() {
  var wrap = document.getElementById('ordersList');
  customerFetch('/customers/me/orders')
    .then(function (orders) {
      if (orders.length === 0) {
        wrap.innerHTML = '<div class="cart-empty"><i class="fas fa-box-open"></i><p>Vous n\'avez pas encore passé de commande.</p><a href="/boutique" class="btn-primary" style="margin-top:16px;">Découvrir la boutique</a></div>';
        return;
      }
      wrap.innerHTML = orders.map(orderCardHtml).join('');
    })
    .catch(function (err) {
      wrap.innerHTML = '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>' + escapeHtml(err.message) + '</div>';
    });
}

if (getCustomerToken()) loadMyOrders();
