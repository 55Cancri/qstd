import {
  GetCommand,
  PutCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  DynamoDBDocumentClient,
  type NativeAttributeValue,
} from "@aws-sdk/lib-dynamodb";
import {
  DynamoDBClient,
  DeleteTableCommand,
  DescribeTableCommand,
  DynamoDBServiceException,
} from "@aws-sdk/client-dynamodb";
import * as _t from "./types";
import * as _f from "./fns";

export type Client = ReturnType<typeof create>;

export const create = (props?: {
  credentials?: _t.Credentials;
  tableName: string;
}) => {
  const tableName = props?.tableName;
  const credentials = props?.credentials;
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      ...(credentials && { credentials }),
      region: "us-east-1",
    }),
    {
      marshallOptions: {
        // Whether to automatically convert empty strings, blobs, and sets to `null`.
        convertEmptyValues: false, // false, by default.
        // Whether to remove undefined values while marshalling.
        removeUndefinedValues: false, // false, by default.
        // Whether to convert typeof object to map attribute.
        convertClassInstanceToMap: false, // false, by default.
      },
      unmarshallOptions: {
        // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
        wrapNumbers: false, // false, by default.
      },
    }
  );
  return { client, tableName };
};

/**
 * Query or Scan DynamoDB with type-safe filters and modern API
 * @param ddb - DynamoDB client
 * @param props - Query/Scan properties
 * @returns Items array by default; use `first` and `raw` flags to customize
 *
 * @example
 * // Get items array (default)
 * const items = await find<User>(doc, {
 *   tableName: 'users',
 *   pk: { value: 'user#123' }
 * });
 * // items: User[]
 *
 * @example
 * // Get first item
 * const user = await find<User>(doc, {
 *   tableName: 'users',
 *   pk: { value: 'user#123' },
 *   first: true,
 * }); // user: User | undefined
 *
 * @example
 * // Get full response with metadata
 * const result = await find<User>(doc, {
 *   tableName: 'users',
 *   pk: { value: 'user#123' },
 *   raw: true,
 * }); // result: RawResponse<User>
 *
 * @example
 * // Type-safe filters with modern API
 * const active = await find<User>(doc, {
 *   tableName: 'users',
 *   pk: { value: 'org#456' },
 *   sk: { op: 'begins_with', value: 'user#' },
 *   filters: [
 *     { key: 'status', op: '=', value: 'active' },
 *     { key: 'score', op: '>', value: 80 },
 *     { key: 'email', op: 'attribute_exists' }
 *   ],
 *   sort: 'desc',
 *   strong: true,
 * }); // active: User[]
 *
 * @example
 * // Scan mode - no pk/sk required, can filter on any attribute
 * const allActive = await find<User>(doc, {
 *   tableName: 'users',
 *   scan: true,
 *   filters: [
 *     { key: 'pk', op: 'begins_with', value: 'user#' },
 *     { key: 'status', op: '=', value: 'active' },
 *   ],
 *   recursive: true,
 *   maxItems: 1000,
 * }); // allActive: User[]
 */
// Overload 1: first + raw → { item: T | undefined; count; scannedCount }
export function find<T extends object = Record<string, unknown>>(
  ddb: Client,
  props: _t.FindProps<T> & { first: true; raw: true }
): Promise<{ item: T | undefined; count: number; scannedCount: number }>;
// Overload 2: raw: true → RawResponse<T>
export function find<T extends object = Record<string, unknown>>(
  ddb: Client,
  props: _t.FindProps<T> & { raw: true }
): Promise<_t.RawResponse<T>>;
// Overload 3: first: true → T | undefined
export function find<T extends object = Record<string, unknown>>(
  ddb: Client,
  props: _t.FindProps<T> & {
    /** Return the first item from the items array */ first: true;
  }
): Promise<T | undefined>;
// Overload 4: default (no flags) → T[]
export function find<T extends object = Record<string, unknown>>(
  ddb: Client,
  props: _t.FindProps<T>
): Promise<T[]>;

