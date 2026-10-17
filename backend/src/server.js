require('dotenv').config();
// Certains hébergeurs (dont Render) annoncent une adresse IPv6 pour les services
// externes (ex: Gmail SMTP) sans avoir de route IPv6 sortante fonctionnelle, ce qui
// fait échouer la connexion avec ENETUNREACH. On force la résolution DNS à préférer
// IPv4, qui fonctionne partout, pour toutes les connexions sortantes de ce process.
require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const cors = require('cors');

// Filet de sécurité de dernier recours : si un bug futur laisse échapper une
// promesse rejetée hors de tout asyncHandler/try-catch, on la journalise au lieu
// de laisser Node tuer le process entier (et donc couper le service à tous les
// clients pour une seule requête en erreur).
process.on('unhandledRejection', (reason) => {
  console.error('Rejet de promesse non capturé:', reason);
});
// Une exception synchrone non capturée, elle, laisse le process dans un état
// incertain (connexions, transactions à moitié faites) : on journalise puis on
// arrête, et l'hébergeur (Render) relance automatiquement un process propre.
process.on('uncaughtException', (err) => {
  console.error('Exception non capturée, arrêt du process:', err);
  process.exit(1);
});

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const paymentRouter = require('./routes/payment');
const adminRouter = require('./routes/admin');
const customersRouter = require('./routes/customers');

const app = express();

// Render (comme la plupart des hébergeurs) place l'API derrière un proxy : sans
// ceci, req.ip vaut l'IP du proxy pour TOUS les visiteurs, et les limiteurs de
// tentatives (login, commandes) bloqueraient tout le monde d'un coup.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// En-têtes de sécurité de base pour une API JSON (pas de dépendance à helmet).
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });
  next();
});

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
// Les origines localhost (développement) ne sont acceptées qu'hors production.
const allowLocalOrigins = process.env.NODE_ENV !== 'production';
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (allowLocalOrigins && isLocalOrigin(origin))) return callback(null, true);
    callback(new Error('Origine non autorisée'));
  }
}));

app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customers', customersRouter);

app.use((err, req, res, next) => {
  console.error(err);
  // On ne renvoie le message d'erreur brut au client que pour les erreurs
  // délibérément levées avec un status par notre propre code (ex: validation).
  // Toute erreur inattendue (panne DB, bug) reste journalisée côté serveur mais
  // n'expose jamais ses détails internes (schéma, requêtes SQL...) au client.
  const message = err.status ? err.message : 'Erreur serveur, réessayez plus tard.';
  res.status(err.status || 500).json({ error: message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend KALEO GROUPE en écoute sur le port ${PORT}`));
