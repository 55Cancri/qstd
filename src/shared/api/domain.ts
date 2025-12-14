import { RestError } from "./types";
import type {
  BodylessOptions,
  BodyOptions,
  Config,
  DataForOutput,
  HeadersObject,
  Input,
  JsonRes,
  Method,
  Options,
  Output,
  ReqFrom,
  ResFrom,
} from "./types";
import * as _f from "./fns";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

let config: Config = { baseUrl: "" };

/**
 * Configure the API client with base URL and default headers.
 *
 * Call this once at app startup before making any requests. The headers
 * option can be a static object or an async function that returns headers,
 * useful for dynamic auth tokens that refresh periodically.
 *
 * @example
 * ```ts
 * // Static headers
 * Api.configure({
 *   baseUrl: "https://api.example.com",
 *   headers: { "X-API-Key": "secret" },
 * });
 *
 * // Dynamic headers (called fresh on each request)
 * Api.configure({
 *   baseUrl: import.meta.env.VITE_API_URL,
 *   headers: async () => ({
 *     Authorization: `Bearer ${await getAuthToken()}`,
 *   }),
 * });
 * ```
 */
export const configure = (c: Config) => {
  config = c;
};

/**
 * Resolve configured default headers into a plain object.
 *
 * The API client supports static headers (simple apps) and dynamic headers
 * (most common: auth tokens that refresh). We normalize both into a single
 * async call so the request pipeline can treat headers uniformly.
 *
 * @example
 * ```ts
 * // Static headers
 * Api.configure({ baseUrl: "...", headers: { "X-API-Key": "secret" } });
 *
 * // Dynamic headers (called per-request)
 * Api.configure({ baseUrl: "...", headers: async () => ({ Authorization: "Bearer ..." }) });
 * ```
 */
