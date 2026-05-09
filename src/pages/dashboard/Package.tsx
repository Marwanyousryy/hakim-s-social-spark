import { useEffect, useState } from "react";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanStatus } from "@/hooks/usePlanStatus";

const PLAN_LABELS: Record<string, string> = {
  free: "مجاني",
  basic: "أساسية",
  medium: "متوسطة",
  pro: "برو",
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["10 توليدات شهرياً", "ربط منصة واحدة", "محتوى بالذكاء الاصطناعي", "دعم بالعربية"],
  basic: ["30 منشور شهرياً", "ربط منصة واحدة", "كابشن بالذكاء الاصطناعي", "هاشتاجات مقترحة"],
  medium: ["80 منشور شهرياً", "3 منصات", "تحليلات أسبوعية", "جدولة تلقائية"],
  pro: ["منشورات غير محدودة", "كل المنصات", "تحليلات يومية", "رد على كومنتات", "دعم أولوية"],
};

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 30,
  medium: 80,
  pro: 999,
};

const Package = () => {
  const { user } = useAuth();
  const plan = usePlanStatus();
  const [generationsUsed, setGenerationsUsed] = useState(0);

  useEffect(() => {
    if (!user) return;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    supabase
      .from("content_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString())
      .then(({ count }) => setGenerationsUsed(count ?? 0));
  }, [user]);

  const currentPlan = plan.plan || "free";
  const features = PLAN_FEATURES[currentPlan] ?? PLAN_FEATURES.free;
  const generationLimit = PLAN_LIMITS[currentPlan] ?? 10;
  const genPct = Math.min(100, (generationsUsed / generationLimit) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">باقتي</h1>
        <p className="mt-1 text-sm text-foreground/60">تابع استهلاكك واترقّى لما تحتاج</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-bl from-gold/10 via-transparent to-transparent p-6 sm:p-8">
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-gold/15 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="mb-1 text-xs font-bold text-gold">باقتك الحالية</div>
          <h2 className="font-display text-3xl font-black">
            {PLAN_LABELS[currentPlan] ?? currentPlan}
          </h2>

          {plan.isTrial && (
            <p className="mt-1 text-sm text-foreground/60">
              فترة تجريبية — متبقي{" "}
              <span className="font-bold text-gold">{plan.daysRemaining}</span> يوم
            </p>
          )}
          {plan.isPaid && plan.planEndDate && (
            <p className="mt-1 text-sm text-foreground/60">
              تنتهي في{" "}
              <span className="font-bold text-gold">
                {new Date(plan.planEndDate).toLocaleDateString("ar-EG")}
              </span>
              {" — "}متبقي <span className="font-bold text-gold">{plan.daysRemaining}</span> يوم
            </p>
          )}
          {!plan.isTrial && !plan.isPaid && (
            <p className="mt-1 text-sm text-foreground/60">ابدأ مجاناً، اترقّى لما يكبر بيزنسك</p>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check className="h-4 w-4 text-gold" />
                {f}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-foreground/70">
                <span>توليد المحتوى هذا الشهر</span>
                <span>
                  {generationsUsed}/{currentPlan === "pro" ? "∞" : generationLimit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] to-[hsl(var(--gold-bright))] transition-all"
                  style={{ width: `${currentPlan === "pro" ? 20 : genPct}%` }}
                />
              </div>
            </div>
          </div>

          {!plan.isPaid && (
            <Link
              to="/pricing"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3 font-bold text-background shadow-gold transition hover:scale-[1.02]"
            >
              <Sparkles className="h-4 w-4" />
              ترقية الباقة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Package;
