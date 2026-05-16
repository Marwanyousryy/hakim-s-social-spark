import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Paymob HMAC field order (transaction processed callback)
const HMAC_FIELDS = [
  "amount_cents", "created_at", "currency", "error_occured",
  "has_parent_transaction", "id", "integration_id", "is_3d_secure",
  "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order.id", "owner", "pending",
  "source_data.pan", "source_data.sub_type", "source_data.type", "success",
];

function getPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return "";
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur === null || cur === undefined) return "";
  return String(cur);
}

async function computeHmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: any) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const HMAC_SECRET = Deno.env.get("PAYMOB_HMAC_SECRET");
    if (!HMAC_SECRET) {
      console.error("PAYMOB_HMAC_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const body: any = await req.json();
    const obj = body.obj || body;

    // Paymob sends hmac as query param `hmac` (transaction processed callback)
    // Some integrations also include it in body.
    const providedHmac = url.searchParams.get("hmac") || body.hmac || "";
    if (!providedHmac) {
      console.error("Missing hmac signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = HMAC_FIELDS.map((f) => getPath(obj, f)).join("");
    const expected = await computeHmac(HMAC_SECRET, message);

    if (!timingSafeEqual(expected.toLowerCase(), String(providedHmac).toLowerCase())) {
      console.error("HMAC mismatch");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const success = obj?.success === true || obj?.success === "true";
    const order = obj?.order || {};
    const merchantOrderId: string = order?.merchant_order_id || "";
    const parts = merchantOrderId.split("_");
    const userId = parts[0];
    const plan = parts[1];

    if (!success || !userId || !["basic", "medium", "pro"].includes(plan)) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const start = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error } = await admin
      .from("profiles")
      .update({
        plan,
        plan_start_date: start.toISOString(),
        plan_end_date: end.toISOString(),
        trial_used: true,
      })
      .eq("id", userId);

    if (error) console.error("Profile update error:", error);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error:", e);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
