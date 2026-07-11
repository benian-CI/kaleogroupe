// ============================================
// COMPTE CLIENT — AUTH PARTAGÉE (façon Jumia : compte optionnel)
// ============================================
var CUSTOMER_TOKEN_KEY = 'kaleo_customer_token';
var CUSTOMER_NAME_KEY = 'kaleo_customer_name';

function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function getCustomerName() {
  return localStorage.getItem(CUSTOMER_NAME_KEY) || '';
}

function setCustomerSession(token, customer) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  localStorage.setItem(CUSTOMER_NAME_KEY, customer && customer.name ? customer.name : '');
}

function customerLogout() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_NAME_KEY);
  window.location.href = '/';
}

function customerFetch(path, options) {
  options = options || {};
  options.headers = Object.assign({}, options.headers, { Authorization: 'Bearer ' + getCustomerToken() });
  return fetch(window.API_BASE_URL + path, options).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      return data;
    });
  });
}

// Remplit l'emplacement "Mon compte" de la navbar sur chaque page.
function renderAccountNav() {
  var slot = document.getElementById('navAccount');
  if (!slot) return;
  var token = getCustomerToken();
  if (token) {
    var name = getCustomerName() || 'Mon compte';
    var firstName = name.split(' ')[0];
    slot.innerHTML =
      '<div class="nav-account-dropdown">' +
        '<button type="button" class="nav-account-btn"><i class="fas fa-user-circle"></i> ' + firstName + '</button>' +
        '<div class="nav-account-menu">' +
          '<a href="/compte/commandes"><i class="fas fa-box"></i> Mes commandes</a>' +
          '<button type="button" id="navLogoutBtn"><i class="fas fa-right-from-bracket"></i> Déconnexion</button>' +
        '</div>' +
      '</div>';
    document.getElementById('navLogoutBtn').addEventListener('click', customerLogout);
  } else {
    slot.innerHTML = '<a href="/compte/connexion"><i class="fas fa-user"></i> Se connecter</a>';
  }
}

document.addEventListener('DOMContentLoaded', renderAccountNav);
