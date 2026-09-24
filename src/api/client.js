/*
 * ============================================================
 * SÍGALE — API CLIENT
 * Thin fetch wrapper around the Sígale Express backend.
 * The single place that knows the base URL and the request
 * shape; every src/api/*.js module calls through it.
 *
 * Base URL comes from VITE_API_URL (.env.production); in dev it
 * is blank and Vite proxies /api to production (vite.config.js).
 * ============================================================
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Error thrown for any non-2xx response. Carries the HTTP status
 * and the parsed server payload so callers can branch (e.g. 409
 * "Cupos insuficientes" during a reservation).
 */
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Core request. Prefixes the base URL, sends/parses JSON, and
 * turns non-2xx responses into ApiError.
 *
 * @param {string} path   Path beginning with '/', e.g. '/api/events/1'.
 * @param {object} [opts] fetch options. `body` may be a plain object
 *                        (auto-serialized) or a pre-built BodyInit.
 * @returns {Promise<any>} Parsed JSON body, or null for 204.
 */
export async function request(path, opts = {}) {
  const { body, headers, ...rest } = opts;

  const isPlainObject =
    body != null &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob);

  const finalHeaders = { ...(headers || {}) };
  if (isPlainObject && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: isPlainObject ? JSON.stringify(body) : body,
    });
  } catch (networkError) {
    // DNS failure, offline, CORS preflight rejection, etc.
    throw new ApiError(
      networkError.message || 'No fue posible conectar con el servidor',
      0,
      null,
    );
  }

  // Parse the payload defensively: the server may return JSON, text, or nothing.
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      `Error ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

/** Convenience verbs over `request`. */
export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),

  /** Backend liveness probe. */
  health: () => request('/api/health', { method: 'GET' }),
};

export default api;
