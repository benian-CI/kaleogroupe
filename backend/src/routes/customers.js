const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { requireCustomer } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');
const { requireString, optionalString, isValidEmail } = require('../lib/validate');
const { sendPasswordResetEmail } = require('../services/email');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives, réessayez plus tard.' }
});

function issueToken(customer) {
  return jwt.sign(
    { type: 'customer', customerId: customer.id, email: customer.email, tv: customer.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Plus strict que le login : chaque demande envoie un email depuis notre compte Gmail.
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de demandes, réessayez plus tard.' }
});

// POST /api/customers/register
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { name: rawName, email: rawEmail, password, phone: rawPhone } = req.body || {};
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (!rawName || !isValidEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Nom, email valide et mot de passe sont requis' });
  }
  // 72 = limite de bcrypt (au-delà, les caractères sont ignorés silencieusement).
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir entre 8 et 72 caractères' });
  }
  const name = requireString(rawName, 'Le nom', 100);
  const phone = optionalString(rawPhone, 'Le téléphone', 30);

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({
    data: { name, email, passwordHash, phone }
  });

  res.status(201).json({ token: issueToken(customer), customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
}));

// POST /api/customers/login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  res.json({ token: issueToken(customer), customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
}));

// POST /api/customers/forgot-password — envoie un lien de réinitialisation.
// Réponse identique que le compte existe ou non, pour ne pas révéler quels
// emails sont inscrits.
router.post('/forgot-password', forgotLimiter, asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Adresse email invalide' });

  const genericResponse = { message: 'Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé.' };

  const customer = await prisma.customer.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });
  if (!customer) return res.json(genericResponse);

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS)
    }
  });

  const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim();
  try {
    await sendPasswordResetEmail(customer, `${frontendUrl}/compte/reinitialiser?token=${token}`);
  } catch (err) {
    console.error('Erreur envoi email de réinitialisation:', err);
    return res.status(502).json({ error: 'Impossible d\'envoyer l\'email pour le moment. Réessayez plus tard.' });
  }
  res.json(genericResponse);
}));

// POST /api/customers/reset-password — définit le nouveau mot de passe à partir
// du jeton reçu par email, puis révoque toutes les sessions existantes.
router.post('/reset-password', authLimiter, asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
    return res.status(400).json({ error: 'Lien de réinitialisation invalide' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir entre 8 et 72 caractères' });
  }

  const tokenHash = hashResetToken(token);
  const passwordHash = await bcrypt.hash(password, 10);
  // Mise à jour conditionnelle : le jeton doit exister et ne pas être expiré, et
  // il est effacé dans la même opération (utilisable une seule fois).
  const { count } = await prisma.customer.updateMany({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpires: { gt: new Date() } },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
      tokenVersion: { increment: 1 }
    }
  });
  if (count === 0) {
    return res.status(400).json({ error: 'Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande.' });
  }
  res.json({ message: 'Mot de passe modifié. Vous pouvez maintenant vous connecter.' });
}));

// GET /api/customers/me
router.get('/me', requireCustomer, asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.customer.customerId },
    select: { id: true, name: true, email: true, phone: true, createdAt: true }
  });
  if (!customer) return res.status(404).json({ error: 'Compte introuvable' });
  res.json(customer);
}));

// GET /api/customers/me/orders — historique de commandes du client connecté
router.get('/me/orders', requireCustomer, asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.customer.customerId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } }
  });
  res.json(orders);
}));

module.exports = router;
