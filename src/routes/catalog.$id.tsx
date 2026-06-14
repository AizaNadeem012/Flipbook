import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Book, BookOpen, Sparkles, Eye, Download,
  Maximize, ChevronRight, Trash2,
} from "lucide-react";
import { Flipbook } from "@/components/flipbook";
import { getCatalog, incrementViewCount, deleteCatalog } from "@/lib/store";
import { getFileUrl, deleteFile } from "@/lib/file-store";
import { SiteHeader } from "@/components/site-header";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/catalog/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reading catalog — Folio" },
      { name: "description", content: "Read this catalog in a realistic flipbook viewer." },
    ],
  }),
  component: CatalogViewer,
});

function CatalogViewer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bookOpen, setBookOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["catalog", id],
    queryFn: () => getCatalog(id),
  });

  // Track view
  useQuery({
    queryKey: ["catalog-view", id],
    queryFn: () => { incrementViewCount(id); return true; },
    staleTime: Infinity,
    enabled: !!catalog,
  });

  // Load PDF and cover from IndexedDB
  useEffect(() => {
    if (!catalog) return;
    let cancelled = false;

    async function load() {
      try {
        const pdf = await getFileUrl(catalog!.pdf_path);
        if (cancelled) return;
        if (pdf) {
          setPdfUrl(pdf);
        } else {
          // Fallback: might be a direct URL (old data)
          if (catalog!.pdf_path.startsWith("http") || catalog!.pdf_path.startsWith("blob:")) {
            setPdfUrl(catalog!.pdf_path);
          } else {
            setLoadError(true);
          }
        }

        if (catalog!.cover_path) {
          const cover = await getFileUrl(catalog!.cover_path);
          if (!cancelled) {
            setCoverUrl(cover ?? catalog!.cover_path);
          }
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [catalog]);

  // Lock body scroll when book is open
  useEffect(() => {
    if (bookOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [bookOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-warm">
        <SiteHeader />
        <div className="grid min-h-[60vh] place-items-center">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid min-h-[60vh] place-items-center p-6">
          <div className="text-center">
            <Book className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Catalog not found.</p>
            <Button asChild className="mt-6 rounded-full"><Link to="/browse">Back to browse</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !pdfUrl) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid min-h-[60vh] place-items-center p-6">
          <div className="text-center">
            <Book className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Could not load PDF file.</p>
            <p className="mt-1 text-xs text-muted-foreground">The file may have been stored in a previous session and is no longer available.</p>
            <Button asChild className="mt-6 rounded-full"><Link to="/browse">Back to browse</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-warm">
        <SiteHeader />

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-6 rounded-full" onClick={() => navigate({ to: "/browse" })}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to catalogs
          </Button>

          {/* Catalog info + Book cover */}
          <div className="flex flex-col items-center">
            {/* Book cover — interactive, click to open */}
            <button
              onClick={() => setBookOpen(true)}
              className="group relative cursor-pointer select-none focus:outline-none"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative transition-transform duration-500"
                style={{
                  width: "min(60vw, 260px)",
                  aspectRatio: "3/4.2",
                  transformStyle: "preserve-3d",
                  transform: "rotateY(-5deg)",
                }}
              >
                {/* Book shadow on surface */}
                <div
                  className="pointer-events-none absolute -bottom-4 left-[8%] right-[8%]"
                  style={{
                    height: 24,
                    background: "radial-gradient(ellipse, oklch(0.30 0.08 250 / 0.25), transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />

                {/* Spine (left edge) */}
                <div
                  className="absolute left-0 top-0 h-full rounded-l-md"
                  style={{
                    width: 16,
                    background: "linear-gradient(90deg, oklch(0.34 0.08 250), oklch(0.44 0.10 250))",
                    boxShadow: "inset -2px 0 6px oklch(0 0 0 / 0.35)",
                    zIndex: 5,
                  }}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-1.5">
                    <div className="h-px w-2 bg-white/20" />
                    <div className="h-5 w-px bg-white/15" />
                    <div className="h-px w-2 bg-white/20" />
                  </div>
                </div>

                {/* Page edges (right edge) */}
                <div
                  className="absolute right-0 top-[4px] bottom-[4px] rounded-r-sm"
                  style={{
                    width: 7,
                    background: "repeating-linear-gradient(180deg, oklch(0.96 0.01 250) 0px, oklch(0.91 0.015 245) 1px, oklch(0.96 0.01 250) 2px)",
                    borderRight: "1px solid oklch(0.86 0.015 245)",
                    zIndex: 1,
                  }}
                />

                {/* Main cover face */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-r-lg"
                  style={{
                    marginLeft: 16,
                    marginRight: 7,
                    background: coverUrl
                      ? undefined
                      : "linear-gradient(155deg, oklch(0.50 0.15 250), oklch(0.32 0.10 255))",
                    boxShadow: "4px 8px 30px oklch(0.30 0.08 250 / 0.3), 1px 2px 8px oklch(0.30 0.08 250 / 0.15)",
                    transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s",
                  }}
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt={catalog.title} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      {/* Decorative border */}
                      <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/10" />

                      {/* Cover content */}
                      <div className="relative flex h-full flex-col justify-between p-5">
                        <div>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}>
                            <BookOpen className="h-2.5 w-2.5" /> Catalog
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-xl leading-tight" style={{ color: "oklch(0.985 0.005 250)" }}>{catalog.title}</h3>
                          <div className="mt-2 h-0.5 w-8" style={{ background: "oklch(0.985 0.012 80 / 0.35)" }} />
                          {catalog.page_count && (
                            <p className="mt-2 text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.985 0.012 80 / 0.50)" }}>{catalog.page_count} pages</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                            <Eye className="h-3 w-3" style={{ color: "rgba(255,255,255,0.70)" }} />
                          </div>
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>Click to read</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Hover shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.06) 50%, transparent 70%)",
                    }}
                  />
                </div>
              </div>
            </button>

            {/* Catalog details below the cover */}
            <div className="mt-8 text-center">
              <h1 className="font-display text-2xl sm:text-3xl">{catalog.title}</h1>
              {catalog.description && (
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{catalog.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                {catalog.page_count && (
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {catalog.page_count} pages</span>
                )}
                {catalog.file_size && (
                  <span>{(catalog.file_size / 1024 / 1024).toFixed(1)} MB</span>
                )}
                {catalog.view_count > 0 && (
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {catalog.view_count} views</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="rounded-full shadow-soft" onClick={() => setBookOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" /> Open Book
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 bg-card/60">
                <a href={pdfUrl} download={`${catalog.title}.pdf`}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </a>
              </Button>
              <Button
                size="lg"
                variant={confirmDelete ? "destructive" : "outline"}
                className={`rounded-full border-border/80 ${confirmDelete ? "scale-105" : "bg-card/60"}`}
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3000);
                    return;
                  }
                  try {
                    if (catalog.pdf_path && !catalog.pdf_path.startsWith("http") && !catalog.pdf_path.startsWith("blob:")) {
                      await deleteFile(catalog.pdf_path).catch(() => {});
                    }
                    if (catalog.cover_path && !catalog.cover_path.startsWith("http") && !catalog.cover_path.startsWith("blob:") && !catalog.cover_path.startsWith("data:")) {
                      await deleteFile(catalog.cover_path).catch(() => {});
                    }
                    deleteCatalog(id);
                    qc.invalidateQueries({ queryKey: ["catalogs"] });
                    qc.invalidateQueries({ queryKey: ["landing-recent"] });
                    qc.invalidateQueries({ queryKey: ["landing-stats"] });
                    toast.success(`Deleted "${catalog.title}"`);
                    navigate({ to: "/browse" });
                  } catch {
                    toast.error("Failed to delete");
                  }
                  setConfirmDelete(false);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> {confirmDelete ? "Confirm Delete" : "Delete"}
              </Button>
            </div>

            {/* Quick hints */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
              {[
                { icon: BookOpen, label: "Flip pages" },
                { icon: Maximize, label: "Fullscreen" },
                { icon: Sparkles, label: "Auto-play" },
                { icon: Download, label: "Download" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 p-3">
                  <Icon className="h-4 w-4 text-primary/60" />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen flipbook modal */}
      {bookOpen && pdfUrl && (
        <Flipbook
          pdfUrl={pdfUrl}
          title={catalog.title}
          onClose={() => setBookOpen(false)}
        />
      )}
    </>
  );
}
