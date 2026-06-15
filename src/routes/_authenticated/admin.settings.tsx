import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) {
      toast.error("No signed-in user found.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setBusy(true);
    try {
      // Verify the current password by re-authenticating.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary/70" /> Change password
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your current password, then set a new one.
        </p>

        <form onSubmit={changePassword} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
