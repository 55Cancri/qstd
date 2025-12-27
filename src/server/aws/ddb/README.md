# DynamoDB Table Copy Utility

A modern TypeScript utility for copying DynamoDB tables with support for cross-region copying, schema-only migration, and data transformation.

## Features

- **Modern AWS SDK v3**: Uses the latest AWS SDK with async/await
- **Cross-region copying**: Copy tables between different AWS regions
- **Schema-only copying**: Copy just the table structure without data
- **Data transformation**: Transform items during the copy process
- **Automatic table creation**: Create destination tables if they don't exist
- **Continuous backups**: Optionally enable point-in-time recovery
- **Robust retry logic**: Handles unprocessed items with exponential backoff
- **Progress logging**: Optional progress display during copy operations

## Usage

```typescript
import { copyTable } from "./copy-table";

// Basic table copy
const result = await copyTable({
  source: {
    tableName: "source-table",
  },
  destination: {
    tableName: "destination-table",
  },
  create: true, // Create destination if it doesn't exist
  log: true, // Show progress
});

console.log(`Copied ${result.count} items`);
```

## API Reference

### `copyTable(props)`

#### Parameters

- `props` (`CopyTableProps`): Configuration options

#### CopyTableProps

```typescript
type CopyTableProps = {
  source: {
    tableName: string;
    config?: DynamoDBClientConfig; // Optional AWS config for cross-region
  };
  destination: {
    tableName: string;
    config?: DynamoDBClientConfig; // Optional AWS config for cross-region
  };
  create?: boolean; // Create destination table if it doesn't exist
  schemaOnly?: boolean; // Copy only schema, not data
  continuousBackups?: boolean; // Enable point-in-time recovery
  transform?: (item: any, index: number) => any; // Transform items during copy
  log?: boolean; // Show progress logs
};
```

#### Returns

```typescript
type CopyTableResult = {
  count: number; // Number of items copied
  status: "SUCCESS" | "FAIL";
  schemaOnly?: boolean; // Whether only schema was copied
};
```

## Examples

### Cross-Region Copy

```typescript
const result = await copyTable({
  source: {
    tableName: "my-table",
    config: { region: "us-west-2" },
  },
  destination: {
    tableName: "my-table-backup",
    config: { region: "us-east-1" },
  },
  create: true,
  continuousBackups: true,
});
```

### Data Transformation

```typescript
const result = await copyTable({
  source: { tableName: "old-table" },
  destination: { tableName: "new-table" },
  create: true,
  transform: (item, index) => ({
    ...item,
    migratedAt: new Date().toISOString(),
    migrationIndex: index,
  }),
});
```

### Schema-Only Copy

```typescript
const result = await copyTable({
  source: { tableName: "production-table" },
  destination: { tableName: "test-table" },
  create: true,
  schemaOnly: true, // Only copy table structure
});
```

## Migration from Original Code

The original callback-based function has been modernized:

### Before (Original)

```javascript
var copy = require("copy-dynamodb-table").copy;

copy(
  {
    source: { tableName: "source" },
    destination: { tableName: "dest" },
    log: true,
    create: true,
  },
  function (err, result) {
    if (err) console.log(err);
    console.log(result);
  }
);
```

### After (Refactored)

```typescript
import { copyTable } from "./copy-table";

try {
  const result = await copyTable({
    source: { tableName: "source" },
    destination: { tableName: "dest" },
    log: true,
    create: true,
  });
  console.log(result);
} catch (error) {
  console.error(error);
}
```

## Key Improvements

1. **Modern JavaScript**: Uses const/let, async/await, ES6 modules
2. **TypeScript**: Full type safety with proper interfaces
3. **AWS SDK v3**: Uses the latest AWS SDK with command pattern
4. **Better Error Handling**: Comprehensive error handling with proper types
5. **Cleaner Code**: Removed recursive callbacks in favor of loops
6. **Performance**: More efficient batch processing and retry logic
7. **Documentation**: Comprehensive JSDoc comments and examples