const configHeaders = async (): Promise<HeadersObject> => {
  if (!config.headers) return {};
  return typeof config.headers === "function"
    ? await config.headers()
    : config.headers;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute a single HTTP request with the module's defaults, safety checks, and parsing.
 *
 * This is the orchestrator that turns the "nice" API exposed by `get/post/...`
 * into a concrete `fetch(...)` call. It exists so the app can rely on consistent
 * behavior everywhere:
 * - Internal paths use `baseUrl`, external URLs do not
 * - Default headers (auth) are included for internal calls, and **never** for external
 * - Bodies are serialized consistently (`json` by default for write methods)
 * - Errors are normalized into `RestError` and can be converted via `onError`
 * - Responses are parsed via `_f.parseResponse` with optional progress tracking
 *
 * @throws {RestError} When the response is not ok and no `onError` handler is provided.
 */
const request = async <
  Req,
  Res,
  O extends Output | undefined = undefined,
  Return = DataForOutput<Res, O>,
>(
  method: Method,
  path: string,
  options?: BodyOptions<Req, Res, Return, O> | Options<Res, Return, O>,
  defaultInput?: Input
): Promise<Return> => {
  const opts = options as BodyOptions<Req, Res, Return, O> | undefined;
  const url = _f.prepareUrl(path, {
    baseUrl: config.baseUrl,
    ...(opts?.params ? { params: opts.params } : {}),
  });
  const rawBody = opts?.body;

  // Determine input type:
  // 1. If explicitly specified, use it
  // 2. If body is FormData/Blob, auto-detect (skip defaultInput to avoid JSON.stringify)
  // 3. Otherwise, use defaultInput (json for POST/PUT/PATCH)
  const isAutoDetect = rawBody instanceof FormData || rawBody instanceof Blob;
  const input =
    opts && "input" in opts && opts.input !== undefined
      ? opts.input
      : isAutoDetect
        ? undefined
        : defaultInput;

  const headersOption = opts?.headers;
  const isExternal = _f.isAbsolute(path);

  // Default headers behavior:
  // - Internal paths: include configured default headers (auth, etc) unless headers:false
  // - External URLs: NEVER include configured default headers to avoid leaking auth tokens.
  const defaults =
    headersOption !== false && !isExternal ? await configHeaders() : {};
  const headers = await _f.prepareHeaders({
    defaults,
    headersOption,
    input,
    body: rawBody,
  });

  const body = _f.prepareBody(rawBody, input);

  const response = await fetch(url, {
    method,
    ...(headers && { headers }),
    ...(body !== undefined && { body }),
    ...(opts?.signal && { signal: opts.signal }),
  });

  if (!response.ok) {
    const error = new RestError({
      status: response.status,
      body: await response.text(),
    });
    if (opts?.onError) return opts.onError(error);
    throw error;
  }

  const data = await _f.parseResponse<Res, O>(
    response,
    opts?.output,
    opts?.onProgress
  );
  return opts?.onSuccess ? opts.onSuccess(data) : (data as unknown as Return);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make a GET request to fetch data.
 *
 * GET requests don't have a body. Use `params` for query parameters.
 * Response is parsed as JSON by default; use `output` for other formats.
 *
 * Notes:
 * - Generics are compile-time only; `output` is what decides runtime decoding.
 * - The return type is derived from `output` (e.g. `output: "blob"` returns `Blob`).
 * - If you try to use a non-JSON decoded response type (like `Blob`) without setting
 *   `output`, TypeScript will raise a helpful error type to prevent mismatches.
 *
 * If the response is not ok, this throws a `RestError` unless you provide
 * an `onError` handler to convert the error into a return value.
 *
 * @example
 * ```ts
 * // Simple GET
 * const users = await Api.get<User[]>("/users");
 *
 * // With query params
 * const users = await Api.get<User[]>("/users", {
 *   params: { limit: 10, status: "active" },
 * });
 * // → GET /users?limit=10&status=active
 *
 * // Transform response
 * const names = await Api.get("/users", {
 *   onSuccess: (users: User[]) => users.map(u => u.name),
 * });
 *
 * // Download as blob
 * const image = await Api.get("/avatar.png", { output: "blob" });
 * ```
 *
 * @throws {RestError} When the response is not ok and no `onError` handler is provided.
 */
export function get<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = unknown,
>(
  path: string,
  opts: Options<JsonRes<ResFrom<TTypes>>, Return, O> & {
    onSuccess: (
      data: DataForOutput<JsonRes<ResFrom<TTypes>>, O>
    ) => Return;
  }
): Promise<Return>;
export function get<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  opts?: Options<JsonRes<ResFrom<TTypes>>, Return, O> & {
    onSuccess?: undefined;
  }
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return>;
export function get<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  opts?: Options<JsonRes<ResFrom<TTypes>>, Return, O>
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return> {
  return request<never, JsonRes<ResFrom<TTypes>>, O, Return>(
    "GET",
    path,
    opts
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make a POST request to create a resource.
 *
 * Body handling:
 * - Objects are JSON-serialized by default (Content-Type: application/json)
 * - FormData is auto-detected (browser sets Content-Type with boundary)
 * - Blob is auto-detected (uses blob.type for Content-Type)
 * - Use `input` option to override: "json" | "form" | "text"
 *
 * Notes:
 * - Use named type-args to type both request and response:
 *   `Api.post<{ Req: CreateReq; Res: CreateRes }>(...)`
 * - `output` controls runtime decoding and therefore the return type.
 *
 * If the response is not ok, this throws a `RestError` unless you provide
 * an `onError` handler to convert the error into a return value.
 *
 * @example
 * ```ts
 * // JSON body (default for objects)
 * const user = await Api.post<User>("/users", { name: "Alice" });
 *
 * // FormData auto-detected
 * const result = await Api.post("/upload", formData);
 *
 * // External URL (never includes configured default headers like auth)
 * await Api.post(presignedUrl, formData);
 * ```
 *
 * @throws {RestError} When the response is not ok and no `onError` handler is provided.
 */
export function post<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = unknown,
>(
  path: string,
  body: ReqFrom<TTypes>,
  opts: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & {
    onSuccess: (
      data: DataForOutput<JsonRes<ResFrom<TTypes>>, O>
    ) => Return;
  }
): Promise<Return>;
export function post<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & { onSuccess?: undefined }
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return>;
export function post<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  >
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return> {
  return request<ReqFrom<TTypes>, JsonRes<ResFrom<TTypes>>, O, Return>(
    "POST",
    path,
    { ...opts, body },
    "json"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make a PUT request to replace a resource.
 *
 * Body is JSON-serialized by default. See `post` for `input` options.
 *
 * If the response is not ok, this throws a `RestError` unless you provide
 * an `onError` handler to convert the error into a return value.
 *
 * @example
 * ```ts
 * const user = await Api.put<User>(`/users/${id}`, {
 *   name: "Alice",
 *   email: "alice@example.com",
 * });
 * ```
 *
 * @throws {RestError} When the response is not ok and no `onError` handler is provided.
 */
export function put<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = unknown,
>(
  path: string,
  body: ReqFrom<TTypes>,
  opts: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & {
    onSuccess: (
      data: DataForOutput<JsonRes<ResFrom<TTypes>>, O>
    ) => Return;
  }
): Promise<Return>;
export function put<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & { onSuccess?: undefined }
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return>;
export function put<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  >
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return> {
  return request<ReqFrom<TTypes>, JsonRes<ResFrom<TTypes>>, O, Return>(
    "PUT",
    path,
    { ...opts, body },
    "json"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make a PATCH request to partially update a resource.
 *
 * Body is JSON-serialized by default. See `post` for `input` options.
 *
 * If the response is not ok, this throws a `RestError` unless you provide
 * an `onError` handler to convert the error into a return value.
 *
 * @example
 * ```ts
 * const user = await Api.patch<User>(`/users/${id}`, { name: "New Name" });
 * ```
 *
 * @throws {RestError} When the response is not ok and no `onError` handler is provided.
 */
export function patch<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = unknown,
>(
  path: string,
  body: ReqFrom<TTypes>,
  opts: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & {
    onSuccess: (
      data: DataForOutput<JsonRes<ResFrom<TTypes>>, O>
    ) => Return;
  }
): Promise<Return>;
export function patch<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & { onSuccess?: undefined }
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return>;
export function patch<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  >
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return> {
  return request<ReqFrom<TTypes>, JsonRes<ResFrom<TTypes>>, O, Return>(
    "PATCH",
    path,
    { ...opts, body },
    "json"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Make a DELETE request to remove a resource.
 *
 * Supports an optional body for batch deletes or similar use cases.
 * Body is JSON-serialized by default when provided.
 *
 * If the response is not ok, this throws a `RestError` unless you provide
 * an `onError` handler to convert the error into a return value.
 *
 * @example
 * ```ts
 * // Simple delete
 * await Api.remove(`/users/${id}`);
 *
 * // With confirmation response
 * const result = await Api.remove<{ deleted: boolean }>(`/users/${id}`);
 *
 * // Batch delete with body
 * await Api.remove("/users", { ids: ["1", "2", "3"] });
 * ```
 *
 * @throws {RestError} When the response is not ok and no `onError` handler is provided.
 */
export function remove<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = unknown,
>(
  path: string,
  body: ReqFrom<TTypes>,
  opts: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & {
    onSuccess: (
      data: DataForOutput<JsonRes<ResFrom<TTypes>>, O>
    ) => Return;
  }
): Promise<Return>;
export function remove<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  > & { onSuccess?: undefined }
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return>;
export function remove<
  TTypes = unknown,
  O extends Output | undefined = undefined,
  Return = never,
>(
  path: string,
  body?: ReqFrom<TTypes>,
  opts?: BodylessOptions<
    ReqFrom<TTypes>,
    JsonRes<ResFrom<TTypes>>,
    Return,
    O
  >
): Promise<DataForOutput<JsonRes<ResFrom<TTypes>>, O> | Return> {
  // Only set default input to "json" if body is provided
  const defaultInput = body !== undefined ? "json" : undefined;
  return request<ReqFrom<TTypes>, JsonRes<ResFrom<TTypes>>, O, Return>(
    "DELETE",
    path,
    { ...opts, body },
    defaultInput
  );
}

