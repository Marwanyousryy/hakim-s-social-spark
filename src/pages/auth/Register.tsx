import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import AuthShell from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const BUSINESS_TYPES = ["مطعم", "متجر إلكتروني", "عيادة", "كافيه", "برند ملابس", "أخرى"];

const schema = z.object({
  full_name: z.string().trim().min(2, { message: "الاسم قصير جداً" }).max(80),
  email: z.string().trim().email({ message: "بريد إلكتروني غير صحيح" }).max(255),
  password: z.string().min(6, { message: "كلمة السر 6 أحرف على الأقل" }).max(72),
  business_type: z.string().min(1, { message: "اختر نوع البيزنس" }),
});

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", business_type: "" });
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: form.full_name, business_type: form.business_type },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("registered") ? "البريد مسجل بالفعل" : "حصلت مشكلة، جرب تاني");
      return;
    }
    toast.success("تم إنشاء الحساب 🎉");
    navigate("/dashboard");
  };

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="ابدأ مع حاكم في أقل من دقيقة"
      footer={<>عندك حساب؟ <Link to="/login" className="text-gold hover:underline">سجّل دخول</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">الاسم الكامل</label>
          <input
            value={form.full_name}
            onChange={update("full_name")}
            required
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none transition focus:border-gold/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none transition focus:border-gold/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">كلمة السر</label>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none transition focus:border-gold/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">نوع البيزنس</label>
          <select
            value={form.business_type}
            onChange={update("business_type")}
            required
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 outline-none transition focus:border-gold/50"
          >
            <option value="">اختر...</option>
            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3.5 font-bold text-background shadow-gold transition hover:scale-[1.01] disabled:opacity-60"
        >
          {loading ? "..." : "إنشاء الحساب"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
