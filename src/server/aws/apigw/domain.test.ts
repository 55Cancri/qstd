import { PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { describe, expect, it, vi } from "vitest";
import * as _t from "./types";
import * as ApiGw from "./domain";

describe("server/aws/apigw broadcast", () => {
  it("reuses cached payloads and prunes gone connections", async () => {
    const sent: { connectionId: string; data: unknown }[] = [];
    const send = vi.fn(async (command: unknown) => {
      if (!(command instanceof PostToConnectionCommand)) {
        throw new Error("Expected a PostToConnectionCommand");
      }

      const connectionId = command.input.ConnectionId as string;
      if (connectionId === "stale") {
        throw { $metadata: { httpStatusCode: 410 } };
      }

      sent.push({
        connectionId,
        data: command.input.Data,
      });
      return {};
    });

    const apigw: _t.Client = {
      client: { send } as unknown as _t.RawClient,
      endpoint: "https://example.com/dev",
    };

    let buildCount = 0;
    const gone: string[] = [];

    const result = await ApiGw.broadcast(apigw, {
      targets: [
        { group: "active", id: "a" },
        { group: "active", id: "b" },
        { group: "active", id: "stale" },
      ],
      getConnectionId: (target) => target.id,
      getData: async (target) => {
        buildCount += 1;
        return { group: target.group };
      },
      getCacheKey: (target) => target.group,
      onGone: async (target) => {
        gone.push(target.id);
      },
    });

    expect(buildCount).toBe(1);
    expect(result.sent).toBe(2);
    expect(result.failed).toEqual([]);
    expect(result.stale).toEqual([
      {
        connectionId: "stale",
        target: { group: "active", id: "stale" },
      },
    ]);
    expect(gone).toEqual(["stale"]);
    expect(sent).toEqual([
      { connectionId: "a", data: '{"group":"active"}' },
      { connectionId: "b", data: '{"group":"active"}' },
    ]);
  });

  it("creates a bound publisher with target-aware cleanup", async () => {
    const sent: { connectionId: string; data: unknown }[] = [];
    const send = vi.fn(async (command: unknown) => {
      if (!(command instanceof PostToConnectionCommand)) {
        throw new Error("Expected a PostToConnectionCommand");
      }

      const connectionId = command.input.ConnectionId as string;
      if (connectionId === "stale") {
        throw { $metadata: { httpStatusCode: 410 } };
      }

      sent.push({
        connectionId,
        data: command.input.Data,
      });
      return {};
    });

    const apigw: _t.Client = {
      client: { send } as unknown as _t.RawClient,
      endpoint: "https://example.com/dev",
    };

    const gone: string[] = [];
    const publisher = ApiGw.createPublisher<
      { id: string },
      { step: "subscribed" | "update" }
    >(apigw, {
      getConnectionId: (target) => target.id,
      onGone: async (target) => {
        gone.push(target.id);
      },
    });

    await publisher.send({ id: "first" }, { data: { step: "subscribed" } });

    const result = await publisher.broadcast({
      targets: [{ id: "second" }, { id: "stale" }],
      data: { step: "update" },
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toEqual([]);
    expect(result.stale).toEqual([
      {
        connectionId: "stale",
        target: { id: "stale" },
      },
    ]);
    expect(gone).toEqual(["stale"]);
    expect(sent).toEqual([
      { connectionId: "first", data: '{"step":"subscribed"}' },
      { connectionId: "second", data: '{"step":"update"}' },
    ]);
  });
});