// Implementation
export async function find<T extends object = Record<string, unknown>>(
  ddb: Client,
  props: _t.FindProps<T> & { first?: boolean; raw?: boolean }
): Promise<
  | { item: T | undefined; count: number; scannedCount: number }
  | _t.RawResponse<T>
  | T[]
  | T
  | undefined
> {
  try {
    const TableName = props.tableName ?? ddb.tableName;
    const { filters, projection, debug } = props;
    const isScan = "scan" in props && props.scan === true;

    _f.validateFindProps(props);

    // Build expression attributes
    const names: Record<string, string> = {};
    const values: Record<string, NativeAttributeValue> = {};

    // Only build KeyConditionExpression for Query mode
    const KeyConditionExpression = isScan
      ? undefined
      : _f.buildKeyConditionExpression(
          (props as { pk: { key?: string; value: string } }).pk,
          (props as { sk?: _t.SkCond }).sk,
          names,
          values
        );

    const FilterExpression = filters
      ? _f.buildFilterExpression(filters, names, values)
      : undefined;

    if (debug) {
      console.log(`[debug] [ddb] [find] input:`, {
        isScan,
        filters,
        FilterExpression,
        names,
        values,
      });
    }

    const ProjectionExpression = projection
      ? _f.buildProjectionExpression(projection, names)
      : undefined;

    // Execute query/scan with pagination
    const all: T[] = [];
    let startKey = props.startKey;
    let pageCount = 0;
    let totalItems = 0;

    do {
      // Check safety limits before querying
      if (props.maxPages && pageCount >= props.maxPages) break;

      const command = isScan
        ? new ScanCommand({
            TableName,
            IndexName: props.indexName,
            FilterExpression,
            Limit: props.limit,
            ProjectionExpression,
            ExclusiveStartKey: startKey,
            ConsistentRead: props.strong,
            ...(Object.keys(names).length > 0 && {
              ExpressionAttributeNames: names,
            }),
            ...(Object.keys(values).length > 0 && {
              ExpressionAttributeValues: values,
            }),
          })
        : new QueryCommand({
            TableName,
            IndexName: props.indexName,
            KeyConditionExpression,
            FilterExpression,
            Limit: props.limit,
            ProjectionExpression,
            ExclusiveStartKey: startKey,
            ConsistentRead: props.strong,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ScanIndexForward:
              (props as { sort?: "asc" | "desc" }).sort === "desc"
                ? false
                : true,
          });

      const result = await ddb.client.send(command);
      const pageItems = (result.Items ?? []) as T[];
      all.push(...pageItems);
      totalItems += pageItems.length;
      pageCount++;
      startKey = result.LastEvaluatedKey;

      // Check if should continue recursing
      if (props.recursive) {
        // Check max items limit
        if (props.maxItems && totalItems >= props.maxItems) break;
        // No more pages
        if (!startKey) break;
        // Check recursive condition
        if (typeof props.recursive === "function") {
          const page: _t.RawResponse<T> = {
            lastEvaluatedKey: result.LastEvaluatedKey,
            scannedCount: result.ScannedCount ?? 0,
            count: result.Count ?? 0,
            items: pageItems,
          };
          const shouldContinue = props.recursive(page, pageCount, totalItems);
          if (!shouldContinue) break;
        }
        // else recursive === true, continue
      } else {
        // Not recursive, stop after first page
        break;
      }
    } while (true);

    // Build raw response
    const rawResponse: _t.RawResponse<T> = {
      lastEvaluatedKey: startKey,
      scannedCount: totalItems,
      count: totalItems,
      items: all,
    };

    // Return based on flags
    if (props.raw && props.first) {
      return {
        count: rawResponse.count,
        item: rawResponse.items[0],
        scannedCount: rawResponse.scannedCount,
      };
    }
    if (props.raw) return rawResponse;
    if (props.first) return rawResponse.items[0];
    return rawResponse.items;
    // default: items array
  } catch (error) {
    const err = error as Error;
    console.log(`[error] [ddb] [find] failed with ${err.message}. Input:`);
    console.dir(props, { depth: 100 });
    throw err;
  }
}

