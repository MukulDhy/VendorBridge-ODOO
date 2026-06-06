const tones: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Inactive: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Blacklisted: "bg-red-500/10 text-red-700 border-red-500/20",
  Open: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Closed: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Awarded: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  Cancelled: "bg-red-500/10 text-red-700 border-red-500/20",
  Pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  Approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  Submitted: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Shortlisted: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  Issued: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Invoiced: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Paid: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  Overdue: "bg-red-500/10 text-red-700 border-red-500/20",
};

export default function StatusPill({ status }: { status: string }) {
  const cls = tones[status] ?? "bg-muted text-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}