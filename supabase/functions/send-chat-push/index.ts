import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToDer(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function createProviderToken(keyId: string, teamId: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: keyId })));
  const claims = base64Url(new TextEncoder().encode(JSON.stringify({ iss: teamId, iat: now })));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  ));
  return `${signingInput}.${base64Url(signature)}`;
}

function base64UrlText(value: string) {
  return base64Url(new TextEncoder().encode(value));
}

async function createFirebaseAccessToken(serviceAccountJson: string) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlText(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64UrlText(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const privateKeyDer = pemToDer(serviceAccount.private_key);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  ));
  const assertion = `${signingInput}.${base64Url(signature)}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.access_token) {
    throw new Error(`Firebase OAuth failed (${tokenResponse.status})`);
  }
  return { accessToken: tokenBody.access_token as string, projectId: serviceAccount.project_id as string };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "");
  if (!accessToken) return response({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apnsKeyId = Deno.env.get("APNS_KEY_ID");
  const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
  const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY");
  const firebaseServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") || "ch.pingcar.app";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Supabase function secrets are incomplete.");
    return response({ error: "Push service is not configured" }, 503);
  }
  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData.user) return response({ error: "Invalid session" }, 401);

    const body = await request.json();
    const conversationId = String(body.conversation_id || "");
    const senderId = String(body.sender_id || "");
    const receiverId = String(body.receiver_id || "");
    const messageText = String(body.message || "").trim();
    const qrCode = String(body.qr_code || "");

    if (!conversationId || !senderId || !receiverId || !messageText || senderId !== authData.user.id) {
      return response({ error: "Invalid message notification request" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: messageRow, error: messageError } = await admin
      .from("messages")
      .select("id, created_at")
      .eq("conversation_id", conversationId)
      .eq("sender_id", senderId)
      .eq("receiver_id", receiverId)
      .eq("message", messageText)
      .gte("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (messageError) {
      console.error("Could not verify chat message:", messageError.message);
      return response({ error: "Could not verify sent message" }, 500);
    }
    if (!messageRow) return response({ error: "Message was not found" }, 404);

    await admin.from("push_message_dispatches")
      .delete()
      .lt("created_at", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());
    const { error: claimError } = await admin.from("push_message_dispatches")
      .insert({ message_id: String(messageRow.id) });
    if (claimError?.code === "23505") {
      return response({ sent: 0, reason: "Notification already handled for this message" });
    }
    if (claimError) {
      console.error("Could not claim push dispatch:", claimError.message);
      return response({ error: "Could not queue notification" }, 500);
    }

    const { data: devices, error: deviceError } = await admin
      .from("push_devices")
      .select("device_token, language, platform")
      .eq("user_id", receiverId);
    if (deviceError) {
      console.error("Could not load push devices:", deviceError.message);
      return response({ error: "Could not load recipient devices" }, 500);
    }
    const { data: webDevices, error: webDeviceError } = await admin
      .from("device_tokens")
      .select("fcm_token")
      .eq("user_id", receiverId);
    if (webDeviceError) {
      console.error("Could not load web push devices:", webDeviceError.message);
      return response({ error: "Could not load recipient devices" }, 500);
    }
    const allDevices = [
      ...(devices || []),
      ...(webDevices || []).filter((device) => device.fcm_token).map((device) => ({
        device_token: device.fcm_token,
        language: "en",
        platform: "fcm_web",
      })),
    ];
    if (!allDevices.length) return response({ sent: 0, reason: "No registered push devices" });

    const hasIosDevices = allDevices.some((device) => device.platform === "ios");
    const hasAndroidDevices = allDevices.some((device) => device.platform !== "ios");
    if (hasIosDevices && (!apnsKeyId || !apnsTeamId || !apnsPrivateKey)) {
      console.error("APNs secrets are not configured.");
      return response({ error: "Apple push service is not configured" }, 503);
    }
    if (hasAndroidDevices && !firebaseServiceAccount) {
      console.error("Firebase service account is not configured.");
      return response({ error: "Android push service is not configured" }, 503);
    }

    const apnsProviderToken = hasIosDevices
      ? await createProviderToken(apnsKeyId!, apnsTeamId!, apnsPrivateKey!)
      : null;
    const apnsHost = Deno.env.get("APNS_ENVIRONMENT") === "sandbox"
      ? "https://api.sandbox.push.apple.com"
      : "https://api.push.apple.com";
    const firebase = hasAndroidDevices
      ? await createFirebaseAccessToken(firebaseServiceAccount!)
      : null;
    const url = `/message.html?conversation_id=${encodeURIComponent(conversationId)}` +
      `&receiver_id=${encodeURIComponent(senderId)}` +
      (qrCode ? `&qr_code=${encodeURIComponent(qrCode)}` : "");
    const alertText: Record<string, string> = {
      de: "Du hast eine neue Nachricht zu deinem Auto.",
      sq: "Keni një mesazh të ri për makinën tuaj.",
      fr: "Vous avez reçu un nouveau message concernant votre voiture.",
      it: "Hai un nuovo messaggio sulla tua auto.",
      en: "You have a new message about your car.",
    };

    const invalidTokens: string[] = [];
    const invalidFcmTokens: string[] = [];
    let sent = 0;
    await Promise.all(allDevices.map(async ({ device_token, language, platform }) => {
      const body = alertText[language] || alertText.en;
      if (platform !== "ios") {
        const result = await fetch(
          `https://fcm.googleapis.com/v1/projects/${firebase!.projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${firebase!.accessToken}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token: device_token,
                notification: { title: "PingCar", body },
                data: { url },
                android: {
                  priority: "HIGH",
                  notification: { channel_id: "chat_messages", sound: "default" },
                },
              },
            }),
          },
        );
        if (result.ok) {
          sent++;
          return;
        }
        const failure = await result.text();
        console.error(`FCM rejected an Android token (${result.status}):`, failure);
        if (result.status === 404 || failure.includes("UNREGISTERED")) {
          if (platform === "fcm_web") invalidFcmTokens.push(device_token);
          else invalidTokens.push(device_token);
        }
        return;
      }

      const result = await fetch(`${apnsHost}/3/device/${device_token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${apnsProviderToken}`,
          "apns-topic": bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          aps: { alert: { title: "PingCar", body }, sound: "default" },
          url,
        }),
      });
      if (result.ok) {
        sent++;
        return;
      }
      const failure = await result.text();
      console.error(`APNs rejected a device token (${result.status}):`, failure);
      if (result.status === 410 || (result.status === 400 && failure.includes("BadDeviceToken"))) {
        invalidTokens.push(device_token);
      }
    }));

    if (invalidTokens.length) {
      await admin.from("push_devices").delete().in("device_token", invalidTokens);
    }
    if (invalidFcmTokens.length) {
      await admin.from("device_tokens").delete().in("fcm_token", invalidFcmTokens);
    }

    return response({ sent });
  } catch (error) {
    console.error("Chat push failed:", error);
    return response({ error: "Push delivery failed" }, 500);
  }
});
