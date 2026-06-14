/**
 * Local data store — replaces Supabase for frontend-only demo.
 * All data lives in localStorage so it survives refreshes.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LocalCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface LocalCatalog {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  pdf_path: string;        // blob URL or remote URL
  cover_path: string | null;
  page_count: number | null;
  file_size: number | null;
  view_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "customer";
  password: string;        // demo only — not for production
}

interface StoreShape {
  catalogs: LocalCatalog[];
  categories: LocalCategory[];
  users: LocalUser[];
  currentUserId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _counter = 0;
export function genId(): string {
  return `${Date.now().toString(36)}-${(++_counter).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

const KEY = "folio_store_v1";

function defaults(): StoreShape {
  return {
    catalogs: [],
    categories: [],
    users: [
      // Pre-seeded admin account
      {
        id: genId(),
        email: "admin@folio.app",
        display_name: "Admin",
        role: "admin",
        password: "admin123",
      },
    ],
    currentUserId: null,
  };
}

export function loadStore(): StoreShape {
  try {
    if (typeof localStorage === "undefined") return defaults();
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StoreShape;
  } catch {
    /* corrupt — reset */
  }
  const d = defaults();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(d));
  }
  return d;
}

export function saveStore(s: StoreShape) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetStore() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
  loadStore();
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export function localSignIn(email: string, password: string): LocalUser | null {
  const s = loadStore();
  const user = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return null;
  s.currentUserId = user.id;
  saveStore(s);
  return user;
}

export function localSignUp(email: string, password: string, displayName: string): LocalUser {
  const s = loadStore();
  const existing = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) throw new Error("An account with this email already exists");
  const user: LocalUser = {
    id: genId(),
    email,
    display_name: displayName || email.split("@")[0],
    role: "customer",
    password,
  };
  s.users.push(user);
  s.currentUserId = user.id;
  saveStore(s);
  return user;
}

export function localSignOut() {
  const s = loadStore();
  s.currentUserId = null;
  saveStore(s);
}

export function localCurrentUser(): LocalUser | null {
  const s = loadStore();
  if (!s.currentUserId) return null;
  return s.users.find((u) => u.id === s.currentUserId) ?? null;
}

/* ------------------------------------------------------------------ */
/*  CRUD helpers                                                       */
/* ------------------------------------------------------------------ */

// ---- Categories ----

export function getCategories(): LocalCategory[] {
  return loadStore().categories;
}

export function addCategory(name: string, parentId: string | null): LocalCategory {
  const s = loadStore();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cat: LocalCategory = {
    id: genId(),
    parent_id: parentId,
    name,
    slug,
    description: null,
    sort_order: s.categories.length,
    created_at: new Date().toISOString(),
  };
  s.categories.push(cat);
  saveStore(s);
  return cat;
}

export function deleteCategory(id: string) {
  const s = loadStore();
  // also delete children recursively
  const idsToDelete = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of s.categories) {
      if (c.parent_id && idsToDelete.has(c.parent_id) && !idsToDelete.has(c.id)) {
        idsToDelete.add(c.id);
        changed = true;
      }
    }
  }
  s.categories = s.categories.filter((c) => !idsToDelete.has(c.id));
  // unset category_id on catalogs
  for (const cat of s.catalogs) {
    if (cat.category_id && idsToDelete.has(cat.category_id)) cat.category_id = null;
  }
  saveStore(s);
}

// ---- Catalogs ----

export function getCatalogs(): LocalCatalog[] {
  return loadStore().catalogs;
}

export function getCatalog(id: string): LocalCatalog | null {
  return loadStore().catalogs.find((c) => c.id === id) ?? null;
}

export function addCatalog(data: {
  title: string;
  description?: string;
  category_id?: string | null;
  pdf_path: string;
  cover_path?: string | null;
  file_size?: number;
  page_count?: number;
  created_by?: string;
}): LocalCatalog {
  const s = loadStore();
  const now = new Date().toISOString();
  const cat: LocalCatalog = {
    id: genId(),
    title: data.title,
    description: data.description ?? null,
    category_id: data.category_id ?? null,
    pdf_path: data.pdf_path,
    cover_path: data.cover_path ?? null,
    file_size: data.file_size ?? null,
    page_count: data.page_count ?? null,
    view_count: 0,
    created_by: data.created_by ?? null,
    created_at: now,
    updated_at: now,
  };
  s.catalogs.unshift(cat);
  saveStore(s);
  return cat;
}

export function deleteCatalog(id: string) {
  const s = loadStore();
  const cat = s.catalogs.find((c) => c.id === id);
  if (cat) {
    // revoke blob URLs
    try { URL.revokeObjectURL(cat.pdf_path); } catch {}
    if (cat.cover_path) try { URL.revokeObjectURL(cat.cover_path); } catch {}
  }
  s.catalogs = s.catalogs.filter((c) => c.id !== id);
  saveStore(s);
}

export function incrementViewCount(id: string) {
  const s = loadStore();
  const cat = s.catalogs.find((c) => c.id === id);
  if (cat) {
    cat.view_count += 1;
    saveStore(s);
  }
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

export function searchCatalogs(query: string): LocalCatalog[] {
  const q = query.toLowerCase();
  return getCatalogs().filter(
    (c) => c.title.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q),
  );
}
