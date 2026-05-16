const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APP_BASE =
  (Deno.env.get("APP_URL") || "https://hakim-s-social-spark.lovable.app").replace(/\/$/, "");

function parseSuccess(url: URL, body: Record<string, unknown> | null): boolean {
  const querySuccess = url.searchParams.get("success");
  if (querySuccess !== null) {
    return querySuccess === "true" || querySuccess === "1";
  }

  if (body) {
    const obj = (body.obj as Record<string, unknown> | undefined) ?? body;
    const value = obj.success;
    if (value !== undefined && value !== null) {
      return value === true || value === "true" || value === "1";
    }
  }

  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const body =
      req.method === "POST"
        ? ((await req.json().catch(() => null)) as Record<string, unknown> | null)
        : null;

    const success = parseSuccess(url, body);
    const paymentStatus = success ? "success" : "failed";
    const redirectUrl = `${APP_BASE}/dashboard?payment=${paymentStatus}`;

    console.log("Paymob response callback", {
      method: req.method,
      success,
      redirectUrl,
    });

    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("paymob-response-webhook error:", error);
    return Response.redirect(`${APP_BASE}/dashboard?payment=failed`, 302);
  }
});
