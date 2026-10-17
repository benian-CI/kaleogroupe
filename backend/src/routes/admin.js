const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');
const { uploadImageBuffer } = require('../services/cloudinary');
const { slugify } = require('../lib/slugify');
const asyncHandler = require('../lib/asyncHandler');
const { httpError, requireString, optionalString, nonNegativeNumber } = require('../lib/validate');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const VALID_UNITS = ['unite', 'metre', 'kg'];
const VALID_QUALITIES = ['standard', 'superieure', 'premium'];

// Champs produit communs à la création et à la modification. En modification,
// un champ absent (undefined) est simplement laissé tel quel.
function validateProductFields(body, { partial }) {
  const field = (key, fn) => (partial && body[key] === undefined ? undefined : fn(body[key]));
  const data = {
    name: field('name', (v) => requireString(v, 'Le nom', 200)),
    description: field('description', (v) => requireString(v, 'La description', 5000)),
    category: field('category', (v) => requireString(v, 'La catégorie', 50)),
    price: field('price', (v) => {
      if (v === undefined) throw httpError(400, 'Le prix est requis');
      return Math.round(nonNegativeNumber(v, 'Le prix'));
    }),
    stock: field('stock', (v) => (v === undefined || v === '' ? 0 : Math.round(nonNegativeNumber(v, 'Le stock') * 100) / 100)),
    imageUrl: field('imageUrl', (v) => {
      const url = optionalString(v, 'L\'URL de l\'image', 1000);
      if (url && !/^(https:\/\/|\/(?![\/\\]))/.test(url)) throw httpError(400, 'L\'image doit être une adresse https:// ou un chemin du site');
      return url;
    }),
    active: field('active', (v) => {
      if (v === undefined) return true;
      if (typeof v !== 'boolean') throw httpError(400, 'Statut actif invalide');
      return v;
    })
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives, réessayez plus tard.' }
});

// POST /api/admin/login
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  const token = jwt.sign({ type: 'admin', adminId: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
}));

router.use(requireAdmin);

// Un :id non numérique ferait échouer Prisma (erreur 500) : on répond 404 directement.
router.param('id', (req, res, next, id) => (/^\d+$/.test(id) ? next() : res.status(404).json({ error: 'Introuvable' })));

// ---- Produits ----

router.get('/products', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(products);
}));

router.post('/products', asyncHandler(async (req, res) => {
  const { name, description, price, category, unit, quality } = req.body || {};
  if (!name || !description || !category || price === undefined || price === null || price === '') {
    return res.status(400).json({ error: 'Nom, description, prix et catégorie sont requis' });
  }
  const fields = validateProductFields(req.body, { partial: false });
  const productUnit = unit || 'unite';
  if (!VALID_UNITS.includes(productUnit)) {
    return res.status(400).json({ error: 'Unité de vente invalide' });
  }
  if (quality !== undefined && quality !== null && quality !== '' && !VALID_QUALITIES.includes(quality)) {
    return res.status(400).json({ error: 'Qualité invalide' });
  }

  const baseSlug = slugify(fields.name) || 'produit';
  let slug = baseSlug;
  let i = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`;
  }

  const product = await prisma.product.create({
    data: {
      ...fields,
      slug,
      quality: quality || null,
      unit: productUnit
    }
  });
  res.status(201).json(product);
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const { unit, quality } = req.body || {};
  const fields = validateProductFields(req.body || {}, { partial: true });
  if (unit !== undefined && !VALID_UNITS.includes(unit)) {
    return res.status(400).json({ error: 'Unité de vente invalide' });
  }
  if (quality !== undefined && quality !== null && quality !== '' && !VALID_QUALITIES.includes(quality)) {
    return res.status(400).json({ error: 'Qualité invalide' });
  }
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        ...fields,
        ...(unit !== undefined && { unit }),
        ...(quality !== undefined && { quality: quality || null })
      }
    });
    res.json(product);
  } catch (err) {
    // P2025 = l'enregistrement n'existe pas : c'est la seule vraie raison de répondre 404.
    // Toute autre erreur (panne DB, etc.) doit remonter au gestionnaire d'erreurs global
    // pour être journalisée, plutôt que d'être déguisée en "produit introuvable".
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' });
    throw err;
  }
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  // On vérifie explicitement AVANT de supprimer plutôt que de deviner après coup
  // le type d'erreur renvoyé par Postgres : selon la façon exacte dont la contrainte
  // de clé étrangère est violée, Prisma ne classe pas toujours ça sous le code connu
  // "P2003" (parfois ça remonte comme une erreur générique non reconnue), ce qui
  // masquait ce cas légitime derrière une erreur 500 au lieu du message clair.
  const hasOrders = await prisma.orderItem.findFirst({ where: { productId: id } });
  if (hasOrders) {
    return res.status(409).json({ error: 'Impossible de supprimer : ce produit a déjà des commandes associées. Désactivez-le plutôt que de le supprimer.' });
  }

  try {
    await prisma.product.delete({ where: { id } });
    res.sendStatus(204);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit introuvable' });
    throw err;
  }
}));

// POST /api/admin/upload — upload d'image produit vers Cloudinary
router.post('/upload', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucune image envoyée' });
  try {
    const url = await uploadImageBuffer(req.file.buffer, 'produit');
    res.json({ url });
  } catch (err) {
    console.error('Erreur upload Cloudinary:', err);
    res.status(502).json({ error: 'Échec de l\'upload de l\'image' });
  }
}));

// ---- Commandes ----

router.get('/orders', asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } }
  });
  res.json(orders);
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { items: { include: { product: true } } }
  });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(order);
}));

// POST /api/admin/orders/:id/mark-paid — confirme manuellement une commande payée en espèces
// (uniquement les commandes "cash" encore en attente : les commandes CinetPay ne peuvent être
// confirmées que par la vérification serveur-à-serveur dans payment.js, jamais manuellement ici).
router.post('/orders/:id/mark-paid', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (order.paymentMethod !== 'cash') {
    return res.status(400).json({ error: 'Seules les commandes payées en espèces peuvent être confirmées manuellement.' });
  }
  if (order.status !== 'pending') {
    return res.status(409).json({ error: 'Cette commande a déjà été traitée.' });
  }
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'paid', paidAt: new Date() }
  });
  res.json(updated);
}));

// POST /api/admin/orders/:id/cancel — annule une commande "cash" encore en attente
// (client injoignable, fausse commande...) et remet en stock ce qu'elle avait réservé.
// Les commandes CinetPay ne sont pas annulables ici : leur stock n'est pas réservé,
// et les annuler risquerait d'ignorer un paiement confirmé plus tard par le webhook.
router.post('/orders/:id/cancel', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  if (order.paymentMethod !== 'cash') {
    return res.status(400).json({ error: 'Seules les commandes payées en espèces peuvent être annulées ici.' });
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: 'pending' },
      data: { status: 'cancelled' }
    });
    if (count === 0) return false;
    const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }
    return true;
  });
  if (!cancelled) return res.status(409).json({ error: 'Cette commande a déjà été traitée.' });

  res.json(await prisma.order.findUnique({ where: { id: order.id } }));
}));

module.exports = router;
