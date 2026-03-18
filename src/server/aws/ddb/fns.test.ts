import { describe, expect, it } from "vitest";
import * as _f from "./fns";

describe("server/aws/ddb fns", () => {
  it("detects transaction conflict errors by name", () => {
    expect(
      _f.isTransactionConflictError({
        name: "TransactionConflictException",
      })
    ).toBe(true);
    expect(
      _f.isTransactionConflictError({
        name: "TransactionCanceledException",
      })
    ).toBe(true);
  });

  it("detects transaction conflict errors by message", () => {
    expect(
      _f.isTransactionConflictError(
        new Error(
          "Transaction cancelled, please refer cancellation reasons for specific reasons"
        )
      )
    ).toBe(true);
    expect(_f.isTransactionConflictError(new Error("Conditional check failed"))).toBe(
      false
    );
  });
});
