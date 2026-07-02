// ============================================
// FORMULAIRE DE DEVIS — MULTI-ÉTAPES
// ============================================

// ⚠️ Remplace ces 3 valeurs par celles de ton compte EmailJS
const EMAILJS_PUBLIC_KEY  = 'fxjsxJderkG52kGED';
const EMAILJS_SERVICE_ID  = 'service_wap3ttv';
const EMAILJS_TEMPLATE_ID = 'template_kuho9vf';
if (typeof emailjs !== 'undefined') emailjs.init(EMAILJS_PUBLIC_KEY);

function showStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const step = document.getElementById('step' + n);
  if (step) step.classList.add('active');
}

function validateStep(n) {
  let valid = true;
  const step = document.getElementById('step' + n);
  if (!step) return true;

  const required = step.querySelectorAll('[required]');
  required.forEach(field => {
    const group = field.closest('.form-group');
    if (!field.value || field.value.trim() === '') {
      field.classList.add('invalid');
      if (group) group.classList.add('has-error');
      valid = false;
    } else {
      field.classList.remove('invalid');
      if (group) group.classList.remove('has-error');
    }
    // Email validation
    if (field.type === 'email' && field.value) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(field.value)) {
        field.classList.add('invalid');
        if (group) group.classList.add('has-error');
        valid = false;
      }
    }
    // Téléphone validation (format Côte d'Ivoire : 10 chiffres, indicatif +225 optionnel)
    if (field.type === 'tel' && field.value) {
      const phoneRe = /^(\+225|00225)?\s?0[1-9](\s?\d{2}){4}$/;
      if (!phoneRe.test(field.value.trim())) {
        field.classList.add('invalid');
        if (group) group.classList.add('has-error');
        valid = false;
      }
    }
  });

  // Email invalide même si le champ est facultatif
  step.querySelectorAll('input[type="email"]:not([required])').forEach(field => {
    const group = field.closest('.form-group');
    if (!field.value) return;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(field.value)) {
      field.classList.add('invalid');
      if (group) group.classList.add('has-error');
      valid = false;
    }
  });

  // Check at least one service checkbox in step 2
  if (n === 2) {
    const checked = document.querySelectorAll('input[name="services"]:checked');
    if (checked.length === 0) {
      // On affiche juste une alerte simple
      const label = document.querySelector('.service-checkboxes');
      if (label) label.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.5)';
      valid = false;
      setTimeout(() => { if (label) label.style.boxShadow = ''; }, 2000);
    }
  }

  return valid;
}

function nextStep(current) {
  if (!validateStep(current)) return;
  showStep(current + 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(current) {
  showStep(current - 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Soumission finale
const devisForm = document.getElementById('devisForm');
if (devisForm) {
  devisForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validateStep(3)) return;

    const prenom      = document.getElementById('prenom').value;
    const nom         = document.getElementById('nom').value;
    const telephone   = document.getElementById('telephone').value;
    const email       = document.getElementById('email').value;
    const adresse     = document.getElementById('adresse').value;
    const services    = [...document.querySelectorAll('input[name="services"]:checked')].map(cb => cb.value).join(', ');
    const budget      = document.getElementById('budget').value || 'Non précisé';
    const delai       = document.getElementById('delai').value;
    const description = document.getElementById('description').value;
    const source      = document.getElementById('comment').value || 'Non précisé';
    const ref         = 'DEV-' + Date.now().toString().slice(-6);
    const date        = new Date().toLocaleDateString('fr-FR');

    const message = encodeURIComponent(
      '🔧 *Demande de devis — KALEO GROUPE*\n' +
      '🧾 *Réf. :* ' + ref + ' · ' + date + '\n\n' +
      '👤 *Nom :* ' + prenom + ' ' + nom + '\n' +
      '📞 *Téléphone :* ' + telephone + '\n' +
      (email ? '📧 *Email :* ' + email + '\n' : '') +
      '📍 *Adresse chantier :* ' + adresse + '\n\n' +
      '🛠️ *Services demandés :* ' + services + '\n' +
      '💰 *Budget :* ' + budget + '\n' +
      '⏱️ *Délai :* ' + delai + '\n\n' +
      '📝 *Description du projet :*\n' + description + '\n\n' +
      '📣 *Source :* ' + source
    );

    const envoi = document.querySelector('input[name="envoi"]:checked');
    if (!envoi) {
      document.getElementById('envoi-error').style.display = 'block';
      return;
    }
    document.getElementById('envoi-error').style.display = 'none';

    const recaptchaResponse = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
    if (!recaptchaResponse) {
      document.getElementById('recaptcha-error').style.display = 'block';
      return;
    }
    document.getElementById('recaptcha-error').style.display = 'none';

    if ((envoi.value === 'email' || envoi.value === 'les-deux') && !email) {
      const emailField = document.getElementById('email');
      const group = emailField.closest('.form-group');
      emailField.classList.add('invalid');
      if (group) group.classList.add('has-error');
      showStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      emailField.focus();
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

    const templateParams = {
      prenom, nom, telephone, email, adresse, services, budget, delai, description, source, ref, date,
      to_email: 'kaleogroupe@gmail.com',
      from_name: 'KALEO GROUPE',
      reply_to: email || 'kaleogroupe@gmail.com',
      subject:  'Nouvelle demande de devis - ' + prenom + ' ' + nom,
      'g-recaptcha-response': recaptchaResponse
    };

    function afficherSucces() {
      document.getElementById('successName').textContent = prenom;
      document.getElementById('successRef').textContent = ref;
      document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
      document.getElementById('formSuccess').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function envoyerWhatsApp() {
      window.open('https://wa.me/2250102181848?text=' + message, '_blank');
    }

    function envoyerEmail() {
      return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    }

    if (envoi.value === 'whatsapp') {
      envoyerWhatsApp();
      afficherSucces();

    } else if (envoi.value === 'email') {
      envoyerEmail()
        .then(() => afficherSucces())
        .catch(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer ma demande';
          if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
          alert('Erreur d\'envoi. Vérifiez votre connexion ou utilisez WhatsApp.');
        });

    } else if (envoi.value === 'les-deux') {
      envoyerWhatsApp();
      envoyerEmail()
        .then(() => afficherSucces())
        .catch(() => {
          afficherSucces();
        });
    }
  });
}

// Retirer l'erreur au focus
document.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('input', function() {
    this.classList.remove('invalid');
    const group = this.closest('.form-group');
    if (group) group.classList.remove('has-error');
  });
});

