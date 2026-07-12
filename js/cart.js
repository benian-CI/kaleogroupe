// ============================================
// PANIER — ÉTAT PARTAGÉ (localStorage)
// ============================================
var CART_KEY = 'kaleo_cart';

function formatFCFA(amount) {
  // Le FCFA n'a pas de sous-unité : on arrondit toujours à l'entier, même quand
  // le montant vient d'un prix au mètre/kilo multiplié par une quantité décimale.
  return Math.round(Number(amount)).toLocaleString('fr-FR') + ' FCFA';
}

var unitLabels = { unite: '', metre: 'm', kg: 'kg' };
var unitSuffix = { unite: '', metre: ' / mètre', kg: ' / kg' };
var qualityLabels = { standard: 'Standard', superieure: 'Supérieure', premium: 'Premium' };

function formatQuantity(quantity, unit) {
  var label = unitLabels[unit] || '';
  var num = (unit === 'unite') ? String(quantity) : (Math.round(quantity * 100) / 100).toString().replace('.', ',');
  return num + (label ? ' ' + label : '');
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

function normalizeQuantity(quantity, unit) {
  quantity = Number(quantity) || 0;
  return unit === 'unite' ? Math.floor(quantity) : Math.round(quantity * 100) / 100;
}

function addToCart(product, quantity) {
  var unit = product.unit || 'unite';
  quantity = Math.max(unit === 'unite' ? 1 : 0.1, normalizeQuantity(quantity, unit) || 1);
  var cart = getCart();
  var existing = cart.find(function (i) { return i.productId === product.id; });
  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity + quantity, unit);
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || '',
      unit: unit,
      quantity: quantity
    });
  }
  saveCart(cart);
}

function updateCartItemQuantity(productId, quantity) {
  var cart = getCart();
  var item = cart.find(function (i) { return i.productId === productId; });
  var unit = item ? (item.unit || 'unite') : 'unite';
  quantity = normalizeQuantity(quantity, unit);
  if (quantity <= 0) {
    cart = cart.filter(function (i) { return i.productId !== productId; });
  } else if (item) {
    item.quantity = quantity;
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
