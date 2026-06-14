import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book } from "lucide-react";
import { toast } from "sonner";
import { localSignIn, localSignUp, localCurrentUser } from "@/lib/store";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — Folio" },
      { name: "description", content: "Sign in or create an account to browse and manage catalogs." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });

  useEffect(() => {
    const user = localCurrentUser();
    if (user) navigate({ to: redirect ?? "/", replace: true });
  }, [navigate, redirect]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        localSignUp(email, password, name || email.split("@")[0]);
        toast.success("Account created!");
      } else {
        const user = localSignIn(email, password);
        if (!user) throw new Error("Invalid email or password");
        toast.success("Welcome back");
      }
      navigate({ to: redirect ?? "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

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
          <h1 className="font-display text-3xl">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in or create an account to start reading.
          </p>

          {/* Demo hint */}
          <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
            <strong>Demo admin:</strong> admin@folio.app / admin123
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <TabsContent value="signup" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                </div>
              </TabsContent>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={6} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <Button type="submit" className="w-full rounded-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms of use.
        </p>
      </div>
    </div>
  );
}
