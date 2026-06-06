import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { signup, clearError } from "@/store/slices/authSlice";
import type { Role } from "@/lib/mockData";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PROCUREMENT_OFFICER");
  const dispatch = useAppDispatch();
  const { user, error } = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);
  useEffect(() => () => { dispatch(clearError()); }, [dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-subtle)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gradient-primary)] text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">VendorBridge</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Get started in under a minute.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); dispatch(signup({ name, email, password, role })); }}
          className="mt-6 space-y-4"
        >
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="Work email"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={6} placeholder="Password"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2">
            <option value="ADMIN">Admin</option>
            <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
            <option value="MANAGER">Manager / Approver</option>
            <option value="VENDOR">Vendor</option>
          </select>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button className="h-11 w-full rounded-lg bg-[var(--gradient-primary)] text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}