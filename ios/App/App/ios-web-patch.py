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

# ============================================================
# EXACT PingCar website language order
# ============================================================

LANGUAGES = [
    ("de", "Deutsch (DE)"),
    ("fr", "Français (FR)"),
    ("it", "Italiano (IT)"),
    ("en", "English (EN)"),
    ("sq", "Shqip (SQ)"),
    ("sr", "Srpski (SR)"),
    ("es", "Español (ES)"),
    ("tr", "Türkçe (TR)"),
    ("sk", "Slovenčina (SK)"),
    ("hr", "Hrvatski (HR)"),
    ("hu", "Magyar (HU)"),
    ("pt", "Português (PT)"),
    ("mk", "Македонски (MK)"),
    ("nl", "Nederlands (NL)"),
]

SUPPORTED = [code for code, _ in LANGUAGES]

# ============================================================
# iOS toolbar
# ============================================================

TOOLBAR_STYLE = r'''
<style id="pingcar-ios-toolbar-style">

#pingcar-ios-toolbar{
  position:fixed;
  left:0;
  right:0;
  top:0;
  z-index:2147483646;
  padding-top:env(safe-area-inset-top);
  background:#ffffff;
  box-shadow:0 2px 8px rgba(0,0,0,.14);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

#pingcar-ios-toolbar .pc-top{
  min-height:50px;
  display:flex;
  align-items:center;
  gap:8px;
  padding:4px 10px;
}

#pingcar-ios-toolbar .pc-back{
  flex:0 0 auto;
  border:0;
  border-radius:9px;
  padding:8px 11px;
  background:#111827;
  color:#ffffff;
  font-size:15px;
  font-weight:600;
}

#pingcar-ios-toolbar .pc-title{
  flex:1;
  min-width:0;
  text-align:center;
  font-size:18px;
  font-weight:700;
  color:#111827;
}

#pingcar-ios-toolbar .pc-language-wrap{
  position:relative;
  flex:0 0 auto;
}

#pingcar-ios-toolbar .pc-language-button{
  border:1px solid #d1d5db;
  border-radius:9px;
  padding:8px 9px;
  background:#ffffff;
  color:#111827;
  font-size:13px;
  font-weight:600;
  white-space:nowrap;
}

#pingcar-ios-toolbar .pc-language-menu{
  display:none;
  position:absolute;
  right:0;
  top:calc(100% + 5px);
  width:215px;
  max-height:60vh;
  overflow:auto;
  background:#ffffff;
  border:1px solid #e5e7eb;
  border-radius:12px;
  box-shadow:0 10px 30px rgba(0,0,0,.18);
  padding:6px;
}

#pingcar-ios-toolbar .pc-language-menu.open{
  display:block;
}

#pingcar-ios-toolbar .pc-language-option{
  display:block;
  width:100%;
  text-align:left;
  border:0;
  border-radius:8px;
  padding:10px 11px;
  background:#ffffff;
  color:#111827;
  font-size:15px;
}

#pingcar-ios-toolbar .pc-language-option.selected{
  background:#eef5ff;
  color:#1762d2;
  font-weight:700;
}

#pingcar-ios-toolbar .pc-tabs{
  display:flex;
  gap:4px;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  padding:5px 8px 7px;
  scrollbar-width:none;
}

#pingcar-ios-toolbar .pc-tabs::-webkit-scrollbar{
  display:none;
}

#pingcar-ios-toolbar .pc-tab{
  flex:0 0 auto;
  border:0;
  border-radius:8px;
  padding:8px 11px;
  background:#f3f4f6;
  color:#374151;
  font-size:14px;
  font-weight:600;
}

#pingcar-ios-toolbar .pc-tab.active{
  background:#2563eb;
  color:#ffffff;
}

#pingcar-ios-toolbar-spacer{
  height:calc(env(safe-area-inset-top) + 101px);
}

</style>
'''

# ============================================================
# iOS toolbar JavaScript
# ============================================================

