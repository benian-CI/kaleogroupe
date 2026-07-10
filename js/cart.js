// ============================================
// PANIER — ÉTAT PARTAGÉ (localStorage)
// ============================================
var CART_KEY = 'kaleo_cart';

function formatFCFA(amount) {
  return Number(amount).toLocaleString('fr-FR') + ' FCFA';
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity) {
  quantity = Math.max(1, Math.floor(Number(quantity) || 1));
  var cart = getCart();
  var existing = cart.find(function (i) { return i.productId === product.id; });
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      quantity: quantity
    });
  }
  saveCart(cart);
}

function updateCartItemQuantity(productId, quantity) {
  quantity = Math.floor(Number(quantity) || 0);
  var cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter(function (i) { return i.productId !== productId; });
  } else {
    var item = cart.find(function (i) { return i.productId === productId; });
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter(function (i) { return i.productId !== productId; }));
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  return getCart().reduce(function (sum, i) { return sum + i.quantity; }, 0);
}

function getCartTotal() {
  return getCart().reduce(function (sum, i) { return sum + i.price * i.quantity; }, 0);
}

function updateCartBadge() {
  var badge = document.getElementById('cartBadge');
  if (!badge) return;
  var count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
