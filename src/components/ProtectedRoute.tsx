import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanStatus } from "@/hooks/usePlanStatus";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const plan = usePlanStatus();
  const location = useLocation();

  if (loading || (user && plan.loading)) {
    return (
      <div className="grid min-h-screen place-items-center text-foreground/60">
        جاري التحميل...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // Trial expired and no paid plan -> send to pricing
  // Allow settings + package so the user can still manage their account
  const isAllowedWhenExpired = location.pathname.startsWith("/dashboard/settings")
    || location.pathname.startsWith("/dashboard/package");
  if (plan.trialExpired && !plan.isPaid && !isAllowedWhenExpired) {
    return <Navigate to="/pricing" replace />;
  }
  return children;
};

export default ProtectedRoute;
