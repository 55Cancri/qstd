/**
 * Resolve bucket name from candidates, returning the first truthy value
 * @throws Error if no bucket name is found
 */
export const getBucketNameOrThrow = (
  ...candidates: (string | undefined)[]
): string => {
  for (const name of candidates) {
    if (name) return name;
  }
  throw new Error(
    `[s3] "bucketName" is required - provide it in props or when creating the client`
  );
};
