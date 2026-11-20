// ============================================
// BOUTIQUE — CATALOGUE PRODUITS
// ============================================
var allProducts = [];
var activeFilters = { category: 'all', quality: '', priceMin: null, priceMax: null, search: '' };

function productCardHtml(p, index) {
  var outOfStock = p.stock <= 0;
  var unit = p.unit || 'unite';
  var description = p.description || '';
  return (
    // --i : rang de la carte, pour l'apparition en cascade (css/boutique-vitrine.css)
    '<article class="product-card' + (outOfStock ? ' is-out' : '') + '" style="--i:' + Math.min(index, 11) + '">' +
      '<a href="/produit?id=' + p.id + '" class="product-thumb" aria-label="Voir ' + escapeHtml(p.name) + '">' +
        (p.imageUrl
          ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.name) + '" loading="lazy"/>'
          : '<i class="fas fa-box"></i>') +
        (outOfStock ? '<span class="product-badge out">Rupture de stock</span>' : '') +
        (p.quality ? '<span class="product-badge quality">' + escapeHtml(qualityLabels[p.quality] || p.quality) + '</span>' : '') +
        '<span class="product-voir">Voir le produit</span>' +
      '</a>' +
      '<div class="product-info">' +
        '<span class="product-cat">' + escapeHtml(categoryLabels[p.category] || p.category || '') + '</span>' +
        '<h3><a href="/produit?id=' + p.id + '">' + escapeHtml(p.name) + '</a></h3>' +
        '<p>' + escapeHtml(description.slice(0, 90)) + (description.length > 90 ? '…' : '') + '</p>' +
        '<div class="product-bas">' +
          '<span class="product-price">' + formatFCFA(p.price) + '<small>' + (unitSuffix[unit] || '') + '</small></span>' +
          '<button class="btn-primary product-ajout" data-product-id="' + p.id + '"' + (outOfStock ? ' disabled' : '') + ' aria-label="Ajouter ' + escapeHtml(p.name) + ' au panier">' +
            '<i class="fas fa-cart-plus"></i><span>Ajouter</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function quickAddToCart(btn) {
  var product = allProducts.find(function (p) { return p.id === Number(btn.dataset.productId); });
  if (!product) return;
  addToCart(product, 1);
  var original = btn.innerHTML;
  btn.classList.add('is-added');
  btn.innerHTML = '<i class="fas fa-check"></i><span>Ajouté</span>';
  // petit rebond du badge panier
  var badge = document.getElementById('cartBadge');
  if (badge) {
    badge.classList.remove('bq-rebond');
    void badge.offsetWidth;
    badge.classList.add('bq-rebond');
  }
  setTimeout(function () { btn.innerHTML = original; btn.classList.remove('is-added'); }, 1300);
}

document.addEventListener('click', function (e) {
  var btn = e.target.closest('.products-grid [data-product-id]');
  if (btn && !btn.disabled) quickAddToCart(btn);
});

// Recherche sans accents ni majuscules : « camera » trouve « Caméra »
function normalize(str) {
  return String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesFilters(p) {
  if (activeFilters.category !== 'all' && p.category !== activeFilters.category) return false;
  if (activeFilters.quality && p.quality !== activeFilters.quality) return false;
  if (activeFilters.priceMin !== null && p.price < activeFilters.priceMin) return false;
  if (activeFilters.priceMax !== null && p.price >= activeFilters.priceMax) return false;
  if (activeFilters.search) {
    var haystack = normalize(p.name + ' ' + (p.description || '') + ' ' + (categoryLabels[p.category] || ''));
    var words = activeFilters.search.split(/\s+/).filter(Boolean);
    if (!words.every(function (w) { return haystack.indexOf(w) !== -1; })) return false;
  }
  return true;
}

function setState(html) {
  var grid = document.querySelector('.products-grid');
  var old = document.getElementById('boutiqueState');
  if (old) old.remove();
  if (html && grid) grid.insertAdjacentHTML('afterend', '<div class="boutique-state" id="boutiqueState">' + html + '</div>');
}

function renderProducts() {
  var grid = document.querySelector('.products-grid');
  if (!grid) return;
  var filtered = allProducts.filter(matchesFilters);

  var count = document.getElementById('resultCount');
  if (count) count.textContent = filtered.length + ' produit' + (filtered.length > 1 ? 's' : '');

  grid.innerHTML = filtered.map(productCardHtml).join('');
  if (filtered.length === 0) {
    setState('<i class="fas fa-box-open"></i>Aucun produit ne correspond à votre recherche.' +
      '<button type="button" class="bq-reinit" id="resetFilters">Effacer les filtres</button>');
  } else {
    setState('');
  }
}

function setCategory(cat) {
  activeFilters.category = cat;
  document.querySelectorAll('.bq-filtres-cat .filter-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.filter === cat);
  });
  document.querySelectorAll('#categoryShortcuts button').forEach(function (b) {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderProducts();
}

function resetFilters() {
  activeFilters.quality = '';
  activeFilters.priceMin = null;
  activeFilters.priceMax = null;
  activeFilters.search = '';
  var search = document.getElementById('searchInput');
  if (search) search.value = '';
  var price = document.getElementById('priceFilter');
  if (price) price.value = '';
  document.querySelectorAll('#qualityFilterBar .filter-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.quality === '');
  });
  setCategory('all');
}

function buildFilters() {
  var bar = document.querySelector('.bq-filtres-cat');
  if (!bar) return;
  var categories = Array.from(new Set(allProducts.map(function (p) { return p.category; })));
  var html = '<button class="filter-btn active" data-filter="all">Tous</button>';
  categories.forEach(function (cat) {
    html += '<button class="filter-btn" data-filter="' + escapeHtml(cat) + '">' + escapeHtml(categoryLabels[cat] || cat) + '</button>';
  });
  bar.innerHTML = html;
  bar.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setCategory(btn.dataset.filter); });
  });

  // Raccourcis de l'en-tête : filtrent puis descendent jusqu'au catalogue.
  // Une catégorie sans produit est grisée.
  document.querySelectorAll('#categoryShortcuts button').forEach(function (btn) {
    var has = categories.indexOf(btn.dataset.cat) !== -1;
    btn.disabled = !has;
    btn.addEventListener('click', function () {
      setCategory(activeFilters.category === btn.dataset.cat ? 'all' : btn.dataset.cat);
      document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
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

  var search = document.getElementById('searchInput');
  if (search) {
    var timer;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        activeFilters.search = normalize(search.value.trim());
        renderProducts();
      }, 150);
    });
    // Entrée : descendre jusqu'aux résultats
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#resetFilters')) resetFilters();
  });
}

function loadProducts() {
  var grid = document.querySelector('.products-grid');
  if (!grid) return;
  setState('<i class="fas fa-spinner fa-spin"></i>Chargement du catalogue…');

  fetch(window.API_BASE_URL + '/products')
    .then(function (res) { if (!res.ok) throw new Error('Erreur réseau'); return res.json(); })
    .then(function (products) {
      allProducts = products;
      buildFilters();
      renderProducts();
    })
    .catch(function () {
      setState('<i class="fas fa-triangle-exclamation"></i>Impossible de charger la boutique pour le moment. Réessayez plus tard.');
    });
}

loadProducts();
