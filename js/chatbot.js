(function () {
  'use strict';

  var lastTopic = null;

  // ── Helpers HTML ────────────────────────────────────────────────────────────
  function card(faIcon, title, body) {
    return '<div class="cb-card">' +
      '<div class="cb-card-head">' +
        '<div class="cb-card-head-icon"><i class="' + faIcon + '"></i></div>' +
        '<span class="cb-card-title">' + title + '</span>' +
      '</div>' +
      '<div class="cb-card-body">' + body + '</div>' +
    '</div>';
  }

  function list(items) {
    return '<ul class="cb-info-list">' +
      items.map(function(i) {
        return '<li><i class="' + i[0] + '"></i><span>' + i[1] + '</span></li>';
      }).join('') +
    '</ul>';
  }

  function contactRow(href, faIcon, label, newTab) {
    return '<a href="' + href + '" class="cb-contact-row"' + (newTab ? ' target="_blank"' : '') + '>' +
      '<i class="' + faIcon + '"></i>' +
      '<span>' + label + '</span>' +
      '<i class="fas fa-chevron-right" style="margin-left:auto;font-size:9px;opacity:0.35;"></i>' +
    '</a>';
  }

  function devisEmailBtn() {
    return '<button type="button" class="cb-contact-row cb-devis-btn cb-devis-email-btn">' +
      '<i class="fas fa-file-invoice"></i>' +
      '<span>Faire une demande de devis par email</span>' +
      '<i class="fas fa-chevron-right" style="margin-left:auto;font-size:9px;opacity:0.35;"></i>' +
    '</button>';
  }

  function badges(items) {
    return '<div class="cb-badge-row">' +
      items.map(function(b) {
        return '<span class="cb-stat-badge"><i class="' + b[0] + '"></i><strong>' + b[1] + '</strong></span>';
      }).join('') +
    '</div>';
  }

  // ── Icônes des boutons rapides ──────────────────────────────────────────────
  var qrIcons = {
    'Caméras':           'fas fa-video',
    'Construction':      'fas fa-helmet-safety',
    'Climatisation':     'fas fa-wind',
    'Portes & Fenêtres': 'fas fa-door-open',
    'Électricité':       'fas fa-bolt',
    'Devis gratuit':     'fas fa-file-invoice',
    'Devis caméras':     'fas fa-file-invoice',
    'Devis construction':'fas fa-file-invoice',
    'Devis climatisation':'fas fa-file-invoice',
    'Devis menuiserie':  'fas fa-file-invoice',
    'Devis électricité': 'fas fa-file-invoice',
    'Devis entretien':   'fas fa-file-invoice',
    'Panne électrique':  'fas fa-bolt',
    'Mise aux normes':   'fas fa-clipboard-check',
    'Appeler':           'fas fa-phone',
    'WhatsApp':          'fab fa-whatsapp',
    'Email':             'fas fa-envelope',
    'Vue smartphone':    'fas fa-mobile-screen',
    'Nombre de caméras': 'fas fa-layer-group',
    'Vision nocturne':   'fas fa-moon',
    'Puissance BTU':     'fas fa-sliders',
    'Entretien clim':    'fas fa-broom',
    'Dépannage clim':    'fas fa-triangle-exclamation',
    'Délai fabrication': 'fas fa-calendar-days',
    'Porte blindée':     'fas fa-lock',
    'Rideau métallique': 'fas fa-store',
    'Délai chantier':    'fas fa-calendar-days',
    'Rénovation':        'fas fa-rotate-left',
    'Nos réalisations':  'fas fa-images',
    'Urgence':           'fas fa-circle-exclamation'
  };

  // ── Boutons → texte de recherche ────────────────────────────────────────────
  var qrMap = {
    'Caméras':            'cameras surveillance cctv',
    'Construction':       'construction batiment',
    'Climatisation':      'climatisation split clim',
    'Portes & Fenêtres':  'menuiserie fenetres aluminium',
    'Électricité':        'electricite electricien courant',
    'Devis gratuit':      'devis prix gratuit',
    'Devis caméras':      'devis prix gratuit',
    'Devis construction': 'devis prix gratuit',
    'Devis climatisation':'devis prix gratuit',
    'Devis menuiserie':   'devis prix gratuit',
    'Devis électricité':  'devis prix gratuit',
    'Devis entretien':    'devis prix gratuit',
    'Panne électrique':   'panne coupure disjoncteur court.circuit',
    'Mise aux normes':    'normes tableau electrique conformite',
    'Appeler':            'numero contacter joindre',      // corrigé : évite le match cameras/smartphone
    'WhatsApp':           'whatsapp',
    'Email':              'email mail courriel',
    'Vue smartphone':     'smartphone monitoring distance', // corrigé : plus de 'mobile' ambigu
    'Nombre de caméras':  'combien installer pose',          // corrigé : 'cameras' déclenchait caméras général
    'Vision nocturne':    'nuit infrarouge nocturne',
    'Puissance BTU':      'puissance btu capacite',
    'Entretien clim':     'entretien nettoyage filtres',
    'Dépannage clim':     'depannage panne reparation',    // corrigé : 'climatiseur' déclenchait clim général
    'Délai fabrication':  'livraison fabriquer fabrication', // corrigé : 'menuiserie'/'fenetre' déclenchaient menuiserie général
    'Porte blindée':      'blindee renforcee securisee',   // corrigé : 'porte' déclenchait menuiserie général
    'Rideau métallique':  'rideau metallique store',
    'Délai chantier':     'delai chantier semaine',         // corrigé : 'construction' déclenchait construction général
    'Rénovation':         'renovation rehabilitation restaurer',
    'Nos réalisations':   'realisations references portfolio',
    'Urgence':            'urgence immediat intervention'  // corrigé : 'panne' déclenchait clim
  };

  // ── Réponses ────────────────────────────────────────────────────────────────
  var responses = [

    // SALUTATIONS
    {
      topic: null,
      patterns: [/bonjour|salut|bonsoir|hello|coucou|bonne\s*(matin|soir|nuit|apr)/i],
      reply: function() {
        return card('fas fa-comments', 'Bienvenue chez KALEO GROUPE',
          '<strong>Bonjour !</strong> Je suis votre assistant virtuel.<br/><br/>' +
          'Je peux répondre à toutes vos questions sur nos services, tarifs, délais et coordonnées.<br/><br/>' +
          '<em>Comment puis-je vous aider ?</em>' +
          badges([
            ['fas fa-star',         '4.9/5'],
            ['fas fa-bolt',         'Réponse immédiate'],
            ['fas fa-shield-halved','3 ans d\'expérience']
          ])
        );
      },
      quickReplies: ['Caméras','Construction','Climatisation','Électricité','Portes & Fenêtres']
    },

    // SERVICES GÉNÉRAUX
    {
      topic: null,
      patterns: [/service|proposez|offre|faites.vous|domaine|activit|specialit/i],
      reply: function() {
        return card('fas fa-briefcase', 'Nos domaines d\'expertise',
          'KALEO GROUPE couvre <strong>5 domaines</strong> à Abidjan :' +
          list([
            ['fas fa-video',        '<strong>Caméras de surveillance</strong> — CCTV, IP, filaire & Wi-Fi'],
            ['fas fa-helmet-safety','<strong>Construction & Réhabilitation</strong> — neuf & rénovation'],
            ['fas fa-wind',         '<strong>Climatisation Split</strong> — fourniture, pose & entretien'],
            ['fas fa-bolt',         '<strong>Électricité</strong> — installation, mise aux normes & dépannage'],
            ['fas fa-door-open',    '<strong>Portes & Fenêtres Aluminium</strong> — sur mesure']
          ]) +
          '<br/>Sélectionnez un service pour plus d\'infos.'
        );
      },
      quickReplies: ['Caméras','Construction','Climatisation','Électricité','Portes & Fenêtres']
    },

    // CAMÉRAS — général
    {
      topic: 'cameras',
      patterns: [/cam.ra|cctv|surveillance|vid.o|s.curit.|espion|enregistr/i],
      reply: function() {
        return card('fas fa-video', 'Caméras de surveillance',
          'Systèmes complets pour particuliers, commerces et entreprises :' +
          list([
            ['fas fa-wifi',          'Caméras <strong>IP Wi-Fi</strong> — HD, vision nocturne, sans câble'],
            ['fas fa-plug',          'Caméras <strong>CCTV filaires</strong> — fiabilité maximale'],
            ['fas fa-database',      'Enregistreurs <strong>DVR/NVR</strong> avec stockage local'],
            ['fas fa-mobile-screen', '<strong>Monitoring à distance</strong> via smartphone 24h/24'],
            ['fas fa-building',      'Solutions <strong>villas, bureaux, commerces, chantiers</strong>']
          ])
        );
      },
      quickReplies: ['Vue smartphone','Nombre de caméras','Vision nocturne','Devis caméras']
    },

    // CAMÉRAS — smartphone
    {
      topic: 'cameras',
      patterns: [/t.l.phone|smartphone|distance|mobile|application|app|pc|ordinateur|tablette/i],
      reply: function() {
        return card('fas fa-mobile-screen', 'Surveillance à distance',
          'Tous nos systèmes permettent de visualiser vos caméras <strong>en direct</strong> depuis votre téléphone, partout dans le monde.' +
          list([
            ['fas fa-circle-check', 'Application gratuite — iOS & Android'],
            ['fas fa-circle-check', 'Visionnage en direct et en différé'],
            ['fas fa-circle-check', 'Alertes mouvement en temps réel'],
            ['fas fa-circle-check', 'Fonctionne via Wi-Fi et données mobiles']
          ]) +
          '<br/>Nous configurons tout lors de l\'installation.'
        );
      },
      quickReplies: ['Nombre de caméras','Devis caméras','Appeler']
    },

    // CAMÉRAS — nombre
    {
      topic: 'cameras',
      patterns: [/combien.*(cam.ra|install|met)|nombre.*(cam.ra)/i],
      reply: function() {
        return card('fas fa-layer-group', 'Nombre de caméras recommandé',
          list([
            ['fas fa-house',         '<strong>Appartement</strong> : 2 à 4 caméras'],
            ['fas fa-house-chimney', '<strong>Villa / maison</strong> : 4 à 8 caméras'],
            ['fas fa-shop',          '<strong>Commerce / bureau</strong> : selon superficie'],
            ['fas fa-warehouse',     '<strong>Entrepôt / chantier</strong> : étude sur place']
          ]) +
          '<br/>Nous réalisons une <strong>visite gratuite</strong> pour évaluer vos besoins et définir la configuration optimale.'
        );
      },
      quickReplies: ['Devis caméras','Appeler','WhatsApp']
    },

    // CAMÉRAS — vision nocturne
    {
      topic: 'cameras',
      patterns: [/nuit|nocturne|noir|obscurit|infrarouge|sombre/i],
      reply: function() {
        return card('fas fa-moon', 'Vision nocturne',
          'Toutes nos caméras intègrent la <strong>technologie infrarouge</strong> pour surveiller efficacement même dans l\'obscurité totale.' +
          list([
            ['fas fa-eye',   'Portée infrarouge jusqu\'à <strong>30 mètres</strong>'],
            ['fas fa-image', 'Image nette en noir & blanc la nuit'],
            ['fas fa-star',  'Option <strong>Starlight</strong> — couleur même de nuit']
          ]) +
          '<br/>Nous sélectionnons le modèle adapté à votre environnement.'
        );
      },
      quickReplies: ['Devis caméras','Appeler']
    },

    // CONSTRUCTION — général
    {
      topic: 'construction',
      patterns: [/construction|b.timent|gros.uvre|second.uvre|b.ton|maison|villa|immeuble|logement|neuf/i],
      reply: function() {
        return card('fas fa-helmet-safety', 'Construction & Réhabilitation',
          'Nous gérons vos projets <strong>de A à Z</strong>, neuf ou rénovation :' +
          list([
            ['fas fa-layer-group',  '<strong>Gros œuvre</strong> — fondations, murs porteurs, dalles'],
            ['fas fa-faucet',       '<strong>Second œuvre</strong> — plomberie, électricité, menuiserie'],
            ['fas fa-paintbrush',   '<strong>Finitions</strong> — peinture, carrelage, faux-plafond'],
            ['fas fa-rotate-left',  '<strong>Réhabilitation</strong> — rénovation & extension de bâtiment']
          ]) +
          '<br/>Un seul interlocuteur du début à la fin du chantier.'
        );
      },
      quickReplies: ['Délai chantier','Rénovation','Devis construction']
    },

    // CONSTRUCTION — délai
    {
      topic: 'construction',
      patterns: [/d.lai|dur.e|temps|semaine|mois|ann.e|combien.*(temps|dur)/i],
      reply: function() {
        return card('fas fa-calendar-days', 'Délais de construction',
          list([
            ['fas fa-circle', '<strong>Rénovation simple</strong> : 2 à 4 semaines'],
            ['fas fa-circle', '<strong>Aménagement intérieur</strong> : 3 à 6 semaines'],
            ['fas fa-circle', '<strong>Villa standard</strong> : 4 à 8 mois'],
            ['fas fa-circle', '<strong>Grand immeuble</strong> : étude personnalisée']
          ]) +
          '<br/>Un <strong>planning précis</strong> est établi dès la signature du contrat.'
        );
      },
      quickReplies: ['Devis construction','Appeler','WhatsApp']
    },

    // CONSTRUCTION — finitions
    {
      topic: 'construction',
      patterns: [/peinture|finition|carrelage|faux.plafond|rev.tement|enduit/i],
      reply: function() {
        return card('fas fa-paintbrush', 'Travaux de finition',
          'Nous réalisons toutes les finitions intérieures et extérieures :' +
          list([
            ['fas fa-check', 'Peinture intérieure & extérieure'],
            ['fas fa-check', 'Pose de carrelage — sol & mur'],
            ['fas fa-check', 'Faux-plafonds PVC et placoplatre'],
            ['fas fa-check', 'Enduits décoratifs & revêtements muraux'],
            ['fas fa-check', 'Faïence & mosaïque']
          ])
        );
      },
      quickReplies: ['Devis construction','Appeler']
    },

    // CONSTRUCTION — rénovation
    {
      topic: 'construction',
      patterns: [/r.novation|r.habilitation|r.nover|restaurer|vieux|ancien/i],
      reply: function() {
        return card('fas fa-rotate-left', 'Réhabilitation & Rénovation',
          'Nous redonnons vie à vos bâtiments anciens ou endommagés :' +
          list([
            ['fas fa-wrench',      'Reprise structurelle — fissures, fondations'],
            ['fas fa-bolt',        'Mise aux normes électrique & plomberie'],
            ['fas fa-building',    'Ravalement de façade'],
            ['fas fa-paint-roller','Rénovation complète intérieure']
          ]) +
          '<br/>Diagnostic gratuit sur place avant tout devis.' +
          contactRow('tel:+2250707953684', 'fas fa-phone', 'Prendre rendez-vous : +225 07 07 95 36 84')
        );
      },
      quickReplies: ['Devis construction','Appeler','WhatsApp']
    },

    // CLIMATISATION — général
    {
      topic: 'clim',
      patterns: [/climatisation|split|clim|climatiseur|froid|chaud|ventilation|refroidiss/i],
      reply: function() {
        return card('fas fa-wind', 'Climatisation Split',
          'Tout ce dont vous avez besoin, chez un seul prestataire :' +
          list([
            ['fas fa-box-open',              '<strong>Fourniture</strong> — Samsung, LG, Daikin, Midea, Gree…'],
            ['fas fa-screwdriver-wrench',    '<strong>Installation</strong> professionnelle garantie'],
            ['fas fa-broom',                 '<strong>Entretien annuel</strong> et nettoyage des filtres'],
            ['fas fa-triangle-exclamation',  '<strong>Dépannage</strong> toutes pannes sous 24–48h'],
            ['fas fa-calendar-check',        '<strong>Maintenance préventive</strong> sur contrat']
          ])
        );
      },
      quickReplies: ['Puissance BTU','Entretien clim','Dépannage clim','Devis climatisation']
    },

    // CLIMATISATION — puissance
    {
      topic: 'clim',
      patterns: [/btu|puissance|capacit|m.tre.carr.|grande.pi.ce|petite.pi.ce|quelle.taille|quel.mod.le/i],
      reply: function() {
        return card('fas fa-sliders', 'Quelle puissance choisir ?',
          list([
            ['fas fa-bed',     '<strong>Chambre (12–20 m²)</strong> : 9 000 BTU'],
            ['fas fa-couch',   '<strong>Salon (20–35 m²)</strong> : 12 000 BTU'],
            ['fas fa-house',   '<strong>Grand salon (35–50 m²)</strong> : 18 000 BTU'],
            ['fas fa-building','<strong>Bureaux (50–70 m²)</strong> : 24 000 BTU']
          ]) +
          '<br/>Ces valeurs varient selon l\'isolation et l\'exposition au soleil. Nous réalisons une <strong>évaluation gratuite</strong>.'
        );
      },
      quickReplies: ['Devis climatisation','Appeler','WhatsApp']
    },

    // CLIMATISATION — panne
    {
      topic: 'clim',
      patterns: [/panne|marche pas|d.faillance|r.paration|d.pann|probl.me.*clim|clim.*probl.me/i],
      reply: function() {
        return card('fas fa-triangle-exclamation', 'Dépannage climatisation',
          'Nous intervenons sur toutes les pannes :' +
          list([
            ['fas fa-snowflake',   'Clim qui ne refroidit plus'],
            ['fas fa-droplet',     'Fuite d\'eau ou de gaz réfrigérant'],
            ['fas fa-volume-high', 'Bruit anormal au fonctionnement'],
            ['fas fa-circle-xmark','Erreur affichée sur la télécommande']
          ]) +
          badges([['fas fa-clock','Intervention 24–48h sur Abidjan']]) +
          contactRow('tel:+2250707953684', 'fas fa-phone', '+225 07 07 95 36 84') +
          contactRow('https://wa.me/2250102181848', 'fab fa-whatsapp', 'WhatsApp +225 01 02 18 18 48', true)
        );
      },
      quickReplies: ['Appeler','WhatsApp']
    },

    // CLIMATISATION — entretien
    {
      topic: 'clim',
      patterns: [/entretien|nettoyage|maintenance|revision|vidange|filtre/i],
      reply: function() {
        return card('fas fa-broom', 'Entretien & Maintenance',
          'Un entretien régulier <strong>prolonge la durée de vie</strong> de votre appareil et réduit votre consommation électrique.' +
          list([
            ['fas fa-circle-check','Nettoyage des filtres et évaporateurs'],
            ['fas fa-circle-check','Vérification du niveau de gaz réfrigérant'],
            ['fas fa-circle-check','Contrôle des connexions électriques'],
            ['fas fa-circle-check','Test de performance et de débit d\'air']
          ]) +
          badges([['fas fa-calendar','Recommandé 1 fois par an minimum']])
        );
      },
      quickReplies: ['Devis entretien','Appeler','WhatsApp']
    },

    // MENUISERIE — général
    {
      topic: 'menuiserie',
      patterns: [/porte|fen.tre|aluminium|baie|vitr.e|coulissante|menuiserie|rideau.m.tal|grille/i],
      reply: function() {
        return card('fas fa-door-open', 'Portes & Fenêtres Aluminium',
          'Fabrication et pose <strong>sur mesure</strong> :' +
          list([
            ['fas fa-door-closed',   '<strong>Portes d\'entrée</strong> aluminium et blindées'],
            ['fas fa-border-all',    '<strong>Fenêtres</strong> et doubles-vitrages isolants'],
            ['fas fa-expand',        '<strong>Baies vitrées</strong> coulissantes ou à galandage'],
            ['fas fa-store',         '<strong>Rideaux métalliques</strong> pour commerces'],
            ['fas fa-shield-halved', '<strong>Grilles de sécurité</strong> sur mesure'],
            ['fas fa-umbrella',      '<strong>Vérandas</strong> et pergolas aluminium']
          ]) +
          '<br/>Isolation thermique et acoustique garantie.'
        );
      },
      quickReplies: ['Délai fabrication','Porte blindée','Rideau métallique','Devis menuiserie']
    },

    // MENUISERIE — délai
    {
      topic: 'menuiserie',
      patterns: [/d.lai|fabriquer|livraison|pr.t|longtemps|combien.*(temps|dur|semaine)/i],
      reply: function() {
        return card('fas fa-calendar-days', 'Délais de fabrication & pose',
          list([
            ['fas fa-door-closed','<strong>Porte simple</strong> : 5 à 7 jours ouvrés'],
            ['fas fa-border-all', '<strong>Fenêtre sur mesure</strong> : 7 à 10 jours'],
            ['fas fa-expand',     '<strong>Baie vitrée</strong> : 10 à 15 jours'],
            ['fas fa-store',      '<strong>Rideau métallique</strong> : 7 à 14 jours']
          ]) +
          '<br/>La pose est <strong>incluse</strong> et réalisée par nos techniciens.'
        );
      },
      quickReplies: ['Devis menuiserie','Appeler']
    },

    // MENUISERIE — porte blindée
    {
      topic: 'menuiserie',
      patterns: [/blind.e|s.curis.e|anti.*effraction|renforc.e/i],
      reply: function() {
        return card('fas fa-lock', 'Portes blindées & sécurisées',
          'Nous fabriquons des portes renforcées adaptées à vos besoins :' +
          list([
            ['fas fa-ruler-combined','Cadre aluminium épais anti-effraction'],
            ['fas fa-key',           'Serrures multipoints certifiées'],
            ['fas fa-eye-slash',     'Vitrage feuilleté ou opaque au choix'],
            ['fas fa-palette',       'Finitions haut de gamme personnalisées']
          ]) +
          '<br/>Idéal pour villas, bureaux et commerces.'
        );
      },
      quickReplies: ['Devis menuiserie','Appeler','WhatsApp']
    },

    // ÉLECTRICITÉ — général
    {
      topic: 'electricite',
      patterns: [/.lectricit.|.lectricien|courant|tableau.electrique|prise|c.blage|.clairage|disjoncteur|groupe.electrog.ne|onduleur/i],
      reply: function() {
        return card('fas fa-bolt', 'Électricité',
          'Installations et dépannages électriques par des techniciens qualifiés :' +
          list([
            ['fas fa-plug',              '<strong>Installation neuve</strong> — câblage, prises, éclairage'],
            ['fas fa-clipboard-check',   '<strong>Mise aux normes</strong> et tableaux électriques'],
            ['fas fa-triangle-exclamation','<strong>Dépannage</strong> et recherche de panne'],
            ['fas fa-car-battery',       '<strong>Groupes électrogènes</strong> et onduleurs'],
            ['fas fa-shield-halved',     '<strong>Diagnostic</strong> et sécurité électrique']
          ])
        );
      },
      quickReplies: ['Panne électrique','Mise aux normes','Devis électricité']
    },

    // ÉLECTRICITÉ — panne
    {
      topic: 'electricite',
      patterns: [/panne.*.lectri|coupure|court.circuit|disjoncte|.a saute|plus de courant/i],
      reply: function() {
        return card('fas fa-triangle-exclamation', 'Dépannage électrique',
          'Nous intervenons rapidement sur toutes les pannes électriques :' +
          list([
            ['fas fa-bolt',        'Coupures et disjoncteurs qui sautent'],
            ['fas fa-plug-circle-xmark', 'Prises ou circuits hors service'],
            ['fas fa-fire',        'Recherche de court-circuit'],
            ['fas fa-lightbulb',   'Problèmes d\'éclairage']
          ]) +
          badges([['fas fa-clock','Intervention rapide sur Abidjan']]) +
          contactRow('tel:+2250707953684', 'fas fa-phone', '+225 07 07 95 36 84') +
          contactRow('https://wa.me/2250102181848', 'fab fa-whatsapp', 'WhatsApp +225 01 02 18 18 48', true)
        );
      },
      quickReplies: ['Devis électricité','Appeler','WhatsApp']
    },

    // ÉLECTRICITÉ — mise aux normes
    {
      topic: 'electricite',
      patterns: [/norme|conformit.|tableau.electrique|s.curit..electrique|diagnostic/i],
      reply: function() {
        return card('fas fa-clipboard-check', 'Mise aux normes électriques',
          'Nous mettons votre installation en conformité pour votre sécurité :' +
          list([
            ['fas fa-square-check', 'Remplacement de tableaux électriques vétustes'],
            ['fas fa-square-check', 'Mise à la terre et protection différentielle'],
            ['fas fa-square-check', 'Diagnostic complet de l\'installation'],
            ['fas fa-square-check', 'Certificat de conformité sur demande']
          ]) +
          '<br/>Indispensable avant vente, location ou après rénovation.'
        );
      },
      quickReplies: ['Devis électricité','Appeler']
    },

    // DEVIS
    {
      topic: null,
      patterns: [/devis|prix|tarif|co.t|combien|estimation|gratuit|budget/i],
      reply: function() {
        return card('fas fa-file-invoice', 'Devis gratuit — Réponse sous 24h',
          list([
            ['fas fa-circle-check','Devis <strong>100% gratuit</strong> et sans engagement'],
            ['fas fa-circle-check','Déplacement offert pour l\'évaluation sur place'],
            ['fas fa-circle-check','Devis détaillé poste par poste, sans surprise'],
            ['fas fa-circle-check','Réponse garantie sous <strong>24 heures</strong>']
          ]) +
          contactRow(getDevisPath(),                    'fas fa-file-lines',   'Remplir le formulaire de devis')
        );
      },
      quickReplies: []
    },

    // PAIEMENT
    {
      topic: null,
      patterns: [/paiement|payer|r.glement|mobile.money|orange.money|mtn|wave|esp.ce|virement|acompte/i],
      reply: function() {
        return card('fas fa-credit-card', 'Modes de paiement acceptés',
          list([
            ['fas fa-money-bill',       'Espèces'],
            ['fas fa-mobile-screen',    'Orange Money'],
            ['fas fa-mobile-screen',    'MTN Mobile Money'],
            ['fas fa-mobile-screen',    'Wave'],
            ['fas fa-building-columns', 'Virement bancaire']
          ]) +
          badges([
            ['fas fa-percent',   'Acompte 30% à la commande'],
            ['fas fa-handshake', 'Solde à la livraison']
          ])
        );
      },
      quickReplies: ['Devis gratuit','Appeler']
    },

    // GARANTIE
    {
      topic: null,
      patterns: [/garanti|garantie|apr.s.vente|sav/i],
      reply: function() {
        return card('fas fa-shield-halved', 'Nos garanties',
          list([
            ['fas fa-video',         '<strong>Caméras</strong> : 12 mois pièces & main-d\'œuvre'],
            ['fas fa-helmet-safety', '<strong>Construction</strong> : garantie décennale'],
            ['fas fa-wind',          '<strong>Climatisation</strong> : 12 mois installation'],
            ['fas fa-bolt',          '<strong>Électricité</strong> : 12 mois installation'],
            ['fas fa-door-open',     '<strong>Menuiserie</strong> : 12 mois pièces & pose']
          ]) +
          '<br/>Matériaux certifiés, techniciens formés — votre investissement est protégé.'
        );
      },
      quickReplies: ['Devis gratuit','Appeler']
    },

    // URGENCE
    {
      topic: null,
      patterns: [/urgence|urgent|d.pann|vite|imm.diatement|panne|ne fonctionne|marche plus/i],
      reply: function() {
        return card('fas fa-circle-exclamation', 'Dépannage urgent',
          'Contactez-nous <strong>immédiatement</strong> :' +
          contactRow('tel:+2250707953684',          'fas fa-phone',    '+225 07 07 95 36 84') +
          contactRow('https://wa.me/2250102181848', 'fab fa-whatsapp', 'WhatsApp — réponse rapide', true) +
          badges([['fas fa-clock','Intervention 24–48h sur Abidjan']])
        );
      },
      quickReplies: ['Appeler','WhatsApp']
    },

    // RÉALISATIONS
    {
      topic: null,
      patterns: [/r.alisation|r.f.rence|exemple|photo|portfolio|travaux.ant.rieurs/i],
      reply: function() {
        return card('fas fa-images', 'Nos réalisations',
          'Consultez nos projets terminés :' +
          contactRow(getRealisationsPath(), 'fas fa-arrow-right', 'Voir toutes nos réalisations') +
          badges([
            ['fas fa-trophy',   '30+ projets'],
            ['fas fa-calendar', '3 ans d\'expérience'],
            ['fas fa-star',     '4.9/5 clients']
          ])
        );
      },
      quickReplies: ['Devis gratuit','Appeler']
    },

    // ZONE D'INTERVENTION
    {
      topic: null,
      patterns: [/abidjan|ivoire|zone|commune|cocody|riviera|palmeraie|yopougon|plateau|marcory|abobo|adjam.|d.placez|localisation|o.sommes/i],
      reply: function() {
        return card('fas fa-location-dot', 'Notre localisation & zone d\'intervention',
          '<strong>Siège principal :</strong>' +
          list([
            ['fas fa-map-marker-alt', '<strong>Cocody, Riviera Palmeraie</strong> — Abidjan, Côte d\'Ivoire']
          ]) +
          '<br/><strong>Zone d\'intervention :</strong>' +
          list([
            ['fas fa-city',  'Toutes les communes d\'<strong>Abidjan</strong>'],
            ['fas fa-map',   '<strong>Grand Abidjan</strong> et périphérie'],
            ['fas fa-plane', 'Autres villes de Côte d\'Ivoire <em>(sur demande)</em>']
          ]) +
          badges([['fas fa-car','Déplacement offert pour l\'évaluation']])
        );
      },
      quickReplies: ['Devis gratuit','Appeler','WhatsApp']
    },

    // HORAIRES
    {
      topic: null,
      patterns: [/horaire|heure|disponible|ouvert|ferm.|week.end|samedi|dimanche|lundi/i],
      reply: function() {
        return card('fas fa-clock', 'Nos horaires d\'ouverture',
          list([
            ['fas fa-sun',          '<strong>Lundi – Vendredi</strong> : 7h30 – 18h30'],
            ['fas fa-calendar-day', '<strong>Samedi</strong> : 8h00 – 16h00'],
            ['fas fa-calendar',     '<strong>Dimanche</strong> : Sur rendez-vous']
          ]) +
          '<br/>Pour les <strong>urgences</strong>, contactez-nous via WhatsApp à tout moment.' +
          contactRow('https://wa.me/2250102181848', 'fab fa-whatsapp', 'WhatsApp — Disponible 7j/7', true)
        );
      },
      quickReplies: ['WhatsApp','Appeler']
    },

    // EXPÉRIENCE
    {
      topic: null,
      patterns: [/exp.rience|ann.es|anciennet.|depuis|cr..tion|fond.|histoire|confiance/i],
      reply: function() {
        return card('fas fa-medal', 'Notre expérience',
          'KALEO GROUPE est votre partenaire de confiance depuis <strong>3 ans</strong> en Côte d\'Ivoire.' +
          badges([
            ['fas fa-trophy',        '30+ projets'],
            ['fas fa-star',          '4.9/5'],
            ['fas fa-users',         'Équipe certifiée'],
            ['fas fa-calendar-days', '3 ans']
          ])
        );
      },
      quickReplies: ['Nos réalisations','Devis gratuit','Appeler']
    },

    // WHATSAPP
    {
      topic: null,
      patterns: [/whatsapp|wapp/i],
      reply: function() {
        return card('fab fa-whatsapp', 'Contact WhatsApp',
          'Réponse rapide assurée, <strong>7j/7</strong> :' +
          contactRow('https://wa.me/2250102181848', 'fab fa-whatsapp', '+225 01 02 18 18 48', true)
        );
      },
      quickReplies: ['Appeler','Email']
    },

    // TÉLÉPHONE
    {
      topic: null,
      patterns: [/appel|t.l.phone|num.ro|appeler|contact/i],
      reply: function() {
        return card('fas fa-phone', 'Nous appeler',
          'Disponible <strong>Lun–Sam, 7h30–18h30</strong> :' +
          contactRow('tel:+2250707953684',          'fas fa-phone',    '+225 07 07 95 36 84') +
          '<br/>Pour les urgences et en dehors des horaires, préférez <strong>WhatsApp</strong> :' +
          contactRow('https://wa.me/2250102181848', 'fab fa-whatsapp', 'WhatsApp +225 01 02 18 18 48', true)
        );
      },
      quickReplies: ['WhatsApp','Email']
    },

    // EMAIL
    {
      topic: null,
      patterns: [/email|mail|courriel|ecrire/i],
      reply: function() {
        return card('fas fa-envelope', 'Nous écrire par email',
          'Réponse sous <strong>24h ouvrées</strong> :' +
          contactRow('mailto:kaleogroupe@gmail.com', 'fas fa-envelope', 'kaleogroupe@gmail.com')
        );
      },
      quickReplies: ['Appeler','WhatsApp']
    },

    // MERCI
    {
      topic: null,
      patterns: [/merci|super|parfait|cool|bien|ok|accord|compris|nickel/i],
      reply: function() {
        return card('fas fa-thumbs-up', 'Avec plaisir !',
          'N\'hésitez pas si vous avez d\'autres questions. <strong>KALEO GROUPE</strong> reste à votre disposition.'
        );
      },
      quickReplies: ['Caméras','Construction','Climatisation','Électricité','Portes & Fenêtres']
    },

    // AU REVOIR
    {
      topic: null,
      patterns: [/au revoir|bye|bonne journ.e|bonne soir.e|.+ plus|.+ tard/i],
      reply: function() {
        return card('fas fa-hand', 'À bientôt !',
          'Merci pour votre visite. <strong>KALEO GROUPE</strong> est toujours là pour vous. À très bientôt !'
        );
      },
      quickReplies: []
    }
  ];

  var defaultReply = {
    topic: null,
    reply: function() {
      return card('fas fa-circle-question', 'Comment puis-je vous aider ?',
        'Je n\'ai pas bien compris votre demande. Voici ce que je peux faire pour vous :' +
        list([
          ['fas fa-video',         'Renseignements sur les <strong>caméras</strong>'],
          ['fas fa-helmet-safety', 'Infos sur la <strong>construction</strong>'],
          ['fas fa-wind',          'Questions sur la <strong>climatisation</strong>'],
          ['fas fa-bolt',          'Infos sur l\'<strong>électricité</strong>'],
          ['fas fa-door-open',     'Devis <strong>portes & fenêtres</strong>'],
          ['fas fa-file-invoice',  '<strong>Devis gratuit</strong> tous services']
        ])
      );
    },
    quickReplies: ['Caméras','Construction','Climatisation','Électricité','Portes & Fenêtres','Devis gratuit']
  };

  // ── Chemins dynamiques (root ou /pages/) ────────────────────────────────────
  function getBasePath() {
    var scripts = document.querySelectorAll('script[src*="chatbot"]');
    return scripts.length ? scripts[0].src.replace(/js\/chatbot\.js.*$/, '') : '';
  }
  function getLogoPath()        { return getBasePath() + 'LOGO KALEO.png'; }
  function getDevisPath()       { return getBasePath() + 'pages/devis.html'; }
  function getRealisationsPath(){ return getBasePath() + 'pages/realisations.html'; }

  // ── Construction du DOM ─────────────────────────────────────────────────────
  function buildChatbot() {
    var LOGO = getLogoPath();
    var toggle = document.createElement('button');
    toggle.className = 'chatbot-toggle';
    toggle.setAttribute('aria-label', 'Ouvrir le chat');
    toggle.innerHTML = '<i class="fas fa-comments"></i><span class="cb-badge">1</span>';

    var win = document.createElement('div');
    win.className = 'chatbot-window';
    win.setAttribute('role', 'dialog');
    win.innerHTML =
      '<div class="cb-header">' +
        '<div class="cb-avatar-wrap">' +
          '<div class="cb-avatar"><img src="' + LOGO + '" alt="KALEO" class="cb-avatar-img"/></div>' +
          '<span class="cb-online-dot"></span>' +
        '</div>' +
        '<div class="cb-header-info">' +
          '<h4>Assistant KALEO GROUPE</h4>' +
          '<span class="cb-header-sub">' +
            '<i class="fas fa-circle" style="font-size:7px;color:#22C55E;"></i>' +
            ' En ligne — Répond instantanément' +
          '</span>' +
        '</div>' +
        '<div class="cb-header-actions">' +
          '<button class="cb-close" aria-label="Fermer"><i class="fas fa-xmark"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="cb-messages" id="cbMessages"></div>' +
      '<div class="cb-quick-replies" id="cbQuickReplies"></div>' +
      '<div class="cb-input-area">' +
        '<textarea class="cb-input" id="cbInput" rows="1" placeholder="Posez votre question…" maxlength="400"></textarea>' +
        '<button class="cb-send" id="cbSend" aria-label="Envoyer"><i class="fas fa-paper-plane"></i></button>' +
      '</div>' +
      '<div class="cb-footer">KALEO GROUPE &copy; 2025 — Cocody, Riviera Palmeraie, Abidjan</div>';

    document.body.appendChild(toggle);
    document.body.appendChild(win);

    var messagesEl     = document.getElementById('cbMessages');
    var quickRepliesEl = document.getElementById('cbQuickReplies');
    var inputEl        = document.getElementById('cbInput');
    var sendBtn        = document.getElementById('cbSend');
    var closeBtn       = win.querySelector('.cb-close');
    var isOpen         = false;
    var defaultCount   = 0;

    function openChat() {
      isOpen = true;
      win.classList.add('cb-open');
      toggle.innerHTML = '<i class="fas fa-xmark"></i>';
      inputEl.focus();
    }
    function closeChat() {
      isOpen = false;
      win.classList.remove('cb-open');
      toggle.innerHTML = '<i class="fas fa-comments"></i>';
    }
    function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

    // ── Mini-formulaire devis ──────────────────────────────
    function showDevisForm(emailOnly) {
      // Désactiver tous les boutons déclencheurs déjà affichés
      var btns = messagesEl.querySelectorAll('.cb-devis-btn');
      for (var b = 0; b < btns.length; b++) { btns[b].disabled = true; }

      var formId = 'cbDevisForm_' + Date.now();

      var html = card('fas fa-file-invoice', 'Demande de devis gratuit',
        '<form id="' + formId + '" class="cb-form" novalidate>' +

          '<div class="cb-form-row">' +
            '<div class="cb-form-group">' +
              '<label class="cb-form-label">Prénom *</label>' +
              '<input class="cb-form-field" type="text" name="prenom" placeholder="Votre prénom" required/>' +
            '</div>' +
            '<div class="cb-form-group">' +
              '<label class="cb-form-label">Nom *</label>' +
              '<input class="cb-form-field" type="text" name="nom" placeholder="Votre nom" required/>' +
            '</div>' +
          '</div>' +

          '<div class="cb-form-group">' +
            '<label class="cb-form-label">Téléphone *</label>' +
            '<input class="cb-form-field" type="tel" name="tel" placeholder="+225 07 00 00 00 00" required/>' +
          '</div>' +

          '<div class="cb-form-group">' +
            '<label class="cb-form-label">Commune / Adresse *</label>' +
            '<input class="cb-form-field" type="text" name="adresse" placeholder="Cocody, Yopougon, Plateau..." required/>' +
          '</div>' +

          '<div class="cb-form-group">' +
            '<label class="cb-form-label">Service(s) souhaité(s) *</label>' +
            '<div class="cb-service-grid">' +
              '<label class="cb-service-item"><input type="checkbox" name="services" value="Caméras de surveillance"/><i class="fas fa-video"></i><span>Caméras</span></label>' +
              '<label class="cb-service-item"><input type="checkbox" name="services" value="Construction"/><i class="fas fa-helmet-safety"></i><span>Construction</span></label>' +
              '<label class="cb-service-item"><input type="checkbox" name="services" value="Climatisation"/><i class="fas fa-wind"></i><span>Climatisation</span></label>' +
              '<label class="cb-service-item"><input type="checkbox" name="services" value="Portes & Fenêtres"/><i class="fas fa-door-open"></i><span>Menuiserie</span></label>' +
              '<label class="cb-service-item"><input type="checkbox" name="services" value="Électricité"/><i class="fas fa-bolt"></i><span>Électricité</span></label>' +
            '</div>' +
          '</div>' +

          '<div class="cb-form-group">' +
            '<label class="cb-form-label">Budget estimatif</label>' +
            '<select class="cb-form-field" name="budget">' +
              '<option value="">-- Optionnel --</option>' +
              '<option>Moins de 500 000 FCFA</option>' +
              '<option>500 000 – 1 000 000 FCFA</option>' +
              '<option>1 000 000 – 3 000 000 FCFA</option>' +
              '<option>3 000 000 – 10 000 000 FCFA</option>' +
              '<option>Plus de 10 000 000 FCFA</option>' +
              '<option>Je ne sais pas encore</option>' +
            '</select>' +
          '</div>' +

          '<div class="cb-form-group">' +
            '<label class="cb-form-label">Décrivez votre projet *</label>' +
            '<textarea class="cb-form-field" name="description" rows="3" placeholder="Surface, nombre de pièces, spécificités..." required></textarea>' +
          '</div>' +

          (emailOnly
            ? '<div class="cb-form-group">' +
                '<label class="cb-form-label">Mode d\'envoi</label>' +
                '<div class="cb-send-choice">' +
                  '<label class="cb-send-item checked" id="' + formId + '_em">' +
                    '<input type="radio" name="envoi" value="email" checked/>' +
                    '<i class="fas fa-envelope"></i><span>Email</span>' +
                  '</label>' +
                '</div>' +
              '</div>'
            : '<div class="cb-form-group">' +
                '<label class="cb-form-label">Mode d\'envoi *</label>' +
                '<div class="cb-send-choice">' +
                  '<label class="cb-send-item" id="' + formId + '_wa">' +
                    '<input type="radio" name="envoi" value="whatsapp"/>' +
                    '<i class="fab fa-whatsapp"></i><span>WhatsApp</span>' +
                  '</label>' +
                  '<label class="cb-send-item" id="' + formId + '_em">' +
                    '<input type="radio" name="envoi" value="email"/>' +
                    '<i class="fas fa-envelope"></i><span>Email</span>' +
                  '</label>' +
                  '<label class="cb-send-item" id="' + formId + '_both">' +
                    '<input type="radio" name="envoi" value="les-deux"/>' +
                    '<i class="fas fa-paper-plane"></i><span>Les deux</span>' +
                  '</label>' +
                '</div>' +
              '</div>'
          ) +

          '<div class="cb-form-error" id="' + formId + '_err">' +
            '<i class="fas fa-circle-exclamation"></i> Veuillez remplir tous les champs, cocher un service et choisir un mode d\'envoi.' +
          '</div>' +

          '<button type="submit" class="cb-form-submit" id="' + formId + '_btn">' +
            (emailOnly
              ? '<i class="fas fa-envelope"></i> Envoyer par Email'
              : '<i class="fas fa-paper-plane"></i> Envoyer ma demande') +
          '</button>' +

        '</form>'
      );

      addBotMessage(html);
      setQuickReplies([]);

      setTimeout(function() {
        var form = document.getElementById(formId);
        if (!form) return;

        // Toggle .checked sur les services
        var serviceLabels = form.querySelectorAll('.cb-service-item');
        for (var s = 0; s < serviceLabels.length; s++) {
          (function(lbl) {
            lbl.addEventListener('click', function() {
              var chk = lbl.querySelector('input[type="checkbox"]');
              chk.checked = !chk.checked;
              lbl.classList.toggle('checked', chk.checked);
            });
          })(serviceLabels[s]);
        }

        // Toggle .checked sur le mode d'envoi + mise à jour bouton submit
        var sendLabels = form.querySelectorAll('.cb-send-item');
        var submitBtn  = document.getElementById(formId + '_btn');
        var iconMap    = { whatsapp: 'fab fa-whatsapp', email: 'fas fa-envelope', 'les-deux': 'fas fa-paper-plane' };
        var labelMap   = { whatsapp: 'Envoyer via WhatsApp', email: 'Envoyer par Email', 'les-deux': 'Envoyer WhatsApp + Email' };

        for (var r = 0; r < sendLabels.length; r++) {
          (function(lbl) {
            lbl.addEventListener('click', function() {
              for (var x = 0; x < sendLabels.length; x++) { sendLabels[x].classList.remove('checked'); }
              lbl.classList.add('checked');
              var val = lbl.querySelector('input[type="radio"]').value;
              submitBtn.innerHTML = '<i class="' + iconMap[val] + '"></i> ' + labelMap[val];
            });
          })(sendLabels[r]);
        }

        form.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var prenom      = form.querySelector('[name="prenom"]').value.trim();
          var nom         = form.querySelector('[name="nom"]').value.trim();
          var tel         = form.querySelector('[name="tel"]').value.trim();
          var adresse     = form.querySelector('[name="adresse"]').value.trim();
          var description = form.querySelector('[name="description"]').value.trim();
          var budget      = form.querySelector('[name="budget"]').value;
          var envoiEl     = form.querySelector('[name="envoi"]:checked');
          var envoi       = envoiEl ? envoiEl.value : '';
          var errorEl     = document.getElementById(formId + '_err');

          var services = [];
          var checks = form.querySelectorAll('[name="services"]:checked');
          for (var c = 0; c < checks.length; c++) { services.push(checks[c].value); }

          if (!prenom || !nom || !tel || !adresse || !description || services.length === 0 || !envoi) {
            errorEl.style.display = 'flex';
            return;
          }
          errorEl.style.display = 'none';

          // Message WhatsApp (formaté Markdown)
          var waMsg =
            '📋 *DEMANDE DE DEVIS — KALEO GROUPE*\n\n' +
            '👤 *Nom :* ' + prenom + ' ' + nom + '\n' +
            '📞 *Téléphone :* ' + tel + '\n' +
            '📍 *Adresse :* ' + adresse + '\n' +
            '🛠️ *Service(s) :* ' + services.join(', ') + '\n' +
            (budget ? '💰 *Budget :* ' + budget + '\n' : '') +
            '\n📝 *Description :*\n' + description;

          // Sujet et corps Email
          var emailSubject = 'Demande de devis — ' + prenom + ' ' + nom;
          var emailBody =
            'DEMANDE DE DEVIS — KALEO GROUPE\n\n' +
            'Nom : ' + prenom + ' ' + nom + '\n' +
            'Téléphone : ' + tel + '\n' +
            'Adresse : ' + adresse + '\n' +
            'Service(s) : ' + services.join(', ') + '\n' +
            (budget ? 'Budget : ' + budget + '\n' : '') +
            '\nDescription du projet :\n' + description;

          if (envoi === 'whatsapp' || envoi === 'les-deux') {
            window.open('https://wa.me/2250102181848?text=' + encodeURIComponent(waMsg), '_blank');
          }
          if (envoi === 'email' || envoi === 'les-deux') {
            setTimeout(function() {
              window.location.href = 'mailto:kaleogroupe@gmail.com' +
                '?subject=' + encodeURIComponent(emailSubject) +
                '&body='    + encodeURIComponent(emailBody);
            }, envoi === 'les-deux' ? 600 : 0);
          }

          var sentVia = envoi === 'whatsapp' ? 'WhatsApp' : envoi === 'email' ? 'Email' : 'WhatsApp & Email';
          var body = form.closest('.cb-card-body');
          body.innerHTML =
            '<div class="cb-form-success">' +
              '<i class="fas fa-circle-check"></i>' +
              '<h4>Demande envoyée !</h4>' +
              '<p>Merci <strong>' + prenom + '</strong>. Votre demande a été envoyée via <strong>' + sentVia + '</strong>.<br/>Notre équipe vous contactera dans les <strong>24 heures</strong>.</p>' +
            '</div>';

          scrollToBottom();
          setQuickReplies(['Caméras','Construction','Climatisation','Électricité','Appeler']);
        });
      }, 80);
    }

    function addBotMessage(html) {
      var wrap = document.createElement('div');
      wrap.className = 'cb-msg bot';
      wrap.innerHTML = '<div class="cb-msg-av"><img src="' + LOGO + '" alt="KALEO" class="cb-av-img"/></div>' + html;
      messagesEl.appendChild(wrap);
      scrollToBottom();
    }
    function addUserMessage(text) {
      var wrap = document.createElement('div');
      wrap.className = 'cb-msg user';
      wrap.innerHTML = '<div class="cb-user-bubble">' + text.replace(/</g,'&lt;') + '</div>';
      messagesEl.appendChild(wrap);
      scrollToBottom();
    }
    function showTyping() {
      var wrap = document.createElement('div');
      wrap.className = 'cb-msg bot';
      wrap.innerHTML =
        '<div class="cb-msg-av"><img src="' + LOGO + '" alt="KALEO" class="cb-av-img"/></div>' +
        '<div class="cb-typing-card">' +
          '<span class="cb-dot"></span><span class="cb-dot"></span><span class="cb-dot"></span>' +
        '</div>';
      messagesEl.appendChild(wrap);
      scrollToBottom();
      return wrap;
    }

    function setQuickReplies(items) {
      quickRepliesEl.innerHTML = '';
      (items || []).forEach(function(label) {
        var btn = document.createElement('button');
        btn.className = 'cb-qr';
        var icon = qrIcons[label] || 'fas fa-chevron-right';
        btn.innerHTML = '<i class="' + icon + '"></i>' + label;
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          handleUserMessage(qrMap[label] || label);
        });
        quickRepliesEl.appendChild(btn);
      });
    }

    function normalize(str) {
      return str.toLowerCase()
        .replace(/[àáâã]/g,'a').replace(/[éèêë]/g,'e')
        .replace(/[îï]/g,'i').replace(/[ôõ]/g,'o')
        .replace(/[ùûü]/g,'u').replace(/ç/g,'c');
    }

    function serviceClientReply() {
      return card('fas fa-headset', 'Notre service client est là pour vous',
        'Votre demande nécessite l\'attention directe de notre équipe. Nous vous répondrons rapidement.' +
        list([
          ['fas fa-clock',       'Disponible <strong>Lun–Sam, 7h30–18h30</strong>'],
          ['fab fa-whatsapp',    'WhatsApp — réponse rapide <strong>7j/7</strong>'],
          ['fas fa-bolt',        'Devis et réponse sous <strong>24 heures</strong>']
        ]) +
        '<br/><strong>Comment souhaitez-vous nous contacter ?</strong>' +
        contactRow(
          'https://wa.me/2250102181848?text=' + encodeURIComponent('Bonjour KALEO GROUPE, j\'ai une question : '),
          'fab fa-whatsapp',
          'Envoyer un message WhatsApp',
          true
        ) +
        devisEmailBtn()
      );
    }

    function getResponse(text) {
      var norm = normalize(text);
      for (var i = 0; i < responses.length; i++) {
        var item = responses[i];
        for (var j = 0; j < item.patterns.length; j++) {
          if (item.patterns[j].test(text) || item.patterns[j].test(norm)) {
            if (item.topic) lastTopic = item.topic;
            defaultCount = 0;
            return item;
          }
        }
      }
      defaultCount++;
      if (defaultCount >= 2) {
        defaultCount = 0;
        return { reply: serviceClientReply, quickReplies: [] };
      }
      return defaultReply;
    }

    function handleUserMessage(text) {
      text = text.trim();
      if (!text) return;
      addUserMessage(text);
      setQuickReplies([]);
      inputEl.value = '';
      inputEl.style.height = 'auto';
      var typingEl = showTyping();
      setTimeout(function() {
        typingEl.remove();
        var matched = getResponse(text);
        addBotMessage(matched.reply());
        setQuickReplies(matched.quickReplies || []);
      }, 650 + Math.random() * 350);
    }

    // Délégation : bouton "Formulaire de devis"
    messagesEl.addEventListener('click', function(e) {
      var btn = e.target;
      while (btn && btn !== messagesEl) {
        if (btn.classList && btn.classList.contains('cb-devis-btn')) {
          e.stopPropagation();
          if (!btn.disabled) showDevisForm(btn.classList.contains('cb-devis-email-btn'));
          return;
        }
        btn = btn.parentNode;
      }
    });

    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isOpen) { closeChat(); } else { openChat(); }
    });
    closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeChat(); });
    sendBtn.addEventListener('click', function(e) { e.stopPropagation(); handleUserMessage(inputEl.value); });
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserMessage(inputEl.value); }
    });
    inputEl.addEventListener('input', function() {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 88) + 'px';
    });
    document.addEventListener('click', function(e) {
      if (isOpen && !win.contains(e.target) && !toggle.contains(e.target)) { closeChat(); }
    });

    setTimeout(function() {
      addBotMessage(
        card('fas fa-comments', 'Bienvenue chez KALEO GROUPE',
          'Bonjour ! Je suis votre assistant virtuel. Je peux répondre à vos questions sur nos <strong>services, tarifs, délais et coordonnées</strong>.' +
          badges([
            ['fas fa-star',          '4.9/5'],
            ['fas fa-bolt',          'Devis sous 24h'],
            ['fas fa-shield-halved', '3 ans d\'expérience']
          ]) +
          '<br/><em>Comment puis-je vous aider ?</em>'
        )
      );
      setQuickReplies(['Caméras','Construction','Climatisation','Électricité','Portes & Fenêtres','Devis gratuit','Appeler']);
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChatbot);
  } else {
    buildChatbot();
  }

})();