export const remove = async (
  ddb: Client,
  props: { key: _t.Key; tableName?: string }
) => {
  const TableName = props.tableName ?? ddb.tableName;
  const command = new DeleteCommand({ Key: props.key, TableName });
  return ddb.client.send(command);
};
/** * Create or overwrite an item
 * @param ddb
 * @param item
 * @param opts
 * @returns
 */
export const save = async <T extends object>(
  ddb: Client,
  props: { tableName?: string; item: T }
) => {
  const TableName = props.tableName ?? ddb.tableName;
  const command = new PutCommand({
    Item: props.item as Record<string, unknown>,
    TableName,
  });
  return ddb.client.send(command);
};

// ============================================================================
// BATCH GET
// ============================================================================

/**
 * Batch get multiple items from DynamoDB
 *
 * ## Limits
 * - Max items per request: 100
 * - Max request size: 16MB
 * - Read capacity: 0.5 RCU per item (eventually consistent), 1 RCU (strongly consistent)
 *
 * @example
 * const result = await batchGet(ddb, {
 * tableName: 'users',
 * keys: [{ pk: 'user#1', sk: 'profile' }, { pk: 'user#2', sk: 'profile' }]
 * });
 * console.log(`Retrieved: ${result.count}, Missing: ${result.missing}`);
 * const users = result.items;
 */
export async function batchGet<T extends Record<string, unknown>>(
  ddb: Client,
  props: {
    tableName: string;
    keys: { pk: string; sk?: string }[];
    maxRetries?: number;
    strong?: boolean;
  }
): Promise<_t.BatchGetResult<T>> {
  const { keys, maxRetries = 3, strong = false } = props;
  const TableName = props.tableName ?? ddb.tableName;
  const chunks = _f.chunk(keys, 100);
  const allItems: T[] = [];
  const requestedCount = keys.length;
  let totalConsumedCapacity = 0;
  for (const chunk of chunks) {
    let attempt = 0;
    let keysToFetch = chunk;
    while (keysToFetch.length > 0 && attempt <= maxRetries) {
      if (attempt > 0) {
        const delay = _f.backoffDelay(attempt);
        console.log(
          `[info] [ddb] [batchGet]: Retrying ${keysToFetch.length} keys (attempt ${attempt}/${maxRetries}) after ${delay}ms`
        );
        await _f.sleep(delay);
      }
      try {
        const command = new BatchGetCommand({
          RequestItems: {
            [TableName]: { Keys: keysToFetch, ConsistentRead: strong },
          },
        });
        const result = await ddb.client.send(command);
        // Collect returned items
        const items = (result.Responses?.[TableName] ?? []) as T[];
        allItems.push(...items);
        // Track capacity
        if (result.ConsumedCapacity) {
          totalConsumedCapacity += result.ConsumedCapacity.reduce(
            (sum, cap) => sum + (cap.CapacityUnits ?? 0),
            0
          );
        }
        // Check for unprocessed keys
        const unprocessed = result.UnprocessedKeys?.[TableName]?.Keys as
          | _t.Key[]
          | undefined;
        if (unprocessed && unprocessed.length > 0) {
          keysToFetch = unprocessed;
          attempt++;
        } else {
          keysToFetch = [];
        }
      } catch (error) {
        console.log(
          `[error] [ddb] [batchGet]: Error fetching chunk (attempt ${attempt}/${maxRetries}):`,
          error
        );
        if (attempt >= maxRetries) throw error;
        attempt++;
      }
    }
    if (keysToFetch.length > 0) {
      console.log(
        `[error] [ddb] [batchGet]: Failed to fetch ${keysToFetch.length} keys after ${maxRetries} retries`
      );
    }
  }
  const missing = requestedCount - allItems.length;
  return {
    missing,
    items: allItems,
    count: allItems.length,
    consumedCapacity: totalConsumedCapacity || undefined,
  };
}

// ============================================================================
// BATCH WRITE
// ============================================================================

