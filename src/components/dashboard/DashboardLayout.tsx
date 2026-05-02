import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, PenSquare, Calendar, BarChart3, Settings, Gem, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard", label: "الرئيسية", icon: Home, end: true },
  { to: "/dashboard/create", label: "إنشاء محتوى", icon: PenSquare },
  { to: "/dashboard/schedule", label: "الجدولة", icon: Calendar },
  { to: "/dashboard/analytics", label: "التحليلات", icon: BarChart3 },
  { to: "/dashboard/settings", label: "الإعدادات", icon: Settings },
  { to: "/dashboard/package", label: "باقتي", icon: Gem },
];

const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج");
    navigate("/login");
  };

  const initial = (profile?.full_name || user?.email || "?").trim()[0]?.toUpperCase() || "?";
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "مستخدم";

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-foreground/10 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
            <span className="font-display text-sm font-black text-gold">ح</span>
          </div>
          <span className="font-display font-black">حاكم</span>
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-foreground/10" aria-label="فتح القائمة">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-foreground/10 bg-background/95 backdrop-blur transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-5">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
              <span className="font-display text-lg font-black text-gold">ح</span>
            </div>
            <span className="font-display text-xl font-black tracking-tight">حاكم</span>
          </Link>
          <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-foreground/10 md:hidden" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-gold/10 text-gold ring-1 ring-gold/30"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-foreground/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-foreground/5 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 font-bold text-gold ring-1 ring-gold/30">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{displayName}</div>
              <div className="truncate text-xs text-foreground/50">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/15 px-3 py-2.5 text-sm text-foreground/80 transition hover:border-destructive/40 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Content */}
      <main className="md:mr-72">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