TOOLBAR_SCRIPT = r'''
<script id="pingcar-ios-toolbar-script">

(function(){

  if(window.__pingcarIOSUnifiedToolbar){
    return;
  }

  window.__pingcarIOSUnifiedToolbar = true;

  var labels = {

    de:{
      back:"‹ Zurück",
      home:"Start",
      qr:"QR-Code",
      contact:"Kontakt",
      dashboard:"Dashboard",
      message:"🔔 Nachrichten",
      admin:"Admin"
    },

    fr:{
      back:"‹ Retour",
      home:"Accueil",
      qr:"Code QR",
      contact:"Contact",
      dashboard:"Tableau",
      message:"🔔 Messages",
      admin:"Admin"
    },

    it:{
      back:"‹ Indietro",
      home:"Home",
      qr:"Codice QR",
      contact:"Contatti",
      dashboard:"Dashboard",
      message:"🔔 Messaggi",
      admin:"Admin"
    },

    en:{
      back:"‹ Back",
      home:"Home",
      qr:"QR Code",
      contact:"Contact",
      dashboard:"Dashboard",
      message:"🔔 Messages",
      admin:"Admin"
    },

    sq:{
      back:"‹ Mbrapa",
      home:"Kryefaqja",
      qr:"Kodi QR",
      contact:"Kontakt",
      dashboard:"Paneli",
      message:"🔔 Mesazhe",
      admin:"Admin"
    },

    sr:{
      back:"‹ Nazad",
      home:"Početna",
      qr:"QR kod",
      contact:"Kontakt",
      dashboard:"Kontrolna tabla",
      message:"🔔 Poruke",
      admin:"Admin"
    },

    es:{
      back:"‹ Volver",
      home:"Inicio",
      qr:"Código QR",
      contact:"Contacto",
      dashboard:"Panel",
      message:"🔔 Mensajes",
      admin:"Admin"
    },

    tr:{
      back:"‹ Geri",
      home:"Ana Sayfa",
      qr:"QR Kodu",
      contact:"İletişim",
      dashboard:"Panel",
      message:"🔔 Mesajlar",
      admin:"Admin"
    },

    sk:{
      back:"‹ Späť",
      home:"Domov",
      qr:"QR kód",
      contact:"Kontakt",
      dashboard:"Ovládací panel",
      message:"🔔 Správy",
      admin:"Admin"
    },

    hr:{
      back:"‹ Natrag",
      home:"Početna",
      qr:"QR kod",
      contact:"Kontakt",
      dashboard:"Nadzorna ploča",
      message:"🔔 Poruke",
      admin:"Admin"
    },

    hu:{
      back:"‹ Vissza",
      home:"Kezdőlap",
      qr:"QR-kód",
      contact:"Kapcsolat",
      dashboard:"Vezérlőpult",
      message:"🔔 Üzenetek",
      admin:"Admin"
    },

    pt:{
      back:"‹ Voltar",
      home:"Início",
      qr:"Código QR",
      contact:"Contacto",
      dashboard:"Painel",
      message:"🔔 Mensagens",
      admin:"Admin"
    },

    mk:{
      back:"‹ Назад",
      home:"Почетна",
      qr:"QR код",
      contact:"Контакт",
      dashboard:"Контролна табла",
      message:"🔔 Пораки",
      admin:"Admin"
    },

    nl:{
      back:"‹ Terug",
      home:"Home",
      qr:"QR-code",
      contact:"Contact",
      dashboard:"Dashboard",
      message:"🔔 Berichten",
      admin:"Admin"
    }

  };

  var languages = [
    ["de","Deutsch (DE)"],
    ["fr","Français (FR)"],
    ["it","Italiano (IT)"],
    ["en","English (EN)"],
    ["sq","Shqip (SQ)"],
    ["sr","Srpski (SR)"],
    ["es","Español (ES)"],
    ["tr","Türkçe (TR)"],
    ["sk","Slovenčina (SK)"],
    ["hr","Hrvatski (HR)"],
    ["hu","Magyar (HU)"],
    ["pt","Português (PT)"],
    ["mk","Македонски (MK)"],
    ["nl","Nederlands (NL)"]
  ];

  var current =
    localStorage.getItem("pingcar_language") || "de";

  if(!labels[current]){
    current = "de";
  }

  function pageName(){
    return(
      location.pathname.split("/").pop() ||
      "index.html"
    ).toLowerCase();
  }

  function go(href){
    location.assign(
      new URL(href,location.href).href
    );
  }

  function install(){

    if(!document.body){
      setTimeout(install,25);
      return;
    }

    if(
      document.getElementById(
        "pingcar-ios-toolbar"
      )
    ){
      return;
    }

    document
      .querySelectorAll("nav")
      .forEach(function(n){
        n.remove();
      });

    document
      .querySelectorAll(".lang-dropdown")
      .forEach(function(n){
        n.remove();
      });

    var l = labels[current];

    var options = "";

    languages.forEach(function(item){

      options +=
        '<button type="button" ' +
        'class="pc-language-option' +
        (item[0] === current ? " selected" : "") +
        '" data-language="' +
        item[0] +
        '">' +
        item[1] +
        "</button>";

    });

    var html =
      '<div id="pingcar-ios-toolbar">' +

        '<div class="pc-top">' +

          '<button type="button" class="pc-back">' +
            l.back +
          "</button>" +

          '<div class="pc-title">' +
            "PingCar" +
          "</div>" +

          '<div class="pc-language-wrap">' +

            '<button type="button" ' +
              'id="pingcar-ios-language-button" ' +
              'class="pc-language-button">' +
              current.toUpperCase() +
              " ▾" +
            "</button>" +

            '<div id="pingcar-ios-language-menu" ' +
              'class="pc-language-menu">' +
              options +
            "</div>" +

          "</div>" +

        "</div>" +

        '<div class="pc-tabs">' +

          '<button class="pc-tab" data-href="index.html">' +
            l.home +
          "</button>" +

          '<button class="pc-tab" data-href="qr.html">' +
            l.qr +
          "</button>" +

          '<button class="pc-tab" data-href="contact.html">' +
            l.contact +
          "</button>" +

          '<button class="pc-tab" data-href="dashboard.html">' +
            l.dashboard +
          "</button>" +

          '<button class="pc-tab" data-href="message.html">' +
            l.message +
          "</button>" +

          '<button class="pc-tab" data-href="admin.html">' +
            l.admin +
          "</button>" +

        "</div>" +

      "</div>" +

      '<div id="pingcar-ios-toolbar-spacer"></div>';

    document.body.insertAdjacentHTML(
      "afterbegin",
      html
    );

    var languageButton =
      document.getElementById(
        "pingcar-ios-language-button"
      );

    var languageMenu =
      document.getElementById(
        "pingcar-ios-language-menu"
      );

    languageButton.addEventListener(
      "click",
      function(e){

        e.preventDefault();
        e.stopPropagation();

        languageMenu.classList.toggle(
          "open"
        );

      },
      true
    );

    document
      .querySelectorAll(
        "#pingcar-ios-toolbar .pc-language-option"
      )
      .forEach(function(btn){

        btn.addEventListener(
          "click",
          function(e){

            e.preventDefault();
            e.stopPropagation();

            localStorage.setItem(
              "pingcar_language",
              this.getAttribute(
                "data-language"
              )
            );

            location.reload();

          },
          true
        );

      });

    document.addEventListener(
      "click",
      function(e){

        if(
          !languageMenu.contains(e.target) &&
          e.target !== languageButton
        ){
          languageMenu.classList.remove(
            "open"
          );
        }

      },
      true
    );

    document
      .querySelectorAll(
        "#pingcar-ios-toolbar .pc-tab"
      )
      .forEach(function(btn){

        var href =
          btn.getAttribute("data-href");

        if(href === pageName()){
          btn.classList.add("active");
        }

        btn.addEventListener(
          "click",
          function(e){

            e.preventDefault();
            e.stopPropagation();

            go(href);

          },
          true
        );

      });

    document
      .querySelector(
        "#pingcar-ios-toolbar .pc-back"
      )
      .addEventListener(
        "click",
        function(e){

          e.preventDefault();
          e.stopPropagation();

          if(history.length > 1){
            history.back();
          }else{
            go("index.html");
          }

        },
        true
      );

  }

  if(
    document.readyState === "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      install
    );

  }else{

    install();

  }

})();

</script>
'''

