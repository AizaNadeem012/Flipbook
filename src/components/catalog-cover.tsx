import { useState, useEffect } from "react";
import { Book } from "lucide-react";
import { resolveStorageUrl } from "@/lib/storage";

/**
 * Renders a catalog cover image from Supabase Storage or a direct URL.
 */
export function CatalogCover({
  coverPath,
  title,
  className,
}: {
  coverPath: string | null;
  title: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(resolveStorageUrl(coverPath));
  }, [coverPath]);

  if (!url) {
    return (
      <div className={`flex h-full items-center justify-center bg-gradient-clay/30 ${className ?? ""}`}>
        <Book className="h-10 w-10 text-primary/40" />
      </div>
    );
  }

  return (
    <img src={url} alt={title} className={`h-full w-full object-cover ${className ?? ""}`} loading="lazy" />
  );
}
