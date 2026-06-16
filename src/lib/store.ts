/**
 * Shared catalog data — backed by Supabase.
 * Public visitors can read; only admins can write (enforced by RLS).
 */
export type { Catalog, Category, LocalCatalog, LocalCategory } from "@/lib/catalog-api";
export {
  getCategories,
  getCatalogs,
  getCatalog,
  addCategory,
  deleteCategory,
  addCatalog,
  deleteCatalog,
  searchCatalogs,
} from "@/lib/catalog-api";
