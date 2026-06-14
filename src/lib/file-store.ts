/**
 * Simple IndexedDB wrapper for storing PDF files and cover images.
 * Blob URLs are session-scoped and break on navigation/refresh,
 * so we persist the raw File/Blob in IndexedDB instead.
 */

const DB_NAME = "folio_files";
const DB_VERSION = 1;
const STORE = "files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Store a blob (File/Blob) under a key. Returns the key. */
export async function storeFile(key: string, blob: Blob): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => { db.close(); resolve(key); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/** Retrieve a blob by key. Returns null if not found. */
export async function getFile(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Get a blob URL for a stored file. Creates a fresh object URL. */
export async function getFileUrl(key: string): Promise<string | null> {
  const blob = await getFile(key);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/** Delete a stored file by key. */
export async function deleteFile(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