/**
 * Batch write (put) multiple items to DynamoDB
 *
 * ## Operation Mode
 * - **Without conditions**: Uses BatchWriteCommand (cheaper, faster)
 * - Max items: 25 per request
 * - Max size: 16MB per request
 * - Cost: 1 WCU per item
 * - Not atomic
 *
 * - **With conditions**: Auto-switches to TransactWriteCommand (atomic, safer)
 * - Max items: 100 per request (4x better!)
 * - Max size: 4MB per request
 * - Cost: 2 WCU per item (2x more expensive)
 * - Atomic: all succeed or all fail
 *
 * @example
 * // Simple usage
 * const result = await batchWrite(ddb, {
 *   tableName: 'users',
 *   items: [
 *     { item: { pk: 'user#1', sk: 'profile', name: 'Alice' } },
 *     { item: { pk: 'user#2', sk: 'profile', name: 'Bob' } }
 *   ]
 * });
 * console.log(`Processed: ${result.processed}, Failed: ${result.failed}`);
 *
 * @example
 * // With transform - avoid manual mapping
 * const result = await batchWrite(ddb, {
 *   tableName: 'users',
 *   items: users,
 *   transform: (user) => ({ item: user })
 * });
 *
 * @example
 * // With conditions (auto-switches to transact)
 * const result = await batchWrite(ddb, {
 *   tableName: 'users',
 *   items: [
 *     { item: user1, cond: 'attribute_not_exists(pk)' },
 *     { item: user2, cond: 'version = :v1' }
 *   ]
 * });
 */
export function batchWrite<T extends Record<string, unknown>>(
  ddb: Client,
  props: {
    tableName: string;
    items: { item: T; cond?: string }[];
    maxRetries?: number;
  }
): Promise<_t.BatchWriteResult>;
export function batchWrite<T extends Record<string, unknown>, I>(
  ddb: Client,
  props: {
    tableName: string;
    items: I[];
    transform: (item: I) => { item: T; cond?: string };
    maxRetries?: number;
  }
): Promise<_t.BatchWriteResult>;
export async function batchWrite<
  T extends Record<string, unknown>,
  I = { item: T; cond?: string }
>(
  ddb: Client,
  props: {
    tableName: string;
    items: (I | { item: T; cond?: string })[];
    transform?: (item: I) => { item: T; cond?: string };
    maxRetries?: number;
  }
): Promise<_t.BatchWriteResult> {
  const { maxRetries = 3 } = props;
  const TableName = props.tableName ?? ddb.tableName;

  // Transform items if needed
  const items = props.transform
    ? (props.items as I[]).map(props.transform)
    : (props.items as { item: T; cond?: string }[]);
  // Auto-detect: use transact if any item has conditions
  const hasConditions = items.some((x) => x.cond);
  const chunkSize = hasConditions ? 100 : 25;
  const chunks = _f.chunk(items, chunkSize);
  let processedCount = 0;
  let failedCount = 0;
  let totalConsumedCapacity = 0;
  for (const chunk of chunks) {
    let attempt = 0;
    let itemsToWrite = chunk;
    while (itemsToWrite.length > 0 && attempt <= maxRetries) {
      if (attempt > 0) {
        const delay = _f.backoffDelay(attempt);
        console.log(
          `[info] [ddb] [batchWrite]: Retrying ${itemsToWrite.length} items (attempt ${attempt}/${maxRetries}) after ${delay}ms`
        );
        await _f.sleep(delay);
      }
      try {
        if (hasConditions) {
          // Use TransactWrite for conditional writes
          const transactItems = itemsToWrite.map((x) => ({
            Put: {
              TableName,
              Item: x.item,
              ...(x.cond && { ConditionExpression: x.cond }),
            },
          }));
          const command = new TransactWriteCommand({
            TransactItems: transactItems,
          });
          const result = await ddb.client.send(command);
          if (result.ConsumedCapacity) {
            totalConsumedCapacity += result.ConsumedCapacity.reduce(
              (sum, cap) => sum + (cap.CapacityUnits ?? 0),
              0
            );
          }
          processedCount += itemsToWrite.length;
          itemsToWrite = [];
        } else {
          // Use BatchWrite for non-conditional writes
          const writeRequests = itemsToWrite.map((x) => ({
            PutRequest: { Item: x.item },
          }));
          const command = new BatchWriteCommand({
            RequestItems: { [TableName]: writeRequests },
          });
          const result = await ddb.client.send(command);
          if (result.ConsumedCapacity) {
            totalConsumedCapacity += result.ConsumedCapacity.reduce(
              (sum, cap) => sum + (cap.CapacityUnits ?? 0),
              0
            );
          }
          // Check for unprocessed items
          const unprocessed = result.UnprocessedItems?.[TableName];
          if (unprocessed && unprocessed.length > 0) {
            // Map unprocessed back to original format
            itemsToWrite = unprocessed.map((req) => ({
              item: req.PutRequest!.Item as T,
            }));
            processedCount += chunk.length - itemsToWrite.length;
            attempt++;
          } else {
            processedCount += itemsToWrite.length;
            itemsToWrite = [];
          }
        }
      } catch (error) {
        console.log(
          `[error] [ddb] [batchWrite]: Error writing chunk (attempt ${attempt}/${maxRetries}):`,
          error
        );
        if (attempt >= maxRetries) {
          failedCount += itemsToWrite.length;
          itemsToWrite = [];
        } else {
          attempt++;
        }
      }
    }
    if (itemsToWrite.length > 0) {
      console.log(
        `[error] [ddb] [batchWrite]: Failed to write ${itemsToWrite.length} items after ${maxRetries} retries`
      );
      failedCount += itemsToWrite.length;
    }
  }
  return {
    failed: failedCount,
    processed: processedCount,
    consumedCapacity: totalConsumedCapacity || undefined,
  };
}

