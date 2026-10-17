const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Les jetons admin et client sont signés avec le même secret mais portent un
// claim "type" distinct, vérifié strictement ici : un jeton client ne doit
// jamais pouvoir passer les routes admin, et inversement.
function requireAdmin(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') throw new Error('wrong token type');
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

// Vérifie un jeton client : signature, type, et version encore valide en base
// (une réinitialisation de mot de passe incrémente tokenVersion et révoque ainsi
// toutes les sessions ouvertes). Les jetons émis avant l'ajout de "tv" valent 0.
// Renvoie le contenu décodé, ou null si le jeton n'est pas (ou plus) valide.
async function verifyCustomerToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  if (decoded.type !== 'customer') return null;
  const customer = await prisma.customer.findUnique({
    where: { id: decoded.customerId },
    select: { tokenVersion: true }
  });
  if (!customer || customer.tokenVersion !== (decoded.tv || 0)) return null;
  return decoded;
}

async function requireCustomer(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Connexion requise' });

  try {
    const decoded = await verifyCustomerToken(token);
    if (!decoded) return res.status(401).json({ error: 'Session invalide ou expirée' });
    req.customer = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

// Pour les routes accessibles en invité : si un jeton client valide est
// fourni, req.customer est renseigné ; sinon la requête continue quand même
// (commande "invité"), sans jamais bloquer.
async function optionalCustomer(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return next();
  try {
    const decoded = await verifyCustomerToken(token);
    if (decoded) req.customer = decoded;
  } catch (err) {
    // Base indisponible pour la vérification : la commande reste possible en invité.
    console.error('Vérification du jeton client impossible:', err);
  }
  next();
}

module.exports = { requireAdmin, requireCustomer, optionalCustomer };
