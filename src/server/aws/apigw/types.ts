import type {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommandOutput,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { APIGatewayProxyEvent } from "aws-lambda";

export type RawClient = Pick<ApiGatewayManagementApiClient, "send">;

export type Client = {
  client: RawClient;
  endpoint: string;
};

export type CreateProps = {
  endpoint: string;
};

export type RequestContextProps = Pick<
  APIGatewayProxyEvent["requestContext"],
  "domainName" | "stage"
> & {
  protocol?: "http" | "https";
  basePath?: string;
};

export type EncodedPayload = string | Uint8Array;

export type SendProps = {
  onGone?: (connectionId: string) => Promise<void> | void;
  connectionId: string;
  data: unknown;
};

export type DeleteConnectionProps = {
  connectionId: string;
};

export type DeleteConnectionResult = DeleteConnectionCommandOutput;

export type BroadcastStale<T> = {
  connectionId: string;
  target: T;
};

export type BroadcastFailure<T> = {
  connectionId: string;
  error: unknown;
  target: T;
};

export type BroadcastResult<T> = {
  failed: BroadcastFailure<T>[];
  stale: BroadcastStale<T>[];
  sent: number;
};

type Awaitable<T> = T | PromiseLike<T>;

type BroadcastSharedProps<T> = {
  getConnectionId: (target: T) => string;
  onGone?: (target: T) => Promise<void> | void;
  targets: readonly T[];
  concurrency?: number;
};

export type BroadcastConstantDataProps<T> = BroadcastSharedProps<T> & {
  getCacheKey?: never;
  getData?: never;
  data: unknown;
};

export type BroadcastDynamicDataProps<
  T,
  TData = unknown
> = BroadcastSharedProps<T> & {
  getData: (target: T) => Awaitable<TData>;
  getCacheKey?: (target: T) => string | number | null | undefined;
  data?: never;
};

export type BroadcastProps<T, TData = unknown> =
  | BroadcastConstantDataProps<T>
  | BroadcastDynamicDataProps<T, TData>;

/**
 * Configuration for a bound websocket publisher.
 *
 * `qstd` intentionally asks only for connection lookup and stale-target cleanup.
 * Any storage details, such as DynamoDB removal, live in the `onGone` closure so
 * the publisher can stay generic across apps and persistence layers.
 */
export type CreatePublisherProps<T> = {
  /** Extract the API Gateway connection ID from your app's target shape. */
  getConnectionId: (target: T) => string;
  /** Optional stale-target cleanup hook, eg remove a dead connection from DDB. */
  onGone?: (target: T) => Promise<void> | void;
};

export type PublisherSendProps<TData = unknown> = {
  data: TData;
};

type PublisherBroadcastSharedProps<T> = {
  targets: readonly T[];
  concurrency?: number;
};

export type PublisherBroadcastConstantDataProps<
  T,
  TData = unknown
> = PublisherBroadcastSharedProps<T> & {
  getCacheKey?: never;
  getData?: never;
  data: TData;
};

export type PublisherBroadcastDynamicDataProps<
  T,
  TData = unknown
> = PublisherBroadcastSharedProps<T> & {
  getData: (target: T) => Awaitable<TData>;
  getCacheKey?: (target: T) => string | number | null | undefined;
  data?: never;
};

export type PublisherBroadcastProps<T, TData = unknown> =
  | PublisherBroadcastConstantDataProps<T, TData>
  | PublisherBroadcastDynamicDataProps<T, TData>;

/**
 * Bound websocket publisher created once per invocation and passed to helpers.
 *
 * The type only needs to describe the target shape and payload shape. Any DDB,
 * SQL, or cache clients used for stale cleanup stay hidden inside the closure
 * captured by `createPublisher()`.
 *
 * @example
 * type Connection = { id: string; roomId: string };
 * type Event = { type: "message"; roomId: string; text: string };
 *
 * const publisher = ApiGw.createPublisher<Connection, Event>(apigw, {
 *   getConnectionId: (connection) => connection.id,
 *   onGone: (connection) => removeConnection(ddb, connection.id),
 * });
 *
 * await publisher.send(connection, {
 *   data: { type: "message", roomId: "abc", text: "hello" },
 * });
 */
export type Publisher<T, TData = unknown> = {
  send: (target: T, props: PublisherSendProps<TData>) => Promise<boolean>;
  broadcast: (props: PublisherBroadcastProps<T, TData>) => Promise<
    BroadcastResult<T>
  >;
};
