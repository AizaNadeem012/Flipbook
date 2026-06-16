import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getCatalogs, getCategories } from "@/lib/store";
import { changePassword, changeEmail, useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Book, FolderTree, Eye, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [catalogs, categories] = await Promise.all([getCatalogs(), getCategories()]);
      const totalViews = catalogs.reduce((s, c) => s + (c.view_count ?? 0), 0);
      return {
        categories: categories.length,
        catalogs: catalogs.length,
        totalViews,
        recent: catalogs.slice(0, 5),
      };
    },
  });

  const stats = [
    { label: "Total catalogs", value: data?.catalogs ?? 0, icon: Book },
    { label: "Categories", value: data?.categories ?? 0, icon: FolderTree },
    { label: "Total views", value: data?.totalViews ?? 0, icon: Eye },
  ];

  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) setNewEmail(user.email);
  }, [user]);

  async function handlePasswordChange() {
    if (!newPassword || newPassword.length < 6) {
      return toast.error("Enter a new password (at least 6 characters)");
    }
    setChanging(true);
    try {
      await changePassword(newPassword);
      toast.success("Password changed successfully");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setChanging(false);
    }
  }

  async function handleEmailChange() {
    if (!newEmail || !newEmail.includes("@")) {
      return toast.error("Enter a valid email");
    }
    setChangingEmail(true);
    try {
      await changeEmail(newEmail);
      toast.success("Email updated. Check your inbox to confirm the new address.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email change failed";
      if (/rate limit/i.test(message)) {
        toast.error("Too many email requests. Wait a bit (about an hour) and try again.");
      } else {
        toast.error(message);
      }
    } finally {
      setChangingEmail(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your catalog platform.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary/60" />
            </div>
            <p className="mt-3 font-display text-4xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2"><Clock className="h-4 w-4" />Recent uploads</h3>
        <div className="space-y-2">
          {data?.recent.length === 0 && <p className="text-sm text-muted-foreground">No catalogs yet.</p>}
          {data?.recent.map((r) => (
            <div key={r.id} className="flex justify-between rounded-lg px-3 py-2 hover:bg-secondary/60">
              <span className="text-sm font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg mb-4">Account</h3>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="text-xs font-medium">Change email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email"
              className="mt-2 w-full rounded-xl border px-3 py-2"
            />
            <div className="mt-2">
              <button onClick={handleEmailChange} disabled={changingEmail} className="rounded-full bg-primary px-4 py-2 text-white">
                {changingEmail ? "Updating…" : "Change email"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Change password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="mt-2 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handlePasswordChange} disabled={changing} className="rounded-full bg-primary px-4 py-2 text-white">
              {changing ? "Changing…" : "Change password"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
