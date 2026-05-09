import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 30,
  medium: 80,
  pro: Number.POSITIVE_INFINITY,
};

const SYSTEM_PROMPT = `أنت خبير سوشيال ميديا متخصص في السوق المصري والخليجي.
مهمتك إنشاء محتوى احترافي وجذاب للبيزنس.
رد دائماً بـ JSON فقط بدون أي نص خارجه.`;

function buildUserPrompt(input: {
  businessType: string;
  description: string;
  platform: string[] | string;
  tone: string;
  language: string;
}) {
  const platform = Array.isArray(input.platform)
    ? input.platform.join(", ")
    : input.platform;
  return `اكتب محتوى سوشيال ميديا لـ: ${input.businessType}
الوصف: ${input.description}
المنصة: ${platform}
نبرة الكلام: ${input.tone}
اللغة: ${input.language}

أرجع JSON بالشكل ده بالظبط:
{
  "caption": "الكابشن الكامل هنا",
  "hashtags": ["هاشتاج1", "هاشتاج2", "هاشتاج3", "هاشتاج4", "هاشتاج5", "هاشتاج6", "هاشتاج7", "هاشتاج8", "هاشتاج9", "هاشتاج10"],
  "bestTime": "أفضل وقت للنشر",
  "tips": "نصيحة سريعة لزيادة التفاعل"
}`;
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("تعذر قراءة رد الذكاء الاصطناعي");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { description, platform, tone, language, businessType } = body ?? {};
    if (!description || !platform || !tone || !language || !businessType) {
      return new Response(
        JSON.stringify({ error: "البيانات ناقصة، تأكد من ملء كل الحقول" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Length limits to prevent prompt-injection abuse and resource exhaustion
    const platformStr = Array.isArray(platform) ? platform.join(",") : String(platform);
    const checks: Array<[string, unknown, number]> = [
      ["description", description, 500],
      ["businessType", businessType, 100],
      ["tone", tone, 50],
      ["language", language, 30],
      ["platform", platformStr, 200],
    ];
    for (const [name, val, max] of checks) {
      if (typeof val !== "string" && !Array.isArray(val)) {
        return new Response(
          JSON.stringify({ error: `قيمة ${name} غير صحيحة` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const len = typeof val === "string" ? val.length : platformStr.length;
      if (len > max) {
        return new Response(
          JSON.stringify({ error: `الحقل ${name} طويل جداً (الحد الأقصى ${max} حرف)` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Plan + usage check
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    const plan = (profile?.plan as string) ?? "free";
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("content_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    if ((count ?? 0) >= limit) {
      return new Response(
        JSON.stringify({
          error: "limit_reached",
          plan,
          limit,
          used: count ?? 0,
          message:
            "وصلت للحد الأقصى للباقة المجانية\nترقّي دلوقتي وولّد محتوى بلا حدود! 💎",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "مفتاح الذكاء الاصطناعي غير مهيأ" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userPrompt = buildUserPrompt({
      businessType,
      description,
      platform,
      tone,
      language,
    });

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "كتر الطلبات، استنى شوية وجرب تاني" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "الرصيد خلص، رجاءً اشحن باقتك من Lovable" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "حصلت مشكلة في توليد المحتوى، جرّب تاني بعد شوية" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiPayload = await aiRes.json();
    const text: string = aiPayload?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(text);

    // Track usage (best-effort)
    await supabase.from("content_generations").insert({ user_id: userId });

    return new Response(
      JSON.stringify({
        caption: parsed.caption ?? "",
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        bestTime: parsed.bestTime ?? "",
        tips: parsed.tips ?? "",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("generate-content error", e);
    return new Response(
      JSON.stringify({ error: "حصلت مشكلة غير متوقعة، جرّب تاني" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
