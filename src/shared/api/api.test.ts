import { describe, expect, it } from "vitest";
import * as _f from "./fns";

describe("shared/api prepareUrl", () => {
  it("joins baseUrl + '/path' without double slashes (preserves base path like /v1)", () => {
    expect(
      _f.prepareUrl("/image", { baseUrl: "https://api.example.com/v1" })
    ).toBe("https://api.example.com/v1/image");

    expect(
      _f.prepareUrl("/image", { baseUrl: "https://api.example.com/v1/" })
    ).toBe("https://api.example.com/v1/image");
  });

  it("joins baseUrl + 'path' by inserting a single slash", () => {
    expect(_f.prepareUrl("image", { baseUrl: "https://api.example.com/v1" })).toBe(
      "https://api.example.com/v1/image"
    );
  });

  it("keeps legacy relative behavior when baseUrl is empty", () => {
    expect(_f.prepareUrl("/image", { baseUrl: "" })).toBe("/image");
    expect(_f.prepareUrl("image", { baseUrl: "" })).toBe("image");
  });

  it("does not apply baseUrl to absolute/external URLs", () => {
    expect(
      _f.prepareUrl("https://s3.amazonaws.com/bucket/key", {
        baseUrl: "https://api.example.com/v1/",
      })
    ).toBe("https://s3.amazonaws.com/bucket/key");
  });

  it("appends params with correct encoding (and merges with existing query)", () => {
    expect(
      _f.prepareUrl("/users", {
        baseUrl: "https://api.example.com/v1/",
        params: { q: "a b", limit: 10, empty: null },
      })
    ).toBe("https://api.example.com/v1/users?q=a+b&limit=10");

    expect(
      _f.prepareUrl("/users?existing=1", {
        baseUrl: "https://api.example.com/v1/",
        params: { added: "2" },
      })
    ).toBe("https://api.example.com/v1/users?existing=1&added=2");
  });
});

