import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
  UpdateContinuousBackupsCommand,
  DescribeContinuousBackupsCommand,
  type CreateTableCommandInput,
  type DynamoDBClientConfig,
  type GlobalSecondaryIndex,
  type TableDescription,
} from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  type ScanCommandInput,
  type ScanCommandOutput,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import signale from "signale";

// Type for batch write requests in DocumentClient context
type BatchWriteRequest = {
  PutRequest?: {
    Item: Record<string, unknown>;
  };
  DeleteRequest?: {
    Key: Record<string, unknown>;
  };
};

/**
 * Validates that a table name follows AWS naming conventions
 * @param tableName The table name to validate
 */
const validateTableName = (tableName: string): void => {
  const regex = /^[a-zA-Z0-9_.-]{3,255}$/;
  if (!regex.test(tableName)) {
    throw new Error(
      `tableName must follow AWS naming rules (3-255 length, and only the following characters: a-z, A-Z, 0-9, _-.) but received: ${tableName}`
    );
  }
};

/**
 * Cleans a table schema by removing AWS-specific fields that cannot be used in CreateTable
 * @param table The table description from DescribeTable
 * @returns Cleaned table schema suitable for CreateTable
 */
const clearTableSchema = (table: TableDescription): CreateTableCommandInput => {
  // Start with required fields
  const cleanTable: CreateTableCommandInput = {
    TableName: table.TableName!,
    AttributeDefinitions: table.AttributeDefinitions!,
    KeySchema: table.KeySchema!,
  };

  // Add optional billing mode
  if (table.BillingModeSummary?.BillingMode) {
    cleanTable.BillingMode = table.BillingModeSummary.BillingMode;
  }

  // Handle ProvisionedThroughput (only if not on-demand)
  if (
    table.ProvisionedThroughput &&
    table.BillingModeSummary?.BillingMode !== "PAY_PER_REQUEST"
  ) {
    cleanTable.ProvisionedThroughput = {
      ReadCapacityUnits: table.ProvisionedThroughput.ReadCapacityUnits!,
      WriteCapacityUnits: table.ProvisionedThroughput.WriteCapacityUnits!,
    };
  }

  // Handle Local Secondary Indexes
  if (table.LocalSecondaryIndexes && table.LocalSecondaryIndexes.length > 0) {
    cleanTable.LocalSecondaryIndexes = table.LocalSecondaryIndexes.map(
      (lsi) => ({
        IndexName: lsi.IndexName!,
        KeySchema: lsi.KeySchema!,
        Projection: lsi.Projection!,
      })
    );
  }

  // Handle Global Secondary Indexes
  if (table.GlobalSecondaryIndexes && table.GlobalSecondaryIndexes.length > 0) {
    cleanTable.GlobalSecondaryIndexes = table.GlobalSecondaryIndexes.map(
      (gsi) => {
        const cleanGsi: GlobalSecondaryIndex = {
          IndexName: gsi.IndexName!,
          KeySchema: gsi.KeySchema!,
          Projection: gsi.Projection!,
        };

        // Add provisioned throughput if not on-demand
        if (
          gsi.ProvisionedThroughput &&
          table.BillingModeSummary?.BillingMode !== "PAY_PER_REQUEST"
        ) {
          cleanGsi.ProvisionedThroughput = {
            ReadCapacityUnits: gsi.ProvisionedThroughput.ReadCapacityUnits!,
            WriteCapacityUnits: gsi.ProvisionedThroughput.WriteCapacityUnits!,
          };
        }

        return cleanGsi;
      }
    );
  }

  // Handle SSE (Server-Side Encryption)
  if (table.SSEDescription) {
    cleanTable.SSESpecification = {
      Enabled:
        table.SSEDescription.Status === "ENABLED" ||
        table.SSEDescription.Status === "ENABLING",
    };
    if (
      table.SSEDescription.SSEType === "KMS" &&
      table.SSEDescription.KMSMasterKeyArn
    ) {
      cleanTable.SSESpecification.SSEType = "KMS";
      cleanTable.SSESpecification.KMSMasterKeyId =
        table.SSEDescription.KMSMasterKeyArn;
    }
  }

  // Handle Stream Specification
  if (table.StreamSpecification) {
    cleanTable.StreamSpecification = {
      StreamEnabled: table.StreamSpecification.StreamEnabled,
      StreamViewType: table.StreamSpecification.StreamViewType,
    };
  }

  return cleanTable;
};

