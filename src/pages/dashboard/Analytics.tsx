import { BarChart3 } from "lucide-react";

const Analytics = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-3xl font-black sm:text-4xl">التحليلات</h1>
      <p className="mt-1 text-sm text-foreground/60">تقارير أداء حساباتك على كل المنصات</p>
    </div>
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 py-20 text-center">
      <BarChart3 className="mb-3 h-12 w-12 text-foreground/30" />
      <p className="text-sm text-foreground/60">هتظهر التحليلات هنا بعد ربط أول منصة.</p>
      <p className="mt-1 text-xs text-foreground/40">اربط حساباتك من صفحة الإعدادات</p>
    </div>
  </div>
);

export default Analytics;
