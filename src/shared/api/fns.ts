import * as _t from "./types";

/**
 * Check if we're in a development environment.
 *
 * Works in both:
 * - Node.js: process.env.NODE_ENV !== "production"
 * - Vite/browser: import.meta.env?.DEV
 */
const isDev = (): boolean => {
  // Node.js environment
  if (typeof process !== "undefined" && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== "production";
  }
  // Vite/browser environment
  // @ts-expect-error - import.meta.env is Vite-specific
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV !== undefined) {
    // @ts-expect-error - import.meta.env is Vite-specific
    return import.meta.env.DEV;
  }
  // Default to false if we can't determine
  return false;
};

/**
 * Detect whether a request path is an absolute URL (external request).
 *
 * This module's domain layer uses this check to decide when **not** to apply
 * app-configured defaults (like `baseUrl` and auth headers). That protects us
 * from accidentally leaking credentials to third-party URLs (e.g. S3 presigned
 * uploads, CDN downloads).
 *
 * Note: This is intentionally simple (`startsWith("http")`) because the only
 * "external" URLs we care about are `http://` and `https://` fetch targets.
 *
 * @example
 * ```ts
 * isAbsolute("/users");                // false
 * isAbsolute("https://example.com");   // true
 * isAbsolute("http://localhost:8787"); // true
 * ```
 */
export const isAbsolute = (path: string) => path.startsWith("http");

/**
 * Build the final request URL from a path, a `baseUrl`, and optional query params.
 *
 * The app calls the API client with "internal" paths like `/entries` and expects
 * the module to consistently:
 * - Prefix `baseUrl` for internal paths
 * - Leave absolute URLs untouched (for presigned URLs, third-party services)
 * - Encode query params safely and skip `null`/`undefined` values
 *
 * Centralizing this avoids scattered string-concatenation bugs and keeps request
 * construction consistent across the app.
 *
 * @example
 * ```ts
 * prepareUrl("/users", {
 *   baseUrl: "https://api.example.com",
 *   params: { limit: 10, q: "alice", includeInactive: false, empty: null },
 * });
 * // "https://api.example.com/users?limit=10&q=alice&includeInactive=false"
 *
 * prepareUrl("https://s3.amazonaws.com/bucket/key", { baseUrl: "ignored" });
 * // "https://s3.amazonaws.com/bucket/key"
 * ```
 */
export const prepareUrl = (
  path: string,
  props: { baseUrl: string; params?: _t.Params }
): string => {
  // Developer ergonomics: discourage embedding query params in the raw path string.
  // We still allow it (to remain backwards-compatible), but prefer `params: { ... }`
  // so values are encoded consistently and query merging is handled centrally.
  //
  // NOTE: We intentionally skip absolute/external URLs here (e.g. S3 presigned URLs),
  // which frequently include required query strings.
  if (
    isDev() &&
    !isAbsolute(path) &&
    path.includes("?") &&
    path.split("?")[1]?.split("#")[0]
  ) {
    console.warn(
      `[api] Query params detected in path string. Prefer using the 'params' option instead: Api.get("/path", { params: { ... } }). Path: ${path}`
    );
  }

  const base = isAbsolute(path) ? "" : props.baseUrl;
  let url = `${base}${path}`;

  if (props.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(props.params)) {
      if (value != null) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  return url;
};

/**
 * Produce the final request headers for a fetch call.
 *
 * This helper exists to keep `domain.ts` readable while enforcing a few
 * non-obvious rules that prevent subtle integration bugs:
 * - `headers: false` means **no headers at all** (escape hatch)
 * - `FormData` must NOT set `Content-Type` (browser adds the multipart boundary)
 * - `Blob` should use `blob.type` when present
 * - `input: "json"`/`"text"` set the appropriate `Content-Type`
 * - A header transform function can layer on top of module defaults
 *
 * Returning `undefined` (instead of `{}`) is intentional: it allows the caller
 * to omit the `headers` field entirely in `fetch(...)`.
 *
 * @example
 * ```ts
 * // Default JSON request
 * await prepareHeaders({
 *   defaults: { Authorization: "Bearer token" },
 *   headersOption: true,
 *   input: "json",
 *   body: { hello: "world" },
 * });
 * // { Authorization: "...", "Content-Type": "application/json" }
 *
 * // Escape hatch: no headers at all
 * await prepareHeaders({
 *   defaults: { Authorization: "Bearer token" },
 *   headersOption: false,
 *   input: "json",
 *   body: { hello: "world" },
 * });
 * // undefined
 * ```
 */
export const prepareHeaders = async (props: {
  defaults: _t.HeadersObject;
  headersOption: true | false | _t.HeadersTransform | undefined;
  input: _t.Input | undefined;
  body: unknown;
}): Promise<_t.HeadersObject | undefined> => {
  const { defaults, headersOption, input, body } = props;

  // headers: false → no headers at all
  if (headersOption === false) return undefined;

  // Copy defaults so we don't mutate config headers (if provided as a stable object)
  const headers: _t.HeadersObject = { ...defaults };

  // Auto-detect: FormData → don't set Content-Type (browser sets multipart boundary)
  // Auto-detect: Blob → use blob's type if available
  if (body instanceof FormData) {
    // Don't set Content-Type - browser will set multipart/form-data with boundary
  } else if (body instanceof Blob && body.type) {
    headers["Content-Type"] = body.type;
  } else if (input === "json") {
    headers["Content-Type"] = "application/json";
  } else if (input === "text") {
    headers["Content-Type"] = "text/plain";
  }
  // input === "form" with plain object → converted to FormData, browser sets header

  // headers: undefined or true → use defaults
  if (headersOption === undefined || headersOption === true) {
    return headers;
  }

  // headers: function → transform defaults
  return await headersOption(headers);
};

/**
 * Convert a user-supplied body into a `fetch`-compatible `BodyInit`.
 *
 * The API client accepts `unknown` bodies to support multiple request styles
 * (JSON APIs, multipart uploads, plain text payloads). This helper centralizes
 * serialization rules so callers don't have to remember when to `JSON.stringify`
 * or how to build `FormData`.
 *
 * @throws When `input: "text"` is specified but `body` is not a string.
 *
 * @example
 * ```ts
 * prepareBody({ a: 1 }, "json"); // '{"a":1}'
 * prepareBody("hello", "text"); // "hello"
 *
 * // Convert a plain object to FormData
 * const fd = prepareBody({ file, title: "cover" }, "form");
 * fd instanceof FormData; // true
 * ```
 */
export const prepareBody = (
  body: unknown,
  input: _t.Input | undefined
): BodyInit | undefined => {
  if (body === undefined) return undefined;

  // Auto-detect: FormData and Blob pass through as-is
  if (body instanceof FormData) return body;
  if (body instanceof Blob) return body;

  // Explicit input handling
  if (input === "json") return JSON.stringify(body);
  if (input === "text") {
    if (typeof body === "string") return body;
    throw new Error("[api] input: 'text' requires a string body");
  }
  if (input === "form") {
    const fd = new FormData();
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      fd.append(k, v as string | Blob);
    }
    return fd;
  }

  // No input specified - pass through (shouldn't normally happen with defaultInput)
  return body as BodyInit;
};

