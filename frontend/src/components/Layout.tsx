import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  LayoutDashboard, FileText, Users, ShoppingCart, ReceiptText, BarChart3,
  Bell, ClipboardList, CheckCircle2, Building2, LogOut, Menu, X, Send, Search,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/slices/authSlice";
import RoleBadge from "./RoleBadge";
import type { Role } from "@/lib/mockData";

interface NavItem { to: string; label: string; icon: any; roles: Role[] }

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { to: "/rfqs", label: "RFQs", icon: FileText, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { to: "/vendor/rfqs", label: "Open RFQs", icon: FileText, roles: ["VENDOR"] },
  { to: "/vendor/quotations", label: "My Quotations", icon: Send, roles: ["VENDOR"] },
  { to: "/vendor/orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["VENDOR"] },
  { to: "/vendors", label: "Vendors", icon: Building2, roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
  { to: "/approvals", label: "Approvals", icon: CheckCircle2, roles: ["MANAGER", "ADMIN"] },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { to: "/invoices", label: "Invoices", icon: ReceiptText, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"] },
  { to: "/activity", label: "Activity Logs", icon: ClipboardList, roles: ["ADMIN"] },
  { to: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
];

export default function Layout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user)!;
  const notifs = useAppSelector((s) => s.notifications.items.filter((n) => (n.userId === user.id || n.userId === "all") && !n.read));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = useMemo(() => NAV.filter((n) => n.roles.includes(user.role)), [user.role]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[var(--gradient-subtle)]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-foreground">VendorBridge</p>
            <p className="-mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Procurement ERP</p>
          </div>
          <button className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <button onClick={handleLogout} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-8">
          <button className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search RFQs, vendors, invoices…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate("/notifications")} className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              {notifs.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {notifs.length}
                </span>
              )}
            </button>
          </div>
        </header>
        <main key={location.pathname} className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}