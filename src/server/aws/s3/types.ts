import { S3Client } from "@aws-sdk/client-s3";
import type {
  CompletedPart,
  UploadPartRequest,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import type { PresignedPostOptions } from "@aws-sdk/s3-presigned-post";

import type { S3Event } from "aws-lambda";

export type NotificationEvent = S3Event;

/** Decoded S3 record from an SQS-delivered notification */
export type SqsRecord = {
  bucket: string;
  /** Decoded S3 object key (URL-decoded, spaces restored) */
  key: string;
  size?: number;
  eventName: string;
  eventTime: string;
};

export type Client = {
  client: S3Client;
  bucketName: string;
  useSignedUrls?: boolean;
  cdn: string | undefined;
};

export type CreateProps = { cdn?: string; bucketName?: string };

export type BucketTransferOpts = { from: string; to: string };

export type SignedPostOpts = {
  key: string;
  /** bytes - 1000 bytes = 1kb, 1000kb = 1mb, etc. */
  maxSize: number;
  expireInSecs: number;
  bucketName?: string;
  contentType?: string;
  startsWith?: string;
};

export type SignedUrlGetProps = {
  expiresInSecs?: number;
  bucketName?: string;
  action: "get";
  key: string;
};

export type SignedUrlPostProps = SignedPostOpts & {
  action: "post";
};

export type SignedUrlMultipartProps = {
  action: "multipart";
  key: string;
  contentType?: string;
  numOfParts: number;
  expiresInSecs?: number;
  bucketName?: string;
};

export type SignedUrlProps =
  | SignedUrlGetProps
  | SignedUrlPostProps
  | SignedUrlMultipartProps;

export type SignedUrlOpts = {
  key: string;
  expires: number;
  bucket?: string;
  numOfParts: number;
  uploadId: string;
};

export type UploadProps = {
  body: PutObjectCommandInput["Body"];
  contentType?: string;
  bucketName?: string;
  key: string;
};

export type FileObjectProps = {
  key: string;
  bucketName?: string;
  action: "get" | "delete" | "metadata";
};

export type StartMultiPartProps = {
  key: string;
  bucketName?: string;
  contentType?: string;
};

export type CompleteMultiPartProps = {
  key: string;
  bucketName?: string;
  uploadId: string;
  parts: CompletedPart[];
};

export type MultiPartProps = {
  bucketName?: string;
  uploadId: string;
  key: string;
};

// ================================
// High-level multipart upload API
// ================================

export type PrepareMultipartUploadProps = {
  expiresInSecs?: number;
  contentType?: string;
  bucketName?: string;
  numOfParts: number;
  key: string;
};

export type PrepareMultipartUploadResult = {
  signedUrls: string[];
  uploadId: string;
  key: string;
};

export type FinalizeMultipartUploadProps = {
  bucketName?: string;
  uploadId: string;
  key: string;
};

export type UploadPartProps = {
  key: string;
  partNum: number;
  uploadId: string;
  body: UploadPartRequest["Body"];
  bucketName?: string;
};

export type PresignedPostOpts = PresignedPostOptions;
