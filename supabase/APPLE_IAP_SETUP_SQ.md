# Lidhja e abonimeve Apple në PingCar

Këto ndryshime janë për branch-in `ios-app-fix`. Bitrise nuk niset nga ky udhëzim; build-in e nis vetë kur të jesh gati. Workflow-i e vendos build number në **79** dhe kopjon `www` në app-in iOS.

## 1. Krijo tabelën e abonimeve Apple në Supabase

Në Supabase Dashboard, te **SQL Editor → New query**, hape dhe ekzekuto skedarin:

`supabase/migrations/20261017000100_apple_iap_subscriptions.sql`

Tabela `apple_iap_subscriptions` mbahet veç nga tabela ekzistuese `subscriptions`, që regjistrat Stripe dhe administrimi aktual të mos ndryshohen. Përdoruesit mund të lexojnë vetëm abonimin e llogarisë së tyre; shkrimin e kryen vetëm funksioni server-side.

## 2. Konfiguro certifikatat rrënjë të Apple si secret

Shkarko certifikatat rrënjë nga [Apple PKI](https://www.apple.com/certificateauthority/). Ruaji përkohësisht në një folder lokal, p.sh. `apple-roots`, me skedarët `.cer` të Apple Root CA. Mos i vendos certifikatat apo vlerën e secret-it në Git ose në chat.

Në PowerShell, nga folderi i projektit pasi të kesh instaluar e hyrë në Supabase CLI:

```powershell
supabase login
supabase link --project-ref uvmkhqzfsgvicacvgskf
$appleRootFiles = Get-ChildItem -LiteralPath .\apple-roots -Filter *.cer
$appleRootBundle = ($appleRootFiles | ForEach-Object { [Convert]::ToBase64String([IO.File]::ReadAllBytes($_.FullName)) }) -join ','
supabase secrets set "APPLE_ROOT_CA_CERTIFICATES_B64=$appleRootBundle"
```

Vlera përmban certifikata publike të Apple të koduara Base64. Çelësi privat `.p8` i App Store Connect nuk nevojitet për këtë verifikim dhe nuk duhet vendosur në app.

## 3. Publiko vetëm funksionin e verifikimit në Supabase

Nga root-i i këtij checkout-i në branch-in `ios-app-fix`, ekzekuto:

```powershell
supabase functions deploy apple-iap-verify
```

Funksioni kërkon sesion të vlefshëm PingCar, verifikon nënshkrimin JWS të Apple, bundle ID `ch.pingcar.app`, produktin, afatin dhe `appAccountToken`-in e lidhur me UUID-në e përdoruesit. Vetëm pas verifikimit ruan abonimin; klienti nuk mund ta aktivizojë vetë statusin.

## 4. Para se ta nisësh build-in në Bitrise

- Kontrollo në App Store Connect që produktet janë saktësisht `ch.pingcar.premium.monthly` dhe `ch.pingcar.premium.yearly`, me çmimet dhe periudhat e sakta.
- Plotëso lokalizimet e emrit/përshkrimit të të dy abonimeve dhe përshkruaj qartë veçoritë që zhbllokohen.
- Shto lidhjen e Privacy Policy te fusha përkatëse në App Store Connect dhe lidhjen standarde EULA në përshkrimin e app-it.
- Sigurohu që të dy abonimet përfshihen me versionin e ri të app-it për shqyrtim.
- Pastaj nise vetë workflow-in `build` në Bitrise. Ai ndërton nga branch-i ku është lidhur Bitrise; kontrollo që ai branch të jetë `ios-app-fix` përpara nisjes.

Pas ngarkimit, provoje blerjen dhe **Restore Purchases** me llogari Sandbox/TestFlight. Në App Review Information vendos udhëzimet dhe llogarinë demo që Apple duhet të përdorë, si dhe shënimin për vendndodhjen e abonimeve dhe Privacy/EULA.
