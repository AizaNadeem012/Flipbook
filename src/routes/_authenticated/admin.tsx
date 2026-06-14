import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Book, FolderTree, Upload, LayoutDashboard, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/", replace: true });
  }, [isAdmin, loading, navigate]);

  if (loading || !isAdmin) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking access…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="font-display text-xl">Admin</h1>
          </div>
          <nav className="flex gap-1 text-sm overflow-x-auto">
            <Link to="/admin" activeOptions={{ exact: true }} className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "rounded-full px-3 py-1.5 bg-secondary" }}>
              <LayoutDashboard className="mr-1 inline h-3.5 w-3.5" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to="/admin/categories" className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "rounded-full px-3 py-1.5 bg-secondary" }}>
              <FolderTree className="mr-1 inline h-3.5 w-3.5" /><span className="hidden sm:inline">Categories</span>
            </Link>
            <Link to="/admin/catalogs" className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-secondary" activeProps={{ className: "rounded-full px-3 py-1.5 bg-secondary" }}>
              <Upload className="mr-1 inline h-3.5 w-3.5" /><span className="hidden sm:inline">Catalogs</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Outlet /></main>
    </div>
  );
}
