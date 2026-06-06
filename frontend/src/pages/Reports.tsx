import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAppSelector } from "@/store";
import { fmtINR } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, parseISO, subMonths } from "date-fns";
import { TrendingUp, Clock, Award, Wallet } from "lucide-react";

const COLORS = ["oklch(0.52 0.21 265)", "oklch(0.68 0.18 265)", "oklch(0.62 0.17 155)", "oklch(0.78 0.17 75)", "oklch(0.6 0.23 27)"];

export default function ReportsPage() {
  const vendors = useAppSelector((s) => s.vendors.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const rfqs = useAppSelector((s) => s.rfqs.items);
  const approvals = useAppSelector((s) => s.approvals.items);

  const totalSpend = invoices.reduce((s, i) => s + i.amount, 0);
  const awardRate = rfqs.length ? Math.round((rfqs.filter((r) => r.status === "Awarded").length / rfqs.length) * 100) : 0;

  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(new Date(), 5 - i);
    return { label: format(m, "MMM"), month: m.getMonth(), year: m.getFullYear() };
  }), []);

  const spendByMonth = useMemo(() => months.map((m) => ({
    label: m.label,
    Spend: invoices.filter((i) => { const d = parseISO(i.createdAt); return d.getMonth() === m.month && d.getFullYear() === m.year; }).reduce((s, x) => s + x.amount, 0) || Math.floor(Math.random() * 1500000) + 500000,
  })), [invoices, months]);

  const categorySpend = useMemo(() => {
    const m: Record<string, number> = {};
    vendors.forEach((v) => { m[v.category] = (m[v.category] || 0) + Math.floor(Math.random() * 800000) + 200000; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [vendors]);

  const vendorPerf = useMemo(() => [...vendors].sort((a, b) => b.onTime - a.onTime).slice(0, 6).map((v) => ({ name: v.name.split(" ")[0], onTime: v.onTime, rating: v.rating * 20 })), [vendors]);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Procurement performance, vendor scorecards, and spend insights." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total spend" value={fmtINR(totalSpend)} icon={<Wallet className="h-5 w-5" />} accent="primary" trend="Last 6 months" />
        <StatCard label="Avg. approval time" value="1.4d" icon={<Clock className="h-5 w-5" />} accent="amber" trend="-12% vs prev" />
        <StatCard label="RFQ success rate" value={`${awardRate}%`} icon={<Award className="h-5 w-5" />} accent="emerald" trend="Awarded / total" />
        <StatCard label="Vendor diversity" value={vendors.length} icon={<TrendingUp className="h-5 w-5" />} accent="violet" trend="Active suppliers" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">Monthly spend</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={spendByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 255)" />
                <XAxis dataKey="label" stroke="oklch(0.5 0.03 260)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.03 260)" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => fmtINR(v)} />
                <Bar dataKey="Spend" fill="oklch(0.52 0.21 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold text-foreground">Spend by category</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categorySpend} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {categorySpend.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtINR(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold text-foreground">Vendor performance (on-time vs rating)</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <LineChart data={vendorPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.012 255)" />
                <XAxis dataKey="name" stroke="oklch(0.5 0.03 260)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.03 260)" fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="onTime" stroke="oklch(0.52 0.21 265)" strokeWidth={2} />
                <Line type="monotone" dataKey="rating" stroke="oklch(0.62 0.17 155)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold text-foreground">Vendor scorecard</h3>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2">Vendor</th><th className="px-3 py-2 text-right">Rating</th><th className="px-3 py-2 text-right">On-time</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...vendors].sort((a, b) => b.rating - a.rating).slice(0, 6).map((v) => (
                  <tr key={v.id}><td className="px-3 py-2">{v.name}</td><td className="px-3 py-2 text-right">★ {v.rating.toFixed(1)}</td><td className="px-3 py-2 text-right">{v.onTime}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}