// ── FOURCHETTES DE BUDGET DYNAMIQUES ──────────────────────────────────────────
var BUDGET_RANGES = {
  cameras: [
    { value: 'cam-<150k',     label: 'Moins de 150 000 FCFA' },
    { value: 'cam-150k-500k', label: '150 000 – 500 000 FCFA' },
    { value: 'cam-500k-1.5m', label: '500 000 – 1 500 000 FCFA' },
    { value: 'cam->1.5m',     label: 'Plus de 1 500 000 FCFA' }
  ],
  construction: [
    { value: 'cst-<5m',      label: 'Moins de 5 000 000 FCFA' },
    { value: 'cst-5m-20m',   label: '5 000 000 – 20 000 000 FCFA' },
    { value: 'cst-20m-100m', label: '20 000 000 – 100 000 000 FCFA' },
    { value: 'cst->100m',    label: 'Plus de 100 000 000 FCFA' }
  ],
  split: [
    { value: 'clim-<200k',     label: 'Moins de 200 000 FCFA' },
    { value: 'clim-200k-600k', label: '200 000 – 600 000 FCFA' },
    { value: 'clim-600k-2m',   label: '600 000 – 2 000 000 FCFA' },
    { value: 'clim->2m',       label: 'Plus de 2 000 000 FCFA' }
  ],
  menuiserie: [
    { value: 'men-<300k',   label: 'Moins de 300 000 FCFA' },
    { value: 'men-300k-1m', label: '300 000 – 1 000 000 FCFA' },
    { value: 'men-1m-3m',   label: '1 000 000 – 3 000 000 FCFA' },
    { value: 'men->3m',     label: 'Plus de 3 000 000 FCFA' }
  ],
  multi: [
    { value: 'mul-<1m',    label: 'Moins de 1 000 000 FCFA' },
    { value: 'mul-1m-5m',  label: '1 000 000 – 5 000 000 FCFA' },
    { value: 'mul-5m-20m', label: '5 000 000 – 20 000 000 FCFA' },
    { value: 'mul->20m',   label: 'Plus de 20 000 000 FCFA' }
  ]
};

function updateBudgetOptions() {
  var checked = document.querySelectorAll('input[name="services"]:checked');
  var budgetSelect = document.getElementById('budget');
  if (!budgetSelect) return;

  var ranges;
  if (checked.length === 0) {
    ranges = BUDGET_RANGES.multi;
  } else if (checked.length === 1) {
    ranges = BUDGET_RANGES[checked[0].value] || BUDGET_RANGES.multi;
  } else {
    ranges = BUDGET_RANGES.multi;
  }

  budgetSelect.innerHTML = '<option value="">-- Sélectionnez une fourchette --</option>';
  for (var i = 0; i < ranges.length; i++) {
    var opt = document.createElement('option');
    opt.value = ranges[i].value;
    opt.textContent = ranges[i].label;
    budgetSelect.appendChild(opt);
  }
  var ncOpt = document.createElement('option');
  ncOpt.value = 'nc';
  ncOpt.textContent = 'Je ne sais pas encore';
  budgetSelect.appendChild(ncOpt);
}

document.querySelectorAll('input[name="services"]').forEach(function(cb) {
  cb.addEventListener('change', updateBudgetOptions);
});
