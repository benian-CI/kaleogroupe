// ============================================
// PAGE PRODUIT — DÉTAIL
// ============================================
var currentProduct = null;

function getProductIdFromUrl() {
  var params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Adresse publique du site, utilisée pour l'URL officielle (canonical) des fiches
var SITE_URL = 'https://app.kaleogroupe.com';

function setMeta(id, attr, value) {
  var el = document.getElementById(id);
  if (el) el.setAttribute(attr, value);
}

// Référencement : titre, description, URL officielle et données « Produit »
// lisibles par Google (prix, disponibilité, image) pour la fiche affichée.
function applyProductSeo(p) {
  var description = (p.description || '').replace(/\s+/g, ' ').trim();
  var shortDesc = (description.length > 155 ? description.slice(0, 152) + '…' : description) ||
    (p.name + ' — disponible à la boutique KALEO GROUPE, Abidjan.');
  var url = SITE_URL + '/produit?id=' + encodeURIComponent(p.id);

  document.title = p.name + ' — Boutique KALEO GROUPE';
  setMeta('metaDescription', 'content', shortDesc);
  setMeta('ogTitle', 'content', p.name + ' — KALEO GROUPE');
  setMeta('ogDescription', 'content', shortDesc);
  if (p.imageUrl) setMeta('ogImage', 'content', p.imageUrl);

  var canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  // Bloc de données (pas du code exécuté) : autorisé par la politique de sécurité
  var data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: description,
    sku: String(p.id),
    category: categoryLabels[p.category] || p.category,
    offers: {
      '@type': 'Offer',
      url: url,
      priceCurrency: 'XOF',
      price: Math.round(Number(p.price)),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'KALEO GROUPE' }
    }
  };
  if (p.imageUrl) data.image = [p.imageUrl];
  var ld = document.getElementById('productJsonLd');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'productJsonLd';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(data);
}

function renderProductDetail(p) {
  currentProduct = p;
  applyProductSeo(p);

  var wrap = document.getElementById('productDetail');
  var outOfStock = p.stock <= 0;
  var unit = p.unit || 'unite';
  var step = unit === 'unite' ? 1 : 0.5;

  wrap.innerHTML =
    '<div class="product-detail-image">' +
      (p.imageUrl ? '<img src="' + escapeHtml(p.imageUrl) + '" alt="' + escapeHtml(p.name) + '"/>' : '<i class="fas fa-box"></i>') +
    '</div>' +
    '<div class="product-detail-info">' +
      '<span class="product-category">' + escapeHtml(categoryLabels[p.category] || p.category) +
        (p.quality ? ' · ' + escapeHtml(qualityLabels[p.quality] || p.quality) : '') + '</span>' +
      '<h1>' + escapeHtml(p.name) + '</h1>' +
      '<span class="product-price">' + formatFCFA(p.price) + (unitSuffix[unit] || '') + '</span>' +
      '<p class="product-desc">' + escapeHtml(p.description) + '</p>' +
      '<p class="product-stock ' + (outOfStock ? 'out' : 'in') + '">' +
        (outOfStock ? '<i class="fas fa-circle-xmark"></i> Rupture de stock' : '<i class="fas fa-circle-check"></i> En stock (' + formatQuantity(p.stock, unit) + ' disponible' + (unit === 'unite' && p.stock > 1 ? 's' : '') + ')') +
      '</p>' +
      '<div class="product-add-row">' +
        (outOfStock ? '' :
          '<div class="qty-selector">' +
            '<button type="button" data-qty-delta="-' + step + '">−</button>' +
            '<input type="text" id="qtyInput" value="' + (unit === 'unite' ? '1' : step) + '" readonly/>' +
            '<button type="button" data-qty-delta="' + step + '">+</button>' +
          '</div>' +
          '<button class="btn-primary btn-large" id="addToCartBtn"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>'
        ) +
      '</div>' +
    '</div>';

  if (!outOfStock) {
    wrap.querySelectorAll('[data-qty-delta]').forEach(function (btn) {
      btn.addEventListener('click', function () { changeQty(Number(btn.dataset.qtyDelta)); });
    });
    document.getElementById('addToCartBtn').addEventListener('click', function () {
      var qty = Number(document.getElementById('qtyInput').value) || 1;
      addToCart(currentProduct, qty);
      this.innerHTML = '<i class="fas fa-check"></i> Ajouté au panier';
      setTimeout(function () {
        document.getElementById('addToCartBtn').innerHTML = '<i class="fas fa-cart-plus"></i> Ajouter au panier';
      }, 1500);
    });
  }
}

function changeQty(delta) {
  var input = document.getElementById('qtyInput');
  var unit = currentProduct ? (currentProduct.unit || 'unite') : 'unite';
  var min = unit === 'unite' ? 1 : 0.5;
  var max = currentProduct ? currentProduct.stock : 99;
  var value = Math.min(max, Math.max(min, Number(input.value) + delta));
  input.value = unit === 'unite' ? value : Math.round(value * 100) / 100;
}

// Produit retiré ou adresse erronée : Google ne doit pas indexer cette page vide
function noIndex() {
  var robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.setAttribute('content', 'noindex, follow');
}

function loadProduct() {
  var id = getProductIdFromUrl();
  var wrap = document.getElementById('productDetail');
  if (!id) {
    noIndex();
    wrap.innerHTML = '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>Produit introuvable.</div>';
    return;
  }
  fetch(window.API_BASE_URL + '/products/' + encodeURIComponent(id))
    .then(function (res) { if (!res.ok) throw new Error('not found'); return res.json(); })
    .then(renderProductDetail)
    .catch(function () {
      noIndex();
      wrap.innerHTML = '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>Ce produit n\'existe plus ou n\'est plus disponible.</div>';
    });
}

loadProduct();
