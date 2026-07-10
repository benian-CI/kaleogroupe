// ============================================
// BOUTIQUE — CATALOGUE PRODUITS
// ============================================
var allProducts = [];

function productCardHtml(p) {
  var outOfStock = p.stock <= 0;
  return (
    '<div class="product-card">' +
      '<div class="product-thumb">' +
        (p.imageUrl
          ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.name) + '" loading="lazy"/>'
          : '<i class="fas fa-box"></i>') +
        (outOfStock ? '<span class="product-badge out">Rupture de stock</span>' : '') +
      '</div>' +
      '<div class="product-info">' +
        '<h3>' + escapeHtml(p.name) + '</h3>' +
        '<p>' + escapeHtml(p.description.slice(0, 90)) + (p.description.length > 90 ? '…' : '') + '</p>' +
        '<span class="product-price">' + formatFCFA(p.price) + '</span>' +
        '<div class="product-actions">' +
          '<a href="/produit?id=' + p.id + '" class="btn-secondary"><i class="fas fa-eye"></i></a>' +
          '<button class="btn-primary" data-product-id="' + p.id + '" ' + (outOfStock ? 'disabled style="opacity:.5;cursor:not-allowed;"' : '') + '>' +
            '<i class="fas fa-cart-plus"></i> Ajouter' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function quickAddToCart(btn) {
  var product = allProducts.find(function (p) { return p.id === Number(btn.dataset.productId); });
  if (!product) return;
  addToCart(product, 1);
  var original = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> Ajouté';
  setTimeout(function () { btn.innerHTML = original; }, 1200);
}

document.addEventListener('click', function (e) {
  var btn = e.target.closest('.products-grid [data-product-id]');
  if (btn) quickAddToCart(btn);
});

function renderProducts(filter) {
  var grid = document.querySelector('.products-grid');
  if (!grid) return;
  var filtered = !filter || filter === 'all' ? allProducts : allProducts.filter(function (p) { return p.category === filter; });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.insertAdjacentHTML('afterend', '<div class="boutique-state" id="emptyState"><i class="fas fa-box-open"></i>Aucun produit dans cette catégorie pour le moment.</div>');
    return;
  }
  var empty = document.getElementById('emptyState');
  if (empty) empty.remove();
  grid.innerHTML = filtered.map(productCardHtml).join('');
}

function buildFilters() {
  var bar = document.querySelector('.filter-bar');
  if (!bar) return;
  var categories = Array.from(new Set(allProducts.map(function (p) { return p.category; })));
  var html = '<button class="filter-btn active" data-filter="all">Tous</button>';
  categories.forEach(function (cat) {
    html += '<button class="filter-btn" data-filter="' + cat + '">' + (categoryLabels[cat] || cat) + '</button>';
  });
  bar.innerHTML = html;
  bar.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      bar.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });
}

function loadProducts() {
  var grid = document.querySelector('.products-grid');
  if (!grid) return;
  grid.insertAdjacentHTML('beforebegin', '<div class="boutique-state" id="loadingState"><i class="fas fa-spinner fa-spin"></i>Chargement du catalogue...</div>');

  fetch(window.API_BASE_URL + '/products')
    .then(function (res) { if (!res.ok) throw new Error('Erreur réseau'); return res.json(); })
    .then(function (products) {
      allProducts = products;
      var loading = document.getElementById('loadingState');
      if (loading) loading.remove();
      buildFilters();
      renderProducts('all');
    })
    .catch(function () {
      var loading = document.getElementById('loadingState');
      if (loading) loading.remove();
      grid.insertAdjacentHTML('afterend', '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>Impossible de charger la boutique pour le moment. Réessayez plus tard.</div>');
    });
}

loadProducts();