// ============================================================================
// BATCH DELETE
// ============================================================================

/**
 * Batch delete multiple items from DynamoDB
 *
 * ## Operation Mode
 * - **Without conditions**: Uses BatchWriteCommand (cheaper, faster)
 * - Max items: 25 per request
 * - Max size: 16MB per request
 * - Cost: 1 WCU per item
 * - Not atomic
 *
 * - **With conditions**: Auto-switches to TransactWriteCommand (atomic, safer)
 * - Max items: 100 per request (4x better!)
 * - Max size: 4MB per request
 * - Cost: 2 WCU per item (2x more expensive)
 * - Atomic: all succeed or all fail
 *
 * @example
 * const result = await batchDelete(ddb, {
 * tableName: 'users',
 * keys: [
 * { key: { pk: 'user#1', sk: 'profile' } },
 * { key: { pk: 'user#2', sk: 'profile' } }
 * ]
 * });
 *
 * console.log(`Deleted: ${result.processed}, Failed: ${result.failed}`);
 *
 * @example
 * // With transform - avoid manual mapping
 * const result = await batchDelete(ddb, {
 * tableName: 'users',
 * keys: [{ pk: 'user#1', sk: 'profile' }, { pk: 'user#2', sk: 'profile' }],
 * transform: (key) => ({ key })
 * });
 *
 * @example
 * // With conditions (auto-switches to transact)
 * const result = await batchDelete(ddb, {
 * tableName: 'users',
 * keys: [
 * { key: { pk: 'user#1', sk: 'profile' }, cond: 'attribute_exists(pk)' },
 * { key: { pk: 'user#2', sk: 'profile' }, cond: 'version = :v1' }
 * ]
 * });
 */
