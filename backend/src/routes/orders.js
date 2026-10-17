const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const prisma = require('../lib/prisma');
const cinetpay = require('../services/cinetpay');
const { sendOrderEmails } = require('../services/email');
const { optionalCustomer } = require('../middleware/auth');
const asyncHandler = require('../lib/asyncHandler');
const { requireString, optionalString, isValidEmail } = require('../lib/validate');

function notifyOrderByEmail(orderId) {
  // Best-effort, ne bloque jamais la réponse HTTP ni ne fait échouer la commande.
  prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } })
    .then(sendOrderEmails)
    .catch((err) => console.error('Erreur notification email commande:', err));
}

const router = express.Router();

// Création de commande publique (invités acceptés) : sans limite, un script
// pourrait vider le stock via des commandes "espèces" (qui le réservent tout de
// suite) et faire envoyer des emails en masse depuis notre compte Gmail.
const createOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de commandes depuis cette connexion, réessayez plus tard ou contactez-nous.' }
});

// Frais fixe, jamais envoyé par le client : seul un booléen "je veux l'installation"
// est accepté depuis le front, le montant est toujours celui-ci côté serveur.
const INSTALLATION_FEE = 30000;

function generateRef() {
  return `KAL-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
}

// POST /api/orders — crée la commande et initie le paiement (CinetPay ou espèces à la livraison)
// optionalCustomer : si un jeton client valide est fourni, la commande est liée
// à son compte ; sinon elle reste une commande "invité", jamais bloquée.
router.post('/', createOrderLimiter, optionalCustomer, asyncHandler(async (req, res) => {
  const { items, customer, paymentMethod, installation } = req.body || {};
  const installationRequested = installation === true;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide' });
  }
  if (items.length > 50) {
    return res.status(400).json({ error: 'Trop d\'articles différents dans le panier' });
  }
  if (!customer?.name || !customer?.phone || !customer?.address) {
    return res.status(400).json({ error: 'Nom, téléphone et adresse de livraison sont requis' });
  }
  if (paymentMethod !== undefined && paymentMethod !== 'cinetpay' && paymentMethod !== 'cash') {
    return res.status(400).json({ error: 'Mode de paiement invalide' });
  }
  const isCash = paymentMethod === 'cash';

  // Champs bornés : ils sont stockés tels quels puis réaffichés dans les emails
  // et le tableau de bord admin.
  const customerName = requireString(customer.name, 'Le nom', 100);
  const customerPhone = requireString(customer.phone, 'Le téléphone', 30);
  const deliveryAddress = requireString(customer.address, 'L\'adresse de livraison', 300);
  const customerCity = optionalString(customer.city, 'La ville', 100);
  const customerEmail = optionalString(customer.email, 'L\'email', 254);
  if (customerEmail && !isValidEmail(customerEmail)) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }

  const productIds = items.map((i) => Number(i?.productId));
  if (!productIds.every(Number.isInteger)) {
    return res.status(400).json({ error: 'Panier invalide' });
  }
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true }
  });

  if (products.length !== new Set(productIds).size) {
    return res.status(400).json({ error: 'Un ou plusieurs produits du panier ne sont plus disponibles' });
  }

  // Le total est TOUJOURS recalculé côté serveur à partir des prix en base,
  // jamais à partir des prix envoyés par le client.
  // On agrège d'abord les quantités par produit : si le même produit apparaît
  // deux fois dans le panier, la limite de stock doit s'appliquer à la somme,
  // pas à chaque ligne indépendamment. Les produits vendus au mètre/kilo
  // acceptent des quantités décimales (ex: 2.5), les autres restent entiers.
  const quantityByProduct = new Map();
  for (const item of items) {
    const id = Number(item.productId);
    const product = products.find((p) => p.id === id);
    const rawQty = Number(item.quantity) || 1;
    const quantity = product.unit === 'unite'
      ? Math.max(1, Math.floor(rawQty))
      : Math.round(Math.max(0.1, rawQty) * 100) / 100;
    quantityByProduct.set(id, (quantityByProduct.get(id) || 0) + quantity);
  }

  let totalAmount = 0;
  const orderItemsData = [];
  for (const [productId, quantity] of quantityByProduct) {
    const product = products.find((p) => p.id === productId);
    if (product.stock < quantity) {
      return res.status(409).json({ error: `Stock insuffisant pour "${product.name}"` });
    }
    totalAmount += product.price * quantity;
    orderItemsData.push({ productId, quantity, unitPrice: product.price });
  }

  const installationFee = installationRequested ? INSTALLATION_FEE : 0;
  totalAmount = Math.round(totalAmount + installationFee);

  const ref = generateRef();

  let order;
  try {
    order = await prisma.order.create({
      data: {
        ref,
        status: 'pending',
        paymentMethod: isCash ? 'cash' : 'cinetpay',
        customerId: req.customer ? req.customer.customerId : null,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        totalAmount,
        installationRequested,
        installationFee,
        items: { create: orderItemsData }
      }
    });
  } catch (err) {
    console.error('Erreur création commande:', err);
    return res.status(500).json({ error: 'Impossible de créer la commande pour le moment. Réessayez.' });
  }

  // Paiement en espèces à la livraison : pas de passerelle en ligne, on réserve
  // le stock tout de suite (aucun webhook ne viendra jamais confirmer ce paiement,
  // c'est l'admin qui le marquera "payée" manuellement une fois la livraison faite).
  if (isCash) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of orderItemsData) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          if (result.count === 0) {
            throw Object.assign(new Error('Stock insuffisant'), { code: 'OUT_OF_STOCK' });
          }
        }
      });
    } catch (err) {
      await prisma.order.updateMany({ where: { ref }, data: { status: 'failed' } });
      if (err.code === 'OUT_OF_STOCK') {
        return res.status(409).json({ error: 'Un produit du panier vient d\'être épuisé, réessayez.' });
      }
      console.error('Erreur réservation stock (commande espèces):', err);
      return res.status(500).json({ error: 'Impossible de finaliser la commande pour le moment. Réessayez.' });
    }
    notifyOrderByEmail(order.id);
    return res.status(201).json({ ref: order.ref, paymentMethod: 'cash' });
  }

  try {
    const { paymentUrl } = await cinetpay.initPayment({
      transactionId: ref,
      amount: totalAmount,
      description: `Commande KALEO GROUPE ${ref}`,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: deliveryAddress,
        city: customerCity
      }
    });

    res.status(201).json({ ref: order.ref, paymentUrl });
  } catch (err) {
    // Si CinetPay échoue à l'initialisation, on marque la commande en échec plutôt que de la laisser bloquée en pending.
    await prisma.order.updateMany({ where: { ref }, data: { status: 'failed' } });
    console.error('Erreur initiation paiement CinetPay:', err);
    res.status(502).json({ error: 'Impossible d\'initier le paiement pour le moment. Réessayez dans un instant.' });
  }
}));

// GET /api/orders/:ref/status — utilisé par la page de retour pour afficher le statut final
router.get('/:ref/status', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { ref: req.params.ref },
    select: { ref: true, status: true, paymentMethod: true, totalAmount: true, installationRequested: true, installationFee: true, customerName: true, paidAt: true }
  });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  // Route publique (seule la référence est demandée) : on ne renvoie que le
  // prénom, suffisant pour le message de remerciement, pas le nom complet.
  res.json({ ...order, customerName: order.customerName.split(/\s+/)[0] });
}));

module.exports = router;
