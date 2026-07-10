// ============================================
// ADMIN — LOGIN & DASHBOARD
// ============================================
var ADMIN_TOKEN_KEY = 'kaleo_admin_token';

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function adminLogout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.location.href = '/admin/login';
}

function adminFetch(path, options) {
  options = options || {};
  options.headers = Object.assign({}, options.headers, { Authorization: 'Bearer ' + getAdminToken() });
  return fetch(window.API_BASE_URL + path, options).then(function (res) {
    if (res.status === 401) {
      adminLogout();
      throw new Error('Session expirée');
    }
    return res.json().then(function (data) {
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      return data;
    });
  });
}

function showToast(message, type) {
  var toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'admin-toast show ' + (type || '');
  setTimeout(function () { toast.className = 'admin-toast'; }, 3000);
}

// ---- LOGIN PAGE ----
var adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  if (getAdminToken()) {
    window.location.href = '/admin/dashboard';
  } else {
    adminLoginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var errorBox = document.getElementById('adminLoginError');
      errorBox.style.display = 'none';
      var btn = document.getElementById('adminLoginBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

      fetch(window.API_BASE_URL + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('adminEmail').value.trim(),
          password: document.getElementById('adminPassword').value
        })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (!result.ok) throw new Error(result.data.error || 'Identifiants invalides');
          localStorage.setItem(ADMIN_TOKEN_KEY, result.data.token);
          window.location.href = '/admin/dashboard';
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.innerHTML = 'Se connecter';
          errorBox.textContent = err.message;
          errorBox.style.display = 'block';
        });
    });
  }
}

