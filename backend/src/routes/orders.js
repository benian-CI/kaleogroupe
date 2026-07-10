const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const cinetpay = require('../services/cinetpay');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

function generateRef() {
  return `KAL-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase();
}

// POST /api/orders — crée la commande et initie le paiement CinetPay
router.post('/', asyncHandler(async (req, res) => {
  const { items, customer } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide' });
  }
  if (!customer?.name || !customer?.phone || !customer?.address) {
    return res.status(400).json({ error: 'Nom, téléphone et adresse de livraison sont requis' });
  }

  const productIds = items.map((i) => Number(i.productId));
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
  // pas à chaque ligne indépendamment.
  const quantityByProduct = new Map();
  for (const item of items) {
    const id = Number(item.productId);
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
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

  const ref = generateRef();

  let order;
  try {
    order = await prisma.order.create({
      data: {
        ref,
        status: 'pending',
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || null,
        deliveryAddress: customer.address,
        totalAmount,
        items: { create: orderItemsData }
      }
    });
  } catch (err) {
    console.error('Erreur création commande:', err);
    return res.status(500).json({ error: 'Impossible de créer la commande pour le moment. Réessayez.' });
  }

  try {
    const { paymentUrl } = await cinetpay.initPayment({
      transactionId: ref,
      amount: totalAmount,
      description: `Commande KALEO GROUPE ${ref}`,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city
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
    select: { ref: true, status: true, totalAmount: true, customerName: true, paidAt: true }
  });
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(order);
}));

module.exports = router;
