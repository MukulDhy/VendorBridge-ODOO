import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppSelector } from "@/store";
import { fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";

export default function VendorQuotations() {
  const user = useAppSelector((s) => s.auth.user)!;
  const quotes = useAppSelector((s) => s.quotations.items.filter((q) => q.vendorId === user.vendorId));
  const rfqs = useAppSelector((s) => s.rfqs.items);
  return (
    <div>
      <PageHeader title="My Quotations" subtitle="Track every quote you've submitted." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">RFQ</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Days</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotes.map((q) => {
              const r = rfqs.find((x) => x.id === q.rfqId);
              return (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r?.code}</td>
                  <td className="px-4 py-3 text-foreground">{r?.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(parseISO(q.submittedAt), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtINR(q.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{q.deliveryDays}</td>
                  <td className="px-4 py-3"><StatusPill status={q.status} /></td>
                </tr>
              );
            })}
            {quotes.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">You haven't submitted any quotations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VendorOrders() {
  const user = useAppSelector((s) => s.auth.user)!;
  const pos = useAppSelector((s) => s.purchaseOrders.items.filter((p) => p.vendorId === user.vendorId));
  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Orders awarded to you." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">PO</th><th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Items</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pos.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-primary">{p.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{format(parseISO(p.createdAt), "dd MMM yyyy")}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.items.length}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtINR(p.items.reduce((s, i) => s + i.qty * i.price, 0))}</td>
                <td className="px-4 py-3"><StatusPill status={p.status} /></td>
              </tr>
            ))}
            {pos.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}