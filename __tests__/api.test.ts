import { apiUrl, joinApiUrl } from "../src/api";

describe("joinApiUrl", () => {
  it("joins a base URL and path", () => {
    expect(joinApiUrl("https://example.com", "/api/chat")).toBe(
      "https://example.com/api/chat"
    );
  });

  it("drops trailing slashes from the base", () => {
    expect(joinApiUrl("https://example.com//", "/api/chat")).toBe(
      "https://example.com/api/chat"
    );
  });

  it("keeps the path relative when there is no base", () => {
    expect(joinApiUrl("", "/api/chat")).toBe("/api/chat");
  });
});

describe("apiUrl", () => {
  it("fails with a clear message on native when no server is configured", () => {
    expect(() => apiUrl("/api/chat")).toThrow("No server configured");
  });
});
