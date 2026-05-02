import { Sparkles, Calendar, BarChart3, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

const features = [
  {
    icon: Sparkles,
    title: "محتوى يكتبه الذكاء الاصطناعي",
    desc: "بوستات وكابشن وردود جاهزة بلهجتك المصرية أو الخليجية، تناسب جمهورك ومجالك.",
  },
  {
    icon: Calendar,
    title: "نشر تلقائي على كل المنصات",
    desc: "جدولة ونشر على إنستجرام، فيسبوك، تيك توك، وتويتر — من غير ما ترفع إصبعك.",
  },
  {
    icon: BarChart3,
    title: "تحليلات تفهم منها فوراً",
    desc: "تقارير أسبوعية بسيطة تقولك إيه اللي شغّال وإيه اللي محتاج تطوير لزيادة مبيعاتك.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    navigate(`/register?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
            <span className="font-display text-lg font-black text-gold">ح</span>
          </div>
          <span className="font-display text-xl font-black tracking-tight">حاكم</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm text-foreground/70 transition hover:text-foreground"
          >
            دخول
          </Link>
          <Link
            to="/register"
            className="rounded-full border border-gold/30 px-5 py-2 text-sm text-gold transition hover:bg-gold/10"
          >
            ابدأ مجاناً
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-pattern opacity-40" aria-hidden />
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/20 blur-[140px]" aria-hidden />

        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-16 text-center sm:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-4 py-1.5 text-xs text-gold sm:text-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            مدعوم بالذكاء الاصطناعي · مصر والخليج
          </div>

          <h1 className="font-display text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl md:text-7xl">
            بطّل تضيع وقتك على
            <br />
            <span className="gradient-gold-text">السوشيال ميديا</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
            حاكم بيدير حسابات بيزنسك تلقائياً بالذكاء الاصطناعي — يكتب، ينشر، ويرد على عملاءك،
            وانت متفرّغ لشغلك الحقيقي.
          </p>

          {/* Signup */}
          <form
            id="signup"
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="بريدك الإلكتروني"
              className="flex-1 rounded-full border border-foreground/15 bg-foreground/5 px-5 py-3.5 text-right text-foreground placeholder:text-foreground/40 outline-none transition focus:border-gold/50 focus:bg-foreground/10"
              dir="rtl"
            />
            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-7 py-3.5 font-bold text-background shadow-gold transition hover:scale-[1.02] active:scale-[0.98]"
            >
              ابدأ مجاناً
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-foreground/50">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-gold" /> بدون بطاقة ائتمان</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-gold" /> دعم باللهجة العربية</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-gold" /> إلغاء في أي وقت</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            كل اللي محتاجه <span className="gradient-gold-text">في مكان واحد</span>
          </h2>
          <p className="mt-3 text-foreground/60">ثلاث خطوات بسيطة تخلي السوشيال ميديا شغّالة لصالحك</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-7 transition hover:border-gold/30 hover:bg-foreground/[0.04]"
            >
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-gold/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                  <f.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-bold text-gold/70">0{i + 1}</div>
                <h3 className="mb-2 font-display text-xl font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/65">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="relative mx-auto max-w-4xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-bl from-gold/10 via-transparent to-transparent p-10 text-center sm:p-16">
          <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-3xl font-black sm:text-5xl">
              جاهز تخلي حاكم <span className="gradient-gold-text">يشتغل لك؟</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-foreground/65">
              انضم لقائمة الانتظار واحصل على شهر مجاني عند الإطلاق.
            </p>
            <a
              href="#signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-8 py-4 font-bold text-background shadow-gold transition hover:scale-[1.02]"
            >
              سجّل اهتمامك الآن
              <ArrowLeft className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-8 text-center text-sm text-foreground/40">
        © 2026 حاكم — صُنع بحب لرواد الأعمال العرب
      </footer>
    </div>
  );
};

export default Index;
