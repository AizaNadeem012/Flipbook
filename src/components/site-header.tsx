import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Book, LogOut, Shield, User as UserIcon, Search, Menu, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { UploadDialog } from "@/components/upload-dialog";

export function SiteHeader() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) {
      router.navigate({ to: "/search", search: { q: searchQ.trim() } });
      setSearchQ("");
      setMobileOpen(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-clay text-primary-foreground shadow-soft">
              <Book className="h-4 w-4" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Folio</span>
          </Link>

          {/* Desktop search bar */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-sm mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search catalogs…"
                className="h-9 rounded-full pl-9 pr-4 text-sm bg-secondary/50 border-border/60"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/browse"
              className="rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm bg-secondary text-foreground" }}
            >
              Browse
            </Link>
            <Link
              to="/search"
              search={{ q: "" }}
              className="rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-secondary"
            >
              Search
            </Link>

            {/* Upload button — prominent */}
            <Button
              size="sm"
              className="rounded-full ml-1 shadow-soft"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload PDF
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5 max-w-32 truncate">
                      {user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin">
                          <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="rounded-full hidden sm:flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}

            {/* Mobile: Upload button */}
            <Button
              size="icon"
              className="rounded-full md:hidden shadow-soft"
              onClick={() => setUploadOpen(true)}
              aria-label="Upload PDF"
            >
              <Upload className="h-4 w-4" />
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="border-t border-border/60 bg-card px-4 pb-4 pt-2 md:hidden">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search catalogs…"
                  className="h-10 rounded-full pl-10"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <Link
                to="/browse"
                className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                Browse Catalogs
              </Link>
              <Link
                to="/search"
                search={{ q: "" }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                Search
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {!user && (
                <Link
                  to="/auth"
                  className="mt-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Upload dialog — accessible from navbar */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  );
}
