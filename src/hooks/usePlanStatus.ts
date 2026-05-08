import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TRIAL_DAYS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PlanStatus = {
  loading: boolean;
  plan: string;
  isPaid: boolean;
  isTrial: boolean;
  trialExpired: boolean;
  daysRemaining: number;
  planEndDate: string | null;
};

export const usePlanStatus = (): PlanStatus => {
  const { user } = useAuth();
  const [state, setState] = useState<PlanStatus>({
    loading: true,
    plan: "free",
    isPaid: false,
    isTrial: false,
    trialExpired: false,
    daysRemaining: 0,
    planEndDate: null,
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("plan, plan_end_date, created_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setState((s) => ({ ...s, loading: false }));
          return;
        }
        const plan = data.plan || "free";
        const now = Date.now();

        if (plan !== "free" && data.plan_end_date) {
          const end = new Date(data.plan_end_date).getTime();
          const days = Math.max(0, Math.ceil((end - now) / DAY_MS));
          const active = end > now;
          setState({
            loading: false,
            plan: active ? plan : "free",
            isPaid: active,
            isTrial: false,
            trialExpired: !active,
            daysRemaining: days,
            planEndDate: data.plan_end_date,
          });
          return;
        }

        // Free plan -> trial logic based on created_at
        const created = new Date(data.created_at).getTime();
        const trialEnd = created + TRIAL_DAYS * DAY_MS;
        const days = Math.max(0, Math.ceil((trialEnd - now) / DAY_MS));
        const trialActive = now < trialEnd;
        setState({
          loading: false,
          plan: "free",
          isPaid: false,
          isTrial: trialActive,
          trialExpired: !trialActive,
          daysRemaining: days,
          planEndDate: null,
        });
      });
  }, [user]);

  return state;
};
