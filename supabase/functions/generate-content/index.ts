/// <reference path="../deno.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Handle CORS OPTIONS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "مفتاح الذكاء الاصطناعي غير مهيأ في السيرفر" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const { description, platform, tone, language, businessType } = await req.json();

    // 3. Define Prompts
    const systemPrompt = `أنت خبير محترف في إدارة وسائل التواصل الاجتماعي وصناعة المحتوى التسويقي المبتكر باللغة العربية.`;
    
    // Handle platform as array or string
    const platformStr = Array.isArray(platform) ? platform.join(", ") : platform;
    const userPrompt = `قم بإنشاء محتوى لمنصة ${platformStr}. الوصف: ${description}. نوع العمل: ${businessType}. نبرة الصوت: ${tone}. اللغة المطلوبة: ${language}.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash/generateContent?key=${GEMINI_API_KEY}&prompt=${encodeURIComponent(userPrompt)}`;
    
    console.log("Sending bulletproof JSON to Gemini...");
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemPrompt}\n\nالسياق والمطلوب:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API Direct Error:", result);
      return new Response(
        JSON.stringify({ error: "فشل جيمني في توليد المحتوى", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Safe Extract Response Text
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return new Response(
      JSON.stringify({ content: generatedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Global Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ داخلي في السيرفر", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