/**
 * Parse a `fetch` response into the configured output type.
 *
 * Why this exists:
 * - Most app endpoints are JSON, but uploads/downloads need `blob`, `arrayBuffer`,
 *   or raw streaming bodies.
 * - Progress reporting for downloads requires manually reading the response
 *   stream. When `onProgress` is provided, we buffer the response to compute
 *   `loaded/total/percent`.
 *
 * Notes:
 * - For `output: "json"`, an empty response body returns `null`.
 * - For `output: "stream"`, we return `response.body` (no buffering/parsing).
 *
 * @example
 * ```ts
 * const data = await parseResponse<{ id: string }>(response, "json");
 *
 * const blob = await parseResponse<Blob>(response, "blob", (p) => {
 *   console.log(p.percent);
 * });
 *
 * const stream = await parseResponse<ReadableStream<Uint8Array> | null>(
 *   response,
 *   "stream"
 * );
 * ```
 */
export const parseResponse = async <
  Res,
  O extends _t.Output | undefined = undefined,
>(
  response: Response,
  output?: O,
  onProgress?: (progress: _t.Progress) => void
): Promise<_t.DataForOutput<Res, O>> => {
  const out = output ?? "json";

  // Stream output - return body directly
  if (out === "stream") {
    return response.body as _t.DataForOutput<Res, O>;
  }

  // Track download progress if callback provided
  if (onProgress && response.body) {
    const total = Number(response.headers.get("Content-Length")) || 0;
    let loaded = 0;
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress({
        loaded,
        total,
        percent: total ? Math.round((loaded / total) * 100) : 0,
      });
    }

    const blob = new Blob(chunks);
    if (out === "blob") return blob as _t.DataForOutput<Res, O>;
    if (out === "arrayBuffer")
      return (await blob.arrayBuffer()) as _t.DataForOutput<Res, O>;
    if (out === "text") return (await blob.text()) as _t.DataForOutput<Res, O>;

    // json
    const text = await blob.text();
    return (text ? JSON.parse(text) : null) as _t.DataForOutput<Res, O>;
  }

  // No progress tracking - use native methods
  if (out === "blob")
    return (await response.blob()) as _t.DataForOutput<Res, O>;
  if (out === "arrayBuffer")
    return (await response.arrayBuffer()) as _t.DataForOutput<Res, O>;
  if (out === "text")
    return (await response.text()) as _t.DataForOutput<Res, O>;

  // json (default)
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as _t.DataForOutput<Res, O>;
};

