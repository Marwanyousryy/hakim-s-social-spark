import { ReactNode } from "react";
import { Link } from "react-router-dom";

const AuthShell = ({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/20 blur-[140px]" aria-hidden />
      <div className="absolute inset-0 grid-pattern opacity-30" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 ring-1 ring-gold/30">
            <span className="font-display text-lg font-black text-gold">ح</span>
          </div>
          <span className="font-display text-xl font-black tracking-tight">حاكم</span>
        </Link>

        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-7 backdrop-blur">
          <h1 className="font-display text-2xl font-black sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-foreground/60">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-foreground/60">{footer}</div>}
      </div>
    </div>
  );
};

export default AuthShell;
