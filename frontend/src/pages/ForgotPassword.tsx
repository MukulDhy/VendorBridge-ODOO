import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-subtle)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">VendorBridge</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">We'll send a reset link to your email.</p>
        {sent ? (
          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            If <span className="font-medium">{email}</span> exists, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-6 space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="Email"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2" />
            <button className="h-11 w-full rounded-lg bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)]">
              Send reset link
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}