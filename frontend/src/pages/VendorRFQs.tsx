import { useState } from "react";
import { Send, Calendar, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { submitQuotation } from "@/store/slices/quotationsSlice";
import { logActivity } from "@/store/slices/activitySlice";
import { pushNotification } from "@/store/slices/notificationsSlice";
import { format, parseISO } from "date-fns";
import type { RFQ } from "@/lib/mockData";

export default function VendorRFQs() {
  const user = useAppSelector((s) => s.auth.user)!;
  const rfqs = useAppSelector((s) => s.rfqs.items.filter((r) => user.vendorId && r.assignedVendors.includes(user.vendorId)));
  const quotations = useAppSelector((s) => s.quotations.items);
  const [open, setOpen] = useState<RFQ | null>(null);
  const dispatch = useAppDispatch();

  return (
    <div>
      <PageHeader title="Open RFQs" subtitle="Quote on opportunities sent to you by buyers." />
      <div className="grid gap-4 md:grid-cols-2">
        {rfqs.map((r) => {
          const myQuote = quotations.find((q) => q.rfqId === r.id && q.vendorId === user.vendorId);
          return (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{r.code}</p>
                  <h3 className="text-base font-semibold text-foreground">{r.title}</h3>
                </div>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />Qty {r.quantity}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Due {format(parseISO(r.deadline), "dd MMM")}</span>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                {myQuote ? (
                  <p className="text-xs text-emerald-600 font-medium">✓ You've submitted a quotation ({myQuote.status})</p>
                ) : (
                  <button onClick={() => setOpen(r)} className="inline-flex items-center gap-2 rounded-lg bg-[var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
                    <Send className="h-4 w-4" /> Submit quotation
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rfqs.length === 0 && <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground md:col-span-2">No open RFQs at the moment.</p>}
      </div>

      {open && (
        <QuoteModal rfq={open} onClose={() => setOpen(null)} onSubmit={(price, days, comments) => {
          dispatch(submitQuotation({ rfqId: open.id, vendorId: user.vendorId!, price, deliveryDays: days, comments }));
          dispatch(logActivity({ userId: user.id, action: "SUBMIT_QUOTATION", entityType: "RFQ", entityId: open.id }));
          dispatch(pushNotification({ userId: "u2", title: "Quotation Received", message: `${user.name} submitted a quote for ${open.code}.`, link: `/rfqs/${open.id}` }));
          setOpen(null);
        }} />
      )}
    </div>
  );
}

function QuoteModal({ rfq, onClose, onSubmit }: { rfq: RFQ; onClose: () => void; onSubmit: (p: number, d: number, c: string) => void }) {
  const [price, setPrice] = useState(0);
  const [days, setDays] = useState(7);
  const [comments, setComments] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">Submit quotation</h3>
        <p className="mt-1 text-sm text-muted-foreground">{rfq.title} · Qty {rfq.quantity}</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(price, days, comments); }} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Unit price (₹)</label>
            <input required type="number" min={1} value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Delivery (days)</label>
            <input required type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Comments</label>
            <textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Warranty, payment terms, etc." className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm">Cancel</button>
            <button className="h-10 rounded-lg bg-[var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}