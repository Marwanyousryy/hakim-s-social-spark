import { useState } from "react";
import { Upload, ImageOff, Sparkles, Copy, Save, Calendar, X, Instagram, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PLATFORMS = [
  { id: "Instagram", icon: Instagram },
  { id: "TikTok", icon: Sparkles },
  { id: "Twitter", icon: Twitter },
  { id: "Facebook", icon: Facebook },
];
const TONES = ["رسمي", "ودود", "مضحك", "احترافي", "عاطفي"];
const LANGS = ["عربي مصري", "عربي خليجي", "إنجليزي"];

const SAMPLE_HASHTAGS = ["#مطعمنا", "#اكل_بيتي", "#مصر", "#الرياض", "#توصيل", "#عروض"];

const CreateContent = () => {
  const { user } = useAuth();
  const [skipMedia, setSkipMedia] = useState(false);
  const [media, setMedia] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState("ودود");
  const [lang, setLang] = useState("عربي مصري");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ caption: string; tags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const togglePlatform = (id: string) => {
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setMedia(f);
  };

  const generate = () => {
    if (!description.trim()) { toast.error("اكتب وصف بسيط للمنتج أو الحدث"); return; }
    if (platforms.length === 0) { toast.error("اختر منصة واحدة على الأقل"); return; }
    setGenerating(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        caption: `✨ ${description}\n\nاستمتع بأفضل ${tone === "مضحك" ? "تجربة ممتعة" : "تجربة مميزة"} مع أحدث عروضنا! تواصل معنا الآن واحجز مكانك 💛`,
        tags: SAMPLE_HASHTAGS,
      });
      setGenerating(false);
      toast.success("تم توليد المحتوى ✨");
    }, 1400);
  };

  const removeTag = (t: string) => setResult((r) => r ? { ...r, tags: r.tags.filter((x) => x !== t) } : r);

  const copyCaption = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(`${result.caption}\n\n${result.tags.join(" ")}`);
    toast.success("تم النسخ 📋");
  };

  const saveDraft = async (status: "draft" | "scheduled") => {
    if (!result || !user) return;
    setSaving(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      platform: platforms.join(", "),
      content: result.caption,
      hashtags: result.tags,
      status,
      scheduled_at: status === "scheduled" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
    });
    setSaving(false);
    if (error) { toast.error("حصلت مشكلة، جرب تاني"); return; }
    toast.success(status === "draft" ? "تم الحفظ كمسودة 💾" : "تمت الجدولة 📅");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">إنشاء محتوى</h1>
        <p className="mt-1 text-sm text-foreground/60">خليك واضح في الوصف، وحاكم هيتولى الباقي</p>
      </div>

      {/* Step 1: Media */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold">١. الميديا</h2>
        {skipMedia ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-gold/30 bg-gold/5 p-4">
            <div className="flex items-center gap-2 text-sm text-gold"><ImageOff className="h-4 w-4" /> هتولّد بدون ميديا</div>
            <button onClick={() => setSkipMedia(false)} className="text-xs text-foreground/60 hover:text-foreground">إلغاء</button>
          </div>
        ) : (
          <>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-foreground/15 bg-foreground/[0.02] py-10 px-4 text-center transition hover:border-gold/40"
            >
              <Upload className="mb-3 h-8 w-8 text-foreground/40" />
              <div className="text-sm text-foreground/80">{media ? media.name : "اسحب وأفلت صورة أو فيديو هنا"}</div>
              <div className="mt-1 text-xs text-foreground/50">أو اضغط للاختيار من جهازك</div>
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setMedia(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={() => { setMedia(null); setSkipMedia(true); }} className="mt-3 text-xs text-gold hover:underline">
              إنشاء بدون ميديا
            </button>
          </>
        )}
      </section>

      {/* Step 2: Context */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6 space-y-5">
        <h2 className="font-display text-lg font-bold">٢. سياق البيزنس</h2>
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">وصف المنتج أو الخدمة أو الحدث</label>
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
                    on ? "bg-gold/15 text-gold ring-gold/40" : "bg-foreground/5 text-foreground/70 ring-foreground/15 hover:bg-foreground/10"
                  }`}
                >
                  <p.icon className="h-4 w-4" />
                  {p.id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">نبرة الكلام</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50">
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">اللغة</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50">
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Step 3: Generate */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold">٣. الذكاء الاصطناعي</h2>
        <button
          onClick={generate}
          disabled={generating}
          className="w-full rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3.5 font-bold text-background shadow-gold transition hover:scale-[1.01] disabled:opacity-60"
        >
          {generating ? (
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" /> جاري التوليد...</span>
          ) : (
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> 🪄 ولّد المحتوى بالذكاء الاصطناعي</span>
          )}
        </button>

        {result && (
          <div className="mt-6 space-y-5 rounded-xl border border-gold/20 bg-gold/[0.03] p-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gold">الكابشن المقترح</label>
              <textarea
                value={result.caption}
                onChange={(e) => setResult({ ...result, caption: e.target.value })}
                rows={5}
                className="w-full resize-none rounded-xl border border-foreground/15 bg-background/50 p-4 text-sm outline-none focus:border-gold/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-gold">الهاشتاجات</label>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => removeTag(t)}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-3 py-1 text-xs hover:bg-destructive/20 hover:text-destructive"
                  >
                    {t} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-foreground/10 bg-background/40 p-3 text-xs text-foreground/70">
              ⏰ <span className="font-bold text-gold">أفضل وقت للنشر:</span> اليوم الساعة 8:00 مساءً
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={copyCaption} className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5">
                <Copy className="h-4 w-4" /> نسخ
              </button>
              <button disabled={saving} onClick={() => saveDraft("draft")} className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5 disabled:opacity-60">
                <Save className="h-4 w-4" /> حفظ كمسودة
              </button>
              <button disabled={saving} onClick={() => saveDraft("scheduled")} className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-2 text-sm text-gold ring-1 ring-gold/30 hover:bg-gold/20 disabled:opacity-60">
                <Calendar className="h-4 w-4" /> جدولة
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CreateContent;
