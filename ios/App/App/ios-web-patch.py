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

TOOLBAR = r'''
<style id="pingcar-ios-toolbar-style">
#pingcar-ios-toolbar{
  position:fixed;top:0;left:0;right:0;z-index:2147483646;
  padding-top:env(safe-area-inset-top);background:#fff;
  box-shadow:0 2px 8px rgba(0,0,0,.12);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}
#pingcar-ios-toolbar .pc-top{
  height:48px;display:flex;align-items:center;gap:8px;padding:0 10px;
}
#pingcar-ios-toolbar .pc-back{
  border:0;border-radius:9px;padding:8px 11px;background:#111827;
  color:#fff;font-size:15px;font-weight:600;
}
#pingcar-ios-toolbar .pc-title{
  flex:1;text-align:center;font-weight:700;font-size:18px;color:#111827;
}
#pingcar-ios-toolbar select{
  max-width:105px;border:1px solid #d1d5db;border-radius:8px;
  padding:7px 5px;background:#fff;font-size:13px;
}
#pingcar-ios-toolbar .pc-tabs{
  display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;
  padding:5px 8px 7px;scrollbar-width:none;
}
#pingcar-ios-toolbar .pc-tabs::-webkit-scrollbar{display:none}
#pingcar-ios-toolbar .pc-tab{
  flex:0 0 auto;border:0;border-radius:8px;padding:8px 11px;
  background:#f3f4f6;color:#374151;font-size:14px;font-weight:600;
}
#pingcar-ios-toolbar .pc-tab.active{background:#2563eb;color:#fff}
#pingcar-ios-toolbar-spacer{height:calc(env(safe-area-inset-top) + 96px)}
</style>
'''

TOOLBAR_SCRIPT = r'''
<script id="pingcar-ios-toolbar-script">
(function(){
  if(window.__pingcarIOSUnifiedToolbar) return;
  window.__pingcarIOSUnifiedToolbar=true;

  var labels={
    de:{back:"‹ Zurück",home:"Start",qr:"QR-Code",contact:"Kontakt",dashboard:"Dashboard",message:"🔔 Nachrichten",admin:"Admin"},
    en:{back:"‹ Back",home:"Home",qr:"QR Code",contact:"Contact",dashboard:"Dashboard",message:"🔔 Messages",admin:"Admin"},
    es:{back:"‹ Volver",home:"Inicio",qr:"Código QR",contact:"Contacto",dashboard:"Panel",message:"🔔 Mensajes",admin:"Admin"},
    fr:{back:"‹ Retour",home:"Accueil",qr:"Code QR",contact:"Contact",dashboard:"Tableau",message:"🔔 Messages",admin:"Admin"},
    hr:{back:"‹ Natrag",home:"Početna",qr:"QR kod",contact:"Kontakt",dashboard:"Nadzorna ploča",message:"🔔 Poruke",admin:"Admin"},
    hu:{back:"‹ Vissza",home:"Kezdőlap",qr:"QR-kód",contact:"Kapcsolat",dashboard:"Vezérlőpult",message:"🔔 Üzenetek",admin:"Admin"},
    it:{back:"‹ Indietro",home:"Home",qr:"Codice QR",contact:"Contatti",dashboard:"Dashboard",message:"🔔 Messaggi",admin:"Admin"},
    mk:{back:"‹ Назад",home:"Почетна",qr:"QR код",contact:"Контакт",dashboard:"Контролна табла",message:"🔔 Пораки",admin:"Admin"},
    nl:{back:"‹ Terug",home:"Home",qr:"QR-code",contact:"Contact",dashboard:"Dashboard",message:"🔔 Berichten",admin:"Admin"},
    pt:{back:"‹ Voltar",home:"Início",qr:"Código QR",contact:"Contacto",dashboard:"Painel",message:"🔔 Mensagens",admin:"Admin"},
    sk:{back:"‹ Späť",home:"Domov",qr:"QR kód",contact:"Kontakt",dashboard:"Ovládací panel",message:"🔔 Správy",admin:"Admin"},
    sq:{back:"‹ Mbrapa",home:"Kryefaqja",qr:"Kodi QR",contact:"Kontakt",dashboard:"Paneli",message:"🔔 Mesazhe",admin:"Admin"},
    sr:{back:"‹ Назад",home:"Почетна",qr:"QR код",contact:"Контакт",dashboard:"Контролна табла",message:"🔔 Поруке",admin:"Admin"},
    tr:{back:"‹ Geri",home:"Ana Sayfa",qr:"QR Kodu",contact:"İletişim",dashboard:"Panel",message:"🔔 Mesajlar",admin:"Admin"}
  };

  var current=localStorage.getItem("pingcar_language")||"de";
  if(!labels[current]) current="de";

  function pageName(){return(location.pathname.split("/").pop()||"index.html").toLowerCase();}
  function go(href){location.assign(new URL(href,location.href).href);}

  function install(){
    if(!document.body)return setTimeout(install,25);
    if(document.getElementById("pingcar-ios-toolbar"))return;

    document.querySelectorAll("nav").forEach(function(n){n.remove();});
    document.querySelectorAll(".lang-dropdown").forEach(function(n){n.remove();});
    var old=document.getElementById("pingcar-ios-back");if(old)old.remove();

    var l=labels[current];
    var html=
      '<div id="pingcar-ios-toolbar">'+
        '<div class="pc-top">'+
          '<button type="button" class="pc-back">'+l.back+'</button>'+
          '<div class="pc-title">PingCar</div>'+
          '<select id="pingcar-ios-language" aria-label="Language">'+
            '<option value="de">DE</option><option value="en">EN</option>'+
            '<option value="es">ES</option><option value="fr">FR</option>'+
            '<option value="hr">HR</option><option value="hu">HU</option>'+
            '<option value="it">IT</option><option value="mk">MK</option>'+
            '<option value="nl">NL</option><option value="pt">PT</option>'+
            '<option value="sk">SK</option><option value="sq">SQ</option>'+
            '<option value="sr">SR</option><option value="tr">TR</option>'+
          '</select>'+
        '</div>'+
        '<div class="pc-tabs">'+
          '<button class="pc-tab" data-href="index.html">'+l.home+'</button>'+
          '<button class="pc-tab" data-href="qr.html">'+l.qr+'</button>'+
          '<button class="pc-tab" data-href="contact.html">'+l.contact+'</button>'+
          '<button class="pc-tab" data-href="dashboard.html">'+l.dashboard+'</button>'+
          '<button class="pc-tab" data-href="message.html">'+l.message+'</button>'+
          '<button class="pc-tab" data-href="admin.html">'+l.admin+'</button>'+
        '</div>'+
      '</div><div id="pingcar-ios-toolbar-spacer"></div>';

    document.body.insertAdjacentHTML("afterbegin",html);

    var select=document.getElementById("pingcar-ios-language");
    select.value=current;
    select.addEventListener("change",function(){
      localStorage.setItem("pingcar_language",this.value);
      location.reload();
    });

    document.querySelectorAll("#pingcar-ios-toolbar .pc-tab").forEach(function(btn){
      var href=btn.getAttribute("data-href");
      if(href===pageName())btn.classList.add("active");
      btn.addEventListener("click",function(e){
        e.preventDefault();e.stopPropagation();go(href);
      },true);
    });

    document.querySelector("#pingcar-ios-toolbar .pc-back").addEventListener("click",function(){
      if(history.length>1)history.back();else go("index.html");
    },true);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);
  else install();
})();
</script>
'''

