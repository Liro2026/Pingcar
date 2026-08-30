// PingCar - Central Language System

import de from './languages/de.js';
import en from './languages/en.js';
import fr from './languages/fr.js';
import it from './languages/it.js';
import sq from './languages/sq.js';
import sr from './languages/sr.js';
import es from './languages/es.js';

(function () {
  const translationsMap = { de, en, fr, it, sq, sr, es };
  const supportedLanguages = ["de", "en", "fr", "it", "sq", "sr", "es"];
  const defaultLanguage = "de";

  const savedLanguage = localStorage.getItem("pingcar_language");
  const browserLanguage = (navigator.language || defaultLanguage).split("-")[0].toLowerCase();

  const countryLanguageMap = {
    CH: "de", DE: "de", AT: "de",
    GB: "en", US: "en", CA: "en", AU: "en",
    FR: "fr", BE: "fr", IT: "it",
    AL: "sq", XK: "sq", RS: "sr", ES: "es"
  };

  async function detectLanguageFromIP() {
    try {
      const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!response.ok) throw new Error("IP failed");
      const data = await response.json();
      const countryCode = (data.country_code || "").toUpperCase();
      const detected = countryLanguageMap[countryCode];
      if (detected && supportedLanguages.includes(detected)) return detected;
    } catch (e) {
      console.warn("IP detection failed", e);
    }
    return null;
  }

  async function determineLanguage() {
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) return savedLanguage;
    const ipLang = await detectLanguageFromIP();
    if (ipLang) {
      localStorage.setItem("pingcar_language", ipLang);
      return ipLang;
    }
    if (supportedLanguages.includes(browserLanguage)) {
      localStorage.setItem("pingcar_language", browserLanguage);
      return browserLanguage;
    }
    localStorage.setItem("pingcar_language", defaultLanguage);
    return defaultLanguage;
  }

  function loadLanguage(language) {
    if (!supportedLanguages.includes(language)) language = defaultLanguage;

    window.PingCarTranslations = translationsMap[language] || {};
    window.PingCarLanguage.current = language;
    document.documentElement.setAttribute("lang", language);

    applyTranslations();
  }

  function applyTranslations() {
    const translations = window.PingCarTranslations || {};

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (translations[key] !== undefined) el.textContent = translations[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (translations[key] !== undefined) el.placeholder = translations[key];
    });

    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (translations[key] !== undefined) el.title = translations[key];
    });
  }

  window.PingCarLanguage = {
    current: null,
    get: function () {
      return localStorage.getItem("pingcar_language") || defaultLanguage;
    },
    set: function (language) {
      if (!supportedLanguages.includes(language)) return;
      localStorage.setItem("pingcar_language", language);
      loadLanguage(language);
    },
    supported: supportedLanguages,
    translations: function () {
      return window.PingCarTranslations || {};
    },
    translate: function (key) {
      return (window.PingCarTranslations || {})[key] || key;
    }
  };

  async function initializeLanguage() {
    const language = await determineLanguage();
    loadLanguage(language);
  }

  initializeLanguage();
})();
