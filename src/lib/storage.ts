import { supabase } from "@/integrations/supabase/client";

const BUCKET = "catalogs";

/** Resolve a storage path or legacy URL to a browser-loadable URL. */
export function resolveStorageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadToStorage(file: File, prefix: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${prefix}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function removeFromStorage(paths: string[]) {
  const storagePaths = paths.filter(
    (p) => p && !p.startsWith("http") && !p.startsWith("blob:") && !p.startsWith("data:"),
  );
  if (storagePaths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(storagePaths);
}
