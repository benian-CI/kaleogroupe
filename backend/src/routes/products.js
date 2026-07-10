const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// GET /api/products — catalogue public (produits actifs uniquement)
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category } : {})
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(products);
}));

// GET /api/products/:idOrSlug — détail d'un produit actif
router.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isNumeric = /^\d+$/.test(idOrSlug);

  const product = await prisma.product.findFirst({
    where: {
      active: true,
      ...(isNumeric ? { id: Number(idOrSlug) } : { slug: idOrSlug })
    }
  });

  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(product);
}));

module.exports = router;
