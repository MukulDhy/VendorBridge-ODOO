import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Edit2, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { setPOs, deletePO } from "@/store/slices/poSlice";
import { api, fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";

export default function PurchaseOrdersPage() {
  const pos = useAppSelector((s) => s.purchaseOrders.items);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"created_at" | "total_amount">("created_at");

  useEffect(() => {
    setLoading(true);
    api.get("/po")
      .then((res) => {
        if (res.data.success) {
          const mapped = res.data.data.map((p: any) => ({
            id: p.id,
            code: p.po_number,
            vendorId: p.vendor_id,
            vendorName: p.vendor_name,
            rfqTitle: p.rfq_title,
            items: typeof p.items === "string" ? JSON.parse(p.items) : p.items,
            totalAmount: p.total_amount,
            status: p.status === "pending_approval" ? "Pending" 
                  : p.status === "approved" ? "Approved"
                  : p.status === "rejected" ? "Rejected"
                  : p.status === "invoiced" ? "Invoiced"
                  : "Draft",
            createdAt: new Date(p.created_at).toISOString(),
          }));
          dispatch(setPOs(mapped));
        }
      })
      .catch((err) => console.error("Failed to fetch POs", err))
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft PO?")) return;
    try {
      const res = await api.delete(`/po/${id}`);
      if (res.data.success) {
        dispatch(deletePO(id));
        toast.success("PO deleted successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete PO");
    }
  };

  const filtered = useMemo(() => {
    let arr = [...pos];
    if (statusFilter !== "All") {
      arr = arr.filter((p) => p.status === statusFilter);
    }
    arr.sort((a, b) => {
      if (sortBy === "total_amount") return (b.totalAmount || 0) - (a.totalAmount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  }, [pos, statusFilter, sortBy]);

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="All issued POs across vendors."
        actions={
          user?.role?.toUpperCase() === "PROCUREMENT_OFFICER" && (
            <button 
              onClick={() => toast.info("To create a PO, go to an RFQ's Quotation Compare page and select a quotation!")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create PO
            </button>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Invoiced">Invoiced</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
        >
          <option value="created_at">Sort by Date</option>
          <option value="total_amount">Sort by Amount</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">PO Number</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">RFQ Title</th>
              <th className="px-4 py-3 text-right">Total Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No purchase orders found.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{p.code}</td>
                  <td className="px-4 py-3 text-foreground">{p.vendorName || "Unknown Vendor"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.rfqTitle || "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtINR(p.totalAmount || 0)}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{format(parseISO(p.createdAt), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/pos/${p.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary hover:underline">
                        <Eye className="h-3 w-3" /> View
                      </Link>
                      {(user?.role?.toUpperCase() === "PROCUREMENT_OFFICER" || user?.role?.toUpperCase() === "ADMIN") && p.status === "Draft" && (
                        <>
                          <Link to={`/pos/${p.id}/edit`} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary hover:underline">
                            <Edit2 className="h-3 w-3" /> Edit
                          </Link>
                          <button onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive hover:underline">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}