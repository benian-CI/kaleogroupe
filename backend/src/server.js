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
process.on('uncaughtException', (err) => {
  console.error('Exception non capturée:', err);
});

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const paymentRouter = require('./routes/payment');
const adminRouter = require('./routes/admin');
const customersRouter = require('./routes/customers');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) return callback(null, true);
    callback(new Error('Origine non autorisée'));
  }
}));

app.use(express.json());

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
