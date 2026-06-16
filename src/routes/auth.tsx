import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book, Shield } from "lucide-react";
import { toast } from "sonner";
import { bootstrapFirstAdmin, getCurrentAppUser, hasAnyAdmin, signInAdmin } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Admin sign in — Folio" },
      { name: "description", content: "Sign in as admin to manage catalogs and categories." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(true);
  const [setupChecked, setSetupChecked] = useState(false);
  const [setupWarning, setSetupWarning] = useState<string | null>(null);

  useEffect(() => {
    getCurrentAppUser().then((user) => {
      if (user?.roles.includes("admin")) {
        navigate({ to: redirect ?? "/admin", replace: true });
      }
    });
  }, [navigate, redirect]);

  useEffect(() => {
    hasAnyAdmin()
      .then((exists) => {
        setNeedsSetup(!exists);
        setSetupWarning(null);
      })
      .catch((err) => {
        setNeedsSetup(true);
        setSetupWarning(err instanceof Error ? err.message : "Could not check admin status");
      })
      .finally(() => setSetupChecked(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (needsSetup) {
        await bootstrapFirstAdmin(email, password);
        toast.success("Admin account created");
      } else {
        await signInAdmin(email, password);
        toast.success("Welcome back, admin");
      }
      navigate({ to: redirect ?? "/admin", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const isSetup = needsSetup;

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-12">
        <Link to="/" className="mb-10 flex items-center gap-2 self-start">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-clay text-primary-foreground shadow-soft">
            <Book className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold">Folio</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-elegant">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-widest">Admin only</span>
          </div>
          <h1 className="mt-3 font-display text-3xl">{isSetup ? "Create admin" : "Sign in"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSetup
              ? "First-time setup — create the admin account for this site."
              : "Manage catalogs and categories. Visitors can browse without signing in."}
          </p>

          {setupWarning ? (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              {setupWarning}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete={isSetup ? "new-password" : "current-password"}
                minLength={6}
                maxLength={128}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy
                ? "Please wait…"
                : !setupChecked
                  ? "Checking…"
                  : isSetup
                    ? "Create admin account"
                    : "Sign in as admin"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/browse" className="text-primary hover:underline">
            Browse catalogs
          </Link>{" "}
          as a visitor — no account needed.
        </p>
      </div>
    </div>
  );
}
