import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store";
import { logActivity } from "@/store/slices/activitySlice";
import { addRFQ } from "@/store/slices/rfqsSlice";
import { api } from "@/lib/api";

export default function RFQCreatePage() {
  const dispatch = useAppDispatch();
  const vendors = useAppSelector((s) => s.vendors.items.filter((v) => v.status === "Active"));
  const user = useAppSelector((s) => s.auth.user)!;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", 
    description: "", 
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), 
    category: "Electronics",
  });
  
  const [items, setItems] = useState([{ name: "", quantity: 1, unit: "pcs" }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => setAssigned((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { name: "", quantity: 1, unit: "pcs" }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("rfq_title", form.title);
      formData.append("description", form.description);
      formData.append("deadline", new Date(form.deadline).toISOString());
      formData.append("items", JSON.stringify(items));
      formData.append("assigned_vendors", JSON.stringify(assigned));
      
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await api.post("/rfq", formData);

      const newId = response.data.data.id;
      
      // Dispatch the newly created RFQ to the mock Redux store so the UI can render it immediately!
      dispatch(addRFQ({
        id: newId,
        title: form.title,
        category: form.category,
        description: form.description,
        quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        deadline: new Date(form.deadline).toISOString(),
        assignedVendors: assigned,
        status: "Open",
        code: response.data.data.rfq_title || "RFQ-NEW" 
      } as any));

      dispatch(logActivity({ userId: user.id, action: "CREATE_RFQ", entityType: "RFQ", entityId: newId }));
      
      navigate(`/rfqs/${newId}`);
    } catch (error) {
      console.error("Failed to create RFQ", error);
      alert("Failed to create RFQ. Check console for details.");
    } finally {
      setLoading(false);
    }
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
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed specs, technical requirements, certifications…" className={input + " py-2.5"} />
          </Field>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline"><input required type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={input} /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
                {["Electronics", "Furniture", "Office Supplies", "Raw Materials", "Software", "Services"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Items Required</p>
              <button type="button" onClick={addItem} className="text-xs font-medium text-primary hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input required placeholder="Item Name" value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} className={input.replace("w-full", "flex-1 min-w-[150px]")} />
                  <input required type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, "quantity", Number(e.target.value))} className={input + " w-20"} />
                  <input required placeholder="Unit" value={item.unit} onChange={(e) => updateItem(index, "unit", e.target.value)} className={input + " w-20"} />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Attachments</p>
            <input 
              type="file" 
              multiple 
              onChange={(e) => {
                if (e.target.files) setAttachments(Array.from(e.target.files));
              }}
              className="text-sm text-muted-foreground file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] h-fit">
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
            <button disabled={loading} type="submit" className="h-10 flex-1 rounded-lg bg-primary hover:bg-primary/90 px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-50">
              {loading ? "Publishing..." : "Publish RFQ"}
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