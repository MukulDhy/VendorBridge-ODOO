import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { decideApproval } from "@/store/slices/approvalsSlice";
import { setQuotationStatus } from "@/store/slices/quotationsSlice";
import { updateRFQStatus } from "@/store/slices/rfqsSlice";
import { createPO } from "@/store/slices/poSlice";
import { createInvoice } from "@/store/slices/invoicesSlice";
import { logActivity } from "@/store/slices/activitySlice";
import { pushNotification } from "@/store/slices/notificationsSlice";
import { fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";

export default function ApprovalsPage() {
  const approvals = useAppSelector((s) => s.approvals.items);
  const rfqs = useAppSelector((s) => s.rfqs.items);
  const quotations = useAppSelector((s) => s.quotations.items);
  const vendors = useAppSelector((s) => s.vendors.items);
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const navigate = useNavigate();

  const list = approvals.filter((a) => a.status === tab);

  const approve = async (id: string) => {
    const a = approvals.find((x) => x.id === id)!;
    const q = quotations.find((x) => x.id === a.quotationId)!;
    const r = rfqs.find((x) => x.id === a.rfqId)!;
    dispatch(decideApproval({ id, status: "Approved", remarks: "Approved" }));
    dispatch(setQuotationStatus({ id: q.id, status: "Awarded" }));
    dispatch(updateRFQStatus({ id: r.id, status: "Awarded" }));
    try {
      const po = await dispatch(
        createPO({
          rfqId: r.id,
          quotationId: q.id,
          vendorId: q.vendorId,
          items: [{ name: r.title, qty: r.quantity, price: q.price }],
          taxRate: 18,
        })
      ).unwrap();
      const poId = po.id;
      const total = q.price * r.quantity * 1.18;
      dispatch(createInvoice({ poId, vendorId: q.vendorId, amount: total, taxRate: 18, dueDate: new Date(Date.now() + 30 * 86400000).toISOString() }));
      dispatch(logActivity({ userId: user.id, action: "APPROVE_RFQ", entityType: "Approval", entityId: id }));
      dispatch(pushNotification({ userId: "u2", title: "Approval Granted", message: `${r.code} approved by ${user.name}. PO generated.`, link: "/purchase-orders" }));
      navigate("/purchase-orders");
    } catch (err) {
      console.error("Failed to approve RFQ / create PO:", err);
    }
  };

  const reject = (id: string) => {
    const a = approvals.find((x) => x.id === id)!;
    dispatch(decideApproval({ id, status: "Rejected", remarks: "Rejected by approver." }));
    dispatch(setQuotationStatus({ id: a.quotationId, status: "Rejected" }));
    dispatch(logActivity({ userId: user.id, action: "REJECT_APPROVAL", entityType: "Approval", entityId: id }));
  };

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Review shortlisted quotations and authorize purchase orders." />
      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
        {(["Pending", "Approved", "Rejected"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t} <span className="ml-1 text-xs opacity-75">({approvals.filter((a) => a.status === t).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((a) => {
          const r = rfqs.find((x) => x.id === a.rfqId);
          const q = quotations.find((x) => x.id === a.quotationId);
          const v = vendors.find((x) => x.id === q?.vendorId);
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{r?.code}</p>
                  <h3 className="text-base font-semibold text-foreground">{r?.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Vendor: <span className="font-medium text-foreground">{v?.name}</span> · {q?.deliveryDays}d delivery</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold text-foreground">{fmtINR(a.amount)}</p>
                  <StatusPill status={a.status} />
                </div>
              </div>
              <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">{a.remarks}</p>
              <p className="mt-2 text-xs text-muted-foreground">Requested {format(parseISO(a.createdAt), "PPp")}{a.decidedAt && ` · Decided ${format(parseISO(a.decidedAt), "PPp")}`}</p>
              {a.status === "Pending" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => approve(a.id)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => reject(a.id)} className="inline-flex items-center gap-2 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No {tab.toLowerCase()} items.</p>}
      </div>
    </div>
  );
}