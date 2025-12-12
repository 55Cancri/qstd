import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

import * as _f from "./fns";

export type Client = ReturnType<typeof create>;

export const create = (props?: { queueUrl: string }) => {
  const client = new SQSClient({});
  const queueUrl = props?.queueUrl;
  return { client, queueUrl };
};

export const send = (
  sqs: Client,
  props: { messageGroupId?: string; body: unknown; queueUrl?: string }
) =>
  sqs.client.send(
    new SendMessageCommand({
      MessageBody: JSON.stringify(props.body),
      MessageGroupId: props.messageGroupId,
      QueueUrl: _f.getQueueUrlOrThrow(props.queueUrl, sqs.queueUrl),
    })
  );
