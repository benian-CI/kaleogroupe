const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Force IPv4 : certains hébergeurs annoncent une adresse IPv6 pour Gmail sans
  // route sortante fonctionnelle, ce qui fait échouer la connexion (ENETUNREACH).
  family: 4
});

function money(n) {
  return Number(n).toLocaleString('fr-FR') + ' FCFA';
}

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function itemsTableHtml(items) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #eee;width:70px;">
        ${item.product.imageUrl
          ? `<img src="${escapeHtml(item.product.imageUrl)}" alt="${escapeHtml(item.product.name)}" width="60" height="60" style="object-fit:cover;border-radius:8px;display:block;"/>`
          : ''}
      </td>
      <td style="padding:12px;border-bottom:1px solid #eee;">
        <strong>${escapeHtml(item.product.name)}</strong><br/>
        <span style="color:#888;font-size:13px;">${item.quantity} × ${money(item.unitPrice)}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;white-space:nowrap;">
        ${money(item.quantity * item.unitPrice)}
      </td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">${rows}</table>`;
}

function orderSummaryHtml(order) {
  const paymentLabel = order.paymentMethod === 'cash' ? 'Espèces à la livraison' : 'Mobile Money / Carte bancaire';
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#FF6B2B;margin-bottom:4px;">Commande ${escapeHtml(order.ref)}</h2>
      ${itemsTableHtml(order.items)}
      <p style="text-align:right;font-size:18px;font-weight:bold;margin-top:12px;">Total : ${money(order.totalAmount)}</p>
      <p style="font-family:Arial,sans-serif;"><strong>Mode de paiement :</strong> ${paymentLabel}</p>
      <p style="font-family:Arial,sans-serif;"><strong>Adresse de livraison :</strong> ${escapeHtml(order.deliveryAddress)}</p>
    </div>`;
}

// Notifie le client (confirmation avec photo et détails du produit) et
// l'entreprise (coordonnées du client pour l'appeler et organiser la livraison).
// Best-effort : une erreur d'envoi ne doit jamais faire échouer la commande
// elle-même, qui est déjà confirmée/payée au moment où cette fonction est appelée.
async function sendOrderEmails(order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('Notifications email désactivées : SMTP_USER/SMTP_PASS non configurés.');
    return;
  }

  if (order.customerEmail) {
    try {
      await transporter.sendMail({
        from: `"KALEO GROUPE" <${process.env.SMTP_USER}>`,
        to: order.customerEmail,
        subject: `Confirmation de votre commande ${order.ref} — KALEO GROUPE`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto 16px;">
            <p>Bonjour ${escapeHtml(order.customerName)},</p>
            <p>Merci pour votre commande ! Voici le récapitulatif :</p>
          </div>
          ${orderSummaryHtml(order)}
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:16px auto 0;">
            <p>Notre équipe va vous contacter au <strong>${escapeHtml(order.customerPhone)}</strong> pour confirmer et organiser la livraison.</p>
            <p>Merci de votre confiance,<br/>L'équipe KALEO GROUPE</p>
          </div>`
      });
    } catch (err) {
      console.error('Erreur envoi email client:', err);
    }
  }

  try {
    await transporter.sendMail({
      from: `"Boutique KALEO GROUPE" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
      subject: `🛒 Nouvelle commande ${order.ref} — ${order.customerName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto 16px;">
          <p><strong>Client :</strong> ${escapeHtml(order.customerName)}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(order.customerPhone)}</p>
          ${order.customerEmail ? `<p><strong>Email :</strong> ${escapeHtml(order.customerEmail)}</p>` : ''}
        </div>
        ${orderSummaryHtml(order)}`
    });
  } catch (err) {
    console.error('Erreur envoi email entreprise:', err);
  }
}

module.exports = { sendOrderEmails };