# ============================================================
# Language override
# ============================================================

LANGUAGE_SCRIPT = r'''
<script id="pingcar-ios-language-script">

(function(){

  var supported = [
    "de",
    "fr",
    "it",
    "en",
    "sq",
    "sr",
    "es",
    "tr",
    "sk",
    "hr",
    "hu",
    "pt",
    "mk",
    "nl"
  ];

  function apply(){

    var t =
      window.PingCarTranslations || {};

    document
      .querySelectorAll("[data-i18n]")
      .forEach(function(el){

        var key =
          el.getAttribute("data-i18n");

        if(t[key] !== undefined){
          el.textContent = t[key];
        }

      });

    document
      .querySelectorAll(
        "[data-i18n-placeholder]"
      )
      .forEach(function(el){

        var key =
          el.getAttribute(
            "data-i18n-placeholder"
          );

        if(t[key] !== undefined){
          el.placeholder = t[key];
        }

      });

    document
      .querySelectorAll(
        "[data-i18n-title]"
      )
      .forEach(function(el){

        var key =
          el.getAttribute(
            "data-i18n-title"
          );

        if(t[key] !== undefined){
          el.title = t[key];
        }

      });

  }

  async function load(language){

    if(
      supported.indexOf(language) === -1
    ){
      language = "de";
    }

    try{

      var module =
        await import(
          "./js/languages/" +
          language +
          ".js"
        );

      window.PingCarTranslations =
        module.default || {};

      if(window.PingCarLanguage){
        window.PingCarLanguage.current =
          language;
      }

      document.documentElement.lang =
        language;

      apply();

    }catch(error){

      console.error(
        "PingCar iOS language load failed:",
        language,
        error
      );

    }

  }

  function install(){

    if(!window.PingCarLanguage){

      setTimeout(
        install,
        50
      );

      return;
    }

    if(
      window.PingCarLanguage
        .__iosOverrideInstalled
    ){
      return;
    }

    window.PingCarLanguage
      .__iosOverrideInstalled = true;

    window.PingCarLanguage.set =
      async function(language){

        if(
          supported.indexOf(language) === -1
        ){
          return;
        }

        localStorage.setItem(
          "pingcar_language",
          language
        );

        await load(language);

      };

    var saved =
      localStorage.getItem(
        "pingcar_language"
      ) ||
      window.PingCarLanguage.current ||
      "de";

    if(
      supported.indexOf(saved) === -1
    ){
      saved = "de";
    }

    load(saved);

  }

  install();

})();

</script>
'''