/**
 * Waits for a DynamoDB table to become active using AWS SDK's built-in waiter
 * @param tableName The name of the table to wait for
 * @param client The DynamoDB client to use
 * @param log Whether to show progress message
 */
const waitForActive = async (
  tableName: string,
  client: DynamoDBClient,
  log?: boolean
): Promise<void> => {
  if (log) {
    signale.log(`Waiting for table "${tableName}" to become active...`);
  }

  // Use AWS SDK's built-in waiter - much more robust than custom polling
  await waitUntilTableExists(
    {
      client,
      // Check every 5 seconds
      minDelay: 5,
      maxDelay: 5,
      // Wait up to 10 minutes
      maxWaitTime: 600,
    },
    { TableName: tableName }
  );

  if (log) signale.success(`Table "${tableName}" is now active!`);
};

/**
 * Sleep utility function
 * @param ms Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type CopyTableProps = {
  /** Source table configuration */
  source: {
    tableName: string;
    /** Optional AWS config for cross-region copying */
    config?: DynamoDBClientConfig;
  };
  /** Destination table configuration */
  destination: {
    tableName: string;
    /** Optional AWS config for cross-region copying */
    config?: DynamoDBClientConfig;
  };
  /** Whether to create destination table if it doesn't exist */
  create?: boolean;
  /** If true, only copy schema without data */
  schemaOnly?: boolean;
  /** Whether to enable continuous backups on destination table */
  continuousBackups?: boolean;
  /** Optional function to transform each item during copy */
  transform?: (
    item: Record<string, unknown>,
    index: number
  ) => Record<string, unknown>;
  /** Whether to show progress logs */
  log?: boolean;
};

type CopyTableResult = {
  /** Number of items copied */
  count: number;
  /** Operation status */
  status: "SUCCESS" | "FAIL";
  /** Whether only schema was copied */
  schemaOnly?: boolean;
};

/**
 * Copy a DynamoDB table to another table, with support for cross-region copying,
 * schema-only copying, and data transformation.
 *
 * This function can:
 * - Copy data between tables in the same or different regions
 * - Create the destination table if it doesn't exist
 * - Copy only the schema without data
 * - Transform items during the copy process
 * - Enable continuous backups on the destination table
 * - Handle large tables with proper pagination and retry logic
 *
 * @param props Configuration options for the copy operation
 * @returns Promise resolving to copy results
 */
