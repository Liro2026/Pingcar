// PingCar - Central Language System

(function () {

  const supportedLanguages = [
    "de",
    "en",
    "fr",
    "it",
    "sq",
    "sr"
  ];

  const defaultLanguage = "de";

  // Language saved by the user
  const savedLanguage = localStorage.getItem("pingcar_language");

  // Browser language
  const browserLanguage = (
    navigator.language ||
    navigator.userLanguage ||
    defaultLanguage
  ).split("-")[0].toLowerCase();

  // Choose language
  const currentLanguage =
    savedLanguage && supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : supportedLanguages.includes(browserLanguage)
        ? browserLanguage
        : defaultLanguage;

  // Save automatically detected language
  if (!savedLanguage) {
    localStorage.setItem("pingcar_language", currentLanguage);
  }

  // Load translation file
  async function loadLanguage(language) {
    if (!supportedLanguages.includes(language)) {
      language = defaultLanguage;
    }

    try {
      const module = await import(
        `./languages/${language}.js`
      );

      window.PingCarTranslations = module.default || {};

      window.PingCarLanguage.current = language;

      document.documentElement.setAttribute("lang", language);

      applyTranslations();

    } catch (error) {
      console.error(
        "PingCar language could not be loaded:",
        language,
        error
      );
    }
  }

  // Translate elements with data-i18n
  function applyTranslations() {

    const translations = window.PingCarTranslations || {};

    document.querySelectorAll("[data-i18n]").forEach(function (element) {

      const key = element.getAttribute("data-i18n");

      if (translations[key] !== undefined) {
        element.textContent = translations[key];
      }

    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {

      const key = element.getAttribute("data-i18n-placeholder");

      if (translations[key] !== undefined) {
        element.placeholder = translations[key];
      }

    });

    // Translate titles
    document.querySelectorAll("[data-i18n-title]").forEach(function (element) {

      const key = element.getAttribute("data-i18n-title");

      if (translations[key] !== undefined) {
        element.title = translations[key];
      }

    });
  }

  // Central PingCar language object
  window.PingCarLanguage = {

    current: currentLanguage,

    get: function () {
      return localStorage.getItem("pingcar_language") || currentLanguage;
    },

    set: function (language) {

      if (!supportedLanguages.includes(language)) {
        console.warn("Unsupported PingCar language:", language);
        return;
      }

      localStorage.setItem("pingcar_language", language);

      window.PingCarLanguage.current = language;

      loadLanguage(language);
    },

    supported: supportedLanguages,

    translations: function () {
      return window.PingCarTranslations || {};
    },

    translate: function (key) {

      const translations = window.PingCarTranslations || {};

      return translations[key] || key;
    }

  };

  // Set HTML language
  document.documentElement.setAttribute(
    "lang",
    currentLanguage
  );

  // Load current language
  loadLanguage(currentLanguage);

  // Apply translations after page is ready
  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      applyTranslations
    );

  } else {

    applyTranslations();

  }

})();
