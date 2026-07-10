const fetch = require('node-fetch');

const BASE_URL = 'https://api-checkout.cinetpay.com/v2';

/**
 * Initie un paiement CinetPay et renvoie l'URL de la page de paiement hébergée.
 * Documentation: https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
 */
async function initPayment({ transactionId, amount, description, customer }) {
  const res = await fetch(`${BASE_URL}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount,
      currency: 'XOF',
      description,
      notify_url: `${process.env.BACKEND_URL}/api/payment/notify`,
      return_url: `${process.env.FRONTEND_URL}/paiement-succes?ref=${transactionId}`,
      channels: 'ALL',
      customer_name: customer.name,
      customer_surname: customer.surname || customer.name,
      customer_email: customer.email || 'client@kaleogroupe.com',
      customer_phone_number: customer.phone,
      customer_address: customer.address,
      customer_city: customer.city || 'Abidjan',
      customer_country: 'CI',
      customer_state: 'CI',
      customer_zip_code: '00225'
    })
  });

  const data = await res.json();
  if (data.code !== '201') {
    const err = new Error(data.message || 'Échec de l\'initialisation du paiement CinetPay');
    err.cinetpay = data;
    throw err;
  }
  return { paymentUrl: data.data.payment_url, paymentToken: data.data.payment_token };
}

/**
 * Vérifie le statut réel d'une transaction directement auprès de CinetPay.
 * Ne jamais faire confiance au seul contenu du webhook ou de la redirection navigateur.
 * Documentation: https://docs.cinetpay.com/api/1.0-fr/checkout/verification
 */
async function checkStatus(transactionId) {
  const res = await fetch(`${BASE_URL}/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId
    })
  });

  const data = await res.json();
  // code !== '00' signifie que la VÉRIFICATION elle-même a échoué (API indisponible,
  // transaction inconnue, etc.) — ce n'est pas la même chose qu'un paiement refusé.
  // On distingue les deux en levant une erreur ici plutôt qu'en renvoyant un statut
  // ambigu, pour ne jamais confondre "on ne sait pas" avec "refusé".
  if (data.code !== '00') {
    const err = new Error(data.message || 'Échec de la vérification du paiement CinetPay');
    err.cinetpay = data;
    throw err;
  }
  return { status: data.data?.status }; // 'ACCEPTED' | 'REFUSED' | 'CANCELLED' | ...
}

module.exports = { initPayment, checkStatus };
