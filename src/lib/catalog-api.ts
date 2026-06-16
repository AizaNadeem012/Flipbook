import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { removeFromStorage } from "@/lib/storage";

export type Catalog = Database["public"]["Tables"]["catalogs"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

/** @deprecated Use Catalog — kept for existing imports */
export type LocalCatalog = Catalog;
/** @deprecated Use Category — kept for existing imports */
export type LocalCategory = Category;

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCatalogs(): Promise<Catalog[]> {
  const { data, error } = await supabase
    .from("catalogs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCatalog(id: string): Promise<Catalog | null> {
  const { data, error } = await supabase.from("catalogs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function searchCatalogs(query: string): Promise<Catalog[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("catalogs")
    .select("*")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addCategory(name: string, parentId: string | null): Promise<Category> {
  const cats = await getCategories();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug: slugify(name),
      parent_id: parentId,
      sort_order: cats.length,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addCatalog(data: {
  title: string;
  description?: string;
  category_id?: string | null;
  pdf_path: string;
  cover_path?: string | null;
  file_size?: number;
  page_count?: number;
  created_by?: string;
}): Promise<Catalog> {
  const { data: row, error } = await supabase
    .from("catalogs")
    .insert({
      title: data.title,
      description: data.description ?? null,
      category_id: data.category_id ?? null,
      pdf_path: data.pdf_path,
      cover_path: data.cover_path ?? null,
      file_size: data.file_size ?? null,
      page_count: data.page_count ?? null,
      created_by: data.created_by ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return row;
}

export async function deleteCatalog(id: string): Promise<void> {
  const cat = await getCatalog(id);
  if (cat) {
    await removeFromStorage([cat.pdf_path, cat.cover_path].filter(Boolean) as string[]);
  }
  const { error } = await supabase.from("catalogs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