# ============================================================
# Dashboard repair
# ============================================================

def repair_dashboard(text):

    # 1. Repair broken EN -> SR translation object.
    text = re.sub(
        r'("Benachrichtigungen"\s*:\s*"Notifications")\s*,?\s*sr\s*:',
        r'\1\n  },\n  sr: {',
        text,
        count=1,
        flags=re.S
    )

    # 2. Protect </script> inside printWindow.document.write(`...`).
    # Otherwise HTML closes the outer JavaScript block.
    marker = "printWindow.document.write(`"

    start = text.find(marker)

    if start != -1:

        end = text.find(
            "`);",
            start + len(marker)
        )

        if end != -1:

            segment = text[
                start:
                end + 3
            ]

            segment = segment.replace(
                "</script>",
                "<\\/script>"
            )

            text = (
                text[:start] +
                segment +
                text[end + 3:]
            )

    # 3. FIX FOR RAW JS LEAKING ON SCREEN (downloadQR / printQR / shareQR)
    # E mbyll saktë tagun <script> dhe e rihap për funksionet e QR
    raw_js_pattern = r'(printWindow\.document\.close\(\);\s*\}\;?)\s*(async\s+function\s+downloadQR)'
    text = re.sub(
        raw_js_pattern,
        r'\1\n</script>\n<script>\n\2',
        text,
        flags=re.S
    )

    return text


# ============================================================
# Apply patch
# ============================================================

for name in PAGES:

    path = ROOT / name

    if not path.exists():
        raise SystemExit(
            "Missing: " + str(path)
        )

    text = path.read_text(
        encoding="utf-8-sig"
    )

    # --------------------------------------------------------
    # iOS Firebase startup fix
    # --------------------------------------------------------

    if name == "index.html":

        text = re.sub(
            r'\s*import \{ getMessaging, getToken \} '
            r'from "https://www\.gstatic\.com/firebasejs/'
            r'10\.13\.2/firebase-messaging\.js";\s*',
            "\n",
            text
        )

        text = text.replace(
            "const messaging = getMessaging(firebaseApp);",
            "const messaging = null;"
        )

        text = text.replace(
            'const registration = await navigator.serviceWorker.register(\n'
            '      "/firebase-messaging-sw.js"\n'
            '    );',

            'if (!messaging) {\n'
            '      alert("Push-Benachrichtigungen sind in der iOS-App derzeit nicht verfügbar.");\n'
            '      return;\n'
            '    }\n\n'
            '    const registration = await navigator.serviceWorker.register(\n'
            '      "./firebase-messaging-sw.js"\n'
            '    );'
        )

    # --------------------------------------------------------
    # Dashboard fix
    # --------------------------------------------------------

    if name == "dashboard.html":

        text = repair_dashboard(text)

    # --------------------------------------------------------
    # Remove old iOS patch blocks
    # --------------------------------------------------------

    text = re.sub(
        r'\s*<style id="pingcar-ios-toolbar-style">.*?</style>\s*',
        "\n",
        text,
        flags=re.S
    )

    text = re.sub(
        r'\s*<script id="pingcar-ios-toolbar-script">.*?</script>\s*',
        "\n",
        text,
        flags=re.S
    )

    text = re.sub(
        r'\s*<script id="pingcar-ios-language-script">.*?</script>\s*',
        "\n",
        text,
        flags=re.S
    )

    # --------------------------------------------------------
    # Install new iOS-only runtime
    # --------------------------------------------------------

    text = text.replace(
        "</body>",
        TOOLBAR_STYLE +
        "\n" +
        TOOLBAR_SCRIPT +
        "\n" +
        LANGUAGE_SCRIPT +
        "\n</body>",
        1
    )

    path.write_text(
        text,
        encoding="utf-8"
    )

print("")
print("==============================================")
print("PINGCAR iOS PATCH COMPLETE")
print("==============================================")
print("")
print("Languages:")
print(",".join(SUPPORTED))
print("")
print("Dashboard print-template protection: ON")
print("Dashboard EN/SR repair: ON")
print("Dashboard QR JS leakage fix: ON")
print("Firebase Messaging startup removal: ON")
print("iOS Back button: ON")
print("iOS tabs: ON")
print("iOS language menu: ON")
print("")
print("DONE")
