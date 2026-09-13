import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwordAuth";

describe("password auth", () => {
  it("hashes passwords and verifies the correct credential", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^scrypt:[^:]+:[a-f0-9]+$/);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
});
