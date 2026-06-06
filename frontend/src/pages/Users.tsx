import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import RoleBadge from "@/components/RoleBadge";
import { useAppDispatch, useAppSelector } from "@/store";
import { addUser, deleteUser } from "@/store/slices/usersSlice";
import { Plus, Trash2 } from "lucide-react";
import type { Role } from "@/lib/mockData";

export default function UsersPage() {
  const users = useAppSelector((s) => s.users.items);
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage who can access what across your workspace."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Plus className="h-4 w-4" /> Invite user
          </button>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => dispatch(deleteUser(u.id))} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Invite onClose={() => setOpen(false)} onCreate={(payload) => {
          dispatch(addUser(payload));
          setOpen(false);
        }} />
      )}
    </div>
  );
}

function Invite({ onClose, onCreate }: { onClose: () => void; onCreate: (p: { name: string; email: string; password: string; role: Role }) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PROCUREMENT_OFFICER" as Role });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">Invite user</h3>
        <form onSubmit={(e) => { e.preventDefault(); onCreate(form); }} className="mt-4 space-y-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
            <option value="ADMIN">Admin</option><option value="PROCUREMENT_OFFICER">Procurement Officer</option><option value="MANAGER">Manager</option><option value="VENDOR">Vendor</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-sm">Cancel</button>
            <button className="h-10 rounded-lg bg-[var(--gradient-primary)] px-4 text-sm font-semibold text-primary-foreground">Invite</button>
          </div>
        </form>
      </div>
    </div>
  );
}