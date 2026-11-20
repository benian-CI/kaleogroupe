const express = require('express');
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// Adresse publique du site (les fiches produits y sont servies)
function siteUrl() {
  const fromEnv = process.env.SITE_URL || (process.env.FRONTEND_URL || '').split(',')[0].trim();
  return (fromEnv || 'https://app.kaleogroupe.com').replace(/\/+$/, '');
}

const xmlEscape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// GET /api/sitemap-produits.xml — plan de site des fiches produits actives.
// Déclaré dans le robots.txt du site : Google y trouve chaque nouveau produit
// sans qu'il faille modifier le sitemap.xml statique à la main.
router.get('/sitemap-produits.xml', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, updatedAt: true },
    orderBy: { id: 'asc' }
  });
  const base = siteUrl();
  const urls = products.map((p) =>
    `  <url>\n    <loc>${xmlEscape(`${base}/produit?id=${p.id}`)}</loc>\n    <lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod>\n  </url>`
  ).join('\n');

  res.type('application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}));

module.exports = router;
