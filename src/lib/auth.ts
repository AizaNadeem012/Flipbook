import { useEffect, useState, useCallback } from "react";
import { localCurrentUser, localSignOut, type LocalUser } from "./store";

export type AppRole = "admin" | "customer";

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(localCurrentUser());
    setLoading(false);
  }, []);

  const signOut = useCallback(() => {
    localSignOut();
    setUser(null);
  }, []);

  return {
    user,
    roles: user ? [user.role] as AppRole[] : [],
    loading,
    isAdmin: user?.role === "admin",
    isAuthenticated: !!user,
    signOut,
  };
}
