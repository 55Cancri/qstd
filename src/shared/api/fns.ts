import { RestError } from "./types";
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
  if (
    typeof import.meta !== "undefined" &&
    // @ts-expect-error - import.meta.env is Vite-specific
    import.meta.env?.DEV !== undefined
  ) {
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
 * Join an API `baseUrl` and a request `path` without creating `//` between them.
 *
 * Why this exists:
 * - Many apps (including Stockpile) call the API client with leading-slash paths
 *   like `"/media"` (easy to read, consistent with server routes).
 * - Some deploy tooling naturally emits base URLs with a trailing slash
 *   (e.g. `"https://api.example.com/v1/"`).
 * - Naive string concatenation would produce `"https://.../v1//media"`, which can
 *   break routing in gateways/CDNs and is hard to debug.
 *
 * This helper intentionally does **not** attempt full URL normalization; it only
 * guarantees a single `/` at the join boundary while preserving:
 * - Existing query strings in `path` (e.g. `"/users?limit=10"`)
 * - Relative behavior when `baseUrl` is empty (same as the legacy implementation)
 *
 * @example
 * ```ts
 * joinBaseAndPath("https://api.example.com/v1", "/users");   // "https://api.example.com/v1/users"
 * joinBaseAndPath("https://api.example.com/v1/", "/users");  // "https://api.example.com/v1/users"
 * joinBaseAndPath("https://api.example.com/v1", "users");    // "https://api.example.com/v1/users"
 * joinBaseAndPath("", "/users");                              // "/users"
 * ```
 */
const joinBaseAndPath = (baseUrl: string, path: string): string => {
  if (!baseUrl) return path;
  if (!path) return baseUrl;

  // Query/hash-only "paths" should attach directly (no slash insertion).
  if (path.startsWith("?") || path.startsWith("#")) {
    return `${baseUrl.replace(/\/+$/, "")}${path}`;
  }

  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");

  // Preserve a trailing slash request (rare, but intentional when used).
  if (!trimmedPath && path.startsWith("/")) {
    return `${trimmedBase}/`;
  }

  return `${trimmedBase}/${trimmedPath}`;
};

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

  const baseUrl = isAbsolute(path) ? "" : props.baseUrl;
  let url = joinBaseAndPath(baseUrl, path);

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
  headersOption:
    | true
    | false
    | _t.HeadersObject
    | _t.HeadersTransform
    | undefined;
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
  if (typeof headersOption === "function") {
    return await headersOption(headers);
  }

  // headers: plain object → merge with defaults
  return { ...headers, ...headersOption };
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
/**
 * Parse a ReadableStream as Server-Sent Events (SSE).
 *
 * SSE is a W3C standard wire format for server-to-client streaming. This parser
 * handles the protocol details:
 * - Buffers incomplete lines across chunks (network packets don't align with events)
 * - Parses `data:`, `event:`, `id:` fields per the spec
 * - Yields complete events when an empty line is encountered
 *
 * The generator yields `SSEEvent<T>` objects containing the parsed data and optional
 * event type and ID fields. It completes naturally when the stream ends.
 *
 * Note: Application-level signals like `[DONE]` (OpenAI) are NOT handled here.
 * Those are application semantics, not protocol. The consumer should check for
 * them in the yielded events.
 *
 * ## ⚠️ Important: JSON is required
 *
 * This parser **always** JSON-parses the `data:` payload. Your server must send
 * valid JSON in each SSE event. If it sends plain strings, XML, or any non-JSON
 * format, parsing will fail with a descriptive error.
 *
 * **Why JSON-only?** This matches regular HTTP behavior — when you type
 * `Res: SomeInterface`, you're declaring a JSON contract. SSE follows the same
 * convention: typed data = JSON data.
 *
 * @throws {Error} When a `data:` payload is not valid JSON. The error message
 *   includes the raw data that failed to parse for debugging.
 *
 * @example
 * ```ts
 * // ✅ Works - server sends JSON
 * // Server: data: {"type":"delta","content":"Hello"}
 * for await (const { data } of parseSSE<ChatChunk>(stream)) {
 *   console.log(data.type); // "delta"
 * }
 *
 * // ❌ Throws - server sends plain string
 * // Server: data: Hello world
 * // Error: "SSE data must be valid JSON. Received: Hello world"
 * ```
 */
export async function* parseSSE<T = unknown>(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<_t.SSEEvent<T>, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let eventType: string | undefined;
  let eventId: string | undefined;
  let dataLines: string[] = [];

  /**
   * Parse raw SSE data as JSON with a helpful error message.
   */
  const parseJsonData = (rawData: string): T => {
    try {
      return JSON.parse(rawData) as T;
    } catch {
      // Truncate long data for readability in error message
      const preview =
        rawData.length > 100 ? rawData.slice(0, 100) + "..." : rawData;
      throw new Error(
        `[api] SSE data must be valid JSON. ` +
          `This parser expects your server to send JSON-formatted data in each SSE event. ` +
          `If you're sending plain strings or another format, you'll need to update your server ` +
          `to send JSON instead (e.g., {"message":"Hello"} instead of just "Hello").\n\n` +
          `Received: ${preview}`
      );
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines from buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line === "" || line === "\r") {
          // Empty line = end of event, yield if we have data
          if (dataLines.length > 0) {
            const rawData = dataLines.join("\n");
            yield {
              data: parseJsonData(rawData),
              ...(eventType && { event: eventType }),
              ...(eventId && { id: eventId }),
            };
            // Reset for next event
            dataLines = [];
            eventType = undefined;
            eventId = undefined;
          }
        } else if (line.startsWith("data:")) {
          // data: field (strip "data:" prefix and optional leading space)
          const value = line.slice(5);
          dataLines.push(value.startsWith(" ") ? value.slice(1) : value);
        } else if (line.startsWith("event:")) {
          // event: field
          const value = line.slice(6);
          eventType = value.startsWith(" ") ? value.slice(1) : value;
        } else if (line.startsWith("id:")) {
          // id: field
          const value = line.slice(3);
          eventId = value.startsWith(" ") ? value.slice(1) : value;
        }
        // retry: field is intentionally ignored (reconnection is not applicable here)
        // Lines starting with : are comments, also ignored
      }
    }

    // Handle any remaining data in buffer (shouldn't normally happen with well-formed SSE)
    if (dataLines.length > 0) {
      const rawData = dataLines.join("\n");
      yield {
        data: parseJsonData(rawData),
        ...(eventType && { event: eventType }),
        ...(eventId && { id: eventId }),
      };
    }
  } finally {
    reader.releaseLock();
  }
}

