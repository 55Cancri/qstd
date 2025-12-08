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
