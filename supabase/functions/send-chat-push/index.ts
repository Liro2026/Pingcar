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
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") || "ch.pingcar.app";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Supabase function secrets are incomplete.");
    return response({ error: "Push service is not configured" }, 503);
  }
  if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
    console.error("APNs secrets are not configured.");
    return response({ error: "Apple push service is not configured" }, 503);
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
      .select("device_token, language")
      .eq("user_id", receiverId);
    if (deviceError) {
      console.error("Could not load push devices:", deviceError.message);
      return response({ error: "Could not load recipient devices" }, 500);
    }
    if (!devices?.length) return response({ sent: 0, reason: "No registered iOS devices" });

    const providerToken = await createProviderToken(apnsKeyId, apnsTeamId, apnsPrivateKey);
    const apnsHost = Deno.env.get("APNS_ENVIRONMENT") === "sandbox"
      ? "https://api.sandbox.push.apple.com"
      : "https://api.push.apple.com";
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
    let sent = 0;
    await Promise.all(devices.map(async ({ device_token, language }) => {
      const payload = {
        aps: {
          alert: { title: "PingCar", body: alertText[language] || alertText.en },
          sound: "default",
        },
        url,
      };
      const result = await fetch(`${apnsHost}/3/device/${device_token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${providerToken}`,
          "apns-topic": bundleId,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
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

    return response({ sent });
  } catch (error) {
    console.error("Chat push failed:", error);
    return response({ error: "Push delivery failed" }, 500);
  }
});
