const express = require('express');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const asyncHandler = require('../lib/asyncHandler');
const { requireString, optionalString, isValidEmail, httpError } = require('../lib/validate');
const { sendDevisEmail } = require('../services/email');

const router = express.Router();

// Remplace l'envoi direct par EmailJS depuis le navigateur : la clé EmailJS
// étant publique, n'importe qui pouvait utiliser le compte pour envoyer des
// emails. Ici, le destinataire est fixé côté serveur et les envois sont limités.
const devisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de demandes envoyées. Réessayez plus tard ou contactez-nous par WhatsApp.' }
});

// Identifiants envoyés par les cases du formulaire -> libellés de l'email
const SERVICES = {
  cameras: 'Caméras de surveillance',
  construction: 'Construction & Réhabilitation',
  split: 'Climatisation Split',
  menuiserie: 'Portes & Fenêtres Alu',
  electricite: 'Électricité'
};

// Vérification reCAPTCHA côté serveur, active seulement si la clé secrète est
// configurée (RECAPTCHA_SECRET sur Render). Sans elle, la limite d'envois et le
// champ piège restent les protections.
async function verifyRecaptcha(token, ip) {
  if (!process.env.RECAPTCHA_SECRET) return true;
  if (typeof token !== 'string' || !token) return false;
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token, remoteip: ip || '' }).toString()
  });
  const data = await res.json();
  return data.success === true;
}

// POST /api/devis — demande de devis du formulaire du site
router.post('/', devisLimiter, asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Champ piège invisible pour un humain : s'il est rempli, c'est un robot.
  // On répond comme si tout allait bien, sans rien envoyer.
  if (body.website) return res.status(201).json({ ok: true });

  const prenom = requireString(body.prenom, 'Le prénom', 60);
  const nom = requireString(body.nom, 'Le nom', 60);
  const telephone = requireString(body.telephone, 'Le téléphone', 30);
  const adresse = requireString(body.adresse, 'L\'adresse du chantier', 300);
  const description = requireString(body.description, 'La description du projet', 4000);
  const email = optionalString(body.email, 'L\'email', 254);
  if (email && !isValidEmail(email)) throw httpError(400, 'Adresse email invalide');
  const budget = optionalString(body.budget, 'Le budget', 60) || 'Non précisé';
  const delai = optionalString(body.delai, 'Le délai', 60) || 'Non précisé';
  const source = optionalString(body.source, 'La source', 60) || 'Non précisé';
  const services = (Array.isArray(body.services) ? body.services : [])
    .filter((s) => typeof s === 'string' && Object.prototype.hasOwnProperty.call(SERVICES, s))
    .map((s) => SERVICES[s]);
  if (services.length === 0) throw httpError(400, 'Choisissez au moins un service');

  if (!(await verifyRecaptcha(body.recaptcha, req.ip))) {
    throw httpError(400, 'Vérification anti-robot échouée. Cochez la case et réessayez.');
  }

  // Même référence que celle affichée au client et envoyée sur WhatsApp
  const ref = /^DEV-\d{6}$/.test(body.ref) ? body.ref : 'DEV-' + Date.now().toString().slice(-6);
  try {
    await sendDevisEmail({ ref, prenom, nom, telephone, email, adresse, services, budget, delai, description, source });
  } catch (err) {
    console.error('Erreur envoi email de devis:', err);
    return res.status(502).json({ error: 'Impossible d\'envoyer la demande pour le moment. Réessayez ou utilisez WhatsApp.' });
  }
  res.status(201).json({ ok: true, ref });
}));

module.exports = router;
