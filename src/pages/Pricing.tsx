import { Check, X, Flame, ArrowLeft, Gift, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LAUNCH_END = Date.now() + 30 * 24 * 60 * 60 * 1000;

const plans = [
  {
    name: "أساسية",
    price: 99,
    old: 199,
    badge: "سعر الإطلاق",
    popular: false,
    features: [
      { ok: true, label: "30 منشور شهرياً" },
      { ok: true, label: "كابشن بالذكاء الاصطناعي" },
      { ok: true, label: "هاشتاجات مقترحة" },
      { ok: true, label: "منصة واحدة" },
      { ok: false, label: "تحليلات" },
      { ok: false, label: "جدولة تلقائية" },
      { ok: false, label: "رد على كومنتات" },
    ],
  },
  {
    name: "متوسطة",
    price: 199,
    old: 399,
    badge: "الأكثر طلباً 🔥",
    popular: true,
    features: [
      { ok: true, label: "80 منشور شهرياً" },
      { ok: true, label: "كابشن بالذكاء الاصطناعي" },
      { ok: true, label: "هاشتاجات مقترحة" },
      { ok: true, label: "3 منصات" },
      { ok: true, label: "تحليلات أسبوعية" },
      { ok: true, label: "جدولة تلقائية" },
      { ok: false, label: "رد على كومنتات" },
    ],
  },
  {
    name: "برو",
    price: 349,
    old: 699,
    badge: "الأقوى",
    popular: false,
    features: [
      { ok: true, label: "منشورات غير محدودة" },
      { ok: true, label: "كابشن بالذكاء الاصطناعي" },
      { ok: true, label: "هاشتاجات مقترحة" },
      { ok: true, label: "كل المنصات" },
      { ok: true, label: "تحليلات يومية" },
      { ok: true, label: "جدولة تلقائية" },
      { ok: true, label: "رد على كومنتات" },
      { ok: true, label: "دعم أولوية" },
    ],
  },
];

const comparison = [
  { label: "عدد المنشورات شهرياً", values: ["30", "80", "غير محدود"] },
  { label: "كابشن بالذكاء الاصطناعي", values: [true, true, true] },
  { label: "هاشتاجات مقترحة", values: [true, true, true] },
  { label: "عدد المنصات", values: ["1", "3", "كل المنصات"] },
  { label: "التحليلات", values: [false, "أسبوعية", "يومية"] },
  { label: "الجدولة التلقائية", values: [false, true, true] },
  { label: "الرد على الكومنتات", values: [false, false, true] },
  { label: "دعم أولوية", values: [false, false, true] },
];

const faqs = [
  { q: "هل فيه عقد؟", a: "لأ، تقدر تلغي في أي وقت." },
  { q: "إيه طرق الدفع؟", a: "كروت بنكية وفودافون كاش." },
  { q: "هل ممكن أغير باقتي؟", a: "أيوه في أي وقت." },
  { q: "إيه السعر بعد انتهاء التجربة؟", a: "السعر بتاع الباقة اللي اخترتها." },
  { q: "هل بياناتي آمنة؟", a: "أيوه، بنستخدم تشفير كامل." },
];

const useCountdown = (target: number) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s };
};

const Cell = ({ v }: { v: boolean | string }) =>
  typeof v === "boolean" ? (
    v ? <Check className="mx-auto h-5 w-5 text-gold" /> : <X className="mx-auto h-5 w-5 text-foreground/30" />
  ) : (
    <span className="text-sm text-foreground/80">{v}</span>
  );

