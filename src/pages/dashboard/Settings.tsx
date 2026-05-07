import { useEffect, useState } from "react";
import { Instagram, Facebook, Twitter, Youtube, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BUSINESS_TYPES = ["مطعم", "متجر إلكتروني", "عيادة", "كافيه", "برند ملابس", "أخرى"];
const PLATFORMS = [
  { id: "Instagram", icon: Instagram },
  { id: "TikTok", icon: Sparkles },
  { id: "Twitter", icon: Twitter },
  { id: "Facebook", icon: Facebook },
  { id: "YouTube", icon: Youtube },
];

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", business_name: "", business_type: "" });
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState({ posts: true, weekly: true, marketing: false });
  const [plan, setPlan] = useState<{ plan: string; end: string | null } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,business_name,business_type,plan,plan_end_date").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name ?? "",
            business_name: data.business_name ?? "",
            business_type: data.business_type ?? "",
          });
          if (data.plan && data.plan !== "free") {
            setPlan({ plan: data.plan, end: (data as any).plan_end_date ?? null });
          }
        }
      });
  }, [user]);

  const cancelSubscription = async () => {
    if (!user) return;
    if (!confirm("هل أنت متأكد من إلغاء الاشتراك؟ هتفضل تستفيد من الباقة لحد نهاية الفترة المدفوعة.")) return;
    setCancelling(true);
    const { error } = await supabase.from("profiles").update({
      plan: "free", plan_end_date: null, plan_start_date: null,
    }).eq("id", user.id);
    setCancelling(false);
    if (error) { toast.error("حصلت مشكلة، جرب تاني"); return; }
    setPlan(null);
    toast.success("تم إلغاء الاشتراك");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("حصلت مشكلة، جرب تاني"); return; }
    toast.success("تم حفظ التعديلات ✅");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">الإعدادات</h1>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">الملف الشخصي</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">الاسم</label>
            <input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">البريد الإلكتروني</label>
            <input value={user?.email ?? ""} disabled className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-foreground/50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">اسم البيزنس</label>
            <input
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-foreground/80">نوع البيزنس</label>
            <select
              value={profile.business_type}
              onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none focus:border-gold/50"
            >
              <option value="">اختر...</option>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-2.5 text-sm font-bold text-background shadow-gold disabled:opacity-60"
        >
          {saving ? "..." : "حفظ التعديلات"}
        </button>
      </section>

      {/* Platforms */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold">المنصات المربوطة</h2>
        <div className="space-y-2">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-foreground/10 bg-background/40 p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/30">
                  <p.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{p.id}</span>
                <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/60">غير مربوط</span>
              </div>
              <button
                onClick={() => toast("الربط هييتم تفعيله قريباً")}
                className="rounded-full border border-gold/30 px-4 py-1.5 text-xs text-gold hover:bg-gold/10"
              >
                ربط الحساب
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-bold">إشعارات</h2>
        {[
          { k: "posts", label: "تنبيهات المنشورات" },
          { k: "weekly", label: "تقرير أسبوعي" },
          { k: "marketing", label: "عروض وأخبار" },
        ].map((row) => (
          <label key={row.k} className="flex items-center justify-between border-b border-foreground/5 py-3 last:border-0">
            <span className="text-sm">{row.label}</span>
            <input
              type="checkbox"
              checked={(notif as any)[row.k]}
              onChange={(e) => setNotif({ ...notif, [row.k]: e.target.checked })}
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-foreground/15 transition-colors checked:bg-gold relative
                before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
            />
          </label>
        ))}
      </section>
    </div>
  );
};

export default Settings;
