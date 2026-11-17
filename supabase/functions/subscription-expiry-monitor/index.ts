import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase service configuration is missing." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("id,email,plan_name,amount,expires_at,status,renewal_email_sent_at,premium_blocked_at")
      .eq("is_paid_subscription", true)
      .or("status.eq.active,and(status.eq.inactive,premium_blocked_at.not.is.null)")
      .not("expires_at", "is", null)
      .lte("expires_at", new Date().toISOString());

    if (error) throw error;

    const results = { checked: subscriptions?.length ?? 0, emailed: 0, blocked: 0, errors: 0 };
    const now = Date.now();

    for (const subscription of subscriptions ?? []) {
      const expiresAt = new Date(subscription.expires_at).getTime();
      const graceEndsAt = expiresAt + 7 * 24 * 60 * 60 * 1000;

      if (!subscription.renewal_email_sent_at && subscription.email) {
        const expiryText = new Date(subscription.expires_at).toLocaleDateString("de-CH", {
          timeZone: "Europe/Zurich",
        });
        const graceText = new Date(graceEndsAt).toLocaleDateString("de-CH", {
          timeZone: "Europe/Zurich",
        });
        const message = [
          "Hallo,",
          "",
          "dein PingCar-Abonnement ist abgelaufen. Du kannst dein Konto noch sieben Tage bis zum " + graceText + " weiter nutzen.",
          "",
          "Um dein Abonnement zu verlängern, antworte bitte auf diese E-Mail oder kontaktiere uns unter https://pingcar.ch/contact.html.",
          "Nach Ablauf der Kulanzzeit werden die Premium-Funktionen deaktiviert.",
          "",
          "Ablaufdatum: " + expiryText,
          "Plan: " + (subscription.plan_name || "PingCar Premium"),
          "",
          "Dein PingCar Team",
        ].join("\n");

        const { data: mailData, error: mailError } = await supabase.functions.invoke("send-email", {
          body: {
            to: subscription.email,
            subject: "Dein PingCar-Abonnement ist abgelaufen – 7 Tage Zeit zur Verlängerung",
            message,
          },
        });

        if (!mailError && !mailData?.error) {
          const { error: markError } = await supabase
            .from("subscriptions")
            .update({ renewal_email_sent_at: new Date().toISOString() })
            .eq("id", subscription.id)
            .is("renewal_email_sent_at", null);
          if (markError) {
            console.error("Could not mark renewal email as sent", subscription.id, markError);
            results.errors++;
          } else {
            results.emailed++;
          }
        } else {
          console.error("Renewal email failed", subscription.id, mailError || mailData?.error);
          results.errors++;
        }
      }

      if (now >= graceEndsAt && subscription.status === "active") {
        const { error: blockError } = await supabase
          .from("subscriptions")
          .update({ status: "inactive", premium_blocked_at: new Date().toISOString() })
          .eq("id", subscription.id)
          .eq("status", "active")
          .eq("is_paid_subscription", true);

        if (blockError) {
          console.error("Could not deactivate expired subscription", subscription.id, blockError);
          results.errors++;
        } else {
          results.blocked++;
        }
      }
    }

    return json({ ok: true, ...results });
  } catch (error) {
    console.error("Subscription expiry monitor failed", error);
    return json({ error: "Subscription expiry processing failed." }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