// ---- DASHBOARD PAGE ----
var dashboardRoot = document.getElementById('adminDashboard');
if (dashboardRoot && !getAdminToken()) {
  window.location.href = '/admin/login';
} else if (dashboardRoot) {
  var currentProducts = [];
  var editingProductId = null;

  // Tabs
  document.querySelectorAll('.admin-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById(btn.dataset.panel).classList.add('active');
    });
  });

  document.getElementById('adminLogoutBtn').addEventListener('click', adminLogout);

  // ---- Produits ----
  function loadProducts() {
    adminFetch('/admin/products')
      .then(function (products) {
        currentProducts = products;
        var tbody = document.getElementById('productsTableBody');
        if (products.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6"><div class="admin-empty">Aucun produit pour le moment.</div></td></tr>';
          return;
        }
        tbody.innerHTML = products.map(function (p) {
          return '<tr>' +
            '<td>' + (p.imageUrl ? '<img class="admin-thumb" src="' + escapeHtml(p.imageUrl) + '"/>' : '<div class="admin-thumb"></div>') + '</td>' +
            '<td>' + escapeHtml(p.name) + '</td>' +
            '<td>' + escapeHtml(categoryLabels[p.category] || p.category) + '</td>' +
            '<td>' + formatFCFA(p.price) + '</td>' +
            '<td>' + p.stock + '</td>' +
            '<td><span class="admin-status ' + (p.active ? 'active' : 'inactive') + '">' + (p.active ? 'Actif' : 'Inactif') + '</span></td>' +
            '<td class="admin-actions-cell">' +
              '<button class="admin-icon-btn" onclick="openProductModal(' + p.id + ')"><i class="fas fa-pen"></i></button>' +
              '<button class="admin-icon-btn danger" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button>' +
            '</td>' +
          '</tr>';
        }).join('');
      })
      .catch(function (err) { showToast(err.message, 'error'); });
  }

  window.deleteProduct = function (id) {
    if (!confirm('Supprimer ce produit définitivement ?')) return;
    adminFetch('/admin/products/' + id, { method: 'DELETE' })
      .then(function () { showToast('Produit supprimé', 'success'); loadProducts(); })
      .catch(function (err) { showToast(err.message, 'error'); });
  };

  window.openProductModal = function (id) {
    editingProductId = id || null;
    var product = id ? currentProducts.find(function (p) { return p.id === id; }) : null;
    document.getElementById('productModalTitle').textContent = product ? 'Modifier le produit' : 'Nouveau produit';
    document.getElementById('pName').value = product ? product.name : '';
    document.getElementById('pDescription').value = product ? product.description : '';
    document.getElementById('pPrice').value = product ? product.price : '';
    document.getElementById('pCategory').value = product ? product.category : 'cameras';
    document.getElementById('pStock').value = product ? product.stock : 0;
    document.getElementById('pActive').checked = product ? product.active : true;
    document.getElementById('pImageUrl').value = product && product.imageUrl ? product.imageUrl : '';
    renderImagePreview(product && product.imageUrl ? product.imageUrl : '');
    document.getElementById('productModalOverlay').classList.add('open');
  };

  function closeProductModal() {
    document.getElementById('productModalOverlay').classList.remove('open');
  }
  document.getElementById('productModalCancel').addEventListener('click', closeProductModal);
  document.getElementById('addProductBtn').addEventListener('click', function () { openProductModal(null); });

  function renderImagePreview(url) {
    var preview = document.getElementById('imagePreview');
    preview.innerHTML = url ? '<img src="' + escapeHtml(url) + '"/>' : '<i class="fas fa-image"></i>';
  }

  document.getElementById('pImageFile').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var formData = new FormData();
    formData.append('image', file);
    var status = document.getElementById('imageUploadStatus');
    status.textContent = 'Envoi en cours...';
    adminFetch('/admin/upload', { method: 'POST', body: formData })
      .then(function (data) {
        document.getElementById('pImageUrl').value = data.url;
        renderImagePreview(data.url);
        status.textContent = '';
      })
      .catch(function (err) { status.textContent = ''; showToast(err.message, 'error'); });
  });

  document.getElementById('productForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = {
      name: document.getElementById('pName').value.trim(),
      description: document.getElementById('pDescription').value.trim(),
      price: Number(document.getElementById('pPrice').value),
      category: document.getElementById('pCategory').value,
      stock: Number(document.getElementById('pStock').value),
      active: document.getElementById('pActive').checked,
      imageUrl: document.getElementById('pImageUrl').value || null
    };
    var request = editingProductId
      ? adminFetch('/admin/products/' + editingProductId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : adminFetch('/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    request
      .then(function () {
        showToast('Produit enregistré', 'success');
        closeProductModal();
        loadProducts();
      })
      .catch(function (err) { showToast(err.message, 'error'); });
  });

  // ---- Commandes ----
  function loadOrders() {
    adminFetch('/admin/orders')
      .then(function (orders) {
        var tbody = document.getElementById('ordersTableBody');
        if (orders.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8"><div class="admin-empty">Aucune commande pour le moment.</div></td></tr>';
          return;
        }
        tbody.innerHTML = orders.map(function (o) {
          var canMarkPaid = o.paymentMethod === 'cash' && o.status === 'pending';
          return '<tr>' +
            '<td>' + escapeHtml(o.ref) + '</td>' +
            '<td>' + escapeHtml(o.customerName) + '<br/><span style="color:var(--text-muted)">' + escapeHtml(o.customerPhone) + '</span></td>' +
            '<td>' + o.items.map(function (i) { return i.quantity + '× ' + escapeHtml(i.product.name); }).join('<br/>') + '</td>' +
            '<td>' + formatFCFA(o.totalAmount) + '</td>' +
            '<td>' + (o.paymentMethod === 'cash' ? 'Espèces' : 'Mobile Money / Carte') + '</td>' +
            '<td><span class="admin-status ' + o.status + '">' + o.status + '</span></td>' +
            '<td>' + new Date(o.createdAt).toLocaleString('fr-FR') + '</td>' +
            '<td>' + (canMarkPaid ? '<button class="admin-icon-btn" title="Marquer payée" onclick="markOrderPaid(' + o.id + ')"><i class="fas fa-check"></i></button>' : '') + '</td>' +
          '</tr>';
        }).join('');
      })
      .catch(function (err) { showToast(err.message, 'error'); });
  }

  window.markOrderPaid = function (id) {
    if (!confirm('Confirmer que cette commande a bien été payée en espèces à la livraison ?')) return;
    adminFetch('/admin/orders/' + id + '/mark-paid', { method: 'POST' })
      .then(function () { showToast('Commande marquée payée', 'success'); loadOrders(); })
      .catch(function (err) { showToast(err.message, 'error'); });
  };

  loadProducts();
  loadOrders();
}
