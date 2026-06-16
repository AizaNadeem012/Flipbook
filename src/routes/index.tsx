import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import {
  Book, Sparkles, Zap, Layers, Search, ArrowRight,
  BookOpen, Eye, Monitor, Smartphone, Download, FolderTree,
  Maximize, Play, Volume2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveBook } from "@/components/interactive-book";
import { CatalogCover } from "@/components/catalog-cover";
import { getCatalogs, getCategories, type Catalog } from "@/lib/store";
import { useState } from "react";
import { useInView } from "@/hooks/use-in-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Folio — Premium Digital Catalog Reader" },
      { name: "description", content: "Browse, search and read beautiful PDF catalogs in a realistic flipbook experience." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [searchQ, setSearchQ] = useState("");
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [catalogs, categories] = await Promise.all([getCatalogs(), getCategories()]);
      return { catalogs: catalogs.length, categories: categories.length };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["landing-recent"],
    queryFn: async () => (await getCatalogs()).slice(0, 8),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) {
      router.navigate({ to: "/search", search: { q: searchQ.trim() } });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 lg:px-8 lg:pt-16 lg:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              A new way to read catalogs
            </div>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
              Catalogs that<br />
              <span className="italic text-primary">turn the page.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Browse and read PDF catalogs with realistic page turns,
              sound effects, and a paper-warm interface.
            </p>
          </div>

          {/* Search bar — prominent on homepage */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search catalogs by name or topic…"
                  className="h-12 rounded-full pl-11 pr-4 text-base shadow-soft border-border/60"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full h-12 px-6 shadow-soft">
                Search
              </Button>
            </div>
          </form>

          {/* Quick actions */}
          <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full shadow-soft">
              <Link to="/browse">
                <BookOpen className="mr-2 h-4 w-4" /> Browse Catalogs
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 bg-card/60">
              <Link to="/search" search={{ q: "" }}>
                <Search className="mr-2 h-4 w-4" /> Search
              </Link>
            </Button>
          </div>

          {/* Stats ribbon */}
          {stats && stats.catalogs > 0 && (
            <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-6 text-center">
              <div>
                <span className="font-display text-2xl text-primary">{stats.catalogs}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">catalogs</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div>
                <span className="font-display text-2xl text-primary">{stats.categories}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">categories</span>
              </div>
            </div>
          )}

          {/* Interactive 3D Book */}
          <InteractiveBook />
        </div>
      </section>

      {/* ALL FEATURES — visible on front page */}
      <FeaturesSection />
      
      {/* RECENT CATALOGS */}
      <RecentCatalogsSection recent={recent ?? []} />
      
      {/* HOW IT WORKS */}
      <HowItWorksSection />

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Folio — Digital Catalog Reader
      </footer>
    </div>
  );
}

/* ── Animated Features Section ── */
function FeaturesSection() {
  const { ref, inView } = useInView();
  const features = [
    { icon: BookOpen, title: "Realistic Page Turn", desc: "Smooth 3D flips with shadows, swipe, and keyboard navigation." },
    { icon: Volume2, title: "Page Turn Sound", desc: "Realistic audio feedback on every page flip — toggle on/off." },
    { icon: FolderTree, title: "Organized Categories", desc: "Browse catalogs grouped by category and subcategory." },
    { icon: Search, title: "Quick Search", desc: "Find any catalog by title or description instantly." },
    { icon: Layers, title: "Nested Categories", desc: "Unlimited subcategories keep everything organized." },
    { icon: Maximize, title: "Fullscreen Mode", desc: "Distraction-free reading in fullscreen." },
    { icon: Play, title: "Auto-play Slideshow", desc: "Hands-free reading with automatic page turns." },
    { icon: Smartphone, title: "Mobile Ready", desc: "Responsive PWA — install to home screen for app-like feel." },
    { icon: Download, title: "Download PDFs", desc: "Save catalogs for offline reading anytime." },
    { icon: Eye, title: "Zoom Up To 1.8×", desc: "Pinch or scroll to zoom into detailed pages." },
    { icon: Monitor, title: "Cross-Device", desc: "Works on desktop, tablet, and mobile seamlessly." },
    { icon: Zap, title: "Fast & Installable", desc: "PWA-ready, lazy-loaded pages for instant rendering." },
  ];
  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className={`text-center mb-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <h2 className="font-display text-3xl sm:text-4xl">Everything you need</h2>
        <p className="mt-2 text-muted-foreground">All features at a glance — simple, powerful, and easy to use.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`group card-glow rounded-xl border border-border bg-card p-5 shadow-soft btn-press ${inView ? `animate-fade-in-up stagger-${i + 1}` : "opacity-0"}`}
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Animated Recent Catalogs ── */
function RecentCatalogsSection({ recent }: { recent: Catalog[] }) {
  const { ref, inView } = useInView();
  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className={`mb-6 flex items-end justify-between transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div>
          <h2 className="font-display text-3xl">Recent Catalogs</h2>
          <p className="mt-1 text-sm text-muted-foreground">Latest catalogs — start reading now.</p>
        </div>
        <Link to="/browse" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {recent.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {recent.map((c, i) => (
            <Link
              key={c.id}
              to="/catalog/$id"
              params={{ id: c.id }}
              className={`group block card-glow rounded-xl ${inView ? `animate-fade-in-up stagger-${Math.min(i + 1, 8)}` : "opacity-0"}`}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-secondary shadow-soft">
                <CatalogCover coverPath={c.cover_path} title={c.title} />
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-medium">{c.title}</h3>
              {c.page_count && (
                <p className="mt-0.5 text-xs text-muted-foreground">{c.page_count} pages · {new Date(c.created_at).toLocaleDateString()}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/40 py-16 text-center transition-all duration-700 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="rounded-full p-4 bg-secondary">
            <Book className="h-8 w-8 text-primary/50" />
          </div>
          <h3 className="mt-4 font-display text-xl">No catalogs yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">Check back soon — new catalogs will appear here.</p>
          <Button asChild className="mt-5 rounded-full btn-press" size="lg">
            <Link to="/browse">Browse Catalogs</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

/* ── Animated How It Works ── */
function HowItWorksSection() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className={`rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <h2 className="text-center font-display text-3xl sm:text-4xl">How it works</h2>
        <p className="mt-2 text-center text-muted-foreground">Three simple steps to start reading.</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            { step: "1", icon: Search, title: "Browse", desc: "Explore catalogs by category or search by name." },
            { step: "2", icon: BookOpen, title: "Open", desc: "Click any catalog to open it in the realistic flipbook reader." },
            { step: "3", icon: Book, title: "Read", desc: "Flip pages, zoom in, go fullscreen, or enable auto-play. Enjoy!" },
          ].map((s, i) => (
            <div key={s.step} className={`flex flex-col items-center text-center ${inView ? `animate-fade-in-up stagger-${i + 1}` : "opacity-0"}`}>
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-110">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="mt-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">{s.step}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
