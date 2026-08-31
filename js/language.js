// PingCar - Central Language System

(function () {

  const supportedLanguages = [
    "de",
    "en",
    "fr",
    "it",
    "sq",
    "sr",
    "es",
    "tr",
    "sk",
    "hr",
    "hu",
    "pt",
    "mk"
  ];

  const defaultLanguage = "de";

  // --------------------------------------------------
  // 1. Manual language selection has highest priority
  // --------------------------------------------------

  const savedLanguage = localStorage.getItem("pingcar_language");

  // --------------------------------------------------
  // 2. Browser language
  // --------------------------------------------------

  const browserLanguage = (
    navigator.language ||
    navigator.userLanguage ||
    defaultLanguage
  ).split("-")[0].toLowerCase();

  // --------------------------------------------------
  // 3. Map country to PingCar language
  // --------------------------------------------------

  const countryLanguageMap = {
    CH: "de",
    DE: "de",
    AT: "de",

    GB: "en",
    US: "en",
    CA: "en",
    AU: "en",

    FR: "fr",
    BE: "fr",

    IT: "it",

    AL: "sq",
    XK: "sq",

    RS: "sr",
    ES: "es",
    TR: "tr",
    SK: "sk",
    HR: "hr",
    HU: "hu",
    PT: "pt",
    MK: "mk"
    
  };

  // --------------------------------------------------
  // 4. Get language from IP country
  // --------------------------------------------------

  async function detectLanguageFromIP() {

    try {

      const response = await fetch(
        "https://ipapi.co/json/",
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("IP detection failed");
      }

      const data = await response.json();

      const countryCode = (
        data.country_code || ""
      ).toUpperCase();

      const detectedLanguage =
        countryLanguageMap[countryCode];

      if (
        detectedLanguage &&
        supportedLanguages.includes(detectedLanguage)
      ) {
        return detectedLanguage;
      }

    } catch (error) {

      console.warn(
        "PingCar IP language detection failed:",
        error
      );

    }

    return null;
  }

  // --------------------------------------------------
  // 5. Choose initial language
  // --------------------------------------------------

  async function determineLanguage() {

    // User manually selected a language
    if (
      savedLanguage &&
      supportedLanguages.includes(savedLanguage)
    ) {
      return savedLanguage;
    }

    // Try IP country first
    const ipLanguage = await detectLanguageFromIP();

    if (ipLanguage) {
      localStorage.setItem(
        "pingcar_language",
        ipLanguage
      );

      return ipLanguage;
    }

    // Fall back to browser language
    if (
      supportedLanguages.includes(browserLanguage)
    ) {
      localStorage.setItem(
        "pingcar_language",
        browserLanguage
      );

      return browserLanguage;
    }

    // Final fallback
    localStorage.setItem(
      "pingcar_language",
      defaultLanguage
    );

    return defaultLanguage;
  }

  // --------------------------------------------------
  // 6. Load translation file
  // --------------------------------------------------

  async function loadLanguage(language) {

    if (
      !supportedLanguages.includes(language)
    ) {
      language = defaultLanguage;
    }

    try {

      const module = await import(
        `./languages/${language}.js`
      );

      window.PingCarTranslations =
        module.default || {};

      window.PingCarLanguage.current =
        language;

      document.documentElement.setAttribute(
        "lang",
        language
      );

      applyTranslations();

    } catch (error) {

      console.error(
        "PingCar language could not be loaded:",
        language,
        error
      );

    }
  }

  // --------------------------------------------------
  // 7. Apply translations
  // --------------------------------------------------

  function applyTranslations() {

    const translations =
      window.PingCarTranslations || {};

    // Normal text
    document
      .querySelectorAll("[data-i18n]")
      .forEach(function (element) {

        const key =
          element.getAttribute("data-i18n");

        if (
          translations[key] !== undefined
        ) {
          element.textContent =
            translations[key];
        }

      });

    // Placeholders
    document
      .querySelectorAll("[data-i18n-placeholder]")
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

    // Titles
    document
      .querySelectorAll("[data-i18n-title]")
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

  }

  // --------------------------------------------------
  // 8. Central PingCar language object
  // --------------------------------------------------

  window.PingCarLanguage = {

    current: null,

    get: function () {

      return (
        localStorage.getItem(
          "pingcar_language"
        ) || defaultLanguage
      );

    },

    set: function (language) {

      if (
        !supportedLanguages.includes(language)
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
if (typeof window.setLanguage === "function") {
  window.setLanguage(language);
  return;
}
   

loadLanguage(language);

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

  // --------------------------------------------------
  // 9. Start PingCar language system
  // --------------------------------------------------

  async function initializeLanguage() {

    const language =
      await determineLanguage();

    document.documentElement.setAttribute(
      "lang",
      language
    );

    await loadLanguage(language);

  }

  // Start
  initializeLanguage();

})();
