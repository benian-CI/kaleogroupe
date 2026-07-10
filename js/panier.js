// ============================================
// PAGE PANIER
// ============================================
function cartItemHtml(item) {
  return (
    '<div class="cart-item" data-id="' + item.productId + '">' +
      '<div class="cart-item-thumb">' +
        (item.imageUrl ? '<img src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.name) + '"/>' : '<i class="fas fa-box"></i>') +
      '</div>' +
      '<div class="cart-item-info">' +
        '<h4>' + escapeHtml(item.name) + '</h4>' +
        '<span class="item-unit-price">' + formatFCFA(item.price) + ' / unité</span>' +
      '</div>' +
      '<div class="cart-item-qty">' +
        '<div class="qty-selector">' +
          '<button type="button" onclick="changeCartQty(' + item.productId + ', -1)">−</button>' +
          '<input type="text" value="' + item.quantity + '" readonly/>' +
          '<button type="button" onclick="changeCartQty(' + item.productId + ', 1)">+</button>' +
        '</div>' +
      '</div>' +
      '<span class="cart-item-total">' + formatFCFA(item.price * item.quantity) + '</span>' +
      '<button class="cart-item-remove" onclick="removeCartItem(' + item.productId + ')" aria-label="Retirer"><i class="fas fa-trash"></i></button>' +
    '</div>'
  );
}

function renderCartPage() {
  var cart = getCart();
  var layout = document.getElementById('cartLayout');
  var emptyState = document.getElementById('cartEmpty');

  if (cart.length === 0) {
    layout.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  layout.style.display = 'grid';
  emptyState.style.display = 'none';

  document.getElementById('cartItemsList').innerHTML = cart.map(cartItemHtml).join('');
  var total = getCartTotal();
  document.getElementById('cartSubtotal').textContent = formatFCFA(total);
  document.getElementById('cartTotal').textContent = formatFCFA(total);
}

function changeCartQty(productId, delta) {
  var cart = getCart();
  var item = cart.find(function (i) { return i.productId === productId; });
  if (!item) return;
  updateCartItemQuantity(productId, item.quantity + delta);
  renderCartPage();
}

function removeCartItem(productId) {
  removeFromCart(productId);
  renderCartPage();
}

renderCartPage();
