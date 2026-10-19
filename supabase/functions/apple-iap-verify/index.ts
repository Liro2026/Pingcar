import { Buffer } from "node:buffer";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  Environment,
  SignedDataVerifier,
} from "npm:@apple/app-store-server-library@3.1.0";

const BUNDLE_ID = "ch.pingcar.app";
const APP_APPLE_ID = 6804319719;
const PRODUCTS = new Set([
  "ch.pingcar.premium.monthly",
  "ch.pingcar.premium.yearly",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeUntrustedEnvironment(signedData: string): string | null {
  const parts = signedData.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload.environment === "Sandbox" || payload.environment === "Production"
      ? payload.environment
      : null;
  } catch {
    return null;
  }
}

function getVerifier(environmentName: string): SignedDataVerifier {
  const configuredRoots = Deno.env.get("APPLE_ROOT_CA_CERTIFICATES_B64") ?? "";
  const roots = configuredRoots
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Buffer.from(value, "base64"));
  if (roots.length === 0) throw new Error("Apple root certificates are not configured");

  const environment = environmentName === "Production"
    ? Environment.PRODUCTION
    : Environment.SANDBOX;
  return new SignedDataVerifier(
    roots,
    true,
    environment,
    BUNDLE_ID,
    environment === Environment.PRODUCTION ? APP_APPLE_ID : undefined,
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization") ?? "";
    const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Supabase function keys are not configured");
      return jsonResponse({ error: "Purchase verification is not configured yet." }, 503);
    }

    const signedTransactionInfo = (await request.json())?.signedTransactionInfo;
    if (typeof signedTransactionInfo !== "string" || signedTransactionInfo.length > 64_000) {
      return jsonResponse({ error: "A valid Apple transaction is required." }, 400);
    }

    const untrustedEnvironment = decodeUntrustedEnvironment(signedTransactionInfo);
    if (!untrustedEnvironment) return jsonResponse({ error: "Invalid Apple transaction." }, 400);

    // Purchases may be made before the user creates a PingCar account. When
    // there is no user session, save the Apple-verified entitlement as
    // unclaimed; a later sign-in and Restore Purchases call can link it.
    let authUser: { id: string; email?: string } | null = null;
    if (accessToken && accessToken !== anonKey) {
      const authClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
      if (authError || !authData.user) {
        return jsonResponse({ error: "Your PingCar session has expired. Sign in again." }, 401);
      }
      authUser = authData.user;
    }

    const verifier = getVerifier(untrustedEnvironment);
    const transaction = await verifier.verifyAndDecodeTransaction(signedTransactionInfo);

    if (transaction.bundleId !== BUNDLE_ID || !PRODUCTS.has(transaction.productId ?? "")) {
      return jsonResponse({ error: "This Apple purchase is not a PingCar subscription." }, 400);
    }
    if (transaction.environment !== untrustedEnvironment) {
      return jsonResponse({ error: "Apple transaction environment did not match." }, 400);
    }
    if (!transaction.transactionId || !transaction.originalTransactionId || !transaction.expiresDate) {
      return jsonResponse({ error: "Apple's transaction is missing required subscription information." }, 400);
    }
    if (transaction.appAccountToken &&
        (!authUser || transaction.appAccountToken.toLowerCase() !== authUser.id.toLowerCase())) {
      return jsonResponse({ error: "This purchase is not linked to the currently signed-in PingCar account." }, 403);
    }

    const transactionId = String(transaction.transactionId);
    const originalTransactionId = String(transaction.originalTransactionId);
    const expiresAt = new Date(Number(transaction.expiresDate));
    if (!Number.isFinite(expiresAt.getTime())) return jsonResponse({ error: "Apple returned an invalid expiry date." }, 400);
    const purchaseDate = new Date(Number(transaction.purchaseDate));
    if (!Number.isFinite(purchaseDate.getTime()) || purchaseDate.getTime() > Date.now() + 5 * 60 * 1000) {
      return jsonResponse({ error: "Apple returned an invalid purchase date." }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing, error: lookupError } = await serviceClient
      .from("apple_iap_subscriptions")
      .select("user_id")
      .eq("original_transaction_id", originalTransactionId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.user_id && authUser && existing.user_id !== authUser.id) {
      return jsonResponse({ error: "This Apple subscription is linked to another PingCar account." }, 403);
    }
    if (existing?.user_id && !authUser) {
      return jsonResponse({ error: "Sign in to the PingCar account linked to this subscription, then restore purchases." }, 401);
    }

    const active = expiresAt.getTime() > Date.now() && !transaction.revocationDate;
    const priceMilliunits = typeof transaction.price === "number" ? transaction.price : null;
    const amount = priceMilliunits === null ? null : priceMilliunits / 1000;
    const currency = typeof transaction.currency === "string" ? transaction.currency : null;

    const { error: saveError } = await serviceClient
      .from("apple_iap_subscriptions")
      .upsert({
        user_id: authUser?.id ?? existing?.user_id ?? null,
        email: authUser?.email ?? "",
        product_id: transaction.productId,
        original_transaction_id: originalTransactionId,
        latest_transaction_id: transactionId,
        status: active ? "active" : "inactive",
        expires_at: expiresAt.toISOString(),
        amount,
        currency,
        environment: transaction.environment,
        updated_at: new Date().toISOString(),
      }, { onConflict: "original_transaction_id" });
    if (saveError) throw saveError;

    return jsonResponse({
      active,
      productId: transaction.productId,
      expiresAt: expiresAt.toISOString(),
      status: active ? "active" : "inactive",
    });
  } catch (error) {
    console.error("Apple IAP verification failed:", error);
    return jsonResponse({ error: "Apple could not verify this purchase right now. Please try again." }, 400);
  }
});