const Pricing = () => {
  const { d, h, m, s } = useCountdown(LAUNCH_END);

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative overflow-hidden border-b border-gold/30 bg-gradient-to-l from-gold/15 via-gold/10 to-gold/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-3 text-center sm:flex-row sm:justify-between sm:text-right">
          <div className="flex items-center gap-2 text-sm font-bold text-gold sm:text-base">
            <Flame className="h-5 w-5 animate-pulse" />
            <span>🔥 سعر الإطلاق - أول 100 مشترك فقط | السعر هيتضاعف قريباً</span>
          </div>
          <div className="flex items-center gap-1.5 font-display text-sm font-black tabular-nums">
            {[
              { v: d, l: "يوم" },
              { v: h, l: "ساعة" },
              { v: m, l: "دقيقة" },
              { v: s, l: "ثانية" },
            ].map((b) => (
              <div key={b.l} className="rounded-lg bg-background/60 px-2 py-1 ring-1 ring-gold/30">
                <span className="text-gold">{String(b.v).padStart(2, "0")}</span>
                <span className="mr-1 text-[10px] text-foreground/60">{b.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
            <span className="font-display text-lg font-black text-gold">ح</span>
          </div>
          <span className="font-display text-xl font-black tracking-tight">حاكم</span>
        </Link>
        <Link to="/register" className="rounded-full border border-gold/30 px-5 py-2 text-sm text-gold transition hover:bg-gold/10">
          ابدأ مجاناً
        </Link>
      </header>

      {/* Heading */}
      <section className="mx-auto max-w-4xl px-6 pt-8 text-center">
        <h1 className="font-display text-4xl font-black sm:text-5xl">
          باقات تناسب <span className="gradient-gold-text">كل بيزنس</span>
        </h1>
        <p className="mt-4 text-foreground/65">اختار الباقة اللي تناسبك واترقّى أو نزّل في أي وقت</p>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-foreground/[0.02] p-6 transition ${
                p.popular ? "border-gold/60 shadow-gold md:-translate-y-2" : "border-foreground/10 hover:border-gold/30"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] to-[hsl(var(--gold-bright))] px-4 py-1 text-xs font-black text-background shadow-gold">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                {p.badge}
              </div>

              <h3 className="font-display text-2xl font-black">{p.name}</h3>

              <div className="mt-4 flex items-end gap-2">
                <span className="font-display text-5xl font-black gradient-gold-text">{p.price}</span>
                <span className="pb-2 text-foreground/60">جنيه/شهر</span>
              </div>
              <div className="mt-1 text-sm text-foreground/40 line-through">{p.old} جنيه</div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    {f.ok ? (
                      <Check className="h-4 w-4 shrink-0 text-gold" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-foreground/30" />
                    )}
                    <span className={f.ok ? "text-foreground/85" : "text-foreground/40 line-through"}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold transition hover:scale-[1.02] ${
                  p.popular
                    ? "bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] text-background shadow-gold"
                    : "border border-gold/40 text-gold hover:bg-gold/10"
                }`}
              >
                ابدأ دلوقتي
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-5 py-2.5 text-sm font-bold text-gold">
            <Gift className="h-4 w-4" />
            🎁 جرب مجاناً 10 أيام - بدون بطاقة ائتمان
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center font-display text-3xl font-black sm:text-4xl">
          مقارنة <span className="gradient-gold-text">تفصيلية</span>
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/[0.03]">
                <th className="p-4 text-sm font-bold text-foreground/70">الميزة</th>
                {plans.map((p) => (
                  <th key={p.name} className={`p-4 text-center text-sm font-bold ${p.popular ? "text-gold" : "text-foreground/80"}`}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={row.label} className={i % 2 ? "bg-foreground/[0.015]" : ""}>
                  <td className="p-4 text-sm text-foreground/80">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-4 text-center">
                      <Cell v={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-8 text-center font-display text-3xl font-black sm:text-4xl">
          الأسئلة <span className="gradient-gold-text">الشائعة</span>
        </h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 transition open:border-gold/30 open:bg-foreground/[0.04]"
            >
              <summary className="flex cursor-pointer items-center justify-between font-display font-bold">
                {f.q}
                <span className="text-gold transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-8 text-center text-sm text-foreground/40">
        © 2026 حاكم — صُنع بحب لرواد الأعمال العرب
      </footer>
    </div>
  );
};

export default Pricing;
