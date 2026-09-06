#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path("ios/App/App/public")

PAGES = [
    "index.html",
    "qr.html",
    "contact.html",
    "dashboard.html",
    "message.html",
    "admin.html",
]

NAV = r'''
<script>
(function () {
  if (window.__pingcarIOSNavigationInstalled) return;
  window.__pingcarIOSNavigationInstalled = true;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("nav a[href]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.indexOf("://") !== -1) return;

      link.style.pointerEvents = "auto";
      link.style.position = "relative";
      link.style.zIndex = "10001";

      link.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign(new URL(href, window.location.href).href);
      }, true);

      link.addEventListener("pointerup", function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign(new URL(href, window.location.href).href);
      }, true);
    });
  });
})();
</script>
'''

BACK = r'''
<script>
(function () {
  if (window.__pingcarIOSBackInstalled) return;
  window.__pingcarIOSBackInstalled = true;

  document.addEventListener("DOMContentLoaded", function () {
    var path = window.location.pathname.split("/").pop() || "index.html";

    if (path === "index.html") return;
    if (document.getElementById("pingcar-ios-back")) return;

    var button = document.createElement("button");
    button.id = "pingcar-ios-back";
    button.type = "button";
    button.textContent = "‹ Zurück";

    button.style.cssText =
      "position:fixed;" +
      "top:max(12px,env(safe-area-inset-top));" +
      "left:12px;" +
      "z-index:2147483647;" +
      "pointer-events:auto;" +
      "padding:10px 14px;" +
      "border:0;" +
      "border-radius:10px;" +
      "background:#111827;" +
      "color:#fff;" +
      "font-size:16px;" +
      "font-weight:600;" +
      "box-shadow:0 2px 8px rgba(0,0,0,.25);";

    button.addEventListener("click", function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign("index.html");
      }
    });

    document.body.appendChild(button);
  });
})();
</script>
'''

LANGUAGE = r'''
<script>
(function () {
  var supported = [
    "de","en","es","fr","hr","hu","it",
    "mk","nl","pt","sk","sq","sr","tr"
  ];

  function applyTranslations() {
    var translations = window.PingCarTranslations || {};

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (translations[key] !== undefined) {
        el.textContent = translations[key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (translations[key] !== undefined) {
        el.placeholder = translations[key];
      }
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (translations[key] !== undefined) {
        el.title = translations[key];
      }
    });
  }

  function install() {
    if (!window.PingCarLanguage) {
      setTimeout(install, 50);
      return;
    }

    if (window.PingCarLanguage.__iosOverrideInstalled) return;

    window.PingCarLanguage.__iosOverrideInstalled = true;

    window.PingCarLanguage.set = async function (language) {
      if (supported.indexOf(language) === -1) return;

      localStorage.setItem("pingcar_language", language);

      try {
        var module = await import("./js/languages/" + language + ".js");

        window.PingCarTranslations = module.default || {};
        window.PingCarLanguage.current = language;

        document.documentElement.setAttribute("lang", language);

        applyTranslations();
      } catch (error) {
        console.error(
          "PingCar iOS language load failed:",
          language,
          error
        );
      }
    };
  }

  install();
})();
</script>
'''

for name in PAGES:
    path = ROOT / name

    if not path.exists():
        raise SystemExit("Missing: " + str(path))

    text = path.read_text(encoding="utf-8-sig")

    if name == "index.html":
        text = re.sub(
            r'\s*import \{ getMessaging, getToken \} from "https://www\.gstatic\.com/firebasejs/10\.13\.2/firebase-messaging\.js";\s*',
            "\n",
            text
        )

        text = text.replace(
            "const messaging = getMessaging(firebaseApp);",
            "const messaging = null;"
        )

        text = text.replace(
            'const registration = await navigator.serviceWorker.register(\n      "/firebase-messaging-sw.js"\n    );',
            'if (!messaging) {\n      alert("Push-Benachrichtigungen sind in der iOS-App derzeit nicht verfügbar.");\n      return;\n    }\n\n    const registration = await navigator.serviceWorker.register(\n      "./firebase-messaging-sw.js"\n    );'
        )

    injection = NAV + BACK + LANGUAGE
    text = text.replace("</body>", injection + "</body>", 1)

    path.write_text(text, encoding="utf-8")

    print("PATCHED:", path)

print("DONE")
