import type { Role } from "@/lib/mockData";

const styles: Record<Role, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  PROCUREMENT_OFFICER: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  MANAGER: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  VENDOR: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};
const labels: Record<Role, string> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement",
  MANAGER: "Manager",
  VENDOR: "Vendor",
};

export default function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[role]}`}>
      {labels[role]}
    </span>
  );
}