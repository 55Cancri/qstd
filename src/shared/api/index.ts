/**
 * REST API client module for making HTTP requests.
 *
 * This module wraps fetch with sensible defaults and type-safe options.
 * It eliminates boilerplate: base URL handling, JSON serialization,
 * Content-Type headers, error parsing, and response transformation.
 *
 * ### Types vs runtime decoding (important)
 * - **Generics (`Req`/`Res`) are compile-time only** (they do not exist at runtime).
 * - The **`output` option is runtime** and controls how we decode the `Response`:
 *   - default / `"json"` → `response.text()` then `JSON.parse(...)`
 *   - `"blob"` → `response.blob()`
 *   - `"arrayBuffer"` → `response.arrayBuffer()`
 *   - `"stream"` → `response.body` (raw ReadableStream)
 *   - `"sse"` → `AsyncGenerator<SSEEvent<Res>>` (Server-Sent Events, JSON only)
 *
 * The return type is derived from `output`. If you try to use a non-JSON response
 * type (like `Blob`) without setting `output`, TypeScript will surface a helpful
 * error type to prevent "type says blob, runtime parses JSON" bugs.
 *
 * Body types are auto-detected:
 * - Objects → JSON (Content-Type: application/json)
 * - FormData → multipart (browser sets Content-Type with boundary)
 * - Blob → uses blob.type for Content-Type
 *
 * ### SSE streaming (output: "sse")
 *
 * For Server-Sent Events streaming, use `output: "sse"`. This returns an async
 * generator that yields parsed events.
 *
 * **⚠️ SSE requires JSON data.** Your server must send valid JSON in each
 * `data:` line. Plain strings or other formats will throw an error with a
 * helpful message explaining what went wrong.
 *
 * @example
 * ```ts
 * // Configure once at app startup
 * Api.configure({
 *   baseUrl: import.meta.env.VITE_API_URL,
 *   headers: () => ({ Authorization: `Bearer ${getToken()}` }),
 * });
 *
 * // GET (JSON)
 * const users = await Api.get<User[]>("/users"); // legacy shorthand
 * const users2 = await Api.get<{ Res: User[] }>("/users"); // named type-args
 *
 * // POST (typed body + typed JSON response)
 * const user = await Api.post<{ Req: { name: string }; Res: User }>(
 *   "/users",
 *   { name: "Alice" }
 * );
 *
 * // Download (non-JSON) — use `output` (return type follows `output`)
 * const image = await Api.get("/avatar.png", { output: "blob" }); // Blob
 *
 * // POST FormData (auto-detected)
 * await Api.post("/upload", formData);
 *
 * // External URL (never includes configured default headers like auth)
 * await Api.post(s3PresignedUrl, formData);
 *
 * // SSE streaming (server must send JSON in each data: line)
 * // Server sends: data: {"type":"delta","content":"Hello"}
 * type ChatChunk = { type: "delta" | "done"; content?: string };
 * const events = Api.post<{ Res: ChatChunk }>("/chat", body, { output: "sse" });
 * for await (const { data } of events) {
 *   if (data.type === "delta") {
 *     content += data.content;
 *   }
 * }
 * ```
 */
export { RestError } from "./types";
export { parseSSE } from "./fns";
export type * from "./types";
export * from "./domain";

