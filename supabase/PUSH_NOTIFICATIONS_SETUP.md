# Native iOS and Android chat push setup

The chat RPC remains unchanged, including its limit of five messages per sender
per conversation in each 24-hour period. The client invokes `send-chat-push`
only after that RPC returns `allowed: true`; the Edge Function authenticates the
sender and confirms the inserted row before sending an APNs or FCM alert. Alerts
contain no chat text. The existing five-message-per-24-hour conversation limit
is unchanged.

## Supabase

Link the repository to the PingCar project, apply the migration, and deploy the
function:

```powershell
supabase link --project-ref uvmkhqzfsgvicacvgskf
supabase db push
supabase functions deploy send-chat-push
```

In Supabase Dashboard → Edge Functions → Secrets, set these values:

- `APNS_KEY_ID`: Key ID for the Apple Push Notifications key.
- `APNS_TEAM_ID`: Apple Developer Team ID (`JSQN8FQTPV`).
- `APNS_PRIVATE_KEY`: complete contents of the downloaded `.p8` key.
- `APNS_BUNDLE_ID`: `ch.pingcar.app`.
- `APNS_ENVIRONMENT`: `production` for TestFlight and App Store builds.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete Firebase service-account JSON
  for the same Firebase project used by the Android app. Keep its private key
  only in Supabase Secrets; never commit or paste it into chat.

Keep the `.p8` private key in Supabase Secrets only. Supabase supplies the
function's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` environment variables.

## Apple and Bitrise

In the Apple Developer account, enable **Push Notifications** for App ID
`ch.pingcar.app`. Then refresh the App Store provisioning profile used by
Bitrise so it includes the `aps-environment` entitlement. The Xcode project
contains the entitlement and uses development for Debug and production for
Release.

The next app version is set to `1.0.2` and the repository Bitrise workflow's
Apple build number is set to `85`. If the Bitrise app uses its separately saved
Workflow Editor configuration, update that Prepare step to version `1.0.2` and
build number `85` as well.

## Device setup and behavior

After the app update is installed, each signed-in iPhone user must open the
dashboard and tap **Enable notifications**, then allow notifications in iOS.
The device token is saved against that signed-in account and deleted before
logout completes. Tapping a chat alert opens that conversation. If the app is
uninstalled, APNs cannot deliver to it; invalid tokens are removed when Apple
reports them. SMS fallback requires a separate SMS provider and verified phone
numbers.

For Android, register an Android app in the Firebase project `pingcar` with
package name `ch.pingcar.app`, download its `google-services.json`, and place it
at `android/app/google-services.json` before building. After installing the
updated Android app, sign in, open the dashboard, tap **Enable notifications**,
and allow notifications. The app registers its native FCM token and saves it
with the account. Tapping a chat notification opens that conversation.
