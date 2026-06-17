/*
 * ============================================================
 * SÍGALE — OFFLINE SCAN STORE (IndexedDB)
 * The device-local backbone of the offline-first door scan (Phase 4).
 * Three object stores in one database:
 *
 *   manifest  — every confirmed ticket for the event, keyed by `hash`.
 *               Downloaded before doors open; the scanner validates
 *               against this with no network (valid / invalid / used).
 *   queue     — scans captured while offline, keyed by `hash`. Drained
 *               by the sync routine when connectivity returns.
 *   log       — a rolling scan log (admits + duplicates) for the door
 *               operator, keyed by an auto id.
 *
 * Raw IndexedDB (no library) to keep the bundle lean — the app already
 * ships its own PWA/service-worker heritage. All calls return Promises.
 *
 * SINGLE-SCANNER ASSUMPTION (plan §7): this cache makes one device the
 * source of truth between syncs. Two offline devices can both admit the
 * same ticket until they reconcile on the server (earliest usedAt wins).
 * ============================================================
 */

const DB_NAME = 'sigale-scan';
const DB_VERSION = 1;
const STORE_MANIFEST = 'manifest';
const STORE_QUEUE = 'queue';
const STORE_LOG = 'log';
const STORE_META = 'meta';

let dbPromise = null;

/** Open (and lazily migrate) the database. Cached for the page lifetime. */
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible en este navegador'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MANIFEST)) {
        db.createObjectStore(STORE_MANIFEST, { keyPath: 'hash' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'hash' });
      }
      if (!db.objectStoreNames.contains(STORE_LOG)) {
        db.createObjectStore(STORE_LOG, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** Promisify a single transaction over `store`. `fn(store)` issues the requests. */
async function tx(storeNames, mode, fn) {
  const db = await openDb();
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(names, mode);
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    result = fn(
      names.length === 1
        ? transaction.objectStore(names[0])
        : names.reduce((acc, n) => ({ ...acc, [n]: transaction.objectStore(n) }), {}),
    );
  });
}

/** Wrap a single IDBRequest as a Promise. */
function reqAsync(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Manifest ───────────────────────────────────────────────────────────────────

/**
 * Replace the cached manifest with a fresh download. Wipes the old ticket set
 * (a new event, or a re-pull) and records meta for the operator's "last synced".
 *
 * @param {number|string} eventId
 * @param {Array<object>} tickets  rows from GET /api/admin/scan/manifest
 * @param {string} [generatedAt]   server timestamp of the manifest
 */
export async function saveManifest(eventId, tickets, generatedAt) {
  await tx([STORE_MANIFEST, STORE_META], 'readwrite', (stores) => {
    const m = stores[STORE_MANIFEST];
    const meta = stores[STORE_META];
    m.clear();
    for (const tk of tickets) {
      m.put({
        hash: tk.hash,
        holderName: tk.holderName || null,
        holderIdNumber: tk.holderIdNumber || null,
        orderId: tk.orderId ?? null,
        stageName: tk.stageName || null,
        isUsed: tk.isUsed ? 1 : 0,
        usedAt: tk.usedAt || null,
      });
    }
    meta.put({ key: 'manifest', eventId, generatedAt: generatedAt || new Date().toISOString(), count: tickets.length });
  });
  return { count: tickets.length };
}

/** Manifest meta: { eventId, generatedAt, count } or null if never downloaded. */
export async function getManifestMeta() {
  return tx(STORE_META, 'readonly', (store) => reqAsync(store.get('manifest'))).then(
    (r) => r || null,
  );
}

/** Look up a ticket by its QR hash. Returns the cached row or null. */
export async function lookupTicket(hash) {
  return tx(STORE_MANIFEST, 'readonly', (store) => reqAsync(store.get(hash))).then(
    (r) => r || null,
  );
}

/** Total tickets cached, for the operator's header count. */
export async function manifestCount() {
  return tx(STORE_MANIFEST, 'readonly', (store) => reqAsync(store.count()));
}

/** Flip a ticket to used locally (after a successful local admit). */
export async function markLocalUsed(hash, usedAt) {
  await tx(STORE_MANIFEST, 'readwrite', (store) => {
    const get = store.get(hash);
    get.onsuccess = () => {
      const row = get.result;
      if (row && !row.isUsed) {
        row.isUsed = 1;
        row.usedAt = usedAt;
        store.put(row);
      }
    };
  });
}

// ── Queue (scans awaiting server sync) ───────────────────────────────────────────

/** Enqueue an admit for later sync. Keyed by hash, so a re-admit is collapsed. */
export async function enqueueScan(hash, usedAt) {
  await tx(STORE_QUEUE, 'readwrite', (store) => {
    store.put({ hash, usedAt });
  });
}

/** All queued scans. */
export async function getQueue() {
  return tx(STORE_QUEUE, 'readonly', (store) => reqAsync(store.getAll())).then((r) => r || []);
}

/** Number of scans waiting to sync. */
export async function queueSize() {
  return tx(STORE_QUEUE, 'readonly', (store) => reqAsync(store.count()));
}

/** Remove the given hashes from the queue (after the server acknowledges them). */
export async function clearQueueHashes(hashes) {
  if (!hashes || hashes.length === 0) return;
  await tx(STORE_QUEUE, 'readwrite', (store) => {
    for (const h of hashes) store.delete(h);
  });
}

// ── Log (operator-facing scan history) ───────────────────────────────────────────

/**
 * Append a scan result to the rolling log.
 * @param {object} entry { hash, result, holderName?, at }
 */
export async function appendLog(entry) {
  await tx(STORE_LOG, 'readwrite', (store) => {
    store.add({ ...entry, at: entry.at || new Date().toISOString() });
  });
}

/** Most-recent-first log, capped at `limit` entries. */
export async function getLog(limit = 50) {
  const all = await tx(STORE_LOG, 'readonly', (store) => reqAsync(store.getAll())).then(
    (r) => r || [],
  );
  return all.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

/** Wipe everything — used when switching events or resetting the door device. */
export async function clearAll() {
  await tx([STORE_MANIFEST, STORE_QUEUE, STORE_LOG, STORE_META], 'readwrite', (stores) => {
    stores[STORE_MANIFEST].clear();
    stores[STORE_QUEUE].clear();
    stores[STORE_LOG].clear();
    stores[STORE_META].clear();
  });
}
