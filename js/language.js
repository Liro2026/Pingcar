// PingCar - Central Language System
(function () {

  const supportedLanguages = [
    "de",
    "en",
    "fr",
    "it",
    "sq",
    "sr",
    "es"
  ];

  const defaultLanguage = "de";

  const languageNames = {
    de: "DE",
    fr: "FR",
    it: "IT",
    en: "EN",
    sq: "SQ",
    sr: "SR",
    es: "ES"
  };

  const languageFlags = {
    de: "🇨🇭",
    fr: "🇫🇷",
    it: "🇮🇹",
    en: "🇬🇧",
    sq: "🇦🇱",
    sr: "🇷🇸",
    es: "🇪🇸"
  };

  /*
   * Spanish compatibility translations.
   * index.html currently has the older translation system,
   * so Spanish needs the same keys as that system.
   */
  const spanish = {
    home: "Inicio",
    qr: "QR",
    contact: "Contacto",
    dashboard: "Panel",
    messages: "Mensajes",

    title: "PingCar",
    description:
      "La solución segura para contactar con el propietario de un vehículo, sin número de teléfono y sin datos personales.",
    available: "Regístrate gratis ahora",

    how: "Cómo funciona PingCar",
    afterScan: "Después del escaneo",

    register: "Registrarse",
    registerText:
      "Crea tu cuenta de PingCar gratis.",

    getQr: "Obtener código QR",
    getQrText:
      "Recibirás un código QR personal para tu vehículo.",

    placeQr: "Colocar código QR",
    placeQrText:
      "Coloca el código QR en un lugar visible de tu vehículo.",

    scanQr: "Escanear código QR",
    scanQrText:
      "Otra persona escanea el código QR con su teléfono.",

    notification: "Notificación",
    notificationText:
      "Recibirás inmediatamente un mensaje en PingCar.",

    blocked: "Mi vehículo está bloqueado",
    lights: "Las luces están encendidas",
    damaged: "Vehículo dañado",
    forgot: "Has olvidado algo",
    otherMessage: "Otro mensaje",

    noPhone: "Sin número de teléfono",
    noPersonalData: "Sin datos personales",
    fastNotification: "Notificación rápida",
    privacy: "Privacidad",

    discover: "Descubre PingCar",
    monthly: "Suscripción mensual",
    yearly: "Suscripción anual",

    premiumText:
      "Prueba todas las funciones Premium gratis.",

    perMonth: "al mes",
    perYear: "al año",

    name: "Tu nombre",
    email: "Tu dirección de correo electrónico",
    password: "Contraseña",

    login: "Iniciar sesión",
    forgotPassword: "¿Has olvidado tu contraseña?",
    sendLink: "Enviar enlace",
    logout: "Cerrar sesión",

    contactTitle: "Contacto",
    footerText:
      "PingCar – la solución segura para los propietarios de vehículos.",
    rights: "Todos los derechos reservados."
  };


  /*
   * Remember the old index.html language function.
   * We do NOT delete or break it.
   */
  const oldSetLanguage =
    typeof window.setLanguage === "function"
      ? window.setLanguage
      : null;


  /*
   * Update language button.
   */
  function updateLanguageButton(language) {

    const flag =
      document.getElementById("current-flag");

    const text =
      document.getElementById("current-lang-text");

    if (flag) {
      flag.textContent =
        languageFlags[language] || "🇨🇭";
    }

    if (text) {
      text.textContent =
        languageNames[language] || "DE";
    }
  }


  /*
   * Apply the old index.html translation system.
   */
  function applyLegacyLanguage(language) {

    /*
     * Existing languages already have their complete
     * translation object inside index.html.
     */
    if (
      language !== "es" &&
      oldSetLanguage
    ) {
      oldSetLanguage(language);
      return true;
    }

    /*
     * Spanish is not present in the old translations
     * object, therefore we apply it here.
     */
    if (language === "es") {

      const t = spanish;

      localStorage.setItem(
        "pingcar_language",
        "es"
      );

      // Navigation
      const homeLink =
        document.querySelector('a[href="index.html"]');

      const qrLink =
        document.querySelector('a[href="qr.html"]');

      const contactLink =
        document.querySelector('a[href="contact.html"]');

      const dashboardLink =
        document.querySelector('a[href="dashboard.html"]');

      const messageLink =
        document.querySelector('a[href="message.html"]');

      if (homeLink)
        homeLink.innerHTML = "🏠 " + t.home;

      if (qrLink)
        qrLink.innerHTML = "📷 " + t.qr;

      if (contactLink)
        contactLink.innerHTML = "💬 " + t.contact;

      if (dashboardLink)
        dashboardLink.innerHTML = "👤 " + t.dashboard;

      if (messageLink)
        messageLink.innerHTML = "🔔 " + t.messages;


      // Header
      const header =
        document.querySelector("header");

      if (header) {

        const headerP =
          header.querySelector("p");

        if (headerP)
          headerP.textContent =
            t.description;

        const button =
          header.querySelector("a.button");

        if (button)
          button.textContent =
            "🚗 " + t.available;
      }


      // Main headings
      document
        .querySelectorAll(
          "main h2, body > .container h2"
        )
        .forEach(function (el) {

          const text =
            el.textContent.trim();

          if (
            text.includes("So funktioniert PingCar") ||
            text.includes("How PingCar works") ||
            text.includes("Comment fonctionne PingCar") ||
            text.includes("Come funziona PingCar") ||
            text.includes("Si funksionon PingCar") ||
            text.includes("Cómo funciona PingCar")
          ) {
            el.textContent = t.how;
          }

          if (
            text.includes("Nach dem Scannen") ||
            text.includes("After scanning") ||
            text.includes("Après le scan") ||
            text.includes("Dopo la scansione") ||
            text.includes("Pas skanimit") ||
            text.includes("Después del escaneo")
          ) {
            el.textContent = t.afterScan;
          }

          if (
            text === "Kontakt" ||
            text === "Contact" ||
            text === "Contatti"
          ) {
            el.textContent = t.contactTitle;
          }

          if (
            text === "Registrieren" ||
            text === "Inscription" ||
            text === "Registrazione" ||
            text === "Regjistrohu"
          ) {
            el.textContent = t.register;
          }

          if (
            text === "Anmelden" ||
            text === "Connexion" ||
            text === "Accedi" ||
            text === "Hyr"
          ) {
            el.textContent = t.login;
          }
        });


      // Step headings
      document
        .querySelectorAll(".item h3")
        .forEach(function (el) {

          const text =
            el.textContent.trim();

          if (
            text.includes("Registrieren") ||
            text.includes("Register") ||
            text.includes("Inscription") ||
            text.includes("Registrazione") ||
            text.includes("Regjistrohu")
          ) {
            el.textContent =
              "1. " + t.register;
          }

          else if (
            text.includes("QR-Code erhalten") ||
            text.includes("Get QR Code") ||
            text.includes("Obtenir le code QR") ||
            text.includes("Ottieni il codice QR") ||
            text.includes("Merr QR-Code")
          ) {
            el.textContent =
              "2. " + t.getQr;
          }

          else if (
            text.includes("QR-Code anbringen") ||
            text.includes("Place the QR Code") ||
            text.includes("Placer le code QR") ||
            text.includes("Posiziona il codice QR") ||
            text.includes("Vendos QR-Code")
          ) {
            el.textContent =
              "3. " + t.placeQr;
          }

          else if (
            text.includes("QR-Code scannen") ||
            text.includes("Scan the QR Code") ||
            text.includes("Scanner le code QR") ||
            text.includes("Scansiona il codice QR") ||
            text.includes("Skano QR-Code")
          ) {
            el.textContent =
              "4. " + t.scanQr;
          }

          else if (
            text.includes("Benachrichtigung") ||
            text.includes("Notification") ||
            text.includes("Notifica") ||
            text.includes("Njoftim")
          ) {
            el.textContent =
              "5. " + t.notification;
          }

          else if (
            text.includes("Entdecke PingCar") ||
            text.includes("Discover PingCar") ||
            text.includes("Découvrir PingCar") ||
            text.includes("Scopri PingCar") ||
            text.includes("Zbulo PingCar")
          ) {
            el.textContent =
              "📱 " + t.discover;
          }

          else if (
            text.includes("Monatsabo") ||
            text.includes("Monthly subscription") ||
            text.includes("Abonnement mensuel") ||
            text.includes("Abbonamento mensile") ||
            text.includes("Abonimi mujor")
          ) {
            el.textContent =
              "📅 " + t.monthly;
          }

          else if (
            text.includes("Jahresabo") ||
            text.includes("Annual subscription") ||
            text.includes("Abonnement annuel") ||
            text.includes("Abbonamento annuale") ||
            text.includes("Abonimi vjetor")
          ) {
            el.textContent =
              "⭐ " + t.yearly;
          }
        });


      // Step descriptions
      document
        .querySelectorAll(".item p")
        .forEach(function (el) {

          const text =
            el.textContent.trim();

          if (
            text.includes("Erstellen Sie kostenlos") ||
            text.includes("Créez gratuitement") ||
            text.includes("Crea gratuitamente") ||
            text.includes("Create your PingCar") ||
            text.includes("Krijo falas")
          ) {
            el.textContent =
              t.registerText;
          }

          else if (
            text.includes("Sie erhalten einen persönlichen") ||
            text.includes("Vous recevez un code QR") ||
            text.includes("Ricevi un codice QR") ||
            text.includes("You receive a personal QR") ||
            text.includes("Merr një QR-Code")
          ) {
            el.textContent =
              t.getQrText;
          }

          else if (
            text.includes("Befestigen Sie den QR-Code") ||
            text.includes("Fixez le code QR") ||
            text.includes("Fissa il codice QR") ||
            text.includes("Attach the QR code") ||
            text.includes("Vendose QR-Code")
          ) {
            el.textContent =
              t.placeQrText;
          }

          else if (
            text.includes("Eine andere Person scannt") ||
            text.includes("Une autre personne scanne") ||
            text.includes("Un'altra persona scansiona") ||
            text.includes("Another person scans") ||
            text.includes("Një person tjetër")
          ) {
            el.textContent =
              t.scanQrText;
          }

          else if (
            text.includes("Sie erhalten sofort eine Nachricht") ||
            text.includes("Vous recevez immédiatement") ||
            text.includes("Ricevi immediatamente") ||
            text.includes("You receive a message immediately") ||
            text.includes("Merr menjëherë")
          ) {
            el.textContent =
              t.notificationText;
          }
        });


      // Problem messages
      document
        .querySelectorAll(".item b")
        .forEach(function (el) {

          const text =
            el.textContent.trim();

          if (
            text.includes("Mein Fahrzeug wird blockiert") ||
            text.includes("My vehicle is blocked") ||
            text.includes("Mon véhicule est bloqué") ||
            text.includes("Il mio veicolo è bloccato") ||
            text.includes("Automjeti im është i bllokuar")
          ) {
            el.textContent = t.blocked;
          }

          else if (
            text.includes("Das Licht ist eingeschaltet") ||
            text.includes("The lights are on") ||
            text.includes("Les feux sont allumés") ||
            text.includes("Le luci sono accese") ||
            text.includes("Dritat janë ndezur")
          ) {
            el.textContent = t.lights;
          }

          else if (
            text.includes("Fahrzeug beschädigt") ||
            text.includes("Vehicle damaged") ||
            text.includes("Véhicule endommagé") ||
            text.includes("Veicolo danneggiato") ||
            text.includes("Automjeti është dëmtuar")
          ) {
            el.textContent = t.damaged;
          }

          else if (
            text.includes("Etwas vergessen") ||
            text.includes("Forgot something") ||
            text.includes("Vous avez oublié quelque chose") ||
            text.includes("Hai dimenticato qualcosa") ||
            text.includes("Ke harruar diçka")
          ) {
            el.textContent = t.forgot;
          }

          else if (
            text.includes("Andere Mitteilung") ||
            text.includes("Other message") ||
            text.includes("Autre message") ||
            text.includes("Altro messaggio") ||
            text.includes("Mesazh tjetër")
          ) {
            el.textContent = t.otherMessage;
          }

          else if (
            text.includes("Keine Telefonnummer") ||
            text.includes("No phone number") ||
            text.includes("Aucun numéro de téléphone") ||
            text.includes("Nessun numero di telefono") ||
            text.includes("Pa numër telefoni")
          ) {
            el.textContent = t.noPhone;
          }

          else if (
            text.includes("Keine persönlichen Daten") ||
            text.includes("No personal data") ||
            text.includes("Aucune donnée personnelle") ||
            text.includes("Nessun dato personale") ||
            text.includes("Pa të dhëna personale")
          ) {
            el.textContent =
              t.noPersonalData;
          }

          else if (
            text.includes("Schnelle Benachrichtigung") ||
            text.includes("Fast notification") ||
            text.includes("Notification rapide") ||
            text.includes("Notifica rapida") ||
            text.includes("Njoftim i shpejtë")
          ) {
            el.textContent =
              t.fastNotification;
          }

          else if (
            text.includes("Datenschutz") ||
            text.includes("Privacy") ||
            text.includes("Confidentialité") ||
            text.includes("Privatësia")
          ) {
            el.textContent = t.privacy;
          }
        });


      // QR button outside navigation
      document
        .querySelectorAll('a[href="qr.html"]')
        .forEach(function (el) {

          if (!el.closest("nav")) {
            el.textContent =
              "📱 " + t.scanQr;
          }
        });


      // Premium section
      document
        .querySelectorAll("body p")
        .forEach(function (el) {

          const text =
            el.textContent.trim();

          if (
            text ===
              "Teste alle Premium-Funktionen kostenlos." ||
            text ===
              "Test all premium features for free." ||
            text ===
              "Testez toutes les fonctions Premium gratuitement." ||
            text ===
              "Prova tutte le funzioni Premium gratuitamente." ||
            text ===
              "Testo të gjitha funksionet Premium falas."
          ) {
            el.textContent =
              t.premiumText;
          }

          if (
            text === "pro Monat" ||
            text === "per month" ||
            text === "par mois" ||
            text === "al mese" ||
            text === "në muaj"
          ) {
            el.textContent =
              t.perMonth;
          }

          if (
            text === "pro Jahr" ||
            text === "per year" ||
            text === "par an" ||
            text === "all'anno" ||
            text === "në vit"
          ) {
            el.textContent =
              t.perYear;
          }
        });


      // Forms
      const nameInput =
        document.getElementById("name");

      const emailInput =
        document.getElementById("email");

      const passwordInput =
        document.getElementById("password");

      const loginEmail =
        document.getElementById("loginEmail");

      const loginPassword =
        document.getElementById("loginPassword");

      const resetEmail =
        document.getElementById("resetEmail");


      if (nameInput)
        nameInput.placeholder = t.name;

      if (emailInput)
        emailInput.placeholder = t.email;

      if (passwordInput)
        passwordInput.placeholder = t.password;

      if (loginEmail)
        loginEmail.placeholder = t.email;

      if (loginPassword)
        loginPassword.placeholder = t.password;

      if (resetEmail)
        resetEmail.placeholder = t.email;


      const registerButton =
        document.querySelector(
          "#registerForm button"
        );

      if (registerButton)
        registerButton.textContent =
          t.register;


      const loginButton =
        document.querySelector(
          "#loginForm button"
        );

      if (loginButton)
        loginButton.textContent =
          t.login;


      const forgotPassword =
        document.getElementById(
          "forgotPassword"
        );

      if (forgotPassword)
        forgotPassword.textContent =
          t.forgotPassword;


      const resetButton =
        document.getElementById(
          "resetButton"
        );

      if (resetButton)
        resetButton.textContent =
          t.sendLink;


      const logoutButton =
        document.getElementById(
          "logoutButton"
        );

      if (logoutButton)
        logoutButton.textContent =
          t.logout;


      // Footer
      const footer =
        document.querySelector("footer");

      if (footer) {

        const footerPs =
          footer.querySelectorAll("p");

        if (footerPs.length > 0)
          footerPs[0].textContent =
            t.footerText;

        if (footerPs.length > 1)
          footerPs[1].textContent =
            "© 2026 PingCar. " +
            t.rights;
      }

      return true;
    }

    return false;
  }


  /*
   * Load modern translation file.
   */
  async function loadLanguageFile(language) {

    try {

      const module =
        await import(
          `./languages/${language}.js`
        );

      window.PingCarTranslations =
        module.default || {};

      window.PingCarLanguage.current =
        language;

      document.documentElement
        .setAttribute(
          "lang",
          language
        );

      /*
       * Pages using the modern data-i18n system.
       */
      const translations =
        window.PingCarTranslations || {};

      document
        .querySelectorAll("[data-i18n]")
        .forEach(function (element) {

          const key =
            element.getAttribute(
              "data-i18n"
            );

          if (
            translations[key] !== undefined
          ) {
            element.textContent =
              translations[key];
          }
        });


      document
        .querySelectorAll(
          "[data-i18n-placeholder]"
        )
        .forEach(function (element) {

          const key =
            element.getAttribute(
              "data-i18n-placeholder"
            );

          if (
            translations[key] !== undefined
          ) {
            element.placeholder =
              translations[key];
          }
        });


      document
        .querySelectorAll(
          "[data-i18n-title]"
        )
        .forEach(function (element) {

          const key =
            element.getAttribute(
              "data-i18n-title"
            );

          if (
            translations[key] !== undefined
          ) {
            element.title =
              translations[key];
          }
        });

    } catch (error) {

      console.error(
        "PingCar language could not be loaded:",
        language,
        error
      );
    }
  }


  /*
   * Central PingCar language object.
   */
  window.PingCarLanguage = {

    current: null,

    get: function () {

      return (
        localStorage.getItem(
          "pingcar_language"
        ) || defaultLanguage
      );
    },


    set: async function (language) {

      if (
        !supportedLanguages.includes(
          language
        )
      ) {
        console.warn(
          "Unsupported PingCar language:",
          language
        );
        return;
      }


      localStorage.setItem(
        "pingcar_language",
        language
      );

      window.PingCarLanguage.current =
        language;


      /*
       * First update the visible old-style
       * index.html page.
       */
      applyLegacyLanguage(language);


      /*
       * Then update pages using the new
       * central translation files.
       */
      await loadLanguageFile(language);


      /*
       * Update language selector last.
       */
      updateLanguageButton(language);
    },


    supported:
      supportedLanguages,


    translations: function () {

      return (
        window.PingCarTranslations || {}
      );
    },


    translate: function (key) {

      const translations =
        window.PingCarTranslations || {};

      return (
        translations[key] || key
      );
    }

  };


  /*
   * Initialize.
   */
  async function initializeLanguage() {

    let language =
      localStorage.getItem(
        "pingcar_language"
      );


    if (
      !language ||
      !supportedLanguages.includes(
        language
      )
    ) {

      language =
        defaultLanguage;

      localStorage.setItem(
        "pingcar_language",
        language
      );
    }


    await window.PingCarLanguage.set(
      language
    );
  }


  /*
   * Start after DOM is ready.
   */
  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeLanguage
    );

  } else {

    initializeLanguage();
  }

})();
