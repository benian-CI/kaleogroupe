// ============================================
// PAGE PRODUIT — DÉTAIL
// ============================================
var currentProduct = null;

function getProductIdFromUrl() {
  var params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderProductDetail(p) {
  currentProduct = p;
  document.title = p.name + ' — Boutique KALEO GROUPE';

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
            '<button type="button" onclick="changeQty(-' + step + ')">−</button>' +
            '<input type="text" id="qtyInput" value="' + (unit === 'unite' ? '1' : step) + '" readonly/>' +
            '<button type="button" onclick="changeQty(' + step + ')">+</button>' +
          '</div>' +
          '<button class="btn-primary btn-large" id="addToCartBtn"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>'
        ) +
      '</div>' +
    '</div>';

  if (!outOfStock) {
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

function loadProduct() {
  var id = getProductIdFromUrl();
  var wrap = document.getElementById('productDetail');
  if (!id) {
    wrap.innerHTML = '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>Produit introuvable.</div>';
    return;
  }
  fetch(window.API_BASE_URL + '/products/' + encodeURIComponent(id))
    .then(function (res) { if (!res.ok) throw new Error('not found'); return res.json(); })
    .then(renderProductDetail)
    .catch(function () {
      wrap.innerHTML = '<div class="boutique-state"><i class="fas fa-triangle-exclamation"></i>Ce produit n\'existe plus ou n\'est plus disponible.</div>';
    });
}

loadProduct();
