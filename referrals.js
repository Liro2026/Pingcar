import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://uvmkhqzfsgvicacvgskf.supabase.co",
  "sb_publishable_PlgGThtv9ZEpQgiag8Y7Gw_PvZwsij2"
);

const translations = {
  de: { title: "Freunde einladen", intro: "Teile deinen persönlichen Link. Du siehst bestätigte Registrierungen und deren Datum, aber keine persönlichen Daten.", count: "Bestätigte Registrierungen", people: "Eingeladene", copy: "Einladungslink kopieren", appstore: "Bis das nächste App-Update verfügbar ist, sollen Eingeladene ihr Konto über die PingCar-Website erstellen, damit die Einladung zugeordnet wird.", copied: "Link kopiert.", error: "Einladungslink konnte nicht geladen werden. Bitte melde dich erneut an." },
  en: { title: "Invite friends", intro: "Share your personal link. You will see confirmed registrations and their dates, but no personal details.", count: "Confirmed registrations", people: "Your invitees", copy: "Copy invitation link", appstore: "Until the next app update is available, invitees should create their account on the PingCar website so the invitation can be recorded.", copied: "Link copied.", error: "Could not load your invitation link. Please sign in again." },
  sq: { title: "Fto miqtë", intro: "Shpërndaje linkun personal. Do të shohësh regjistrimet e konfirmuara dhe datat e tyre, jo të dhënat personale.", count: "Regjistrime të konfirmuara", people: "Të ftuarit e tu", copy: "Kopjo linkun e ftesës", appstore: "Deri sa të dalë përditësimi i radhës i aplikacionit, të ftuarit duhet ta krijojnë llogarinë në faqen e PingCar që ftesa të regjistrohet.", copied: "Linku u kopjua.", error: "Linku i ftesës nuk u ngarkua. Hyr përsëri në llogari." },
  it: { title: "Invita amici", intro: "Condividi il tuo link personale. Vedrai le registrazioni confermate e le date, ma non i dati personali.", count: "Registrazioni confermate", people: "I tuoi invitati", copy: "Copia il link d’invito", appstore: "Fino al prossimo aggiornamento dell’app, gli invitati devono creare il proprio account sul sito PingCar affinché l’invito venga registrato.", copied: "Link copiato.", error: "Impossibile caricare il link. Accedi di nuovo." },
  fr: { title: "Inviter des amis", intro: "Partagez votre lien personnel. Vous verrez les inscriptions confirmées et leurs dates, sans données personnelles.", count: "Inscriptions confirmées", people: "Vos invités", copy: "Copier le lien d’invitation", appstore: "Jusqu’à la prochaine mise à jour de l’application, les invités doivent créer leur compte sur le site PingCar pour que l’invitation soit enregistrée.", copied: "Lien copié.", error: "Impossible de charger le lien. Veuillez vous reconnecter." }
};

const language = (localStorage.getItem("pingcar_language") || "de").slice(0, 2);
const t = translations[language] || translations.en;
const inviteBase = "https://pingcar.ch/invite.html";

function addCard() {
  const main = document.querySelector("main") || document.body;
  const card = document.createElement("section");
  card.className = "card";
  card.style.cssText = "background:#fff;border-radius:18px;padding:24px;margin:16px 0;box-shadow:0 4px 16px rgba(0,0,0,.08)";
  card.innerHTML = `<h2>${t.title}</h2><p>${t.intro}</p><div id="referralCount" style="font-size:20px;font-weight:700;margin:18px 0">… ${t.count.toLowerCase()}</div><input id="referralLink" readonly aria-label="${t.title}" style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:9px;font-size:14px"><button id="copyReferralLink" type="button" style="margin-top:10px;padding:12px 16px;border:0;border-radius:9px;background:#1762d2;color:white;font-weight:700;cursor:pointer">${t.copy}</button><h3 style="margin:20px 0 8px">${t.people}</h3><ul id="referralInvitees" style="margin:0;padding-left:20px"></ul><p style="font-size:13px;color:#667085;margin-top:14px">${t.appstore}</p><p id="referralStatus" aria-live="polite" style="font-size:13px"></p>`;
  main.appendChild(card);
  return card;
}

const card = addCard();
try {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw authError || new Error("Not signed in");
  const { data, error } = await supabase.rpc("get_my_referral_summary");
  if (error || !data?.code) throw error || new Error("Missing referral code");
  const link = `${inviteBase}?ref=${encodeURIComponent(data.code)}`;
  card.querySelector("#referralCount").textContent = `${data.confirmed_signups} · ${t.count}`;
  card.querySelector("#referralLink").value = link;
  const invitees = data.referrals || [];
  card.querySelector("#referralInvitees").innerHTML = invitees.length
    ? invitees.map((item, index) => `<li>${t.people} ${index + 1} · ${new Date(item.joined_at).toLocaleDateString()}</li>`).join("")
    : `<li>0</li>`;
  card.querySelector("#copyReferralLink").addEventListener("click", async () => {
    const status = card.querySelector("#referralStatus");
    try {
      await navigator.clipboard.writeText(link);
      status.textContent = t.copied;
    } catch (_) {
      card.querySelector("#referralLink").select();
      status.textContent = link;
    }
  });
} catch (error) {
  console.error("Referral dashboard error:", error);
  card.querySelector("#referralCount").textContent = t.error;
  card.querySelector("#referralLink").remove();
  card.querySelector("#copyReferralLink").remove();
}
