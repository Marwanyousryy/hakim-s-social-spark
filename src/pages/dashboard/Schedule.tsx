import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Schedule = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("posts").select("*").eq("user_id", user.id).eq("status", "scheduled")
      .order("scheduled_at", { ascending: true }).then(({ data }) => setPosts(data ?? []));
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black sm:text-4xl">الجدولة</h1>
        <p className="mt-1 text-sm text-foreground/60">منشوراتك المجدولة للنشر التلقائي</p>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 py-16 text-center">
          <Calendar className="mb-3 h-10 w-10 text-foreground/30" />
          <p className="text-sm text-foreground/60">مفيش منشورات مجدولة دلوقتي.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gold">{p.platform}</span>
                <span className="text-xs text-foreground/50">
                  {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString("ar-EG") : "—"}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-foreground/80">{p.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedule;
