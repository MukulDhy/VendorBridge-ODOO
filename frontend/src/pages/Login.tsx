import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Building2, Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { login, clearError } from "@/store/slices/authSlice";

const DEMO = [
  { role: "Admin", email: "admin@vendorbridge.io", pw: "admin123" },
  { role: "Procurement Officer", email: "officer@vendorbridge.io", pw: "officer123" },
  { role: "Manager", email: "manager@vendorbridge.io", pw: "manager123" },
  { role: "Vendor (Dell)", email: "vendor@dell.com", pw: "vendor123" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@vendorbridge.io");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const dispatch = useAppDispatch();
  const { user, error } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard";

  useEffect(() => { if (user) navigate(from, { replace: true }); }, [user, from, navigate]);
  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-foreground">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[--gradient-primary] p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">VendorBridge</span>
        </div>
        <div className="space-y-6">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            The procurement ERP your team actually wants to use.
          </h1>
          <p className="max-w-md text-base text-primary-foreground/80">
            Centralize RFQs, quotations, approvals, purchase orders and invoices — replace the spreadsheets, emails
            and WhatsApp threads with one auditable workflow.
          </p>
          <div className="grid max-w-md grid-cols-3 gap-3 pt-4">
            {["RFQ", "Compare", "Approve", "PO", "Invoice", "Insights"].map((k) => (
              <div key={k} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center text-xs font-medium backdrop-blur">
                {k}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">© 2026 VendorBridge — Procurement, simplified.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[--gradient-primary] text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-primary-foreground">VendorBridge</span>
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-primary-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-primary-foreground">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot?</Link>
              </div>
              <div className="relative mt-1">
                <input
                  type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none ring-primary/30 focus:ring-2"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" className="h-11 w-full rounded-lg bg-[var(--gradient-primary)] text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-95">
              Sign in
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link>
            </p>
          </form>

          <div className="mt-10 rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo accounts</p>
            <div className="space-y-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className="font-medium text-foreground">{d.role}</span>
                  <span className="text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}