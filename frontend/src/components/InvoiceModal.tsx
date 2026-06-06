import { X, Printer, Mail, Download } from "lucide-react";
import { useAppSelector } from "@/store";
import { fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";
import type { Invoice } from "@/lib/mockData";

export default function InvoiceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const vendor = useAppSelector((s) => s.vendors.items.find((v) => v.id === invoice.vendorId));
  const po = useAppSelector((s) => s.purchaseOrders.items.find((p) => p.id === invoice.poId));
  const subtotal = po ? po.items.reduce((s, i) => s + i.price * i.qty, 0) : invoice.amount / (1 + invoice.taxRate / 100);
  const tax = subtotal * (invoice.taxRate / 100);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 print:bg-white print:p-0" onClick={onClose}>
      <div className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-white shadow-[var(--shadow-elegant)] print:my-0 print:rounded-none print:border-0 print:shadow-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-3 print:hidden">
          <p className="text-sm font-semibold text-foreground">Invoice preview</p>
          <div className="flex gap-1">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"><Printer className="h-3.5 w-3.5" />Print</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" />PDF</button>
            <a href={`mailto:${vendor?.email}?subject=${invoice.code}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"><Mail className="h-3.5 w-3.5" />Email</a>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-10 text-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold tracking-tight">VendorBridge</p>
              <p className="text-xs text-slate-500">Procurement ERP · Mumbai, India</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tracking-tight">INVOICE</p>
              <p className="font-mono text-sm text-slate-500">{invoice.code}</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs uppercase text-slate-500">Billed to</p>
              <p className="mt-1 font-semibold">{vendor?.name}</p>
              <p className="text-slate-600">{vendor?.address}</p>
              <p className="text-slate-600">GST {vendor?.gst}</p>
              <p className="text-slate-600">{vendor?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-slate-500">Issued</p>
              <p className="mt-1">{format(parseISO(invoice.createdAt), "dd MMM yyyy")}</p>
              <p className="mt-3 text-xs uppercase text-slate-500">Due</p>
              <p className="mt-1">{format(parseISO(invoice.dueDate), "dd MMM yyyy")}</p>
              <p className="mt-3 text-xs uppercase text-slate-500">PO Reference</p>
              <p className="mt-1 font-mono">{po?.code}</p>
            </div>
          </div>
          <table className="mt-10 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit price</th><th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(po?.items ?? [{ name: "Goods", qty: 1, price: subtotal }]).map((it, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-3">{it.name}</td>
                  <td className="py-3 text-right tabular-nums">{it.qty}</td>
                  <td className="py-3 text-right tabular-nums">{fmtINR(it.price)}</td>
                  <td className="py-3 text-right tabular-nums">{fmtINR(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{fmtINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">GST ({invoice.taxRate}%)</span><span className="tabular-nums">{fmtINR(tax)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold"><span>Grand total</span><span className="tabular-nums">{fmtINR(invoice.amount)}</span></div>
            </div>
          </div>
          <p className="mt-12 text-xs text-slate-500">Thank you for partnering with VendorBridge. Payment terms: Net 30. Bank: HDFC · A/C 5012-XXXX-XXX · IFSC HDFC0001234.</p>
        </div>
      </div>
    </div>
  );
}