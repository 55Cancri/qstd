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

/**
 * Creates a batch failures tracker for SQS handlers.
 * Provides a simple `add(id)` method instead of pushing objects.
 *
 * @example
 * ```ts
 * const failures = Lambda.withBatchFailures();
 *
 * for (const record of event.Records) {
 *   try {
 *     // process record
 *   } catch (err) {
 *     failures.add(record.messageId);
 *   }
 * }
 *
 * return { batchItemFailures: failures.items };
 * ```
 */
export const withBatchFailures = () => {
  const items: _t.SqsBatchItemFailure[] = [];
  return {
    /** Add a failed message by its ID. Stores as `{ itemIdentifier }` for the SQS batch failures response. */
    add: (itemIdentifier: string) => {
      items.push({ itemIdentifier });
    },
    /** The failures array for the response */
    items,
  };
};

/**
 * Creates a type-safe SQS handler that enforces returning `{ batchItemFailures }`.
 *
 * Provides:
 * - **Compile-time safety**: TypeScript enforces the return type
 * - **Runtime safety**: Validates response shape before returning
 *
 * @example
 * ```ts
 * export const handler = Lambda.createSqsHandler(async (event) => {
 *   const failures = Lambda.withBatchFailures();
 *
 *   for (const record of event.Records) {
 *     try {
 *       // process record
 *     } catch (err) {
 *       failures.add(record.messageId);
 *     }
 *   }
 *
 *   return { batchItemFailures: failures.items };
 * });
 * ```
 */
export const createSqsHandler =
  (fn: _t.SqsHandlerFn): _t.SqsHandlerFn =>
  async (event) => {
    const result = await fn(event);

    // Runtime validation - catch mistakes that bypass TypeScript
    if (!result || !Array.isArray(result.batchItemFailures)) {
      throw new Error(
        "SQS handler must return { batchItemFailures: [] }. " +
          "Return an empty array for success, or include failed messageIds for partial failures."
      );
    }

    return result;
  };
