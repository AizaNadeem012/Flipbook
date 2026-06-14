import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload, Book, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getCatalogs,
  getCategories,
  addCatalog,
  deleteCatalog,
  type LocalCatalog,
} from "@/lib/store";

export const Route = createFileRoute("/_authenticated/admin/catalogs")({
  component: CatalogsAdmin,
});

function CatalogsAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("none");
  const [pdf, setPdf] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: cats } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategories,
  });

  const { data: catalogs } = useQuery({
    queryKey: ["admin-catalogs"],
    queryFn: getCatalogs,
  });

  async function upload() {
    if (!title.trim() || !pdf) {
      toast.error("Title and PDF are required");
      return;
    }
    setBusy(true);
    try {
      // Create blob URL for the PDF (local storage)
      const pdfUrl = URL.createObjectURL(pdf);

      let coverUrl: string | null = null;
      if (cover) {
        coverUrl = URL.createObjectURL(cover);
      }

      addCatalog({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: category === "none" ? null : category,
        pdf_path: pdfUrl,
        cover_path: coverUrl,
        file_size: pdf.size,
        created_by: user?.id ?? undefined,
      });

      toast.success("Catalog uploaded successfully!");
      setTitle("");
      setDescription("");
      setPdf(null);
      setCover(null);
      qc.invalidateQueries({ queryKey: ["admin-catalogs"] });
      qc.invalidateQueries({ queryKey: ["catalogs"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["landing-stats"] });
      qc.invalidateQueries({ queryKey: ["landing-recent"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function remove(id: string) {
    if (!confirm("Delete this catalog?")) return;
    deleteCatalog(id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-catalogs"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Upload form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" /> Upload catalog
        </h3>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Catalog name" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Short description (optional)" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Uncategorized</SelectItem>
                {cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>PDF file *</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
              className="cursor-pointer"
            />
            {pdf && (
              <p className="text-xs text-muted-foreground">
                {pdf.name} ({(pdf.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Cover image (optional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              className="cursor-pointer"
            />
            {cover && (
              <div className="mt-2">
                <img src={URL.createObjectURL(cover)} alt="Preview" className="h-20 w-16 rounded object-cover shadow" />
              </div>
            )}
          </div>
          <Button onClick={upload} disabled={busy} className="w-full rounded-full" size="lg">
            <Upload className="mr-1 h-4 w-4" />
            {busy ? "Uploading…" : "Upload Catalog"}
          </Button>
        </div>
      </div>

      {/* Catalog list */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg mb-4">All catalogs ({catalogs?.length ?? 0})</h3>
        <div className="space-y-2">
          {catalogs?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Book className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No catalogs yet. Upload your first one!</p>
            </div>
          )}
          {catalogs?.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {c.cover_path ? (
                  <img src={c.cover_path} alt="" className="h-12 w-9 shrink-0 rounded object-cover shadow-sm" />
                ) : (
                  <div className="grid h-12 w-9 shrink-0 place-items-center rounded bg-gradient-clay/30">
                    <Book className="h-4 w-4 text-primary/60" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                    {c.page_count && ` · ${c.page_count} pages`}
                    {c.file_size && ` · ${(c.file_size / 1024 / 1024).toFixed(1)} MB`}
                    {c.view_count > 0 && ` · ${c.view_count} views`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" asChild>
                  <Link to="/catalog/$id" params={{ id: c.id }}>
                    <Eye className="h-4 w-4 text-primary" />
                  </Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
