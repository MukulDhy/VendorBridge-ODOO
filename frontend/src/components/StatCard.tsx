import type { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  trend,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  trend?: string;
  accent?: "primary" | "emerald" | "amber" | "violet";
}) {
  const accents: Record<string, string> = {
    primary: "from-primary/15 to-primary/0 text-primary",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600",
    amber: "from-amber-500/15 to-amber-500/0 text-amber-600",
    violet: "from-violet-500/15 to-violet-500/0 text-violet-600",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 ring-1 ring-border ${accents[accent].split(" ").pop()}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}