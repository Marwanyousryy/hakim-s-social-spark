import { useEffect, useRef, useState } from "react";
import {
  Upload,
  ImageOff,
  Sparkles,
  Copy,
  Save,
  Calendar,
  X,
  Instagram,
  Facebook,
  Twitter,
  RefreshCw,
  Clock,
  Lightbulb,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Sparkles },
  { id: "twitter", label: "Twitter", icon: Twitter },
  { id: "facebook", label: "Facebook", icon: Facebook },
];
const TONES = ["ودود", "رسمي", "مضحك", "احترافي", "عاطفي"];
const LANGS = ["عربي مصري", "عربي خليجي", "إنجليزي"];

const LOADING_STAGES = [
  "جاري تحليل المحتوى...",
  "جاري توليد الكابشن...",
  "جاري اختيار الهاشتاجات...",
];

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 30,
  medium: 80,
  pro: Number.POSITIVE_INFINITY,
};

const MEDIA_INPUT_ID = "create-content-media-input";

type GenerationResult = {
  caption: string;
  hashtags: string[];
  bestTime: string;
  tips: string;
};

type GenerateContentResponse = {
  error?: string;
  caption?: string;
  hashtags?: string[];
  bestTime?: string;
  tips?: string;
  message?: string;
};

async function parseFunctionsError(
  error: { message?: string; context?: { json: () => Promise<unknown> } },
): Promise<GenerateContentResponse | null> {
  try {
    const ctx = error.context;
    if (!ctx) return null;
    return (await ctx.json()) as GenerateContentResponse;
  } catch {
    return null;
  }
}

