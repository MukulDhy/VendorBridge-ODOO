import { useMemo, useState } from "react";
import { Plus, Search, Building2, Mail, Phone, Star, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import { useAppDispatch, useAppSelector } from "@/store";
import { addVendor, deleteVendor, setStatus } from "@/store/slices/vendorsSlice";
import type { Vendor } from "@/lib/mockData";

export default function VendorsPage() {
  const vendors = useAppSelector((s) => s.vendors.items);
  const dispatch = useAppDispatch();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [statusF, setStatusF] = useState<string>("All");

  const filtered = useMemo(() => vendors.filter((v) =>
    (statusF === "All" || v.status === statusF) &&
    (v.name.toLowerCase().includes(q.toLowerCase()) || v.category.toLowerCase().includes(q.toLowerCase()))
  ), [vendors, q, statusF]);

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="Manage your supplier directory and performance."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Plus className="h-4 w-4" /> Add vendor
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or category…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none ring-primary/30 focus:ring-2" />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm">
          <option>All</option><option>Active</option><option>Inactive</option><option>Blacklisted</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div key={v.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elegant)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.category} · {v.address}</p>
              </div>
              <StatusPill status={v.status} />
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{v.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{v.phone}</p>
              <p className="font-mono">GST {v.gst}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold text-foreground">{v.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">· {v.onTime}% on-time</span>
              </div>
              <div className="flex gap-1">
                <select value={v.status} onChange={(e) => dispatch(setStatus({ id: v.id, status: e.target.value as Vendor["status"] }))}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                  <option>Active</option><option>Inactive</option><option>Blacklisted</option>
                </select>
                <button onClick={() => dispatch(deleteVendor(v.id))} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && <AddVendorModal onClose={() => setOpen(false)} onCreate={(v) => { dispatch(addVendor(v)); setOpen(false); }} />}
    </div>
  );
}

function AddVendorModal({ onClose, onCreate }: { onClose: () => void; onCreate: (v: any) => void }) {
  const [form, setForm] = useState({ name: "", gst: "", email: "", phone: "", address: "", category: "Electronics", status: "Active" as Vendor["status"] });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">Add new vendor</h3>
        <form onSubmit={(e) => { e.preventDefault(); onCreate(form); }} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={set("name")} required />
          <Input label="GST number" value={form.gst} onChange={set("gst")} required />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
          <Input label="Phone" value={form.phone} onChange={set("phone")} required />
          <Input label="Address" value={form.address} onChange={set("address")} className="sm:col-span-2" />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select value={form.category} onChange={set("category")} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
              {["Electronics", "Furniture", "Office Supplies", "Raw Materials", "Software", "Services"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select value={form.status} onChange={set("status")} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
              <option>Active</option><option>Inactive</option><option>Blacklisted</option>
            </select>
          </div>
          <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm font-medium">Cancel</button>
            <button className="h-10 rounded-lg bg-primary hover:bg-primary/90 px-4 text-sm font-semibold text-primary-foreground">Create vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, className = "", ...rest }: any) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input {...rest} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2" />
    </div>
  );
}