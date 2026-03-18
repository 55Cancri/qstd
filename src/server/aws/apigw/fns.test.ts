import { describe, expect, it } from "vitest";
import * as _f from "./fns";

describe("server/aws/apigw fns", () => {
  it("builds management endpoints from request context", () => {
    expect(
      _f.getManagementEndpoint({
        domainName: "abc.execute-api.us-east-1.amazonaws.com",
        stage: "dev",
      })
    ).toBe("https://abc.execute-api.us-east-1.amazonaws.com/dev");
  });

  it("prefers normalized base paths when provided", () => {
    expect(
      _f.getManagementEndpoint({
        basePath: "/v1/",
        domainName: "ws.example.com",
        stage: "prod",
      })
    ).toBe("https://ws.example.com/v1");
  });

  it("detects 410 gone connection errors", () => {
    expect(
      _f.isGoneConnectionError({
        $metadata: { httpStatusCode: 410 },
      })
    ).toBe(true);
    expect(
      _f.isGoneConnectionError({
        $metadata: { httpStatusCode: 500 },
      })
    ).toBe(false);
  });

  it("encodes structured payloads and preserves binary payloads", () => {
    const bytes = new Uint8Array([1, 2, 3]);

    expect(_f.encodeData({ ok: true })).toBe('{"ok":true}');
    expect(_f.encodeData(bytes)).toBe(bytes);
  });
});
