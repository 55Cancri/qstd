import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type _Object,
  type DeleteObjectCommandOutput,
  type GetObjectCommandOutput,
  type HeadObjectCommandOutput,
  type S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createPresignedPost,
  type PresignedPost,
} from "@aws-sdk/s3-presigned-post";

import * as _f from "./fns";
import * as _t from "./types";

export const create = (props: _t.CreateProps = {}): _t.Client => {
  const { cdn } = props;
  const client = new S3Client({});
  const bucketName = _f.getBucketNameOrThrow(props.bucketName);
  return { client, bucketName, cdn };
};

/**
 * signed url for a get
 * NOTE: ensure lambda has permissions to create
 * signed url or url will give access denied
 * @param s3
 * @param props
 */
export function createSignedUrl(
  s3: _t.Client,
  props: _t.SignedUrlGetProps
): Promise<string>;
export function createSignedUrl(
  s3: _t.Client,
  props: _t.SignedUrlPostProps
): Promise<PresignedPost>;
export function createSignedUrl(s3: _t.Client, props: _t.SignedUrlProps) {
  const Bucket = _f.getBucketNameOrThrow(props.bucketName, s3.bucketName);

  if (props.action === "get") {
    const command = new GetObjectCommand({ Key: props.key, Bucket });
    return getSignedUrl(s3.client, command, {
      expiresIn: props.expiresInSecs ?? 3600,
    });
  } else if (props.action === "post") {
    const params: _t.PresignedPostOpts = {
      Bucket,
      Key: props.key,
      Expires: props.expireInSecs,
      // render url image in the browser instead of downloading it
      Fields: {
        "Content-Disposition": "inline",
      },
      Conditions: [
        ["content-length-range", 0, props.maxSize],
        // ["starts-with", "$Content-Type", file_types], // todo figure out allowed file types later
        // ["Content-Type", file_types], // try with exact match?
      ],
    };

    if (props.contentType) {
      if (!params.Fields) params.Fields = {};
      params.Fields["Content-Type"] = props.contentType;
      params.Conditions!.push(["eq", "$Content-Type", props.contentType]);
    }
    if (props.startsWith) {
      params.Conditions!.push(["starts-with", "$key", props.startsWith]);
    }

    return createPresignedPost(s3.client, params);
  } else {
    // This should be unreachable if types are correct, but good for runtime safety
    throw new Error(
      // @ts-expect-error - runtime check for invalid action
      `[error] [s3] [createSignedUrl] invalid action: ${props.action}`
    );
  }
}

/**
 * upload a file directly to s3 bucket
 * @param s3
 * @param props
 * @returns
 */
export const uploadFile = (s3: _t.Client, props: _t.UploadProps) => {
  const Bucket = _f.getBucketNameOrThrow(props.bucketName, s3.bucketName);
  const command = new PutObjectCommand({
    ContentType: props.contentType,
    Body: props.body!,
    Key: props.key,
    // Metadata
    Bucket,
  });
  return s3.client.send(command);
};

// ================================
// file operations
// ================================

export type FileProps = { key: string; bucketName?: string };

export const getFile = async (
  s3: _t.Client,
  props: FileProps
): Promise<GetObjectCommandOutput> => {
  try {
    const Bucket = _f.getBucketNameOrThrow(props.bucketName, s3.bucketName);
    return await s3.client.send(
      new GetObjectCommand({ Bucket, Key: props.key })
    );
  } catch (err) {
    console.log(`[error] [s3] [getFile] failed. Input:`);
    console.dir(props, { depth: 100 });
    throw err;
  }
};

export const deleteFile = async (
  s3: _t.Client,
  props: FileProps
): Promise<DeleteObjectCommandOutput> => {
  try {
    const Bucket = _f.getBucketNameOrThrow(props.bucketName, s3.bucketName);
    return await s3.client.send(
      new DeleteObjectCommand({ Bucket, Key: props.key })
    );
  } catch (err) {
    console.log(`[error] [s3] [deleteFile] failed. Input:`);
    console.dir(props, { depth: 100 });
    throw err;
  }
};

