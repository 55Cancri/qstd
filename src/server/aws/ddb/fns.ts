import type { NativeAttributeValue } from "@aws-sdk/lib-dynamodb";
import * as _t from "./types";

/**
 * Resolve table name from candidates, returning the first truthy value
 * @throws Error if no table name is found
 */
export const getTableNameOrThrow = (
  ...candidates: (string | undefined)[]
): string => {
  for (const name of candidates) {
    if (name) return name;
  }
  throw new Error(
    `[ddb] "tableName" is required - provide it in props or when creating the client`
  );
};

export const validateFindProps = <T extends object = Record<string, unknown>>(
  props: _t.FindProps<T> & { first?: boolean; raw?: boolean },
  tableName: string
) => {
  const isScan = "scan" in props && props.scan === true;

  if (!tableName) {
    throw new Error(`[ddb] "tableName" is required`);
  }
  if (props.limit && props.recursive) {
    throw new Error(`[ddb] "limit" and "recursive" cannot be used together`);
  }

  // Query-specific validations
  if (!isScan) {
    const queryProps = props as {
      indexName?: string;
      sk?: _t.SkCond;
      pk?: unknown;
    };
    if (!queryProps.pk) {
      throw new Error(
        `[ddb] [find] "pk" is required for Query mode. Use scan: true to scan without pk.`
      );
    }
    if (
      queryProps.sk &&
      "key" in queryProps.sk &&
      queryProps.sk.key &&
      queryProps.sk.key !== "sk" &&
      !queryProps.indexName
    ) {
      throw new Error(
        `[ddb] [find] you provided a custom sk but no indexName. If this is a mistake, change this error to a warn.`
      );
    }
  }
};

export const buildKeyConditionExpression = (
  pk: { key?: string; value: string },
  sk: _t.SkCond | undefined,
  names: Record<string, string>,
  values: Record<string, NativeAttributeValue>
) => {
  const pkKey = pk.key ?? "pk";
  names["#pk"] = pkKey;
  values[":pk"] = pk.value;

  if (!sk) return "#pk = :pk";

  const skName = sk.key ?? "sk";
  names["#sk"] = skName;

  // Modern op-driven syntax
  if ("op" in sk && sk.op) {
    switch (sk.op) {
      case "=":
      case ">=":
      case ">":
      case "<=":
      case "<":
        values[":sk"] = sk.value;
        return `#pk = :pk AND #sk ${sk.op} :sk`;

      case "begins_with":
        values[":sk"] = sk.value;
        return `#pk = :pk AND begins_with(#sk, :sk)`;

      case "between": {
        const [from, to] = sk.value;
        values[":skFrom"] = from;
        values[":skTo"] = to;
        return `#pk = :pk AND #sk BETWEEN :skFrom AND :skTo`;
      }

      default:
        throw new Error(`Unsupported SK op: ${JSON.stringify(sk, null, 2)}`);
    }
  }

  // Legacy syntax support
  if ("value" in sk && sk.value !== undefined) {
    values[":sk"] = sk.value;
    return `#pk = :pk AND #sk = :sk`;
  }

  if ("valueBeginsWith" in sk && sk.valueBeginsWith !== undefined) {
    values[":sk"] = sk.valueBeginsWith;
    return `#pk = :pk AND begins_with(#sk, :sk)`;
  }

  throw new Error(
    `Invalid SK condition: expected 'op' or legacy 'value'/'valueBeginsWith'`
  );
};

export const buildFilterExpression = <T extends object>(
  filters: ReadonlyArray<_t.FilterClause<T>>,
  names: Record<string, string>,
  values: Record<string, NativeAttributeValue>
) => {
  if (!filters || filters.length === 0) return undefined;

  const frags: string[] = [];

  filters.forEach((f, i) => {
    const nameToken = `#f${i}`;
    names[nameToken] = f.key as string;

    switch (f.op) {
      case "attribute_exists":
        frags.push(`attribute_exists(${nameToken})`);
        break;

      case "attribute_not_exists":
        frags.push(`attribute_not_exists(${nameToken})`);
        break;

      case "between": {
        const [lo, hi] = f.value;
        const loPh = `:f${i}_lo`;
        const hiPh = `:f${i}_hi`;
        values[loPh] = lo as NativeAttributeValue;
        values[hiPh] = hi as NativeAttributeValue;
        frags.push(`${nameToken} BETWEEN ${loPh} AND ${hiPh}`);
        break;
      }

      case "in": {
        const arr = f.value as ReadonlyArray<NativeAttributeValue>;
        if (!arr.length) {
          throw new Error(
            `'in' filter for ${f.key} requires at least one value`
          );
        }
        const phs = arr.map((_, j) => `:f${i}_${j}`);
        arr.forEach((v, j) => {
          const ph = phs[j];
          if (ph) values[ph] = v;
        });
        frags.push(`${nameToken} IN (${phs.join(", ")})`);
        break;
      }

      case "contains":
      case "begins_with": {
        const ph = `:f${i}`;
        values[ph] = f.value as NativeAttributeValue;
        frags.push(`${f.op}(${nameToken}, ${ph})`);
        break;
      }

      case "=":
      case "<>":
      case ">":
      case ">=":
      case "<":
      case "<=": {
        const ph = `:f${i}`;
        values[ph] = f.value as NativeAttributeValue;
        frags.push(`${nameToken} ${f.op} ${ph}`);
        break;
      }
    }
  });

  return frags.join(" AND ");
};

