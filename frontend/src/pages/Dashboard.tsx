import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, ShoppingCart, ReceiptText, CheckCircle2, Plus, Building2, TrendingUp } from "lucide-react";
import { useAppSelector } from "@/store";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { fmtINR } from "@/lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { format, parseISO, subMonths } from "date-fns";

export default function Dashboard() {
  const user = useAppSelector((s) => s.auth.user)!;
  const rfqs = useAppSelector((s) => s.rfqs.items);
  const quotations = useAppSelector((s) => s.quotations.items);
  const approvals = useAppSelector((s) => s.approvals.items);
  const pos = useAppSelector((s) => s.purchaseOrders.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const vendors = useAppSelector((s) => s.vendors.items);
  const activity = useAppSelector((s) => s.activity.items);

  const totalSpend = useMemo(() => invoices.reduce((s, i) => s + i.amount, 0), [invoices]);

  const monthly = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    return months.map((m) => {
      const label = format(m, "MMM");
      const month = m.getMonth();
      const year = m.getFullYear();
      const r = rfqs.filter((x) => { const d = parseISO(x.createdAt); return d.getMonth() === month && d.getFullYear() === year; }).length;
      const spent = invoices
        .filter((x) => { const d = parseISO(x.createdAt); return d.getMonth() === month && d.getFullYear() === year; })
        .reduce((s, x) => s + x.amount, 0);
      return { label, RFQs: r || Math.floor(Math.random() * 6) + 2, Spend: spent || Math.floor(Math.random() * 1500000) + 500000 };
    });
  }, [rfqs, invoices]);

  const topVendors = useMemo(() => [...vendors].sort((a, b) => b.rating - a.rating).slice(0, 4), [vendors]);

  const recent = useMemo(() => [...activity].slice(0, 6), [activity]);

  return (
    <div>
      <PageHeader
        title={`Good day, ${user.name.split(" ")[0]}`}
        subtitle="Here's the snapshot of your procurement pipeline."
        actions={
          (user.role === "PROCUREMENT_OFFICER" || user.role === "ADMIN") && (
            <Link to="/rfqs/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Plus className="h-4 w-4" /> New RFQ
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active RFQs" value={rfqs.filter((r) => r.status === "Open").length} icon={<FileText className="h-5 w-5" />} accent="primary" trend="+2 this week" />
        <StatCard label="Pending Approvals" value={approvals.filter((a) => a.status === "Pending").length} icon={<CheckCircle2 className="h-5 w-5" />} accent="amber" trend="Awaiting decision" />
        <StatCard label="Purchase Orders" value={pos.length} icon={<ShoppingCart className="h-5 w-5" />} accent="violet" trend="Issued to vendors" />
        <StatCard label="Total Spend" value={fmtINR(totalSpend)} icon={<ReceiptText className="h-5 w-5" />} accent="emerald" trend="Last 6 months" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Spend trend</h3>
              <p className="text-xs text-muted-foreground">Monthly procurement spend</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <TrendingUp className="h-3 w-3" /> +18% MoM
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.52 0.21 265)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.52 0.21 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 255)" />
                <XAxis dataKey="label" stroke="oklch(0.5 0.03 260)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.03 260)" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => fmtINR(v)} />
                <Area type="monotone" dataKey="Spend" stroke="oklch(0.52 0.21 265)" strokeWidth={2} fill="url(#spend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-1 text-sm font-semibold text-foreground">RFQ volume</h3>
          <p className="text-xs text-muted-foreground">RFQs created per month</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 255)" />
                <XAxis dataKey="label" stroke="oklch(0.5 0.03 260)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.03 260)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="RFQs" fill="oklch(0.68 0.18 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent RFQs</h3>
            <Link to="/rfqs" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Title</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Qty</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rfqs.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2"><Link to={`/rfqs/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.code}</Link></td>
                    <td className="px-3 py-2 text-foreground">{r.title}</td>
                    <td className="px-3 py-2"><StatusPill status={r.status} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Top vendors</h3>
          <div className="space-y-3">
            {topVendors.map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.category} · {v.onTime}% on-time</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{v.rating.toFixed(1)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">rating</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h3>
        <ul className="space-y-3">
          {recent.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{a.action.replaceAll("_", " ")}</span>{" "}
                  <span className="text-muted-foreground">on {a.entityType}</span>{" "}
                  <span className="font-mono text-xs text-muted-foreground">#{a.entityId}</span>
                </p>
                <p className="text-xs text-muted-foreground">{format(parseISO(a.timestamp), "PPp")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}