LANGUAGE_SCRIPT = r'''
<script id="pingcar-ios-language-script">
(function(){
  var supported=["de","en","es","fr","hr","hu","it","mk","nl","pt","sk","sq","sr","tr"];

  function apply(){
    var t=window.PingCarTranslations||{};
    document.querySelectorAll("[data-i18n]").forEach(function(el){
      var k=el.getAttribute("data-i18n");if(t[k]!==undefined)el.textContent=t[k];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el){
      var k=el.getAttribute("data-i18n-placeholder");if(t[k]!==undefined)el.placeholder=t[k];
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function(el){
      var k=el.getAttribute("data-i18n-title");if(t[k]!==undefined)el.title=t[k];
    });
  }

  function install(){
    if(!window.PingCarLanguage)return setTimeout(install,50);
    if(window.PingCarLanguage.__iosOverrideInstalled)return;
    window.PingCarLanguage.__iosOverrideInstalled=true;

    window.PingCarLanguage.set=async function(language){
      if(supported.indexOf(language)===-1)return;
      localStorage.setItem("pingcar_language",language);
      try{
        var module=await import("./js/languages/"+language+".js");
        window.PingCarTranslations=module.default||{};
        window.PingCarLanguage.current=language;
        document.documentElement.lang=language;
        apply();

        var reverse={};
        supported.forEach(function(lang){
          import("./js/languages/"+lang+".js").then(function(m){
            var obj=m.default||{};
            Object.keys(obj).forEach(function(key){
              var value=obj[key];
              if(typeof value==="string"&&value.trim())reverse[value.trim()]=key;
            });
          }).catch(function(){});
        });

        setTimeout(function(){
          var target=window.PingCarTranslations||{};
          document.querySelectorAll("body *").forEach(function(el){
            if(["SCRIPT","STYLE","NOSCRIPT","OPTION"].indexOf(el.tagName)!==-1)return;
            if(el.children.length)return;
            var text=(el.textContent||"").trim();
            if(!text||!reverse[text])return;
            var key=reverse[text];
            if(target[key]!==undefined)el.textContent=target[key];
          });
        },300);
      }catch(error){
        console.error("PingCar iOS language load failed:",language,error);
      }
    };
  }
  install();
})();
</script>
'''

for name in PAGES:
    path=ROOT/name
    if not path.exists():
        raise SystemExit("Missing: "+str(path))

    text=path.read_text(encoding="utf-8-sig")

    if name=="index.html":
        text=re.sub(
            r'\s*import \{ getMessaging, getToken \} from "https://www\.gstatic\.com/firebasejs/10\.13\.2/firebase-messaging\.js";\s*',
            "\n", text
        )
        text=text.replace("const messaging = getMessaging(firebaseApp);","const messaging = null;")
        text=text.replace(
            'const registration = await navigator.serviceWorker.register(\n      "/firebase-messaging-sw.js"\n    );',
            'if (!messaging) {\n      alert("Push-Benachrichtigungen sind in der iOS-App derzeit nicht verfügbar.");\n      return;\n    }\n\n    const registration = await navigator.serviceWorker.register(\n      "./firebase-messaging-sw.js"\n    );'
        )

    if name=="dashboard.html":
        def protect(match):
            return match.group(0).replace("</script>","<\\/script>")
        text=re.sub(r'printWindow\.document\.write\(`.*?`\);',protect,text,flags=re.S)

    text=text.replace("</body>",TOOLBAR+TOOLBAR_SCRIPT+LANGUAGE_SCRIPT+"</body>",1)
    path.write_text(text,encoding="utf-8")

print("DONE")
