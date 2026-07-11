const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { requireCustomer } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives, réessayez plus tard.' }
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function issueToken(customer) {
  return jwt.sign({ type: 'customer', customerId: customer.id, email: customer.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/customers/register
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Nom, email valide et mot de passe sont requis' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

  const passwordHash = await bcrypt.hash(password, 10);
  const customer = await prisma.customer.create({
    data: { name, email, passwordHash, phone: phone || null }
  });

  res.status(201).json({ token: issueToken(customer), customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
}));

// POST /api/customers/login
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await bcrypt.compare(password, customer.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  res.json({ token: issueToken(customer), customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
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
