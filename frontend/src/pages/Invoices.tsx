import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { setInvoiceStatus } from "@/store/slices/invoicesSlice";
import { fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";
import InvoiceModal from "@/components/InvoiceModal";
import type { Invoice } from "@/lib/mockData";

export default function InvoicesPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const invoices = useAppSelector((s) =>
    user.role === "VENDOR" ? s.invoices.items.filter((i) => i.vendorId === user.vendorId) : s.invoices.items,
  );
  const vendors = useAppSelector((s) => s.vendors.items);
  const pos = useAppSelector((s) => s.purchaseOrders.items);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState<Invoice | null>(null);

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Generate, send, and reconcile vendor invoices." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">PO</th><th className="px-4 py-3">Due</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((i) => {
              const v = vendors.find((x) => x.id === i.vendorId);
              const po = pos.find((p) => p.id === i.poId);
              return (
                <tr key={i.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{i.code}</td>
                  <td className="px-4 py-3 text-foreground">{v?.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{po?.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(parseISO(i.dueDate), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtINR(i.amount)}</td>
                  <td className="px-4 py-3">
                    {user.role !== "VENDOR" ? (
                      <select value={i.status} onChange={(e) => dispatch(setInvoiceStatus({ id: i.id, status: e.target.value as Invoice["status"] }))}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                        <option>Pending</option><option>Paid</option><option>Overdue</option>
                      </select>
                    ) : <StatusPill status={i.status} />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setOpen(i)} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15">View / Print</button>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {open && <InvoiceModal invoice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}