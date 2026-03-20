import { describe, expect, it, vi } from "vitest";
import { find, type Client } from "./domain";

const createClient = (pages: unknown[]) => {
  const send = vi.fn();
  for (const page of pages) {
    send.mockResolvedValueOnce(page);
  }

  return {
    ddb: {
      client: { send },
      tableName: "users",
    } as unknown as Client,
    send,
  };
};

describe("server/aws/ddb domain", () => {
  it("uses limit as page size while recursing through query results", async () => {
    const { ddb, send } = createClient([
      {
        Count: 1,
        Items: [{ id: "one" }],
        LastEvaluatedKey: { pk: "user#2", sk: "profile" },
        ScannedCount: 1,
      },
      {
        Count: 1,
        Items: [{ id: "two" }],
        LastEvaluatedKey: undefined,
        ScannedCount: 1,
      },
    ]);
    const pageSnapshots: Array<{
      ids: string[];
      pageCount: number;
      totalItems: number;
    }> = [];

    const result = await find<{ id: string }>(ddb, {
      limit: 1,
      pk: { value: "org#123" },
      raw: true,
      recursive: (page, pageCount, totalItems) => {
        pageSnapshots.push({
          ids: page.items.map((item) => item.id),
          pageCount,
          totalItems,
        });
        return true;
      },
      sk: { op: "begins_with", value: "user#" },
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0].input.Limit).toBe(1);
    expect(send.mock.calls[1]?.[0].input.Limit).toBe(1);
    expect(send.mock.calls[1]?.[0].input.ExclusiveStartKey).toEqual({
      pk: "user#2",
      sk: "profile",
    });
    expect(pageSnapshots).toEqual([
      { ids: ["one"], pageCount: 1, totalItems: 1 },
    ]);
    expect(result.items.map((item) => item.id)).toEqual(["one", "two"]);
  });
});
