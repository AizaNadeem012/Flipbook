import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchCatalogs } from "@/lib/store";
import { Book, Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  validateSearch: (search) => ({ q: (search.q as string) || "" }),
  head: () => ({
    meta: [
      { title: "Search catalogs — Folio" },
      { name: "description", content: "Search across all catalogs by title or description." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: searchParam } = Route.useSearch();
  const [q, setQ] = useState(searchParam);

  useEffect(() => { setQ(searchParam); }, [searchParam]);

  const { data } = useQuery({
    queryKey: ["search", q],
    queryFn: () => (q.trim() ? searchCatalogs(q) : []),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl">Search</h1>
        <div className="relative mt-6">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search catalogs by title or description…"
            className="h-14 rounded-full pl-11 text-base"
            maxLength={120}
          />
        </div>
        <div className="mt-8 space-y-3">
          {data?.map((c) => (
            <Link
              key={c.id}
              to="/catalog/$id"
              params={{ id: c.id }}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-secondary/40"
            >
              {c.cover_path ? (
                <img src={c.cover_path} alt={c.title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-clay/30">
                  <Book className="h-5 w-5 text-primary/60" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                {c.description && <p className="line-clamp-1 text-sm text-muted-foreground">{c.description}</p>}
              </div>
            </Link>
          ))}
          {q && data?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No catalogs match "{q}".</p>
          )}
        </div>
      </div>
    </div>
  );
}
