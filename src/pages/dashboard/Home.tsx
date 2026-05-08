import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FileText, TrendingUp, Link2, Hash, PenSquare, Inbox, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanStatus } from "@/hooks/usePlanStatus";

type Post = {
  id: string;
  platform: string;
  content: string;
  status: string;
  created_at: string;
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 transition hover:border-gold/30">
    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
      <Icon className="h-5 w-5" />
    </div>
    <div className="text-2xl font-black">{value}</div>
    <div className="mt-1 text-xs text-foreground/60">{label}</div>
  </div>
);

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    published: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
    scheduled: "bg-blue-500/10 text-blue-400 ring-blue-500/30",
    draft: "bg-foreground/10 text-foreground/60 ring-foreground/20",
  };
  const label: Record<string, string> = { published: "منشور", scheduled: "مجدول", draft: "مسودة" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${map[s] ?? map.draft}`}>{label[s] ?? s}</span>;
};

const Home = () => {
  const { user } = useAuth();
  const plan = usePlanStatus();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("🎉 تم الاشتراك بنجاح! مرحباً بك في حاكم");
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!user) return;
    supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setPosts(data ?? []));
  }, [user]);

  const planLabel: Record<string, string> = { basic: "أساسية", medium: "متوسطة", pro: "برو" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">الرئيسية</h1>
        <p className="mt-1 text-sm text-foreground/60">نظرة سريعة على نشاطك</p>
      </div>

      {plan.isTrial && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold">الفترة التجريبية فعّالة</div>
              <div className="text-sm text-foreground/60">متبقي <span className="font-bold text-gold">{plan.daysRemaining}</span> يوم — اختر باقتك قبل انتهاء التجربة</div>
            </div>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-4 py-2 text-sm font-bold text-background shadow-gold transition hover:scale-[1.02]">
            <Sparkles className="h-4 w-4" /> ترقية الآن
          </Link>
        </div>
      )}

      {plan.isPaid && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">باقتك الحالية: {planLabel[plan.plan] ?? plan.plan}</div>
            <div className="text-sm text-foreground/60">متبقي <span className="font-bold text-emerald-400">{plan.daysRemaining}</span> يوم</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard icon={FileText} label="المنشورات هذا الشهر" value={posts.length} />
        <StatCard icon={TrendingUp} label="نسبة التفاعل" value="0%" />
        <StatCard icon={Link2} label="المنصات المربوطة" value={0} />
        <StatCard icon={Hash} label="الهاشتاجات المولدة" value={0} />
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">آخر المنشورات</h2>
          <Link
            to="/dashboard/create"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-4 py-2 text-sm font-bold text-background shadow-gold transition hover:scale-[1.02]"
          >
            <PenSquare className="h-4 w-4" />
            إنشاء محتوى جديد
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-foreground/15 py-12 text-center">
            <Inbox className="mb-3 h-10 w-10 text-foreground/30" />
            <p className="text-sm text-foreground/60">لسه ماعندكش منشورات.</p>
            <p className="mt-1 text-xs text-foreground/40">ابدأ بإنشاء أول منشور بالذكاء الاصطناعي 🪄</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-foreground/50">
                <tr>
                  <th className="pb-3 pr-2 font-medium">المنصة</th>
                  <th className="pb-3 font-medium">المحتوى</th>
                  <th className="pb-3 font-medium">التاريخ</th>
                  <th className="pb-3 pl-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-2">{p.platform}</td>
                    <td className="max-w-[16rem] truncate py-3 text-foreground/80">{p.content}</td>
                    <td className="py-3 text-foreground/60">{new Date(p.created_at).toLocaleDateString("ar-EG")}</td>
                    <td className="py-3 pl-2">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