export const buildProjectionExpression = <T>(
  projection: (keyof T)[],
  names: Record<string, string>
) => {
  const projectionNames = projection.map((key, idx) => {
    const nameKey = `#proj${idx}`;
    names[nameKey] = key as string;
    return nameKey;
  });
  return projectionNames.join(", ");
};

/**
 * Sleep for exponential backoff
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate backoff delay for retries
 */
export const backoffDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
};

/**
 * Chunk an array into smaller arrays of specified size
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

/**
 * Build UpdateExpression and expression attributes from type-safe update operations
 */
export const buildUpdateExpression = <T extends object>(
  ops: _t.UpdateOperations<T>,
  names: Record<string, string>,
  values: Record<string, NativeAttributeValue>
) => {
  const setParts: string[] = [];
  const removeParts: string[] = [];
  const addParts: string[] = [];

  // Helper to get unique name token
  let nameIdx = 0;
  const getName = (key: string) => {
    const token = `#u${nameIdx++}`;
    names[token] = key;
    return token;
  };
  let valIdx = 0;
  const getValue = (val: unknown) => {
    const token = `:u${valIdx++}`;
    values[token] = val as NativeAttributeValue;
    return token;
  };

  // SET: { field: value } → SET #field = :field
  if (ops.set) {
    for (const [key, val] of Object.entries(
      ops.set as Record<string, unknown>
    )) {
      if (val !== undefined) {
        setParts.push(`${getName(key)} = ${getValue(val)}`);
      }
    }
  }

  // INCR: { field: 1 } → SET #field = #field + :val
  if (ops.incr) {
    for (const [key, val] of Object.entries(
      ops.incr as Record<string, number>
    )) {
      if (val !== undefined) {
        const nameToken = getName(key);
        setParts.push(`${nameToken} = ${nameToken} + ${getValue(val)}`);
      }
    }
  }

  // REMOVE: ['field'] → REMOVE #field
  if (ops.remove) {
    for (const key of ops.remove as string[]) {
      removeParts.push(getName(key));
    }
  }

  // APPEND: { list: ['item'] } → SET #list = list_append(#list, :list)
  if (ops.append) {
    for (const [key, val] of Object.entries(
      ops.append as Record<string, unknown[]>
    )) {
      if (val !== undefined) {
        const nameToken = getName(key);
        setParts.push(
          `${nameToken} = list_append(${nameToken}, ${getValue(val)})`
        );
      }
    }
  }

  // PREPEND: { list: ['item'] } → SET #list = list_append(:list, #list)
  if (ops.prepend) {
    for (const [key, val] of Object.entries(
      ops.prepend as Record<string, unknown[]>
    )) {
      if (val !== undefined) {
        const nameToken = getName(key);
        setParts.push(
          `${nameToken} = list_append(${getValue(val)}, ${nameToken})`
        );
      }
    }
  }

  // IF NOT EXISTS: { field: 'default' } → SET #field = if_not_exists(#field, :field)
  if (ops.ifNotExists) {
    for (const [key, val] of Object.entries(
      ops.ifNotExists as Record<string, unknown>
    )) {
      if (val !== undefined) {
        const nameToken = getName(key);
        setParts.push(
          `${nameToken} = if_not_exists(${nameToken}, ${getValue(val)})`
        );
      }
    }
  }

  // ADD: { counter: 5 } → ADD #counter :counter (atomic increment, creates if missing)
  if (ops.add) {
    for (const [key, val] of Object.entries(
      ops.add as Record<string, number>
    )) {
      if (val !== undefined) {
        addParts.push(`${getName(key)} ${getValue(val)}`);
      }
    }
  }

  // SET PATH: { 'address.city': 'NYC' } → SET #address.#city = :val
  if (ops.setPath) {
    for (const [path, val] of Object.entries(ops.setPath)) {
      if (val !== undefined) {
        const pathParts = path.split(".");
        const pathTokens = pathParts.map((p) => getName(p));
        setParts.push(`${pathTokens.join(".")} = ${getValue(val)}`);
      }
    }
  }

  // COMPUTE: { total: ['price', '+', 'tax'] } → SET #total = #price + #tax
  if (ops.compute) {
    for (const [key, val] of Object.entries(
      ops.compute as Record<string, unknown>
    )) {
      if (val && Array.isArray(val) && val.length === 3) {
        const [left, op, right] = val as [string, "+" | "-", string];
        setParts.push(
          `${getName(key)} = ${getName(left)} ${op} ${getName(right)}`
        );
      }
    }
  }

  // Build expression parts
  const exprParts: string[] = [];
  if (setParts.length > 0) {
    exprParts.push(`SET ${setParts.join(", ")}`);
  }
  if (removeParts.length > 0) {
    exprParts.push(`REMOVE ${removeParts.join(", ")}`);
  }
  if (addParts.length > 0) {
    exprParts.push(`ADD ${addParts.join(", ")}`);
  }

  return exprParts.join(" ") || undefined;
};
