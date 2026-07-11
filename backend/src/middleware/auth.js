const jwt = require('jsonwebtoken');

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

function requireCustomer(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Connexion requise' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') throw new Error('wrong token type');
    req.customer = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

// Pour les routes accessibles en invité : si un jeton client valide est
// fourni, req.customer est renseigné ; sinon la requête continue quand même
// (commande "invité"), sans jamais bloquer.
function optionalCustomer(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'customer') req.customer = decoded;
  } catch {
    // Jeton invalide/expiré : on ignore silencieusement, la commande reste possible en invité.
  }
  next();
}

module.exports = { requireAdmin, requireCustomer, optionalCustomer };
