import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  "10 منشورات شهرياً",
  "ربط منصة واحدة",
  "محتوى بالذكاء الاصطناعي",
  "دعم بالعربية",
];

const USAGE = [
  { label: "المنشورات", used: 3, total: 10 },
  { label: "المنصات المربوطة", used: 0, total: 1 },
  { label: "توليد الهاشتاجات", used: 5, total: 50 },
];

const Package = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-3xl font-black sm:text-4xl">باقتي</h1>
      <p className="mt-1 text-sm text-foreground/60">تابع استهلاكك واترقّى لما تحتاج</p>
    </div>

    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-bl from-gold/10 via-transparent to-transparent p-6 sm:p-8">
      <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-gold/15 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="mb-1 text-xs font-bold text-gold">باقتك الحالية</div>
        <h2 className="font-display text-3xl font-black">مجاني</h2>
        <p className="mt-1 text-sm text-foreground/60">ابدأ مجاناً، اترقّى لما يكبر بيزنسك</p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
              <Check className="h-4 w-4 text-gold" />
              {f}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {USAGE.map((u) => {
            const pct = Math.min(100, (u.used / u.total) * 100);
            return (
              <div key={u.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-foreground/70">
                  <span>{u.label}</span>
                  <span>{u.used}/{u.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                  <div className="h-full rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] to-[hsl(var(--gold-bright))]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => toast("الترقية هتتاح قريباً 💎")}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3 font-bold text-background shadow-gold transition hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          ترقية الباقة
        </button>
      </div>
    </div>
  </div>
);

export default Package;
