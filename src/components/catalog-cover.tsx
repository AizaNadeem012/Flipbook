import { useState, useEffect } from "react";
import { Book } from "lucide-react";
import { getFileUrl } from "@/lib/file-store";

/**
 * Renders a catalog cover image, resolving IndexedDB keys to blob URLs.
 * Falls back to a placeholder icon if no cover is available.
 */
export function CatalogCover({ coverPath, title, className }: { coverPath: string | null; title: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coverPath) { setUrl(null); return; }

    // Check if it's already a valid URL
    if (coverPath.startsWith("http") || coverPath.startsWith("blob:") || coverPath.startsWith("data:")) {
      setUrl(coverPath);
      return;
    }

    // Otherwise treat as IndexedDB key
    let cancelled = false;
    getFileUrl(coverPath).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => { cancelled = true; };
  }, [coverPath]);

  if (!url) {
    return (
      <div className={`flex h-full items-center justify-center bg-gradient-clay/30 ${className ?? ""}`}>
        <Book className="h-10 w-10 text-primary/40" />
      </div>
    );
  }

  return <img src={url} alt={title} className={`h-full w-full object-cover ${className ?? ""}`} loading="lazy" />;
}
