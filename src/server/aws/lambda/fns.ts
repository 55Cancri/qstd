import { ArkErrors } from "arktype";
import * as _l from "./literals";
import * as _t from "./types";

/**
 * Determine the correct status code to return.
 * If no status code is passed, return either 204 or 200, depending on if a body is present.
 * @param body
 * @param options
 * @returns
 */
export const getStatusCode = (body: unknown, options?: _t.ResponseOptions): number => {
  // body could be null, but still return 400
  if (body === undefined) return 204;
  if (options === undefined) return 200;
  return options.status ?? 200;
};

export const getDefaultHeaders = (opts: _t.ResponseOptions = {}) => ({
  "Content-Type": opts.contentType ?? "application/json",
  "access-control-allow-origin": opts.origin ?? "*",
  "access-control-allow-headers":
    // opts.allowedHeaders ??
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
  "access-control-allow-methods":
    opts.methods ?? "OPTIONS,POST,GET,PUT,DELETE,PATCH",
  "access-control-allow-credentials": opts.allowCredentials ?? false, // don't send cookie automatically
  // opts.allowCredentials === true ? "true" : "false", // don't send cookie automatically
});

/**
 * This will take a string or object and return as a proper
 * response object including the status code, headers,
 * and stringified body.
 * @param responseBody Defaults to 200 status code.
 * @param opts
 * @returns
 */
export const response = <T = unknown>(
  /** Try to make an object or null. */
  responseBody?: T,
  opts?: _t.ResponseOptions
): _t.Response => {
  const statusCode = getStatusCode(responseBody, opts);
  const defaultHeaders = getDefaultHeaders(opts);
  const additionalHeaders = opts?.additionalHeaders;
  const headers = { ...defaultHeaders, ...additionalHeaders };
  const body =
    typeof responseBody === "string"
      ? responseBody
      : JSON.stringify(responseBody);
  const isBase64Encoded = opts?.isBase64Encoded ?? false;
  return { headers, statusCode, body, isBase64Encoded };
};

/**
 * Creates a handler function that will catch all errors and automatically
 * handle things like HTTP errors and Arktype validation errors,
 * @returns
 */
export const createHandlerFactory =
  <T extends _t.ApigwEvent | _t.WebsocketEvent>() =>
  (fn: (event: T) => Promise<_t.ApigwResult> | _t.ApigwResult) =>
  async (event: T) => {
    try {
      return await fn(event);
    } catch (err) {
      console.log(`[error]`, { err });

      if (err instanceof _l.HttpError) {
        return response(
          { message: err.display },
          { status: err.statusCode ?? 500 }
        );
      } else if (err instanceof ArkErrors) {
        return response(
          { message: "validation error", errors: err.summary },
          { status: 400 }
        );
      } else if (err instanceof Error) {
        return response({ message: err.message }, { status: 500 });
      } else {
        return response(null, { status: 500 });
      }
    }
  };
