import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Calendar, Send, ShieldCheck, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { fmtINR } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { setQuotationStatus } from "@/store/slices/quotationsSlice";
import { requestApproval } from "@/store/slices/approvalsSlice";
import { updateRFQStatus } from "@/store/slices/rfqsSlice";
import { logActivity } from "@/store/slices/activitySlice";
import { pushNotification } from "@/store/slices/notificationsSlice";

export default function RFQDetail() {
  const { id } = useParams();
  const rfq = useAppSelector((s) => s.rfqs.items.find((r) => r.id === id));
  const vendors = useAppSelector((s) => s.vendors.items);
  const quotes = useAppSelector((s) => s.quotations.items.filter((q) => q.rfqId === id));
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"price" | "delivery" | "score">("score");

  const enriched = useMemo(() => quotes.map((q) => {
    const v = vendors.find((x) => x.id === q.vendorId)!;
    const priceLow = Math.min(...quotes.map((x) => x.price));
    const dlvLow = Math.min(...quotes.map((x) => x.deliveryDays));
    const priceScore = priceLow / q.price; // 0..1
    const dlvScore = dlvLow / q.deliveryDays;
    const ratingScore = v.rating / 5;
    const score = priceScore * 0.6 + dlvScore * 0.3 + ratingScore * 0.1;
    return { ...q, vendor: v, score: Math.round(score * 100) };
  }), [quotes, vendors]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    if (sortBy === "price") arr.sort((a, b) => a.price - b.price);
    if (sortBy === "delivery") arr.sort((a, b) => a.deliveryDays - b.deliveryDays);
    if (sortBy === "score") arr.sort((a, b) => b.score - a.score);
    return arr;
  }, [enriched, sortBy]);

  if (!rfq) return <p className="text-sm text-muted-foreground">RFQ not found. <Link to="/rfqs" className="text-primary">Back</Link></p>;

  const minPrice = quotes.length ? Math.min(...quotes.map((q) => q.price)) : 0;
  const minDelivery = quotes.length ? Math.min(...quotes.map((q) => q.deliveryDays)) : 0;

  const sendForApproval = (q: typeof enriched[number]) => {
    dispatch(setQuotationStatus({ id: q.id, status: "Shortlisted" }));
    dispatch(requestApproval({ rfqId: rfq.id, quotationId: q.id, amount: q.price * rfq.quantity, remarks: `Shortlisted ${q.vendor.name} via comparison.` }));
    dispatch(logActivity({ userId: user.id, action: "REQUEST_APPROVAL", entityType: "RFQ", entityId: rfq.id }));
    dispatch(pushNotification({ userId: "u3", title: "Approval Required", message: `${rfq.code} awaiting your approval (${fmtINR(q.price * rfq.quantity)}).`, link: "/approvals" }));
    navigate("/approvals");
  };

  return (
    <div>
      <Link to="/rfqs" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to RFQs
      </Link>
      <PageHeader
        title={rfq.title}
        subtitle={`${rfq.code} · ${rfq.category}`}
        actions={
          <>
            <StatusPill status={rfq.status} />
            {rfq.status === "Open" && (
              <button onClick={() => dispatch(updateRFQStatus({ id: rfq.id, status: "Closed" }))} className="h-10 rounded-lg border border-border px-3 text-sm font-medium">
                Close RFQ
              </button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold text-foreground">Specification</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{rfq.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label="Quantity" value={rfq.quantity} />
              <Stat label="Deadline" value={format(parseISO(rfq.deadline), "dd MMM yyyy")} icon={<Calendar className="h-4 w-4" />} />
              <Stat label="Vendors invited" value={rfq.assignedVendors.length} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Quotation comparison</h3>
                <p className="text-xs text-muted-foreground">{quotes.length} quotation{quotes.length !== 1 && "s"} received</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sort by</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                  <option value="score">AI Score</option><option value="price">Price</option><option value="delivery">Delivery</option>
                </select>
              </div>
            </div>

            {sorted.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No quotations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Vendor</th><th className="px-3 py-2 text-right">Unit price</th>
                      <th className="px-3 py-2 text-right">Delivery</th><th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2">AI Score</th><th className="px-3 py-2">Status</th><th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((q) => (
                      <tr key={q.id} className="hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <p className="font-medium text-foreground">{q.vendor.name}</p>
                          <p className="text-xs text-muted-foreground">★ {q.vendor.rating.toFixed(1)} · {q.vendor.onTime}% on-time</p>
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums ${q.price === minPrice ? "font-semibold text-emerald-600" : "text-foreground"}`}>
                          {fmtINR(q.price)}
                        </td>
                        <td className={`px-3 py-3 text-right tabular-nums ${q.deliveryDays === minDelivery ? "font-semibold text-emerald-600" : "text-foreground"}`}>
                          {q.deliveryDays}d
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-medium">{fmtINR(q.price * rfq.quantity)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-[var(--gradient-primary)]" style={{ width: `${q.score}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-foreground">{q.score}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><StatusPill status={q.status} /></td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => sendForApproval(q)} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15">
                            <Send className="h-3 w-3" /> Submit for approval
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI recommendation</h3>
            </div>
            {sorted.length === 0 ? (
              <p className="text-xs text-muted-foreground">Awaiting quotations.</p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">Best balance of price, delivery and rating:</p>
                <p className="mt-2 text-base font-semibold text-foreground">{sorted[0].vendor.name}</p>
                <p className="text-xs text-muted-foreground">Score {sorted[0].score} · {fmtINR(sorted[0].price)} · {sorted[0].deliveryDays}d</p>
                <button onClick={() => sendForApproval(sorted[0])} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--gradient-primary)] py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
                  <Award className="h-4 w-4" /> Award & request approval
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">Invited vendors</h3></div>
            <ul className="space-y-2 text-sm">
              {rfq.assignedVendors.map((vid) => {
                const v = vendors.find((x) => x.id === vid);
                const submitted = quotes.some((q) => q.vendorId === vid);
                return (
                  <li key={vid} className="flex items-center justify-between rounded-lg border border-border p-2">
                    <span className="text-foreground">{v?.name ?? vid}</span>
                    {submitted ? <span className="text-xs font-medium text-emerald-600">Submitted</span> : <span className="text-xs text-muted-foreground">Pending</span>}
                  </li>
                );
              })}
              {rfq.assignedVendors.length === 0 && <p className="text-xs text-muted-foreground">No vendors invited.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">{icon}{value}</p>
    </div>
  );
}