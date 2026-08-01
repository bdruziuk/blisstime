import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";

describe("business import retry", () => {
  it("retries with exponential delays", async () => {
    const operation = vi.fn().mockRejectedValueOnce(new Error("rate limit")).mockRejectedValueOnce(new Error("timeout")).mockResolvedValue("ok");
    const delays: number[] = [];
    await expect(withRetry(operation, { maxAttempts: 3, baseDelayMs: 100, sleep: async (ms) => { delays.push(ms); } })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([100, 200]);
  });

  it("does not retry permanent errors", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("invalid key"));
    await expect(withRetry(operation, { maxAttempts: 3, baseDelayMs: 1, shouldRetry: () => false })).rejects.toThrow("invalid key");
    expect(operation).toHaveBeenCalledOnce();
  });
});
