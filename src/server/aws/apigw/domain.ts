import {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommand,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import * as _f from "./fns";
import * as _t from "./types";

export const create = (props: _t.CreateProps): _t.Client => {
  const client = new ApiGatewayManagementApiClient({
    endpoint: props.endpoint,
  });
  return { client, endpoint: props.endpoint };
};

export const createFromRequestContext = (props: _t.RequestContextProps) => {
  return create({ endpoint: _f.getManagementEndpoint(props) });
};

/**
 * Bind connection lookup and stale cleanup once, then reuse the returned
 * publisher for one-to-one sends and fan-out.
 *
 * Create your API Gateway client and any storage clients once, then create a
 * publisher once and pass that publisher to nested helpers. This keeps the call
 * sites focused on targets and payloads instead of threading the same
 * dependencies through every send.
 *
 * `onGone` is where app-specific cleanup belongs. For example, a DynamoDB-backed
 * app can close over `ddb` there without making the publisher itself depend on
 * DynamoDB types.
 *
 * @example
 * const ddb = DDB.create({ tableName: "app-main" });
 * const apigw = ApiGw.create({ endpoint: process.env.WS_ENDPOINT! });
 *
 * const publisher = ApiGw.createPublisher<Connection, Event>(apigw, {
 *   getConnectionId: (connection) => connection.id,
 *   onGone: (connection) => removeConnection(ddb, connection.id),
 * });
 *
 * await publisher.send(connection, {
 *   data: { type: "subscribed" },
 * });
 *
 * await publisher.broadcast({
 *   targets: connections,
 *   data: { type: "refresh" },
 * });
 *
 * @example
 * type UploadSessionPublisher = ApiGw.Publisher<
 *   UploadSessionConnection,
 *   StreamEvent
 * >;
 *
 * const publishSnapshot = async (
 *   publisher: UploadSessionPublisher,
 *   connection: UploadSessionConnection
 * ) => {
 *   const event =
 *     connection.scope === "active"
 *       ? await createActiveSessionsEvent(ddb)
 *       : await createSessionEvent(ddb, connection.sessionId!);
 *
 *   await publisher.send(connection, { data: event });
 * };
 */
export const createPublisher = <T, TData = unknown>(
  apigw: _t.Client,
  props: _t.CreatePublisherProps<T>
): _t.Publisher<T, TData> => {
  const getConnectionId = props.getConnectionId;
  const onGone = props.onGone;

  return {
    send: (target, sendProps) => {
      return send(apigw, {
        connectionId: getConnectionId(target),
        data: sendProps.data,
        onGone: onGone ? () => onGone(target) : undefined,
      });
    },
    broadcast: (broadcastProps) => {
      return broadcast(apigw, {
        ...broadcastProps,
        getConnectionId,
        onGone,
      });
    },
  };
};

export const send = async (apigw: _t.Client, props: _t.SendProps) => {
  try {
    await apigw.client.send(
      new PostToConnectionCommand({
        ConnectionId: props.connectionId,
        Data: _f.encodeData(props.data),
      })
    );
  } catch (error) {
    if (_f.isGoneConnectionError(error)) {
      await props.onGone?.(props.connectionId);
      return false;
    }
    throw error;
  }

  return true;
};

export const deleteConnection = (
  apigw: _t.Client,
  props: _t.DeleteConnectionProps
) => {
  return apigw.client.send(
    new DeleteConnectionCommand({
      ConnectionId: props.connectionId,
    })
  );
};

export const broadcast = async <T, TData = unknown>(
  apigw: _t.Client,
  props: _t.BroadcastProps<T, TData>
) => {
  const result: _t.BroadcastResult<T> = {
    failed: [],
    stale: [],
    sent: 0,
  };

  const sharedData = "data" in props ? _f.encodeData(props.data) : null;
  const getData = "getData" in props ? props.getData : null;
  const getCacheKey = "getCacheKey" in props ? props.getCacheKey : undefined;
  const onGone = props.onGone;
  const cache = new Map<string | number, Promise<_t.EncodedPayload>>();

  const resolveData = async (target: T): Promise<_t.EncodedPayload> => {
    if (sharedData !== null) {
      return sharedData;
    }

    if (!getData) {
      throw new Error("Missing websocket broadcast payload builder");
    }

    const cacheKey = getCacheKey?.(target);
    if (cacheKey == null) {
      return _f.encodeData(await getData(target));
    }

    const existing = cache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const promise = Promise.resolve(getData(target)).then(_f.encodeData);
    cache.set(cacheKey, promise);
    return promise;
  };

  await _f.runWithConcurrency(
    props.targets,
    props.concurrency ?? 25,
    async (target) => {
      const connectionId = props.getConnectionId(target);

      try {
        const delivered = await send(apigw, {
          connectionId,
          data: await resolveData(target),
          onGone: onGone ? () => onGone(target) : undefined,
        });

        if (!delivered) {
          result.stale.push({ connectionId, target });
          return;
        }

        result.sent += 1;
      } catch (error) {
        result.failed.push({ connectionId, error, target });
      }
    }
  );

  return result;
};
