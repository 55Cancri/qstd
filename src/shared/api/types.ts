export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// ─────────────────────────────────────────────────────────────────────────────
// RestError
// ─────────────────────────────────────────────────────────────────────────────

export class RestError extends Error {
  status: number;
  body: string;

  constructor(props: { status: number; body: string }) {
    super(`REST ${props.status}: ${props.body}`);
    this.name = "RestError";
    this.status = props.status;
    this.body = props.body;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export type HeadersObject = Record<string, string>;
export type HeadersGetter = () => HeadersObject | Promise<HeadersObject>;
export type HeadersTransform = (
  defaults: HeadersObject
) => HeadersObject | Promise<HeadersObject>;

/**
 * Interceptor hooks for observability (telemetry, logging, debugging).
 *
 * These hooks are called during the request lifecycle but do NOT affect
 * the request/response. Use them for breadcrumbs, metrics, or logging.
 *
 * @example
 * ```ts
 * Api.configure({
 *   baseUrl: "https://api.example.com",
 *   onRequest: (method, path) => {
 *     Telemetry.addBreadcrumb({ type: "http", message: `${method} ${path}` });
 *   },
 *   onResponse: (method, path, elapsed) => {
 *     Telemetry.addBreadcrumb({ type: "http", message: `${method} ${path} OK (${elapsed}ms)` });
 *   },
 *   onError: (method, path, error, elapsed) => {
 *     Telemetry.addBreadcrumb({ type: "http", message: `${method} ${path} FAIL`, data: { error } });
 *   },
 * });
 * ```
 */
export type RequestHooks = {
  /** Called before each request starts */
  onRequest?: (method: Method, path: string) => void;
  /** Called after successful response (before parsing) */
  onResponse?: (method: Method, path: string, elapsed: number) => void;
  /** Called when request fails (network error or non-ok response) */
  onError?: (
    method: Method,
    path: string,
    error: Error,
    elapsed: number
  ) => void;
};

export type Config = {
  baseUrl: string;
  headers?: HeadersObject | HeadersGetter;
} & RequestHooks;

// ─────────────────────────────────────────────────────────────────────────────
// Input / Output
// ─────────────────────────────────────────────────────────────────────────────

export type Params = Record<
  string,
  string | number | boolean | undefined | null
>;

export type Input = "json" | "form" | "text";
export type Output =
  | "json"
  | "text"
  | "blob"
  | "stream"
  | "arrayBuffer"
  | "sse";

/** Output types that require fetch's streaming capabilities (incompatible with XHR). */
export type StreamingOutput = "sse" | "stream";

// ─────────────────────────────────────────────────────────────────────────────
// SSE (Server-Sent Events)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A parsed Server-Sent Event.
 *
 * SSE is a W3C standard format for server-to-client streaming:
 * - `data` is the event payload (always JSON-parsed)
 * - `event` is the optional event type (from `event:` field)
 * - `id` is the optional event ID (from `id:` field)
 *
 * ## ⚠️ Important: JSON is required
 *
 * The `data` field is **always** parsed as JSON. The `Res` type parameter
 * defines the expected JSON shape. If your server sends non-JSON data
 * (plain strings, XML, etc.), this will throw a parse error.
 *
 * **Your server must send valid JSON in each `data:` line.**
 *
 * This matches the behavior of regular HTTP JSON responses — if you type
 * `Res: SomeInterface`, you're declaring a JSON contract.
 *
 * @example
 * ```ts
 * // ✅ Server sends: data: {"type":"delta","content":"Hello"}
 * type ChatChunk = { type: "delta" | "done"; content?: string };
 * const events = Api.post<{ Res: ChatChunk }>("/chat", body, { output: "sse" });
 * for await (const { data } of events) {
 *   console.log(data.type); // "delta"
 * }
 *
 * // ❌ Server sends: data: Hello world (plain string, NOT JSON)
 * // This will throw: "SSE data must be valid JSON"
 * ```
 */
export type SSEEvent<T = unknown> = {
  data: T;
  event?: string;
  id?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic helpers (typed Req/Res + output-driven response types)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Named generic type-args for API calls.
 *
 * This enables patterns like:
 * - `Api.post<{ Req: CreateUser; Res: User }>("/users", body)`
 * - `Api.post<{ Req: CreateUser }>("/users", body)` (response defaults to `unknown`)
 * - `Api.get<{ Res: User[] }>("/users")`
 *
 * Calls can still use the legacy shorthand `Api.get<User[]>()` / `Api.post<User>()`
 * where the generic is treated as the JSON response type.
 *
 * Important: these type arguments are compile-time only. For non-JSON responses
 * (blob/arrayBuffer/stream), use the runtime `output` option (the return type
 * is derived from `output`).
 */
export type TypeArgs = {
  Req?: unknown;
  Res?: unknown;
};

type IsTypeArgs<T> = T extends object
  ? "Req" extends keyof T
    ? true
    : "Res" extends keyof T
    ? true
    : false
  : false;

/** Extract request/body type from either `TypeArgs` or legacy shorthand. */
export type ReqFrom<T> = IsTypeArgs<T> extends true
  ? T extends { Req?: infer Req }
    ? Req
    : unknown
  : unknown;

/** Extract JSON response type from either `TypeArgs` or legacy shorthand. */
export type ResFrom<T> = IsTypeArgs<T> extends true
  ? "Res" extends keyof T
    ? T extends { Res?: infer Res }
      ? Res
      : unknown
    : unknown
  : T;

/**
 * Map the runtime `output` option to the parsed value type.
 *
 * - `output: "json"` (or omitted) → `Res`
 * - `output: "blob"` → `Blob`
 * - `output: "sse"` → `AsyncGenerator<SSEEvent<Res>>`
 * - etc.
 *
 * This makes `output` the single source of truth for non-JSON response shapes,
 * while `Res` describes the JSON-decoded shape when `output` is omitted/`"json"`.
 */
export type DataForOutput<Res, O extends Output | undefined> = O extends "text"
  ? string
  : O extends "blob"
  ? Blob
  : O extends "stream"
  ? ReadableStream<Uint8Array> | null
  : O extends "arrayBuffer"
  ? ArrayBuffer
  : O extends "sse"
  ? AsyncGenerator<SSEEvent<Res>, void, unknown>
  : Res;

/**
 * Types that cannot be produced by JSON parsing and therefore require an explicit `output`.
 *
 * (We intentionally do NOT include `string` here because JSON can legitimately parse to a
 * string, e.g. `"hello"`.)
 */
export type NonJsonDecoded =
  | Blob
  | ArrayBuffer
  | ReadableStream<Uint8Array>
  | AsyncGenerator;

/**
 * A helpful compile-time error shape when a non-JSON decoded type is requested without
 * specifying the matching `output` option.
 */
export type OutputRequiredError = {
  __api_output_required: "Set opts.output to 'blob' | 'arrayBuffer' | 'stream' (or use the default JSON output).";
};

/** If `Res` contains a non-JSON decoded type, replace it with an error helper type. */
export type JsonRes<Res> = [Extract<Res, NonJsonDecoded>] extends [never]
  ? Res
  : OutputRequiredError;

export type Progress = {
  loaded: number;
  total: number;
  percent: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Options (GET, DELETE - no body)
// ─────────────────────────────────────────────────────────────────────────────

export type Options<
  Res,
  Return = Res,
  O extends Output | undefined = undefined
> = {
  headers?: true | false | HeadersObject | HeadersTransform;
  params?: Params;
  output?: O;
  signal?: AbortSignal;
  /** Progress callback for blob/arrayBuffer downloads (not applicable to SSE). */
  onProgress?: (progress: Progress) => void;
  onSuccess?: (data: DataForOutput<Res, O>) => Return;
  onError?: (error: RestError) => Return;
};

// ─────────────────────────────────────────────────────────────────────────────
// BodyOptions (POST, PUT, PATCH - with body)
//
// Default behavior:
// - input defaults to "json" for objects (JSON.stringify, Content-Type: application/json)
// - FormData and Blob are auto-detected (no input needed, proper Content-Type handling)
// - external URLs (http/https) NEVER include configured default headers (auth, etc)
// - headers: false skips all headers (escape hatch for tricky integrations)
// ─────────────────────────────────────────────────────────────────────────────

export type BodyOptions<
  Req = unknown,
  Res = unknown,
  Return = Res,
  O extends Output | undefined = undefined
> = {
  body?: Req;
  input?: Input;
  headers?: true | false | HeadersObject | HeadersTransform;
  params?: Params;
  output?: O;
  signal?: AbortSignal;
  /** Progress callback for response body downloads (not applicable to SSE/stream). */
  onProgress?: (progress: Progress) => void;
  /**
   * Progress callback for request body uploads. Uses XHR internally.
   *
   * ⚠️ Cannot be combined with streaming outputs (`output: "sse"` or `output: "stream"`)
   * because XHR doesn't support true streaming responses. TypeScript will error if you
   * try to use both.
   */
  onUploadProgress?: [O] extends [StreamingOutput]
    ? never
    : (progress: Progress) => void;
  onSuccess?: (data: DataForOutput<Res, O>) => Return;
  onError?: (error: RestError) => Return;
};

// ─────────────────────────────────────────────────────────────────────────────
// BodylessOptions (for methods accepting body as separate argument)
// ─────────────────────────────────────────────────────────────────────────────

export type BodylessOptions<
  Req = unknown,
  Res = unknown,
  Return = Res,
  O extends Output | undefined = undefined
> = Omit<BodyOptions<Req, Res, Return, O>, "body">;
