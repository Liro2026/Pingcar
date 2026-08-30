// PingCar - Central Language System

(function () {

  const supportedLanguages = ["de", "en", "fr", "it", "sq", "sr", "es"];
  const defaultLanguage = "de";

  const savedLanguage = localStorage.getItem("pingcar_language");

  const browserLanguage = (
    navigator.language ||
    navigator.userLanguage ||
    defaultLanguage
  ).split("-")[0].toLowerCase();

  const countryLanguageMap = {
    CH: "de", DE: "de", AT: "de",
    GB: "en", US: "en", CA: "en", AU: "en",
    FR: "fr", BE: "fr", IT: "it",
    AL: "sq", XK: "sq", RS: "sr", ES: "es"
  };

  async function detectLanguageFromIP() {
    try {
      const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!response.ok) throw new Error("IP detection failed");
      const data = await response.json();
      const countryCode = (data.country_code || "").toUpperCase();
      const detectedLanguage = countryLanguageMap[countryCode];

      if (detectedLanguage && supportedLanguages.includes(detectedLanguage)) {
        return detectedLanguage;
      }
    } catch (error) {
      console.warn("PingCar IP language detection failed:", error);
    }
    return null;
  }

  async function determineLanguage() {
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }

    const ipLanguage = await detectLanguageFromIP();
    if (ipLanguage) {
      localStorage.setItem("pingcar_language", ipLanguage);
      return ipLanguage;
    }

    if (supportedLanguages.includes(browserLanguage)) {
      localStorage.setItem("pingcar_language", browserLanguage);
      return browserLanguage;
    }

    localStorage.setItem("pingcar_language", defaultLanguage);
    return defaultLanguage;
  }

  async function loadLanguage(language) {
    if (!supportedLanguages.includes(language)) {
      language = defaultLanguage;
    }

    try {
      // Shtohet v=Date.now() që shfletuesi të marrë DETYRIMISHT skedarin e ri dhe jo cache-in
      const module = await import(`./languages/${language}.js?v=${Date.now()}`);

      window.PingCarTranslations = module.default || {};
      window.PingCarLanguage.current = language;

      document.documentElement.setAttribute("lang", language);
      applyTranslations();
    } catch (error) {
      console.error("PingCar language could not be loaded:", language, error);
    }
  }

  function applyTranslations() {
    const translations = window.PingCarTranslations || {};

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      const key = element.getAttribute("data-i18n");
      if (translations[key] !== undefined) {
        element.textContent = translations[key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      const key = element.getAttribute("data-i18n-placeholder");
      if (translations[key] !== undefined) {
        element.placeholder = translations[key];
      }
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (element) {
      const key = element.getAttribute("data-i18n-title");
      if (translations[key] !== undefined) {
        element.title = translations[key];
      }
    });
  }

  window.PingCarLanguage = {
    current: null,

    get: function () {
      return localStorage.getItem("pingcar_language") || defaultLanguage;
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

  async function initializeLanguage() {
    const language = await determineLanguage();
    await loadLanguage(language);
  }

  initializeLanguage();
})();
