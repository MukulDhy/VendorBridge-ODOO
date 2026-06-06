import PageHeader from "@/components/PageHeader";
import { useAppSelector } from "@/store";
import { format, parseISO } from "date-fns";

export default function ActivityPage() {
  const logs = useAppSelector((s) => s.activity.items);
  const users = useAppSelector((s) => s.users.items);
  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="Immutable audit trail of every action across the platform." />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Reference</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((l) => {
              const u = users.find((x) => x.id === l.userId);
              return (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{format(parseISO(l.timestamp), "PPp")}</td>
                  <td className="px-4 py-3 text-foreground">{u?.name ?? l.userId}</td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{l.action.replaceAll("_", " ")}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{l.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{l.entityId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}