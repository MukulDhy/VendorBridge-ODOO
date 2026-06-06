import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppSelector } from "@/store";
import { fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";

export default function PurchaseOrdersPage() {
  const pos = useAppSelector((s) => s.purchaseOrders.items);
  const vendors = useAppSelector((s) => s.vendors.items);
  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="All issued POs across vendors." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">PO</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Items</th><th className="px-4 py-3 text-right">Subtotal</th><th className="px-4 py-3">Status</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pos.map((p) => {
              const v = vendors.find((x) => x.id === p.vendorId);
              const subtotal = p.items.reduce((s, i) => s + i.price * i.qty, 0);
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{p.code}</td>
                  <td className="px-4 py-3 text-foreground">{v?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(parseISO(p.createdAt), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.items.length}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtINR(subtotal)}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/invoices`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <ShoppingCart className="h-3 w-3" /> Invoice
                    </Link>
                  </td>
                </tr>
              );
            })}
            {pos.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No purchase orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}