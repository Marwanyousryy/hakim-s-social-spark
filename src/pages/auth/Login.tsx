import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import AuthShell from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().trim().email({ message: "بريد إلكتروني غير صحيح" }).max(255),
  password: z.string().min(6, { message: "كلمة السر 6 أحرف على الأقل" }).max(72),
});

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    toast.success("أهلاً بعودتك 👋");
    navigate("/dashboard");
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="ادخل لحسابك وكمّل إدارة سوشيال ميديا بيزنسك"
      footer={
        <>
          ماعندكش حساب؟{" "}
          <Link to="/register" className="text-gold hover:underline">سجّل دلوقتي</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm text-foreground/80">البريد الإلكتروني</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-right outline-none transition focus:border-gold/50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm text-foreground/80">كلمة السر</label>
            <Link to="/forgot-password" className="text-xs text-gold hover:underline">نسيت كلمة السر؟</Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-right outline-none transition focus:border-gold/50"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3.5 font-bold text-background shadow-gold transition hover:scale-[1.01] disabled:opacity-60"
        >
          {loading ? "..." : "دخول"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
