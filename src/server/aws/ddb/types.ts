import type { NativeAttributeValue } from "@aws-sdk/lib-dynamodb";
import type {
  DynamoDBClient,
  DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";

export type TableClient = DynamoDBClient;
export type Credentials = DynamoDBClientConfig["credentials"];

export type Key = { pk: Pk; sk: Sk };
// export type Key = { pk: string; sk: string };

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- intentional pattern for string autocomplete hints
export type StrWithAutocomplete<T> = T | (string & Record<never, never>);
export type Pk = StrWithAutocomplete<"pk" | "gsi-pk" | "gsi2-pk" | "gsi-2-pk">;
export type Sk = StrWithAutocomplete<"sk" | "gsi-sk" | "gsi2-sk" | "gsi-2-sk">;

export type RawResponse<T> = {
  lastEvaluatedKey?: Record<string, unknown> | undefined;
  scannedCount: number;
  count: number;
  items: T[];
};
type RecursiveFn<T> = (
  page: RawResponse<T>,
  pageCount: number,
  totalItems: number
) => boolean;
// SK condition type - supports both modern op-driven and legacy styles
export type SkCond =
  // Modern op-driven syntax
  | { key?: Sk; op: "=" | ">=" | ">" | "<=" | "<"; value: string }
  | { key?: Sk; op: "begins_with"; value: string }
  | { key?: Sk; op: "between"; value: [string, string] }
  // Legacy syntax (no op)
  | { key?: Sk; value: string; valueBeginsWith?: never }
  | { key?: Sk; valueBeginsWith: string; value?: never };

// ============================================================================
// Type-safe filter clauses
// ============================================================================

type StrKey<T> = Extract<keyof T, string>;
type Comparable = string | number | bigint;

type AllowsOrder<V> = V extends Comparable ? true : false;
type AllowsBeginsWith<V> = V extends string ? true : false;
type AllowsContains<V> = V extends string
  ? true
  : //   : V extends ReadonlyArray<any> | Array<any> | ReadonlySet<any> | Set<any>
  V extends
      | ReadonlyArray<unknown>
      | Array<unknown>
      | ReadonlySet<unknown>
      | Set<unknown>
  ? true
  : false;
type AllowsBetween<V> = V extends Comparable ? true : false;
type AllowsIn<V> = V extends Comparable ? true : false;

type EqNeClause<T, K extends StrKey<T>> = {
  key: K;
  op: "=" | "<>";
  value: T[K];
};

type OrdClause<T, K extends StrKey<T>> = AllowsOrder<T[K]> extends true
  ? {
      key: K;
      op: ">" | ">=" | "<" | "<=";
      value: Extract<T[K], Comparable>;
    }
  : never;

type BeginsWithClause<T, K extends StrKey<T>> = AllowsBeginsWith<
  T[K]
> extends true
  ? {
      key: K;
      op: "begins_with";
      value: Extract<T[K], string>;
    }
  : never;

type ContainsClause<T, K extends StrKey<T>> = AllowsContains<T[K]> extends true
  ? T[K] extends string
    ? {
        key: K;
        op: "contains";
        value: string;
      }
    : T[K] extends
        | ReadonlyArray<infer U>
        | Array<infer U>
        | ReadonlySet<infer U>
        | Set<infer U>
    ? {
        key: K;
        op: "contains";
        value: U;
      }
    : never
  : never;

type BetweenClause<T, K extends StrKey<T>> = AllowsBetween<T[K]> extends true
  ? {
      key: K;
      op: "between";
      value: readonly [Extract<T[K], Comparable>, Extract<T[K], Comparable>];
    }
  : never;

type InClause<T, K extends StrKey<T>> = AllowsIn<T[K]> extends true
  ? {
      key: K;
      op: "in";
      value: ReadonlyArray<Extract<T[K], Comparable>>;
    }
  : never;

type ExistsClause<T, K extends StrKey<T>> = {
  key: K;
  op: "attribute_exists" | "attribute_not_exists";
};

type FilterClauseForKey<T, K extends StrKey<T>> =
  | EqNeClause<T, K>
  | OrdClause<T, K>
  | BeginsWithClause<T, K>
  | ContainsClause<T, K>
  | BetweenClause<T, K>
  | InClause<T, K>
  | ExistsClause<T, K>;

/** One clause type that's keyed & value-typed from T */
export type FilterClause<T extends object> = {
  [K in StrKey<T>]: FilterClauseForKey<T, K>;
}[StrKey<T>];

// // Test examples showing type inference (boolean discriminators)
// type User = { pk: string; sk: string };

// void find<User>(create(), {
//   pk: { value: "user#123" },
//   sk: { value: "123" },
// }).then((x) => {
//   // x: User[] (default)
//   return x.at(0);
// });

// void find<User>(create(), {
//   pk: { value: "user#123" },
//   sk: { value: "123" },
//   first: true,
// }).then((x) => {
//   // x: User | undefined
//   return x?.pk;
// });

// void find<User>(create(), {
//   pk: { value: "user#123" },
//   sk: { value: "123" },
//   raw: true,
// }).then((x) => {
//   // x: RawResponse<User>
//   return x.items[0]?.pk;
// });

// void find<User>(create(), {
//   pk: { value: "user#123" },
//   sk: { value: "123" },
//   first: true,
//   raw: true,
// }).then((x) => {
//   // x: { item: User | undefined; count: number; scannedCount: number }
// return x.item?.pk;
// });

// ============================================================================
// Find Props (Query + Scan discriminated union)
// ============================================================================

/** Shared props between Query and Scan operations */
type BaseFindProps<T extends object = Record<string, unknown>> = {
  /** Table name override (optional, defaults to main table) */
  tableName?: string;
  /**
   * Type-safe filter clauses for post-query/scan filtering (optional)
   * Array of filter clauses, all combined with AND logic
   *
   * Examples:
   * ```ts
   * // Equality check
   * filters: [{ key: 'status', op: '=', value: 'active' }]
   *
   * // Multiple filters (AND logic)
   * filters: [
   *   { key: 'status', op: '=', value: 'active' },
   *   { key: 'age', op: '>=', value: 18 },
   *   { key: 'score', op: '>', value: 80 }
   * ]
   *
   * // Existence checks
   * filters: [
   *   { key: 'email', op: 'attribute_exists' },
   *   { key: 'deletedAt', op: 'attribute_not_exists' }
   * ]
   *
   * // String operations
   * filters: [
   *   { key: 'name', op: 'begins_with', value: 'John' },
   *   { key: 'description', op: 'contains', value: 'urgent' }
   * ]
   *
   * // Range and list operations
   * filters: [
   *   { key: 'age', op: 'between', value: [18, 65] },
   *   { key: 'status', op: 'in', value: ['active', 'pending', 'approved'] }
   * ]
   * ```
   */
  filters?: ReadonlyArray<FilterClause<T>>;
  /** Limit number of items returned per page (optional) */
  limit?: number;
  /** Pagination token from previous query/scan (optional) */
  startKey?: Record<string, NativeAttributeValue>;
  /** Fetch all pages recursively; pass function to control continuation (optional) */
  recursive?: boolean | RecursiveFn<T>;
  /** Maximum items to fetch when using recursive (optional) */
  maxItems?: number;
  /** Maximum pages to fetch when using recursive (optional) */
  maxPages?: number;
  /** Use consistent reads (slower but guaranteed up-to-date, only works on tables not indexes) */
  strong?: boolean;
  /** Projection: specific attributes to retrieve (reduces data transfer) */
  projection?: (keyof T)[];
  debug?: boolean;
};

/** Query-specific props (default, scan is undefined or false) */
type QueryFindProps<T extends object = Record<string, unknown>> =
  BaseFindProps<T> & {
    /** Use Scan instead of Query (default: false) */
    scan?: false | undefined;
    /** Primary key condition (required for Query) */
    pk: { key?: string; value: string };
    /** Sort key condition (optional) */
    sk?: SkCond;
    /** Global secondary index name (optional) */
    indexName?: string;
    /** Sort order: ascending or descending (default: asc). Only available for Query. */
    sort?: "asc" | "desc";
  };

/** Scan-specific props (scan: true) */
type ScanFindProps<T extends object = Record<string, unknown>> =
  BaseFindProps<T> & {
    /** Use Scan instead of Query - scans entire table with optional filters */
    scan: true;
    /** pk is not allowed in scan mode - use filters instead */
    pk?: never;
    /** sk is not allowed in scan mode - use filters instead */
    sk?: never;
    /** Index to scan (optional, rarely needed for scans) */
    indexName?: string;
    /** sort is not available for Scan - DynamoDB returns items in storage order */
    sort?: never;
  };

/**
 * Find props - discriminated union between Query and Scan modes
 *
 * @example
 * // Query mode (default) - pk required
 * const items = await find<User>(doc, {
 *   tableName: 'users',
 *   pk: { value: 'user#123' },
 *   sk: { op: 'begins_with', value: 'profile#' },
 *   sort: 'desc',
 * });
 *
 * @example
 * // Scan mode - no pk/sk, can filter on any attribute
 * const items = await find<User>(doc, {
 *   tableName: 'users',
 *   scan: true,
 *   filters: [
 *     { key: 'pk', op: 'begins_with', value: 'user#' },
 *     { key: 'status', op: '=', value: 'active' },
 *   ],
 * });
 */
export type FindProps<T extends object = Record<string, unknown>> =
  | QueryFindProps<T>
  | ScanFindProps<T>;

// ============================================================================
// Batch Operation Types
// ============================================================================

export type BatchGetResult<T> = {
  items: T[];
  count: number;
  missing: number;
  consumedCapacity?: number | undefined;
};
export type BatchWriteResult = {
  processed: number;
  failed: number;
  consumedCapacity?: number | undefined;
};
export type BatchDeleteResult = {
  processed: number;
  failed: number;
  consumedCapacity?: number | undefined;
};

// Transaction Types

/** Expression attribute values for condition expressions */
export type ExprValues = Record<string, unknown>;

/** Expression attribute names for reserved word escaping */
export type ExprNames = Record<string, string>;

/**
 * Put operation in a transaction
 * @example
 * // Type-safe conditions (recommended)
 * { put: { item: user, conditions: [{ key: 'version', op: '=', value: 1 }] } }
 *
 * // Raw expression (advanced)
 * { put: { item: user, cond: 'attribute_not_exists(pk)' } }
 */
export type TransactPut<T extends object = Record<string, unknown>> = {
  put: {
    item: T;
    /** Type-safe conditions (like filters). Auto-generates expression attributes. */
    conditions?: ReadonlyArray<FilterClause<T>>;
    /** Raw condition expression. Use conditions for type-safety. */
    cond?: string;
    /** Expression attribute values for raw cond */
    exprValues?: ExprValues;
    /** Expression attribute names for raw cond */
    exprNames?: ExprNames;
  };
};

/**
 * Delete operation in a transaction
 * @example
 * // Type-safe conditions (recommended)
 * { delete: { key: { pk, sk }, conditions: [{ key: 'status', op: '=', value: 'inactive' }] } }
 *
 * // Simple delete (no conditions)
 * { delete: { key: { pk, sk } } }
 */
export type TransactDelete<T extends object = Record<string, unknown>> = {
  delete: {
    key: Key;
    /** Type-safe conditions (like filters). Auto-generates expression attributes. */
    conditions?: ReadonlyArray<FilterClause<T>>;
    /** Raw condition expression. Use conditions for type-safety. */
    cond?: string;
    /** Expression attribute values for raw cond */
    exprValues?: ExprValues;
    /** Expression attribute names for raw cond */
    exprNames?: ExprNames;
  };
};

/**
 * Type-safe update operations - shared between transact and update functions
 * @example
 * ```ts
 * // Value operations
 * set: { name: 'Alice', status: 'active' }     // SET #name = :name, #status = :status
 * incr: { count: 1, views: -5 }                // SET #count = #count + :incr (use negative to decrement)
 * remove: ['oldField', 'tempData']             // REMOVE #oldField, #tempData
 *
 * // List operations
 * append: { items: ['new1', 'new2'] }          // SET #items = list_append(#items, :items)
 * prepend: { items: ['first'] }                // SET #items = list_append(:items, #items)
 *
 * // Conditional & set operations
 * ifNotExists: { field: 'default' }            // SET #field = if_not_exists(#field, :field)
 * add: { counter: 5 }                           // ADD #counter :counter (atomic, creates if missing)
 *
 * // Advanced
 * setPath: { 'address.city': 'NYC' }           // SET #address.#city = :val (nested updates)
 * compute: { total: ['price', '+', 'tax'] }    // SET #total = #price + #tax (cross-attribute math)
 * ```
 */
export type UpdateOperations<T extends object = Record<string, unknown>> = {
  /** SET: assign values to attributes */
  set?: Partial<T>;
  /** INCREMENT: add to numeric attributes (use negative to decrement) */
  incr?: Partial<Record<keyof T, number>>;
  /** REMOVE: list of attribute names to remove */
  remove?: (keyof T)[];
  /** LIST APPEND: append values to list attributes */
  append?: Partial<Record<keyof T, unknown[]>>;
  /** LIST PREPEND: prepend values to list attributes */
  prepend?: Partial<Record<keyof T, unknown[]>>;
  /** IF NOT EXISTS: set value only if attribute doesn't exist */
  ifNotExists?: Partial<T>;
  /** ADD: atomic add to numeric attributes (creates attribute if missing) */
  add?: Partial<Record<keyof T, number>>;
  /** SET PATH: update nested attributes using dot notation */
  setPath?: Record<string, unknown>;
  /** COMPUTE: cross-attribute math operations */
  compute?: Partial<Record<keyof T, [keyof T, "+" | "-", keyof T]>>;
};

/**
 * Update operation in a transaction
 * @example
 * ```ts
 * // All operations can be combined in a single update
 * {
 *   update: {
 *     key: { pk: 'user#123', sk: 'profile' },
 *
 *     // Value operations
 *     set: { name: 'Alice', status: 'active' },     // SET #name = :name, #status = :status
 *     incr: { loginCount: 1, failedAttempts: -1 },  // SET #x = #x + :val (negative to decrement)
 *     remove: ['tempToken', 'oldField'],            // REMOVE #tempToken, #oldField
 *
 *     // List operations
 *     append: { tags: ['new-tag'] },                // SET #tags = list_append(#tags, :tags)
 *     prepend: { notifications: [latest] },         // SET #notif = list_append(:notif, #notif)
 *
 *     // Conditional & set operations
 *     ifNotExists: { createdAt: Date.now() },       // SET #createdAt = if_not_exists(#createdAt, :val)
 *     add: { viewCount: 1 },                        // ADD #viewCount :val (atomic, creates if missing)
 *
 *     // Advanced operations
 *     setPath: { 'address.city': 'NYC' },           // SET #address.#city = :val (nested)
 *     compute: { total: ['subtotal', '+', 'tax'] }, // SET #total = #subtotal + #tax
 *
 *     // Conditional execution
 *     conditions: [{ key: 'version', op: '=', value: 1 }]
 *   }
 * }
 * ```
 */
export type TransactUpdate<T extends object = Record<string, unknown>> = {
  update: UpdateOperations<T> & {
    key: Key;
    /** Type-safe conditions (like filters). Auto-generates expression attributes. */
    conditions?: ReadonlyArray<FilterClause<T>>;
    /** Raw condition expression. Use conditions for type-safety. */
    cond?: string;
  };
};

/** Return values options for update operations */
export type UpdateReturnValues =
  | "none"
  | "allOld"
  | "updatedOld"
  | "allNew"
  | "updatedNew";

/**
 * Props for standalone update function
 */
export type UpdateProps<T extends object = Record<string, unknown>> = {
  /** Table name (optional if set on client) */
  tableName?: string;
  /** Primary key of item to update */
  key: Key;
  /** Type-safe conditions (like filters) */
  conditions?: ReadonlyArray<FilterClause<T>>;
  /** Raw condition expression */
  cond?: string;
  /** What values to return after update */
  returnValues?: UpdateReturnValues;
  /** SET: assign values to attributes */
  set?: Partial<T>;
  /** INCREMENT: add to numeric attributes (use negative to decrement) */
  incr?: Partial<Record<keyof T, number>>;
  /** REMOVE: list of attribute names to remove */
  remove?: (keyof T)[];
  /** LIST APPEND: append values to list attributes */
  append?: Partial<Record<keyof T, unknown[]>>;
  /** LIST PREPEND: prepend values to list attributes */
  prepend?: Partial<Record<keyof T, unknown[]>>;
  /** IF NOT EXISTS: set value only if attribute doesn't exist */
  ifNotExists?: Partial<T>;
  /** ADD: atomic add to numeric attributes (creates attribute if missing) */
  add?: Partial<Record<keyof T, number>>;
  /** SET PATH: update nested attributes using dot notation */
  setPath?: Record<string, unknown>;
  /** COMPUTE: cross-attribute math operations */
  compute?: Partial<Record<keyof T, [keyof T, "+" | "-", keyof T]>>;
};

/**
 * ConditionCheck operation - validates a condition without modifying the item
 * @example
 * // Type-safe conditions (recommended)
 * { conditionCheck: { key: { pk, sk }, conditions: [{ key: 'pk', op: 'attribute_exists' }] } }
 *
 * // Raw expression
 * { conditionCheck: { key: { pk, sk }, cond: 'attribute_exists(pk)' } }
 */
export type TransactConditionCheck<T extends object = Record<string, unknown>> =
  {
    conditionCheck: {
      key: Key;
      /** Type-safe conditions (like filters). Auto-generates expression attributes. */
      conditions?: ReadonlyArray<FilterClause<T>>;
      /** Raw condition expression. Use conditions for type-safety. */
      cond?: string;
      /** Expression attribute values for raw cond */
      exprValues?: ExprValues;
      /** Expression attribute names for raw cond */
      exprNames?: ExprNames;
    };
  };

/**
 * A single operation in a transaction.
 * Discriminated union - exactly one of: put, delete, update, conditionCheck
 */
export type TransactItem<T extends object = Record<string, unknown>> =
  | TransactPut<T>
  | TransactDelete<T>
  | TransactUpdate<T>
  | TransactConditionCheck<T>;

/** Result of a transact operation */
export type TransactResult = {
  /** Number of operations successfully processed */
  processed: number;
  /** Consumed capacity units (if returned by DynamoDB) */
  consumedCapacity?: number;
};
