import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  mid: 50,
  high: Number.POSITIVE_INFINITY,
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

    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
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

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error", geminiRes.status, errText);
      return new Response(
        JSON.stringify({
          error: "حصلت مشكلة في توليد المحتوى، جرّب تاني بعد شوية",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiPayload = await geminiRes.json();
    const text: string =
      aiPayload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
