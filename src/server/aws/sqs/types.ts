import type {
  SQSEvent,
  SQSBatchResponse,
  SQSBatchItemFailure,
} from "aws-lambda";

export type EventFromQueue = SQSEvent;
export type BatchResponse = SQSBatchResponse;
export type BatchItemFailure = SQSBatchItemFailure;
