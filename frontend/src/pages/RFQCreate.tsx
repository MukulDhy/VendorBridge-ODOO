import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store";
import { addRFQ } from "@/store/slices/rfqsSlice";
import { logActivity } from "@/store/slices/activitySlice";
import { pushNotification } from "@/store/slices/notificationsSlice";

export default function RFQCreatePage() {
  const dispatch = useAppDispatch();
  const vendors = useAppSelector((s) => s.vendors.items.filter((v) => v.status === "Active"));
  const user = useAppSelector((s) => s.auth.user)!;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", quantity: 1, deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), category: "Electronics",
  });
  const [assigned, setAssigned] = useState<string[]>([]);
  const toggle = (id: string) => setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = addRFQ({ ...form, assignedVendors: assigned, createdBy: user.id, deadline: new Date(form.deadline).toISOString() });
    dispatch(action);
    const newId = (action.payload as any).id;
    dispatch(logActivity({ userId: user.id, action: "CREATE_RFQ", entityType: "RFQ", entityId: newId }));
    assigned.forEach((vid) => {
      const vu = vendors.find((v) => v.id === vid);
      if (vu) dispatch(pushNotification({ userId: `u-vendor-${vid}`, title: "New RFQ Assigned", message: `${form.title} — please submit your quotation.`, link: `/vendor/rfqs` }));
    });
    navigate(`/rfqs/${newId}`);
  };

  return (
    <div>
      <PageHeader title="Create RFQ" subtitle="Define what you need, set a deadline, and invite vendors." />
      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Field label="Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 100 Developer Laptops" className={input} />
          </Field>
          <Field label="Description">
            <textarea required rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed specs, technical requirements, certifications…" className={input + " py-2.5"} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Quantity"><input required type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={input} /></Field>
            <Field label="Deadline"><input required type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={input} /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
                {["Electronics", "Furniture", "Office Supplies", "Raw Materials", "Software", "Services"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold text-foreground">Assign vendors</p>
          <p className="text-xs text-muted-foreground">Select active vendors to invite for quotations.</p>
          <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {vendors.map((v) => (
              <label key={v.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 hover:bg-muted">
                <input type="checkbox" checked={assigned.includes(v.id)} onChange={() => toggle(v.id)} className="h-4 w-4 accent-[color:var(--primary)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.category} · ★ {v.rating.toFixed(1)}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="h-10 flex-1 rounded-lg bg-[var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
              Publish RFQ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const input = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>;
}