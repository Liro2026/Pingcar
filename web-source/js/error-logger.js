(function () {

  const SUPABASE_URL =
    "https://uvmkhqzfsgvicacvgskf.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_PlgGThtv9ZEpQgiag8Y7Gw_PvZwsij2";

  async function saveError(source, message, details = "") {

    try {

      await fetch(
        SUPABASE_URL + "/rest/v1/error_logs",
        {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            severity: "error",
            source: source,
            message: String(message).substring(0, 2000),
            details: String(details).substring(0, 5000),
            page_url: window.location.href
          })
        }
      );

    } catch (e) {
      console.warn("Error Logger konnte Fehler nicht speichern:", e);
    }
  }

  window.addEventListener("error", function (event) {

    saveError(
      "JavaScript",
      event.message || "Unbekannter JavaScript-Fehler",
      (event.error && event.error.stack) || ""
    );

  });

  window.addEventListener("unhandledrejection", function (event) {

    const reason = event.reason;

    saveError(
      "Promise",
      reason?.message || String(reason) || "Unbehandelte Promise-Fehler",
      reason?.stack || ""
    );

  });

})();
