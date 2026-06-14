import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { CatalogCover } from "@/components/catalog-cover";
import { Book, ChevronRight, Folder, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { getCatalogs, getCategories, deleteCatalog, type LocalCategory, type LocalCatalog } from "@/lib/store";
import { deleteFile } from "@/lib/file-store";
import { toast } from "sonner";
import { useInView } from "@/hooks/use-in-view";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse catalogs — Folio" },
      { name: "description", content: "Explore all catalogs by category." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: catalogs } = useQuery({
    queryKey: ["catalogs", selected],
    queryFn: () => {
      const all = getCatalogs();
      if (!selected) return all;
      const ids = collectDescendants(categories ?? [], selected);
      return all.filter((c) => c.category_id && ids.includes(c.category_id));
    },
  });

  const tree = useMemo(() => buildTree(categories ?? []), [categories]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-display text-4xl">Browse</h1>
          <p className="mt-2 text-muted-foreground">Pick a category to narrow down, or scroll for everything.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar tree */}
          <aside className="rounded-2xl border border-border bg-card p-4 shadow-soft lg:sticky lg:top-20 lg:self-start">
            <button
              onClick={() => setSelected(null)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${selected === null ? "bg-secondary text-foreground" : "hover:bg-secondary/60"}`}
            >
              All catalogs
            </button>
            <div className="mt-2 space-y-0.5">
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} selected={selected} onSelect={setSelected} depth={0} />
              ))}
              {tree.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No categories yet</p>
              )}
            </div>
          </aside>

          {/* Grid */}
          <div>
            {catalogs && catalogs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-center">
                <Book className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No catalogs here yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {catalogs?.map((c, i) => <CatalogCard key={c.id} c={c} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type Node = LocalCategory & { children: Node[] };
function buildTree(cats: LocalCategory[]): Node[] {
  const map = new Map<string, Node>();
  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Node[] = [];
  map.forEach((n) => {
    if (n.parent_id && map.has(n.parent_id)) map.get(n.parent_id)!.children.push(n);
    else roots.push(n);
  });
  return roots;
}
function collectDescendants(cats: LocalCategory[], id: string): string[] {
  const ids = [id];
  let added = true;
  while (added) {
    added = false;
    for (const c of cats) {
      if (c.parent_id && ids.includes(c.parent_id) && !ids.includes(c.id)) {
        ids.push(c.id);
        added = true;
      }
    }
  }
  return ids;
}

function TreeNode({ node, selected, onSelect, depth }: { node: Node; selected: string | null; onSelect: (id: string) => void; depth: number }) {
  const [open, setOpen] = useState(true);
  const active = selected === node.id;
  return (
    <div>
      <div className={`flex items-center gap-1 rounded-lg ${active ? "bg-secondary" : "hover:bg-secondary/60"}`}>
        {node.children.length > 0 ? (
          <button onClick={() => setOpen(!open)} className="p-1 text-muted-foreground">
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        <button
          onClick={() => onSelect(node.id)}
          className="flex-1 truncate py-1.5 pr-2 text-left text-sm"
          style={{ paddingLeft: depth * 4 }}
        >
          <Folder className="mr-1.5 inline h-3.5 w-3.5 text-primary/70" />
          {node.name}
        </button>
      </div>
      {open && node.children.length > 0 && (
        <div className="ml-3 border-l border-border/60 pl-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} selected={selected} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogCard({ c, index }: { c: LocalCatalog; onDelete?: () => void; index?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`group relative ${inView ? `animate-fade-in-up stagger-${Math.min((index ?? 0) + 1, 12)}` : "opacity-0"}`}>
      <Link to="/catalog/$id" params={{ id: c.id }} className="block">
        <div className="aspect-[3/4] overflow-hidden rounded-xl bg-secondary shadow-soft transition-all duration-300 group-hover:shadow-elegant group-hover:-translate-y-1">
          <CatalogCover coverPath={c.cover_path} title={c.title} />
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-medium">{c.title}</h3>
        {c.page_count && (
          <p className="mt-0.5 text-xs text-muted-foreground">{c.page_count} pages</p>
        )}
      </Link>
      <DeleteButton catalogId={c.id} title={c.title} pdfPath={c.pdf_path} coverPath={c.cover_path} />
    </div>
  );
}

function DeleteButton({ catalogId, title, pdfPath, coverPath }: { catalogId: string; title: string; pdfPath: string; coverPath: string | null }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    // Actually delete
    try {
      if (pdfPath && !pdfPath.startsWith("http") && !pdfPath.startsWith("blob:")) {
        await deleteFile(pdfPath).catch(() => {});
      }
      if (coverPath && !coverPath.startsWith("http") && !coverPath.startsWith("blob:") && !coverPath.startsWith("data:")) {
        await deleteFile(coverPath).catch(() => {});
      }
      deleteCatalog(catalogId);
      qc.invalidateQueries({ queryKey: ["catalogs"] });
      qc.invalidateQueries({ queryKey: ["landing-recent"] });
      qc.invalidateQueries({ queryKey: ["landing-stats"] });
      toast.success(`Deleted "${title}"`);
    } catch {
      toast.error("Failed to delete catalog");
    }
    setConfirming(false);
  }

  return (
    <button
      onClick={handleDelete}
      className={`absolute right-2 top-2 z-10 rounded-full p-2 shadow-md transition-all duration-200 ${
        confirming
          ? "bg-destructive text-white scale-110"
          : "bg-white/90 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white"
      }`}
      title={confirming ? "Click again to confirm" : "Delete catalog"}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
