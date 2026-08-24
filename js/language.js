// PingCar - Central Language System

(function () {
  const savedLanguage = localStorage.getItem("pingcar_language");

  const browserLanguage = (
    navigator.language ||
    navigator.userLanguage ||
    "de"
  ).split("-")[0].toLowerCase();

  const supportedLanguages = [
    "de",
    "en",
    "fr",
    "it",
    "sq"
  ];

  const defaultLanguage = "de";

  const currentLanguage =
    savedLanguage && supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : supportedLanguages.includes(browserLanguage)
        ? browserLanguage
        : defaultLanguage;

  window.PingCarLanguage = {
    current: currentLanguage,

    set: function (language) {
      if (!supportedLanguages.includes(language)) {
        return;
      }

      localStorage.setItem("pingcar_language", language);
      window.location.reload();
    },

    get: function () {
      return localStorage.getItem("pingcar_language") || currentLanguage;
    }
  };

  document.documentElement.setAttribute(
    "lang",
    currentLanguage
  );
})();
