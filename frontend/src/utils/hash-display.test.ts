import { describe, expect, it } from "vitest";
import { truncateHash } from "./hash-display";

describe("truncateHash", () => {
  it("truncates long hashes with head and tail segments", () => {
    const hash = "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";

    expect(truncateHash(hash)).toBe("aabbccdd…66778899");
  });

  it("returns short values unchanged", () => {
    expect(truncateHash("short")).toBe("short");
  });
});
