import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

type Client = ReturnType<typeof create>;

export const create = (props?: { topicArn?: string }) => {
  const client = new SNSClient({});

  return { client, topicArn: props?.topicArn };
};

export const publish = (
  sns: Client,
  props: { topicArn?: string; message: unknown }
) => {
  const topicArn = props.topicArn ?? sns.topicArn;
  return sns.client.send(
    new PublishCommand({
      Message: JSON.stringify(props.message),
      TopicArn: topicArn,
    })
  );
};

export const publishError = (
  sns: Client,
  props: { topicArn?: string; message: object; error: Error }
) => {
  const topicArn = props.topicArn ?? sns.topicArn;
  const error = props.error;
  return sns.client.send(
    new PublishCommand({
      Message: JSON.stringify({
        ...props.message,
        error: {
          name: error?.name,
          stack: error?.stack,
          message: error?.message,
        },
        timestamp: new Date().toISOString(),
      }),
      TopicArn: topicArn,
    })
  );
};
