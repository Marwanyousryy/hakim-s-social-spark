import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("كلمة السر 6 أحرف على الأقل"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error("حصلت مشكلة، جرب تاني"); return; }
    toast.success("تم تحديث كلمة السر ✅");
    navigate("/dashboard");
  };

  return (
    <AuthShell title="تعيين كلمة سر جديدة">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة السر الجديدة"
          className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-3 text-right outline-none transition focus:border-gold/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-l from-[hsl(var(--gold-deep))] via-[hsl(var(--gold))] to-[hsl(var(--gold-bright))] px-6 py-3.5 font-bold text-background shadow-gold disabled:opacity-60"
        >
          {loading ? "..." : "حفظ"}
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
