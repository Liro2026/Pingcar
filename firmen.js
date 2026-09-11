async function showCompanies() {
  if (!(await requireAdmin())) return;

  content.innerHTML = `
    <div class="card">
      <h2>🏢 Firmenkunden</h2>

      <button onclick="showCreateCompany()" style="margin-bottom:20px;">
        ➕ Neue Firma
      </button>

      <div id="companiesArea">
        <p>Firmen werden geladen...</p>
      </div>
    </div>
  `;

  await loadCompanies();
}


async function loadCompanies() {
  const area = document.getElementById("companiesArea");

  try {
    const { data, error } = await db
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const companies = data || [];

    if (!companies.length) {
      area.innerHTML = `
        <p>Noch keine Firmen vorhanden.</p>
      `;
      return;
    }

    let rows = "";

    for (const company of companies) {

      const { count, error: memberError } = await db
        .from("company_members")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      const memberCount = memberError ? 0 : (count || 0);

      rows += `
        <tr>
          <td><strong>${escapeCompanyHtml(company.company_name)}</strong></td>
          <td>${escapeCompanyHtml(company.contact_name || "-")}</td>
          <td>${escapeCompanyHtml(company.email || "-")}</td>
          <td>${memberCount} / ${company.user_limit}</td>
          <td>${company.status === "active" ? "🟢 Aktiv" : "⚪ Inaktiv"}</td>
          <td>
            <button onclick="showCompanyDetails('${company.id}')">
              Öffnen
            </button>
          </td>
        </tr>
      `;
    }

    area.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Firma</th>
            <th>Kontakt</th>
            <th>E-Mail</th>
            <th>Benutzer</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

  } catch (error) {
    area.innerHTML = `
      <p style="color:red;">
        Fehler: ${escapeCompanyHtml(error.message)}
      </p>
    `;
  }
}


function showCreateCompany() {

  content.innerHTML = `
    <div class="card">

      <h2>🏢 Neue Firma erstellen</h2>

      <label>Firmenname</label>
      <input id="companyName" placeholder="z.B. Müller AG">

      <label>Ansprechperson</label>
      <input id="companyContact" placeholder="Vorname Nachname">

      <label>E-Mail</label>
      <input id="companyEmail" type="email" placeholder="firma@example.ch">

      <label>Telefon</label>
      <input id="companyPhone" placeholder="+41 ...">

      <label>Adresse</label>
      <input id="companyAddress" placeholder="Strasse, PLZ Ort">

      <label>Anzahl Benutzerplätze</label>
      <input
        id="companyLimit"
        type="number"
        min="1"
        value="50"
      >

      <br>

      <button onclick="createCompany()">
        💾 Firma erstellen
      </button>

      <button
        onclick="showCompanies()"
        style="margin-left:10px;background:#666;"
      >
        Zurück
      </button>

      <p id="companyMessage" style="margin-top:20px;"></p>

    </div>
  `;
}


