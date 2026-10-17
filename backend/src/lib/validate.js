// Petits validateurs de saisie. Ils lèvent une erreur avec un "status" : le
// gestionnaire d'erreurs global renvoie alors le message tel quel au client
// (400), via asyncHandler, sans avoir à répéter les if/return dans chaque route.

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

// Texte obligatoire, nettoyé des espaces, longueur bornée.
function requireString(value, label, max) {
  if (typeof value !== 'string' || !value.trim()) throw httpError(400, `${label} est requis`);
  const v = value.trim();
  if (v.length > max) throw httpError(400, `${label} : ${max} caractères maximum`);
  return v;
}

// Texte facultatif : renvoie null si absent/vide.
function optionalString(value, label, max) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw httpError(400, `${label} invalide`);
  const v = value.trim();
  if (v.length > max) throw httpError(400, `${label} : ${max} caractères maximum`);
  return v || null;
}

function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Nombre fini et >= 0 (prix, stock). Renvoie undefined si la valeur est absente.
function nonNegativeNumber(value, label) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (value === null || value === '' || !Number.isFinite(n) || n < 0) {
    throw httpError(400, `${label} doit être un nombre positif ou nul`);
  }
  return n;
}

module.exports = { httpError, requireString, optionalString, isValidEmail, nonNegativeNumber };