export function batchDelete(
  ddb: Client,
  props: {
    tableName: string;
    keys: Array<{ key: _t.Key; cond?: string }>;
    maxRetries?: number;
  }
): Promise<_t.BatchDeleteResult>;
export function batchDelete<I>(
  ddb: Client,
  props: {
    tableName: string;
    keys: I[];
    transform: (item: I) => { key: _t.Key; cond?: string };
    maxRetries?: number;
  }
): Promise<_t.BatchDeleteResult>;
export async function batchDelete<I = { key: _t.Key; cond?: string }>(
  ddb: Client,
  props: {
    tableName: string;
    keys: (I | { key: _t.Key; cond?: string })[];
    transform?: (item: I) => { key: _t.Key; cond?: string };
    maxRetries?: number;
  }
): Promise<_t.BatchDeleteResult> {
  const { maxRetries = 3 } = props;
  const TableName = props.tableName ?? ddb.tableName;

  // Transform keys if needed
  const keys = props.transform
    ? (props.keys as I[]).map(props.transform)
    : (props.keys as Array<{ key: _t.Key; cond?: string }>);
  // Auto-detect: use transact if any item has conditions
  const hasConditions = keys.some((x) => x.cond);
  const chunkSize = hasConditions ? 100 : 25;
  const chunks = _f.chunk(keys, chunkSize);
  let processedCount = 0;
  let failedCount = 0;
  let totalConsumedCapacity = 0;
  for (const chunk of chunks) {
    let attempt = 0;
    let itemsToDelete = chunk;
    while (itemsToDelete.length > 0 && attempt <= maxRetries) {
      if (attempt > 0) {
        const delay = _f.backoffDelay(attempt);
        console.log(
          `[info] [ddb] [batchDelete]: Retrying ${itemsToDelete.length} items (attempt ${attempt}/${maxRetries}) after ${delay}ms`
        );
        await _f.sleep(delay);
      }
      try {
        if (hasConditions) {
          // Use TransactWrite for conditional deletes
          const transactItems = itemsToDelete.map((x) => ({
            Delete: {
              TableName,
              Key: x.key,
              ...(x.cond && { ConditionExpression: x.cond }),
            },
          }));
          const command = new TransactWriteCommand({
            TransactItems: transactItems,
          });
          const result = await ddb.client.send(command);
          if (result.ConsumedCapacity) {
            totalConsumedCapacity += result.ConsumedCapacity.reduce(
              (sum, cap) => sum + (cap.CapacityUnits ?? 0),
              0
            );
          }
          processedCount += itemsToDelete.length;
          itemsToDelete = [];
        } else {
          // Use BatchWrite for non-conditional deletes
          const writeRequests = itemsToDelete.map((x) => ({
            DeleteRequest: { Key: x.key },
          }));
          const command = new BatchWriteCommand({
            RequestItems: { [TableName]: writeRequests },
          });
          const result = await ddb.client.send(command);
          if (result.ConsumedCapacity) {
            totalConsumedCapacity += result.ConsumedCapacity.reduce(
              (sum, cap) => sum + (cap.CapacityUnits ?? 0),
              0
            );
          }
          // Check for unprocessed items
          const unprocessed = result.UnprocessedItems?.[TableName];
          if (unprocessed && unprocessed.length > 0) {
            // Map unprocessed back to original format
            itemsToDelete = unprocessed.map((req) => ({
              key: req.DeleteRequest!.Key as _t.Key,
            }));
            processedCount += chunk.length - itemsToDelete.length;
            attempt++;
          } else {
            processedCount += itemsToDelete.length;
            itemsToDelete = [];
          }
        }
      } catch (error) {
        console.log(
          `[error] [ddb] [batchDelete]: Error deleting chunk (attempt ${attempt}/${maxRetries}):`,
          error
        );
        if (attempt >= maxRetries) {
          failedCount += itemsToDelete.length;
          itemsToDelete = [];
        } else {
          attempt++;
        }
      }
    }
    if (itemsToDelete.length > 0) {
      console.log(
        `[error] [ddb] [batchDelete]: Failed to delete ${itemsToDelete.length} items after ${maxRetries} retries`
      );
      failedCount += itemsToDelete.length;
    }
  }

  return {
    failed: failedCount,
    processed: processedCount,
    consumedCapacity: totalConsumedCapacity || undefined,
  };
}

export const deleteTable = (ddb: Client, tableName: string) => {
  const TableName = tableName;
  const command = new DeleteTableCommand({ TableName });
  return (ddb.client as _t.TableClient).send(command);
};

/**
 * Check if a dynamodb table exists.
 * @param doc
 * @param TableName
 * @returns
 */
export const tableExists = async (
  ddb: Client,
  props: { tableName: string }
) => {
  try {
    const TableName = props.tableName;
    const command = new DescribeTableCommand({ TableName });
    await (ddb.client as _t.TableClient).send(command);
    return true;
  } catch (err: unknown) {
    if (err instanceof DynamoDBServiceException) {
      if (
        err.name === "ResourceNotFoundException" ||
        err.$metadata.httpStatusCode === 400
      ) {
        return false;
      }
    }
    throw err;
  }
};
