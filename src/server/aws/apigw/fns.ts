import * as _t from "./types";

const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, "");

export const getManagementEndpoint = (props: _t.RequestContextProps) => {
  const domainName = props.domainName;
  if (!domainName) {
    throw new Error("Missing websocket domain name");
  }

  const rawPath = props.basePath ?? props.stage;
  if (rawPath == null) {
    throw new Error("Missing websocket stage or base path");
  }

  const protocol = props.protocol ?? "https";
  const path = normalizePath(rawPath);
  return path
    ? `${protocol}://${domainName}/${path}`
    : `${protocol}://${domainName}`;
};

export const isGoneConnectionError = (error: unknown) => {
  return !!(
    error &&
    typeof error === "object" &&
    "$metadata" in error &&
    (error as { $metadata?: { httpStatusCode?: number } }).$metadata
      ?.httpStatusCode === 410
  );
};

export const encodeData = (data: unknown): _t.EncodedPayload => {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  const encoded = JSON.stringify(data);
  if (encoded === undefined) {
    throw new Error("Websocket payload must be JSON serializable");
  }
  return encoded;
};

export const runWithConcurrency = async <T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
) => {
  const limit = Math.max(1, concurrency);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        await fn(items[currentIndex]!);
      }
    })
  );
};
