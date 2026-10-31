import { getPathFromState } from "expo-router/build/fork/getPathFromState";
import { getStateFromPath } from "expo-router/build/fork/getStateFromPath";

// Runs the real expo-router code through the same adapter Metro uses, because a
// missing export here only shows up as a crash at runtime.
describe("expo-router URL parsing", () => {
  const options = { screens: { chat: "chat/:id" } };

  it("parses query params", () => {
    const route = getStateFromPath("/chat/1?a=1&b=hello%20world", options)
      ?.routes[0];
    expect(route?.params).toMatchObject({ a: "1", b: "hello world" });
  });

  it("writes query params", () => {
    const state = {
      routes: [{ name: "chat", params: { id: "1", q: "hello world" } }],
    };
    expect(getPathFromState(state, options)).toContain("q=hello%20world");
  });

  it("handles malformed percent-encoding quickly", () => {
    const payload = "%E0%A4%A".repeat(10_000);
    const start = Date.now();
    getStateFromPath(`/chat/1?a=${payload}`, options);
    expect(Date.now() - start).toBeLessThan(1_000);
  });
});
