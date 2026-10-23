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
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    // Stockage local indisponible (navigation privée stricte, quota plein) :
    // le panier ne peut pas être conservé, on ne fait pas planter la page.
  }
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

// Nombre d'articles pour le badge : les unités s'additionnent, mais un produit
// vendu au mètre ou au kilo compte pour 1 (25 m de câble = 1 article, pas 25).
function getCartCount() {
  return getCart().reduce(function (sum, i) {
    return sum + ((i.unit || 'unite') === 'unite' ? i.quantity : 1);
  }, 0);
}

function getCartTotal() {
  return getCart().reduce(function (sum, i) { return sum + i.price * i.quantity; }, 0);
}

// Met à jour prix, nom et image du panier avec les données actuelles du
// catalogue (le panier enregistré garde le prix du moment de l'ajout) et retire
// les produits qui ne sont plus en vente. Le serveur recalcule de toute façon le
// total : ceci évite seulement d'afficher au client un montant différent de
// celui qui sera facturé. Appelle onChange(cart) si quelque chose a changé.
function refreshCartFromCatalog(onChange) {
  var cart = getCart();
  if (cart.length === 0 || !window.API_BASE_URL) return;
  fetch(window.API_BASE_URL + '/products')
    .then(function (res) { if (!res.ok) throw new Error('catalogue indisponible'); return res.json(); })
    .then(function (products) {
      var changed = false;
      var fresh = cart.filter(function (item) {
        var p = products.find(function (x) { return x.id === item.productId; });
        if (!p) { changed = true; return false; }
        if (p.price !== item.price || p.name !== item.name || (p.imageUrl || '') !== item.imageUrl) {
          item.price = p.price;
          item.name = p.name;
          item.imageUrl = p.imageUrl || '';
          changed = true;
        }
        return true;
      });
      if (changed) {
        saveCart(fresh);
        if (onChange) onChange(fresh);
      }
    })
    .catch(function () { /* hors ligne : on garde le panier tel quel */ });
}

function updateCartBadge() {
  var badge = document.getElementById('cartBadge');
  if (!badge) return;
  var count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