async function createCompany() {

  if (!(await requireAdmin())) return;

  const companyName =
    document.getElementById("companyName").value.trim();

  const contactName =
    document.getElementById("companyContact").value.trim();

  const email =
    document.getElementById("companyEmail").value.trim();

  const phone =
    document.getElementById("companyPhone").value.trim();

  const address =
    document.getElementById("companyAddress").value.trim();

  const userLimit =
    parseInt(document.getElementById("companyLimit").value, 10);

  const message =
    document.getElementById("companyMessage");

  if (!companyName) {
    message.style.color = "red";
    message.textContent = "Bitte Firmenname eingeben.";
    return;
  }

  if (!userLimit || userLimit < 1) {
    message.style.color = "red";
    message.textContent = "Bitte eine gültige Benutzerzahl eingeben.";
    return;
  }

  try {

    const { data, error } = await db
      .from("companies")
      .insert({
        company_name: companyName,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        user_limit: userLimit,
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;

    message.style.color = "green";
    message.textContent =
      "✅ Firma erfolgreich erstellt.";

    setTimeout(() => {
      showCompanyDetails(data.id);
    }, 700);

  } catch (error) {

    message.style.color = "red";
    message.textContent =
      "Fehler: " + error.message;
  }
}


async function showCompanyDetails(companyId) {

  if (!(await requireAdmin())) return;

  content.innerHTML = `
    <div class="card">
      <h2>🏢 Firma</h2>
      <p>Firmendaten werden geladen...</p>
    </div>
  `;

  try {

    const { data: company, error } = await db
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error) throw error;

    const { data: members, error: membersError } = await db
      .from("company_members")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (membersError) throw membersError;

    const memberList = members || [];

    let rows = "";

    memberList.forEach((member, index) => {

      rows += `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeCompanyHtml(member.full_name || "-")}</td>
          <td>${escapeCompanyHtml(member.email || "-")}</td>
          <td>
            ${
              member.status === "active"
                ? "🟢 Aktiv"
                : "🟡 " + escapeCompanyHtml(member.status)
            }
          </td>
        </tr>
      `;
    });

    if (!rows) {
      rows = `
        <tr>
          <td colspan="4">
            Noch keine Benutzer zugeordnet.
          </td>
        </tr>
      `;
    }

    content.innerHTML = `
      <div class="card">

        <button
          onclick="showCompanies()"
          style="background:#666;margin-bottom:20px;"
        >
          ← Zurück zu Firmen
        </button>

        <h2>🏢 ${escapeCompanyHtml(company.company_name)}</h2>

        <div class="statbox">

          <div class="stat">
            Benutzerplätze
            <h3>${company.user_limit}</h3>
          </div>

          <div class="stat">
            Zugeordnet
            <h3>${memberList.length}</h3>
          </div>

          <div class="stat">
            Frei
            <h3>${Math.max(
              0,
              company.user_limit - memberList.length
            )}</h3>
          </div>

        </div>

        <p><strong>Kontakt:</strong>
          ${escapeCompanyHtml(company.contact_name || "-")}
        </p>

        <p><strong>E-Mail:</strong>
          ${escapeCompanyHtml(company.email || "-")}
        </p>

        <p><strong>Telefon:</strong>
          ${escapeCompanyHtml(company.phone || "-")}
        </p>

        <p><strong>Adresse:</strong>
          ${escapeCompanyHtml(company.address || "-")}
        </p>

        <br>

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
  <h3>👥 Benutzer der Firma</h3>

  <button onclick="showAddCompanyUser('${company.id}')">
    ➕ Benutzer hinzufügen
  </button>
</div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>

      </div>
    `;

  } catch (error) {

    content.innerHTML = `
      <div class="card">
        <h2>Fehler</h2>
        <p style="color:red;">
          ${escapeCompanyHtml(error.message)}
        </p>
        <br>
        <button onclick="showCompanies()">
          ← Zurück
        </button>
      </div>
    `;
  }
}

function showAddCompanyUser(companyId) {

  if (!requireAdmin()) return;

  content.innerHTML = `
    <div class="card">

      <button
        onclick="showCompanyDetails('${companyId}')"
        style="background:#666;margin-bottom:20px;"
      >
        ← Zurück zur Firma
      </button>

      <h2>👤 Benutzer hinzufügen</h2>

      <label>Name</label>
      <input
        id="companyUserName"
        placeholder="Vorname Nachname"
      >

      <label>E-Mail</label>
      <input
        id="companyUserEmail"
        type="email"
        placeholder="benutzer@example.ch"
      >

      <label>Telefon</label>
      <input
        id="companyUserPhone"
        placeholder="+41 ..."
      >

      <br>

      <button onclick="saveCompanyUser('${companyId}')">
        💾 Benutzer hinzufügen
      </button>

      <button
        onclick="showCompanyDetails('${companyId}')"
        style="margin-left:10px;background:#666;"
      >
        Abbrechen
      </button>

      <p id="companyUserMessage" style="margin-top:20px;"></p>

    </div>
  `;
}


async function saveCompanyUser(companyId) {

  if (!(await requireAdmin())) return;

  const name =
    document.getElementById("companyUserName").value.trim();

  const email =
    document.getElementById("companyUserEmail").value.trim();

  const phone =
    document.getElementById("companyUserPhone").value.trim();

  const message =
    document.getElementById("companyUserMessage");

  if (!name) {
    message.style.color = "red";
    message.textContent = "Bitte Namen eingeben.";
    return;
  }

  if (!email) {
    message.style.color = "red";
    message.textContent = "Bitte E-Mail eingeben.";
    return;
  }

  try {

    const { error } = await db
      .from("company_members")
      .insert({
        company_id: companyId,
        full_name: name,
        email: email,
        phone: phone || null,
        status: "pending"
      });

    if (error) throw error;

    message.style.color = "green";
    message.textContent =
      "✅ Benutzer erfolgreich hinzugefügt.";

    setTimeout(() => {
      showCompanyDetails(companyId);
    }, 700);

  } catch (error) {

    message.style.color = "red";
    message.textContent =
      "Fehler: " + error.message;
  }
}
function escapeCompanyHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