export const parseResponse = async <
  Res,
  O extends _t.Output | undefined = undefined
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

  // SSE output - return async generator (always JSON-parses data)
  if (out === "sse") {
    if (!response.body) {
      throw new Error("[api] SSE output requires a response body");
    }
    return parseSSE<Res>(response.body) as _t.DataForOutput<Res, O>;
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

// ─────────────────────────────────────────────────────────────────────────────
// XHR Request (for upload progress support)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute an HTTP request using XMLHttpRequest for upload progress tracking.
 *
 * This is used internally when `onUploadProgress` is provided. XHR is the only
 * browser API that supports tracking upload progress via `xhr.upload.onprogress`.
 *
 * Note: This function does NOT support streaming outputs (`sse`, `stream`) because
 * XHR buffers the entire response. The type system prevents this combination.
 *
 * @throws {RestError} When the response status is not 2xx.
 */
export const requestWithXhr = <
  Res,
  O extends _t.Output | undefined = undefined
>(props: {
  onUploadProgress?: (progress: _t.Progress) => void;
  onProgress?: (progress: _t.Progress) => void;
  headers?: _t.HeadersObject;
  signal?: AbortSignal;
  method: _t.Method;
  body?: BodyInit;
  url: string;
  output?: O;
}): Promise<_t.DataForOutput<Res, O>> => {
  const {
    url,
    body,
    method,
    output,
    signal,
    headers,
    onUploadProgress,
    onProgress,
  } = props;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    // Set response type for non-JSON outputs
    const out = output ?? "json";
    if (out === "blob") {
      xhr.responseType = "blob";
    } else if (out === "arrayBuffer") {
      xhr.responseType = "arraybuffer";
    } else {
      // json, text - use default (text) and parse manually
      xhr.responseType = "text";
    }

    // Set headers (skip Content-Type for FormData - browser sets it with boundary)
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        // Don't override Content-Type for FormData
        if (key.toLowerCase() === "content-type" && body instanceof FormData) {
          continue;
        }
        xhr.setRequestHeader(key, value);
      }
    }

    // Upload progress tracking
    if (onUploadProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onUploadProgress({
            percent: Math.round((e.loaded / e.total) * 100),
            loaded: e.loaded,
            total: e.total,
          });
        }
      };
    }

    // Download progress tracking
    if (onProgress) {
      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      };
    }

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Request aborted"));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Parse response based on output type
        if (out === "blob" || out === "arrayBuffer") {
          resolve(xhr.response as _t.DataForOutput<Res, O>);
        } else if (out === "text") {
          resolve(xhr.responseText as _t.DataForOutput<Res, O>);
        } else {
          // json (default)
          const text = xhr.responseText;
          resolve((text ? JSON.parse(text) : null) as _t.DataForOutput<Res, O>);
        }
      } else {
        reject(new RestError({ status: xhr.status, body: xhr.responseText }));
      }
    };

    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.ontimeout = () => reject(new Error("Request timed out"));

    // Note: ReadableStream bodies are not supported with XHR (fetch-only).
    // The type system prevents combining onUploadProgress with streaming outputs,
    // but we cast here since BodyInit includes ReadableStream which XHR can't handle.
    xhr.send(body as XMLHttpRequestBodyInit | Document | null | undefined);
  });
};