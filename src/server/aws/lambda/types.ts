import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  SQSHandler as AwsSqsHandler,
  SQSBatchItemFailure,
  SQSBatchResponse,
  Callback,
  Context,
  SQSEvent,
} from "aws-lambda";

/** SQS batch response - return this from SQS handlers */
export type SqsBatchResponse = SQSBatchResponse;

/** Individual failure item - add to batchItemFailures array */
export type SqsBatchItemFailure = SQSBatchItemFailure;

/**
 * Type-safe SQS handler that enforces returning { batchItemFailures }.
 * Use with Lambda.createSqsHandler for compile + runtime safety.
 */
export type SqsHandlerFn = (event: SQSEvent) => Promise<{
  batchItemFailures: SQSBatchItemFailure[];
}>;

export type Response = {
  statusCode: number;
  headers: {
    "Content-Type": string;
    "access-control-allow-origin": string;
    "access-control-allow-headers": string;
    "access-control-allow-methods": string;
    "access-control-allow-credentials": string | boolean;
  };
  cookies?: string[] | undefined;
  isBase64Encoded?: boolean;
  body: string;
};

export type WebsocketEvent = APIGatewayProxyEvent;

export type ApigwEvent = APIGatewayProxyEventV2;
export type ApigwResult = APIGatewayProxyResultV2;

export type SqsEvent = SQSEvent;
export type SqsContext = Context;
export type SQSHandler = AwsSqsHandler;
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type SqsCallback = Callback<SQSBatchResponse | void>;

export type ResponseOptions = {
  /**
   * `200` - **Ok**: request succeeded and there is a response payload.
   *
   * `201` - **Created**
   *
   * `204` - **No Content**: request succeeded and there is no response payload.
   *
   * `304` - **Not Modified**: request succeeded but there was no change.j
   *
   * `400` - **Bad Request**: malformed syntax.
   *
   * `401` - **Unauthorized**: request lacks valid auth credentials for target resource.
   * Note: Will *not* return a response.
   *
   * `404` - **Not Found**: no matching resource uri.
   *
   * `410` - **Gone**: the client should not request the resource in the future.
   *
   * `415` - **Unsupported Media Type**
   *
   * `422` - **Unprocessable entity**
   *
   * `500` - **Internal Server Error**
   */
  status?: 200 | 201 | 204 | 304 | 400 | 401 | 404 | 410 | 415 | 422 | 500;
  additionalHeaders?: { [key: string]: string };

  isBase64Encoded?: boolean;

  /** @example "cookies": [ "cookie1", "cookie2" ] */
  cookies?: string[] | undefined;

  /** @example application/json */
  contentType?: string;
  /**
   * @example "*"
   * @example "http://localhost:8000/"
   * */
  origin?: string;

  /** @example "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent" */
  allowedHeaders?: string;

  /** @example "OPTIONS,POST,GET,PUT,DELETE,PATCH" */
  methods?: string;
  allowCredentials?: boolean;
};
