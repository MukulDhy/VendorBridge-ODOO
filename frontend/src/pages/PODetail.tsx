import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { api, fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { useAppSelector } from "@/store";

export default function PODetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/po/${id}`)
      .then((res) => {
        if (res.data.success) {
          setPo(res.data.data);
        }
      })
      .catch((err) => {
        toast.error("Failed to load Purchase Order");
        navigate("/pos");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!po) return <p className="text-sm text-muted-foreground p-8">PO not found. <Link to="/pos" className="text-primary hover:underline">Back</Link></p>;

  // Convert raw status to UI status
  const uiStatus = 
    po.status === "pending_approval" ? "Pending" :
    po.status === "approved" ? "Approved" :
    po.status === "rejected" ? "Rejected" :
    po.status === "invoiced" ? "Invoiced" : "Draft";

  const items = typeof po.items === "string" ? JSON.parse(po.items) : po.items || [];

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/pos" className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Purchase Orders
      </Link>

      <PageHeader
        title={`Purchase Order: ${po.po_number}`}
        subtitle={`Generated on ${format(parseISO(po.created_at), "dd MMM yyyy, h:mm a")}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusPill status={uiStatus} />
            {po.status === "approved" && user?.role === "PROCUREMENT_OFFICER" && (
              <button 
                onClick={() => toast.info("Invoice generation coming soon!")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                <FileText className="h-4 w-4" /> Generate Invoice
              </button>
            )}
            {po.status === "invoiced" && (
              <button 
                onClick={() => toast.info("Download coming soon!")}
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/10 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-foreground font-medium">{item.name || item.description || "Unknown Item"}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{item.quantity || 1}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{fmtINR(item.unit_price || item.price || 0)}</td>
                    <td className="px-6 py-4 text-right text-foreground font-medium">{fmtINR(item.total_price || (item.quantity * (item.unit_price || item.price)) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {po.remarks && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Remarks / Terms</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{po.remarks}</p>
            </div>
          )}

          {po.status === "pending_approval" && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Awaiting Manager Approval</h3>
                <p className="text-sm text-amber-700/80 mt-1">This Purchase Order has been submitted and is currently awaiting approval from a manager before it can be invoiced.</p>
              </div>
            </div>
          )}

        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{fmtINR(po.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({po.tax_percentage}%)</span>
                <span>{fmtINR(po.tax_amount)}</span>
              </div>
              <div className="my-2 border-t border-dashed" />
              <div className="flex justify-between font-semibold text-foreground text-base">
                <span>Total Amount</span>
                <span>{fmtINR(po.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Vendor</span>
                <span className="font-medium text-foreground">{po.vendor?.name || "Unknown"}</span>
                {po.vendor?.email && <span className="block text-muted-foreground mt-0.5">{po.vendor.email}</span>}
              </div>
              <div>
                <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Related RFQ</span>
                <Link to={`/rfqs/${po.rfq_id}`} className="font-medium text-primary hover:underline">{po.rfq_title}</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
