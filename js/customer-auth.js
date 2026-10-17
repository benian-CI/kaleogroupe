// ============================================
// COMPTE CLIENT — AUTH PARTAGÉE (façon Jumia : compte optionnel)
// ============================================
var CUSTOMER_TOKEN_KEY = 'kaleo_customer_token';
var CUSTOMER_NAME_KEY = 'kaleo_customer_name';

// Destination après connexion/inscription (?next=...) : uniquement un chemin
// interne au site. Sans ce contrôle, un lien piégé pourrait renvoyer le client
// vers un site externe (hameçonnage) ou exécuter du code via "javascript:".
function getSafeNextUrl(fallback) {
  var next = new URLSearchParams(window.location.search).get('next') || '';
  return /^\/(?![\/\\])/.test(next) ? next : fallback;
}

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

function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_NAME_KEY);
}

function customerLogout() {
  clearCustomerSession();
  window.location.href = '/';
}

function customerFetch(path, options) {
  options = options || {};
  options.headers = Object.assign({}, options.headers, { Authorization: 'Bearer ' + getCustomerToken() });
  return fetch(window.API_BASE_URL + path, options).then(function (res) {
    return res.json().then(function (data) {
      // Session expirée ou révoquée (ex: mot de passe réinitialisé ailleurs) :
      // on l'oublie et on renvoie vers la connexion.
      if (res.status === 401) {
        clearCustomerSession();
        window.location.href = '/compte/connexion?next=' + encodeURIComponent(window.location.pathname);
      }
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