export const getFileMetadata = async (
  s3: _t.Client,
  props: FileProps
): Promise<HeadObjectCommandOutput> => {
  try {
    const Bucket = _f.getBucketNameOrThrow(props.bucketName, s3.bucketName);
    return await s3.client.send(
      new HeadObjectCommand({ Bucket, Key: props.key })
    );
  } catch (err) {
    console.log(`[error] [s3] [metadataFromFile] failed. Input:`);
    console.dir(props, { depth: 100 });
    throw err;
  }
};

// ================================
// bucket operations
// ================================

/**
 * Create a new S3 bucket
 */
export const createBucket = (s3: _t.Client, bucketName: string) => {
  const command = new CreateBucketCommand({ Bucket: bucketName });
  return s3.client.send(command);
};

/**
 * Delete an S3 bucket
 */
export const deleteBucket = (s3: _t.Client, bucketName: string) => {
  const command = new DeleteBucketCommand({ Bucket: bucketName });
  return s3.client.send(command);
};

/**
 * Check if an S3 bucket exists
 */
export const bucketExists = async (s3: _t.Client, bucketName: string) => {
  try {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3.client.send(command);
    return true;
  } catch (err) {
    const awsError = err as S3ServiceException;
    if (
      awsError.$metadata?.httpStatusCode === 404 ||
      awsError.$metadata?.httpStatusCode === 400
    ) {
      return false;
    }
    console.log(err);
    throw err;
  }
};

/**
 * Copy and delete original files from src bucket to target bucket.
 * @param s3
 * @param buckets
 * @returns
 */
export const migrateBucketContents = async (
  s3: _t.Client,
  buckets: _t.BucketTransferOpts
) => {
  const command = new ListObjectsV2Command({ Bucket: buckets.from });

  const srcFiles = await s3.client.send(command);
  if (!srcFiles.Contents) return;
  const s3Promises = srcFiles.Contents?.map(async (item: _Object) => {
    const CopySource = `${buckets.from}/${item.Key!}`;
    const copyInput = { Bucket: buckets.to, Key: item.Key!, CopySource };
    const deleteInput = { Bucket: buckets.from, Key: item.Key! };

    const copyCommand = new CopyObjectCommand(copyInput);
    const deleteCommand = new DeleteObjectCommand(deleteInput);

    await s3.client.send(copyCommand);
    return s3.client.send(deleteCommand);
  });
  return Promise.all(s3Promises);
};

/**
 * Parse and decode S3 records from an SQS message body.
 *
 * S3 event notifications delivered via SQS contain URL-encoded object keys.
 * This function parses the JSON and decodes keys in one step, so consumers
 * don't need to handle the encoding quirks.
 *
 * @returns Decoded records array, or null if parsing fails or no records exist
 *
 * @example
 * ```ts
 * const records = S3.recordsFromSqs(sqsRecord.body);
 * if (!records) {
 *   logger.warn("Invalid S3 event");
 *   continue;
 * }
 *
 * for (const { bucket, key } of records) {
 *   // key is already decoded
 *   await processFile(bucket, key);
 * }
 * ```
 */
export const recordsFromSqs = (body: string): _t.SqsRecord[] | null => {
  try {
    const event = JSON.parse(body) as _t.NotificationEvent;
    if (!event?.Records?.length) return null;

    return event.Records.map((r) => ({
      bucket: r.s3.bucket.name,
      // S3 URL-encodes keys and replaces spaces with '+'
      key: decodeURIComponent(r.s3.object.key.replace(/\+/g, " ")),
      size: r.s3.object.size,
      eventName: r.eventName,
      eventTime: r.eventTime,
    }));
  } catch {
    return null;
  }
};
