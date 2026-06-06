import PageHeader from "@/components/PageHeader";
import { useAppDispatch, useAppSelector } from "@/store";
import { markAllRead, markRead } from "@/store/slices/notificationsSlice";
import { Bell, CheckCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const items = useAppSelector((s) => s.notifications.items.filter((n) => n.userId === user.id || n.userId === "all"));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay on top of approvals, quotations and orders."
        actions={
          <button onClick={() => dispatch(markAllRead(user.id))} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium">
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        }
      />
      <div className="space-y-2">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => { dispatch(markRead(n.id)); if (n.link) navigate(n.link); }}
            className={`flex w-full items-start gap-3 rounded-xl border border-border p-4 text-left transition hover:shadow-[var(--shadow-card)] ${
              n.read ? "bg-card" : "bg-primary/5"
            }`}
          >
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{format(parseISO(n.createdAt), "PPp")}</p>
            </div>
          </button>
        ))}
        {items.length === 0 && <p className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">You're all caught up.</p>}
      </div>
    </div>
  );
}