import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "customer";

export interface AppUser {
  id: string;
  email: string;
  display_name: string | null;
  roles: AppRole[];
}

async function loadAppUser(user: User): Promise<AppUser> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  return {
    id: user.id,
    email: user.email ?? "",
    display_name: profile?.display_name ?? user.user_metadata?.display_name ?? null,
    roles: (roles ?? []).map((r) => r.role as AppRole),
  };
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  return loadAppUser(data.session.user);
}

export async function signInAdmin(email: string, password: string): Promise<AppUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message ?? "Sign in failed");

  const appUser = await loadAppUser(data.user);
  if (!appUser.roles.includes("admin")) {
    await supabase.auth.signOut();
    throw new Error("This account is not an admin. Contact the site owner for access.");
  }
  return appUser;
}

function friendlySupabaseError(message: string): string {
  if (/fetch failed|failed to fetch|network/i.test(message)) {
    return "Cannot reach Supabase. Check VITE_SUPABASE_URL in .env and connect a real Supabase project.";
  }
  if (/could not find the function.*has_any_admin/i.test(message)) {
    return "Database setup incomplete. Run supabase/migrations/20260614180000_claim_first_admin.sql in Supabase SQL Editor.";
  }
  if (/could not find the function.*claim_first_admin/i.test(message)) {
    return "Database setup incomplete. Run supabase/migrations/20260614180000_claim_first_admin.sql in Supabase SQL Editor.";
  }
  return message;
}

export async function hasAnyAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_any_admin");
  if (error) throw new Error(friendlySupabaseError(error.message));
  return data === true;
}

async function ensureSignedIn(email: string, password: string, displayName = "Admin") {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) return sessionData.session.user;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (signUpError && !/already registered|already exists/i.test(signUpError.message)) {
    throw new Error(friendlySupabaseError(signUpError.message));
  }

  if (signUpData.session?.user) return signUpData.session.user;

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signInData.user) {
    throw new Error(
      signInError
        ? friendlySupabaseError(signInError.message)
        : "Confirm your email in Supabase, then try again.",
    );
  }
  return signInData.user;
}

export async function bootstrapFirstAdmin(
  email: string,
  password: string,
  displayName = "Admin",
): Promise<AppUser> {
  try {
    const anyAdmin = await hasAnyAdmin();
    if (anyAdmin) throw new Error("An admin account already exists. Sign in instead.");
  } catch (err) {
    if (err instanceof Error && /already exists/i.test(err.message)) throw err;
    // If the check RPC is missing or unreachable, still try setup and surface a clearer error below.
  }

  await ensureSignedIn(email, password, displayName);

  const { error: claimError } = await supabase.rpc("claim_first_admin");
  if (claimError) throw new Error(friendlySupabaseError(claimError.message));

  const appUser = await getCurrentAppUser();
  if (!appUser?.roles.includes("admin")) {
    throw new Error("Admin setup failed. Run the SQL migration on Supabase, then try again.");
  }
  return appUser;
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message ?? "Failed to change password");
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function sync() {
      const appUser = await getCurrentAppUser();
      if (mounted) {
        setUser(appUser);
        setLoading(false);
      }
    }

    sync();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(await loadAppUser(session.user));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return {
    user,
    roles: user?.roles ?? [],
    loading,
    isAdmin: user?.roles.includes("admin") ?? false,
    isAuthenticated: !!user,
    signOut,
  };
}
