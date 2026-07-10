const express = require('express');
const prisma = require('../lib/prisma');
const cinetpay = require('../services/cinetpay');
const { sendOrderEmails } = require('../services/email');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();

// POST /api/payment/notify — webhook serveur-à-serveur appelé par CinetPay.
// On ne fait JAMAIS confiance au contenu du webhook lui-même : on revérifie
// systématiquement le statut réel auprès de CinetPay avant de mettre à jour la commande.
router.post('/notify', express.urlencoded({ extended: true }), asyncHandler(async (req, res) => {
  const transactionId = req.body?.cpm_trans_id || req.body?.transaction_id;
  if (!transactionId) return res.sendStatus(400);

  const order = await prisma.order.findUnique({ where: { ref: transactionId } });
  if (!order) return res.sendStatus(404);

  // Idempotent : si la commande a déjà été traitée (paid/failed), on ne refait rien.
  if (order.status !== 'pending') return res.sendStatus(200);

  let status;
  try {
    ({ status } = await cinetpay.checkStatus(transactionId));
  } catch (err) {
    // La VÉRIFICATION a échoué (panne réseau/API CinetPay passagère) — ce n'est pas
    // un refus de paiement. On laisse la commande "pending" et on répond en erreur
    // pour que CinetPay retente le webhook plus tard, plutôt que de marquer à tort
    // la commande "failed" et perdre définitivement un paiement pourtant accepté.
    console.error('Erreur vérification statut CinetPay:', err);
    return res.sendStatus(502);
  }

  if (status === 'ACCEPTED') {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'paid', paidAt: new Date(), cinetpayTransId: transactionId }
      });
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        // Décrément conditionnel : n'enlève du stock que s'il y en a assez, pour ne
        // jamais passer en négatif si deux commandes concurrentes ont vidé le stock
        // entre-temps. Le client a déjà payé — le suivi se fait alors manuellement.
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } }
        });
        if (result.count === 0) {
          console.error(`Stock insuffisant pour le produit ${item.productId} lors de la confirmation de la commande ${order.ref} — survente détectée, vérification manuelle nécessaire.`);
        }
      }
    });

    // Best-effort, ne bloque jamais la réponse au webhook ni ne fait échouer la confirmation.
    prisma.order.findUnique({ where: { id: order.id }, include: { items: { include: { product: true } } } })
      .then(sendOrderEmails)
      .catch((err) => console.error('Erreur notification email commande:', err));
  } else if (status === 'REFUSED' || status === 'CANCELLED' || status === 'EXPIRED') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'failed' } });
  }
  // Tout autre statut (ex: encore "en attente" côté CinetPay) : on ne change rien,
  // la commande reste "pending" jusqu'à un prochain webhook qui tranchera.

  res.sendStatus(200);
}));

module.exports = router;