export const copyTable = async (
  props: CopyTableProps
): Promise<CopyTableResult> => {
  try {
    // Validate table names
    validateTableName(props.source.tableName);
    validateTableName(props.destination.tableName);

    // Create source clients (DocumentClient and DynamoDB)
    const sourceDynamoClient = new DynamoDBClient({
      ...props.source.config,
      region: props.source.config?.region || "us-east-1",
    });
    const sourceDocClient = DynamoDBDocumentClient.from(sourceDynamoClient);

    // Create destination clients (DocumentClient and DynamoDB)
    const destDynamoClient = new DynamoDBClient({
      ...props.destination.config,
      region: props.destination.config?.region || "us-east-1",
    });
    const destDocClient = DynamoDBDocumentClient.from(destDynamoClient);

    let counter = 0;

    // Handle table creation if requested
    if (props.create) {
      try {
        // Get source table description
        const sourceCommand = new DescribeTableCommand({
          TableName: props.source.tableName,
        });
        const sourceResponse = await sourceDynamoClient.send(sourceCommand);

        if (sourceResponse.Table?.TableStatus !== "ACTIVE") {
          throw new Error("Source table is not active");
        }

        // Clean and prepare table schema for creation
        const cleanedTable = clearTableSchema(sourceResponse.Table);
        cleanedTable.TableName = props.destination.tableName;

        // Create destination table
        try {
          const createCommand = new CreateTableCommand(cleanedTable);
          await destDynamoClient.send(createCommand);
        } catch (error: unknown) {
          // Ignore error if table already exists
          if (
            error instanceof Error &&
            error.name !== "ResourceInUseException"
          ) {
            throw error;
          }
        }

        // Wait for destination table to become active
        await waitForActive(
          props.destination.tableName,
          destDynamoClient,
          props.log
        );

        // If schema-only copy, return early
        if (props.schemaOnly) {
          return { count: 0, status: "SUCCESS", schemaOnly: true };
        }

        // Handle continuous backups if requested
        if (props.continuousBackups) {
          try {
            const sourceBackupsCommand = new DescribeContinuousBackupsCommand({
              TableName: props.source.tableName,
            });
            const sourceBackupsResponse = await sourceDynamoClient.send(
              sourceBackupsCommand
            );

            if (
              sourceBackupsResponse.ContinuousBackupsDescription
                ?.ContinuousBackupsStatus === "ENABLED"
            ) {
              const updateBackupsCommand = new UpdateContinuousBackupsCommand({
                TableName: props.destination.tableName,
                PointInTimeRecoverySpecification: {
                  PointInTimeRecoveryEnabled: true,
                },
              });
              await destDynamoClient.send(updateBackupsCommand);
            }
          } catch (error) {
            console.warn("Failed to enable continuous backups:", error);
          }
        }
      } catch (error) {
        signale.error({ error });
        return { count: 0, status: "FAIL" };
      }
    } else {
      // Verify both tables exist and are active
      try {
        const sourceCommand = new DescribeTableCommand({
          TableName: props.source.tableName,
        });
        const sourceResponse = await sourceDynamoClient.send(sourceCommand);

        if (sourceResponse.Table?.TableStatus !== "ACTIVE") {
          throw new Error("Source table is not active");
        }

        const destCommand = new DescribeTableCommand({
          TableName: props.destination.tableName,
        });
        const destResponse = await destDynamoClient.send(destCommand);

        if (destResponse.Table?.TableStatus !== "ACTIVE") {
          throw new Error("Destination table is not active");
        }
      } catch (error) {
        signale.error({ error });
        return { count: 0, status: "FAIL" };
      }
    }

    // Copy data from source to destination
    let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;

    while (true) {
      // Scan source table in batches
      const scanInput: ScanCommandInput = {
        TableName: props.source.tableName,
        Limit: 25, // Process 25 items at a time
        ExclusiveStartKey: lastEvaluatedKey,
      };
      const scanCommand = new ScanCommand(scanInput);

      const scanResponse: ScanCommandOutput = await sourceDocClient.send(
        scanCommand
      );
      const items = scanResponse.Items || [];

      // Break if no more items
      if (items.length === 0) {
        break;
      }

      // Transform items for batch write, applying transform function if provided
      const writeRequests: BatchWriteRequest[] = items.map(
        (item: Record<string, unknown>, index: number) => ({
          PutRequest: {
            Item: props.transform ? props.transform(item, index) : item,
          },
        })
      );

      // Write batch to destination table with retry logic
      let retries = 0;
      let unprocessedItems: BatchWriteRequest[] = writeRequests;

      while (unprocessedItems.length > 0) {
        const batchWriteCommand = new BatchWriteCommand({
          RequestItems: {
            [props.destination.tableName]: unprocessedItems,
          },
        });

        const batchResponse = await destDocClient.send(batchWriteCommand);
        const stillUnprocessed: BatchWriteRequest[] =
          (batchResponse.UnprocessedItems?.[
            props.destination.tableName
          ] as BatchWriteRequest[]) || [];

        // Update counter with successfully processed items
        counter += unprocessedItems.length - stillUnprocessed.length;

        if (stillUnprocessed.length > 0) {
          retries++;
          unprocessedItems = stillUnprocessed;

          // Exponential backoff for retries (as per AWS recommendations)
          await sleep(2 * retries * 100);
        } else {
          unprocessedItems = [];
        }
      }

      // Show progress if logging enabled
      process.stdout.write(`\rCopied ${counter} items`);

      // Check for more items to process
      lastEvaluatedKey = scanResponse.LastEvaluatedKey;
      if (!lastEvaluatedKey) break;
    }

    process.stdout.write("\n");

    return { count: counter, status: "SUCCESS" };
  } catch (error) {
    console.error("Copy operation failed:", error);
    return { count: 0, status: "FAIL" };
  }
};
