import * as _t from "./types";
import * as _f from "./fns";

/**
 * Create a REST handler for an AWS Lambda function.
 * This handler will catch all errors and automatically
 * handle things like HTTP errors and Arktype validation errors,
 * @param fn
 * @returns
 */
export const createRestHandler = _f.createHandlerFactory<_t.ApigwEvent>();

/**
 * Same as rest handler but just receives a websocket event.
 * @param fn
 * @returns
 */
export const createWebsocketHandler =
  _f.createHandlerFactory<_t.WebsocketEvent>();

export const createSqsHandler =
  (fn: _t.SQSHandler) =>
  (event: _t.SqsEvent, context: _t.SqsContext, callback: _t.SqsCallback) => {
    return fn(event, context, callback);
  };
