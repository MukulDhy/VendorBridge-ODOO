import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { api, fmtINR } from "@/lib/api";

export default function POCreatePage() {
  const { quotationId, id } = useParams(); // if id exists, we are editing
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [poData, setPoData] = useState<any>(null);
  const [taxPercentage, setTaxPercentage] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");

  const [preview, setPreview] = useState<{ vendor_name: string; items: any[]; subtotal: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    if (id) {
      api.get(`/po/${id}`).then((res) => {
        if (res.data.success) {
          const po = res.data.data;
          setPoData(po);
          setTaxPercentage(Number(po.tax_percentage));
          setRemarks(po.remarks || "");
          setPreview({
            vendor_name: po.vendor?.name || "Unknown",
            items: typeof po.items === "string" ? JSON.parse(po.items) : po.items,
            subtotal: Number(po.subtotal)
          });
        }
      }).catch(err => {
        toast.error("Failed to load PO");
        navigate("/pos");
      }).finally(() => setLoading(false));
    } else if (quotationId) {
      api.get(`/po/preview/${quotationId}`).then((res) => {
        if (res.data.success) {
          setPreview(res.data.data);
        }
      }).catch(err => {
        toast.error("Failed to load Quotation preview");
        navigate("/pos");
      }).finally(() => setLoading(false));
    } else {
      navigate("/pos");
    }
  }, [id, quotationId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (id) {
        // Edit
        const res = await api.patch(`/po/${id}`, {
          tax_percentage: taxPercentage,
          remarks
        });
        if (res.data.success) {
          toast.success("Purchase Order updated successfully");
          navigate(`/pos/${id}`);
        }
      } else {
        // Create
        const res = await api.post("/po", {
          quotation_id: quotationId,
          tax_percentage: taxPercentage,
          remarks
        });
        if (res.data.success) {
          toast.success("Purchase Order generated successfully");
          navigate(`/pos/${res.data.data.id}`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save Purchase Order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;

  const subtotal = preview?.subtotal || 0;
  const parsedTax = typeof taxPercentage === "number" ? taxPercentage : 0;
  const taxAmount = subtotal * (parsedTax / 100);
  const totalAmount = subtotal + taxAmount;

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </button>

      <PageHeader 
        title={id ? "Edit Purchase Order" : "Generate Purchase Order"} 
        subtitle={id ? `Updating ${poData?.po_number}` : "Set tax and remarks for the selected quotation."} 
      />

      <div className="grid gap-6 md:grid-cols-3">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Purchase Order Details</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">Tax Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={taxPercentage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") setTaxPercentage("");
                    else if (Number(val) <= 100) setTaxPercentage(Number(val));
                  }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">Remarks / Terms (Optional)</label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any specific terms, conditions, or internal notes..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-input bg-transparent px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {id ? <><Save className="h-4 w-4" /> Save Changes</> : <><Send className="h-4 w-4" /> Generate PO</>}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Preview Summary</h3>
            <div className="mb-4">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Vendor</span>
              <span className="font-medium text-foreground">{preview?.vendor_name || "Unknown"}</span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({preview?.items?.length || 0} items)</span>
                <span>{fmtINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({taxPercentage}%)</span>
                <span>{fmtINR(taxAmount)}</span>
              </div>
              <div className="my-2 border-t border-dashed" />
              <div className="flex justify-between font-semibold text-foreground text-base">
                <span>Total Amount</span>
                <span>{fmtINR(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
