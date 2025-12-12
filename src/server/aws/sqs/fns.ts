/**
 * Resolve queue URL from candidates, returning the first truthy value
 * @throws Error if no queue URL is found
 */
export const getQueueUrlOrThrow = (
  ...candidates: (string | undefined)[]
): string => {
  for (const url of candidates) {
    if (url) return url;
  }
  throw new Error(
    `[sqs] "queueUrl" is required - provide it in props or when creating the client`
  );
};