const CreateContent = () => {
  const { user, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const [skipMedia, setSkipMedia] = useState(false);
  const [media, setMedia] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState("ودود");
  const [lang, setLang] = useState("عربي مصري");
  const [businessType, setBusinessType] = useState("أخرى");
  const [userPlan, setUserPlan] = useState("free");
  const [generating, setGenerating] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("business_type, plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.business_type) setBusinessType(data.business_type);
        if (data?.plan) setUserPlan(data.plan);
      });
  }, [user]);

  useEffect(() => {
    if (!generating) return;
    setStageIdx(0);
    const id = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, LOADING_STAGES.length - 1));
    }, 1200);
    return () => clearInterval(id);
  }, [generating]);

  const togglePlatform = (id: string) => {
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setMedia(f);
      setSkipMedia(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setMedia(f);
    if (f) setSkipMedia(false);
  };

  const buildDescriptionForGeneration = () => {
    const base = description.trim();
    if (skipMedia || !media) return base;
    return `${base}\n[مرفق ميديا: ${media.name}]`;
  };

  const checkMonthlyLimit = async (): Promise<boolean> => {
    if (!user) return false;
    const limit = PLAN_LIMITS[userPlan] ?? PLAN_LIMITS.free;
    if (!Number.isFinite(limit)) return false;

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("content_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());

    if (error) return false;
    if ((count ?? 0) >= limit) {
      setLimitOpen(true);
      return true;
    }
    return false;
  };

  const applyGenerationPayload = (payload: GenerateContentResponse | null) => {
    if (!payload) return false;
    if (payload.error === "limit_reached") {
      setLimitOpen(true);
      return true;
    }
    if (payload.error) {
      toast.error(payload.error);
      return true;
    }
    if (payload.caption !== undefined || payload.hashtags !== undefined) {
      setResult({
        caption: payload.caption ?? "",
        hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
        bestTime: payload.bestTime ?? "",
        tips: payload.tips ?? "",
      });
      toast.success("تم توليد المحتوى ✨");
      return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!user || !session?.access_token) {
      toast.error("سجّل دخولك أولاً");
      return;
    }
    if (!description.trim()) {
      toast.error("اكتب وصف بسيط للمنتج أو الحدث");
      return;
    }
    if (platforms.length === 0) {
      toast.error("اختر منصة واحدة على الأقل");
      return;
    }

    if (await checkMonthlyLimit()) return;

    setGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          description: buildDescriptionForGeneration(),
          platform: platforms,
          tone,
          language: lang,
          businessType,
        },
      });

      const payload = (data ?? null) as GenerateContentResponse | null;

      if (applyGenerationPayload(payload)) return;

      if (error) {
        const fromError = await parseFunctionsError(error);
        if (applyGenerationPayload(fromError)) return;
        toast.error(fromError?.error || error.message || "حصلت مشكلة، جرّب تاني");
        return;
      }

      toast.error("حصلت مشكلة، جرّب تاني");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "حصلت مشكلة، جرّب تاني";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const removeTag = (t: string) => {
    setResult((r) => (r ? { ...r, hashtags: r.hashtags.filter((x) => x !== t) } : r));
  };

  const copyCaption = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.caption);
      toast.success("تم نسخ الكابشن 📋");
    } catch {
      toast.error("حصلت مشكلة، جرب تاني");
    }
  };

  const copyHashtags = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.hashtags.join(" "));
      toast.success("تم نسخ الهاشتاجات 📋");
    } catch {
      toast.error("حصلت مشكلة، جرب تاني");
    }
  };

  const saveDraft = async (status: "draft" | "scheduled") => {
    if (!result || !user) return;
    setSaving(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      platform: platforms.join(", "),
      content: result.caption,
      hashtags: result.hashtags,
      status,
      scheduled_at:
        status === "scheduled"
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null,
    });
    setSaving(false);
    if (error) {
      toast.error("حصلت مشكلة، جرب تاني");
      return;
    }
    toast.success(status === "draft" ? "تم الحفظ كمسودة 💾" : "تمت الجدولة 📅");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">إنشاء محتوى</h1>
        <p className="mt-1 text-sm text-foreground/60">
          خليك واضح في الوصف، وحاكم هيتولى الباقي
        </p>
      </div>

      {/* Step 1: Media */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold">١. الميديا</h2>
        {skipMedia ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-gold/30 bg-gold/5 p-4">
            <div className="flex items-center gap-2 text-sm text-gold">
              <ImageOff className="h-4 w-4" /> هتولّد بدون ميديا
            </div>
            <button
              type="button"
              onClick={() => setSkipMedia(false)}
              className="text-xs text-foreground/60 hover:text-foreground"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <>
            <label
              htmlFor={MEDIA_INPUT_ID}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-foreground/15 bg-foreground/[0.02] py-10 px-4 text-center transition hover:border-gold/40"
            >
              <Upload className="mb-3 h-8 w-8 text-foreground/40" />
              <div className="text-sm text-foreground/80">
                {media ? media.name : "اسحب وأفلت صورة أو فيديو هنا"}
              </div>
              <div className="mt-1 text-xs text-foreground/50">
                أو اضغط للاختيار من جهازك
              </div>
              <input
                id={MEDIA_INPUT_ID}
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setMedia(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setSkipMedia(true);
              }}
              className="mt-3 text-xs text-gold hover:underline"
            >
              إنشاء بدون ميديا
            </button>
          </>
        )}
      </section>

      {/* Step 2: Context */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6 space-y-5">
        <h2 className="font-display text-lg font-bold">٢. سياق البيزنس</h2>
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">
            وصف المنتج أو الخدمة أو الحدث
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="مثال: عرض جديد على البيتزا الإيطالية مع كل أوردر تحلية مجاناً..."
            className="w-full resize-none rounded-xl border border-foreground/15 bg-foreground/5 p-4 text-sm outline-none transition focus:border-gold/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-foreground/80">المنصات</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ring-1 ${
                    on
                      ? "bg-gold/15 text-gold ring-gold/40"
                      : "bg-foreground/5 text-foreground/70 ring-foreground/15 hover:bg-foreground/10"
                  }`}
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">نبرة الكلام</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">اللغة</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50"
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Step 3: Generate */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold">٣. الذكاء الاصطناعي</h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3.5 font-bold text-background shadow-gold transition hover:scale-[1.01] disabled:opacity-60"
        >
          {generating ? (
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              {LOADING_STAGES[stageIdx]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> 🪄 ولّد المحتوى بالذكاء الاصطناعي
            </span>
          )}
        </button>

        {generating && (
          <div className="mt-5 space-y-2">
            {LOADING_STAGES.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  i < stageIdx
                    ? "border-gold/30 bg-gold/5 text-gold/80"
                    : i === stageIdx
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-foreground/10 bg-foreground/5 text-foreground/40"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    i <= stageIdx ? "bg-gold" : "bg-foreground/20"
                  } ${i === stageIdx ? "animate-pulse" : ""}`}
                />
                {s}
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-5 rounded-xl border border-gold/20 bg-gold/[0.03] p-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-bold text-gold">الكابشن المقترح</label>
                <button
                  type="button"
                  onClick={copyCaption}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground/70 hover:bg-foreground/10"
                >
                  <Copy className="h-3 w-3" /> نسخ
                </button>
              </div>
              <textarea
                value={result.caption}
                onChange={(e) => setResult({ ...result, caption: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-xl border border-foreground/15 bg-background/50 p-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-bold text-gold">الهاشتاجات</label>
                <button
                  type="button"
                  onClick={copyHashtags}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground/70 hover:bg-foreground/10"
                >
                  <Copy className="h-3 w-3" /> نسخ الكل
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTag(t)}
                    className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs text-gold ring-1 ring-gold/30 hover:bg-destructive/20 hover:text-destructive hover:ring-destructive/30"
                  >
                    {t} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            {result.bestTime && (
              <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-background/40 p-3 text-xs text-foreground/80">
                <Clock className="h-4 w-4 text-gold" />
                <span className="font-bold text-gold">أفضل وقت للنشر:</span>
                <span>{result.bestTime}</span>
              </div>
            )}

            {result.tips && (
              <div className="flex items-start gap-2 rounded-xl border border-gold/15 bg-gold/[0.04] p-3 text-xs text-foreground/80">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <div>
                  <div className="font-bold text-gold">نصيحة سريعة</div>
                  <div className="mt-0.5 leading-relaxed">{result.tips}</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" /> أعد التوليد 🔄
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => saveDraft("draft")}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> حفظ كمسودة
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => saveDraft("scheduled")}
                className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm text-gold ring-1 ring-gold/30 hover:bg-gold/20 disabled:opacity-60"
              >
                <Calendar className="h-4 w-4" /> جدولة
              </button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent className="border-gold/30 bg-background sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/30">
              <Crown className="h-7 w-7 text-gold" />
            </div>
            <DialogTitle className="text-center font-display text-xl">
              وصلت للحد الأقصى للباقة المجانية
            </DialogTitle>
            <DialogDescription className="text-center">
              ترقّي دلوقتي وولّد محتوى بلا حدود! 💎
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            <Link
              to="/dashboard/package"
              onClick={() => setLimitOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3 font-bold text-background shadow-gold transition hover:scale-[1.01]"
            >
              <Sparkles className="h-4 w-4" /> ترقية الباقة
            </Link>
            <button
              type="button"
              onClick={() => setLimitOpen(false)}
              className="text-xs text-foreground/60 hover:text-foreground"
            >
              لاحقاً
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateContent;
