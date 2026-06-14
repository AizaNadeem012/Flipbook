import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Upload, X, FileText, Image, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addCatalog, getCategories } from "@/lib/store";
import { storeFile } from "@/lib/file-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("none");
  const [pdf, setPdf] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const categories = getCategories();

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("none");
    setPdf(null);
    setCover(null);
    setBusy(false);
    setDragActive(false);
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") {
      setPdf(file);
      if (!title) setTitle(file.name.replace(/\.pdf$/i, ""));
    } else if (file?.type.startsWith("image/")) {
      setCover(file);
    } else {
      toast.error("Please drop a PDF file");
    }
  }, [title]);

  async function upload() {
    if (!title.trim() || !pdf) {
      toast.error("Title and PDF are required");
      return;
    }
    setBusy(true);
    try {
      // Generate unique keys for IndexedDB storage
      const ts = Date.now();
      const pdfKey = `pdf_${ts}`;
      const coverKey = cover ? `cover_${ts}` : null;

      // Store files in IndexedDB (persists across navigations/refreshes)
      await storeFile(pdfKey, pdf);
      if (cover && coverKey) await storeFile(coverKey, cover);

      const catalog = addCatalog({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: category === "none" ? null : category,
        pdf_path: pdfKey,
        cover_path: coverKey,
        file_size: pdf.size,
      });

      // Invalidate all relevant queries
      ["admin-catalogs", "catalogs", "admin-stats", "landing-stats", "landing-recent"].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      );

      toast.success("Catalog uploaded successfully!");
      handleClose(false);
      // Navigate to the new catalog
      router.navigate({ to: "/catalog/$id", params: { id: catalog.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Upload className="h-5 w-5 text-primary" /> Upload Catalog
          </DialogTitle>
          <DialogDescription>
            Add a PDF catalog — it will appear in your library instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Drag & drop zone */}
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
              dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            } ${pdf ? "bg-secondary/40" : ""}`}
            onClick={() => pdfRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {pdf ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="mt-2 text-sm font-medium">{pdf.name}</p>
                <p className="text-xs text-muted-foreground">{(pdf.size / 1024 / 1024).toFixed(1)} MB — Click to change</p>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">Drop PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF files only</p>
              </>
            )}
            <input ref={pdfRef} type="file" accept="application/pdf" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setPdf(f); if (!title) setTitle(f.name.replace(/\.pdf$/i, "")); }
              }}
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Catalog name" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} placeholder="Short description..." />
          </div>

          {/* Category + Cover in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <div className="flex items-center gap-2">
                {cover ? (
                  <div className="relative">
                    <img src={URL.createObjectURL(cover)} alt="" className="h-12 w-9 rounded object-cover shadow" />
                    <button onClick={() => setCover(null)} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => coverRef.current?.click()}>
                    <Image className="mr-1 h-3.5 w-3.5" /> Add cover
                  </Button>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          </div>

          {/* Upload button */}
          <Button onClick={upload} disabled={busy || !pdf || !title.trim()} className="w-full rounded-full" size="lg">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {busy ? "Uploading…" : "Upload & Open"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
