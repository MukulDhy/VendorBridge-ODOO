import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Calendar, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteRFQ } from "@/store/slices/rfqsSlice";
import { format, parseISO } from "date-fns";

export default function RFQsPage() {
  const rfqs = useAppSelector((s) => s.rfqs.items);
  const dispatch = useAppDispatch();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => rfqs.filter((r) =>
    (status === "All" || r.status === status) &&
    (r.title.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
  ), [rfqs, q, status]);

  return (
    <div>
      <PageHeader
        title="Requests for Quotation"
        subtitle="Issue RFQs to vendors and track responses."
        actions={
          <Link to="/rfqs/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Plus className="h-4 w-4" /> New RFQ
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search RFQ title or code…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none ring-primary/30 focus:ring-2" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
          {["All", "Draft", "Open", "Closed", "Awarded", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Vendors</th><th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3"><Link to={`/rfqs/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">{r.code}</Link></td>
                <td className="px-4 py-3 font-medium text-foreground">{r.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.quantity}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{format(parseISO(r.deadline), "dd MMM yyyy")}</span></td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{r.assignedVendors.length}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => dispatch(deleteRFQ(r.id))} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No RFQs match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}