// ============================================
// BOUTIQUE — CATALOGUE PRODUITS
// ============================================
var allProducts = [];
var activeFilters = { category: 'all', quality: '', priceMin: null, priceMax: null };

function productCardHtml(p) {
  var outOfStock = p.stock <= 0;
  var unit = p.unit || 'unite';
  return (
    '<div class="product-card">' +
      '<div class="product-thumb">' +
        (p.imageUrl
          ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.name) + '" loading="lazy"/>'
          : '<i class="fas fa-box"></i>') +
        (outOfStock ? '<span class="product-badge out">Rupture de stock</span>' : '') +
        (p.quality ? '<span class="product-badge quality">' + escapeHtml(qualityLabels[p.quality] || p.quality) + '</span>' : '') +
      '</div>' +
      '<div class="product-info">' +
        '<h3>' + escapeHtml(p.name) + '</h3>' +
        '<p>' + escapeHtml(p.description.slice(0, 90)) + (p.description.length > 90 ? '…' : '') + '</p>' +
        '<span class="product-price">' + formatFCFA(p.price) + (unitSuffix[unit] || '') + '</span>' +
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

function matchesFilters(p) {
  if (activeFilters.category !== 'all' && p.category !== activeFilters.category) return false;
  if (activeFilters.quality && p.quality !== activeFilters.quality) return false;
  if (activeFilters.priceMin !== null && p.price < activeFilters.priceMin) return false;
  if (activeFilters.priceMax !== null && p.price >= activeFilters.priceMax) return false;
  return true;
}

function renderProducts() {
  var grid = document.querySelector('.products-grid');
  if (!grid) return;
  var filtered = allProducts.filter(matchesFilters);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.insertAdjacentHTML('afterend', '<div class="boutique-state" id="emptyState"><i class="fas fa-box-open"></i>Aucun produit ne correspond à ces filtres.</div>');
    return;
  }
  var empty = document.getElementById('emptyState');
  if (empty) empty.remove();
  grid.innerHTML = filtered.map(productCardHtml).join('');
}

function buildFilters() {
  var bar = document.querySelector('.filter-bar:not(#qualityFilterBar)');
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
      activeFilters.category = btn.dataset.filter;
      renderProducts();
    });
  });

  var qualityBar = document.getElementById('qualityFilterBar');
  if (qualityBar) {
    qualityBar.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        qualityBar.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilters.quality = btn.dataset.quality;
        renderProducts();
      });
    });
  }

  var priceSelect = document.getElementById('priceFilter');
  if (priceSelect) {
    priceSelect.addEventListener('change', function () {
      var val = priceSelect.value;
      if (!val) {
        activeFilters.priceMin = null;
        activeFilters.priceMax = null;
      } else {
        var parts = val.split('-');
        activeFilters.priceMin = parts[0] ? Number(parts[0]) : null;
        activeFilters.priceMax = parts[1] ? Number(parts[1]) : null;
      }
      renderProducts();
    });
  }
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
      renderProducts();
    })
    .catch(function () {
      var loading = document.getElementById('loadingState');
      if (loading) loading.remove();
      grid.insertAdjacentHTML('afterend', '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>Impossible de charger la boutique pour le moment. Réessayez plus tard.</div>');
    });
}

loadProducts();
