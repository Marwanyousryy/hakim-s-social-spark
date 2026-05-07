import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const obj = body.obj || body;
    const success = obj?.success === true || obj?.success === "true";
    const order = obj?.order || {};
    const merchantOrderId: string = order?.merchant_order_id || "";
    // merchant_order_id format: <userId>_<plan>_<ts>
    const parts = merchantOrderId.split("_");
    const userId = parts[0];
    const plan = parts[1];

    console.log("Webhook received:", { success, merchantOrderId, userId, plan });

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
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
