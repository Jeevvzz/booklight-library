import { describe, expect, it } from "vitest";
import { encodeOAuthState } from "../shared/const";
import { getSuccessRedirect } from "./_core/oauth";

describe("OAuth callback redirects", () => {
  it("returns the requested same-origin app route", () => {
    const state = encodeOAuthState({
      redirectUri: "https://library.example/api/oauth/callback",
      nonce: "nonce",
      returnTo: "/admin?from=oauth#inventory",
    });

    expect(getSuccessRedirect(state)).toBe("/admin?from=oauth#inventory");
  });

  it("defaults to the authenticated dashboard", () => {
    const state = encodeOAuthState({
      redirectUri: "https://library.example/api/oauth/callback",
      nonce: "nonce",
    });

    expect(getSuccessRedirect(state)).toBe("/dashboard");
  });

  it("rejects cross-origin return paths", () => {
    const state = encodeOAuthState({
      redirectUri: "https://library.example/api/oauth/callback",
      nonce: "nonce",
      returnTo: "https://evil.example/steal",
    });

    expect(() => getSuccessRedirect(state)).toThrow("application origin");
  });
});
