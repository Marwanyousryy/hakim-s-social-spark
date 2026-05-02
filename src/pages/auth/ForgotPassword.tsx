import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import AuthShell from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const schema = z.string().trim().email({ message: "بريد إلكتروني غير صحيح" }).max(255);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error("حصلت مشكلة، جرب تاني"); return; }
    setSent(true);
    toast.success("بعتنالك إيميل لاستعادة كلمة السر");
  };

  return (
    <AuthShell
      title="نسيت كلمة السر؟"
      subtitle="ادخل بريدك وهنبعتلك رابط لإعادة تعيين كلمة السر"
      footer={<><Link to="/login" className="text-gold hover:underline">رجوع لتسجيل الدخول</Link></>}
    >
      {sent ? (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-foreground/80">
          ✅ تفقد بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة السر.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-right outline-none transition focus:border-gold/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3.5 font-bold text-background shadow-gold transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "..." : "إرسال الرابط"}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
