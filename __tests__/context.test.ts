import { groupViewFor, trimForModel, MAX_TURNS } from "../src/context";
import type { ChatMessage } from "../src/types";

const mk = (n: number): ChatMessage[] =>
  Array.from({ length: n }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: `m${i}`,
  }));

describe("trimForModel", () => {
  it("leaves short histories untouched", () => {
    const msgs = mk(5);
    expect(trimForModel(msgs)).toBe(msgs);
  });

  it("keeps the greeting + a trailing window at the cap", () => {
    const msgs = mk(40);
    const out = trimForModel(msgs);
    expect(out).toHaveLength(MAX_TURNS);
    expect(out[0]).toBe(msgs[0]); // greeting preserved
    expect(out[out.length - 1]).toBe(msgs[msgs.length - 1]); // latest preserved
  });

  it("respects a custom cap", () => {
    expect(trimForModel(mk(10), 4)).toHaveLength(4);
  });
});

describe("groupViewFor", () => {
  const transcript: ChatMessage[] = [
    { role: "assistant", content: "x joined", name: "Room" },
    { role: "user", content: "hello all" },
    { role: "assistant", content: "hi!", name: "Luna" },
    { role: "assistant", content: "yo", name: "Rex" },
  ];

  it("drops Room system lines", () => {
    const out = groupViewFor({ name: "Luna" }, transcript);
    expect(out.find((m) => m.content.includes("joined"))).toBeUndefined();
  });

  it("marks the member's own lines as assistant", () => {
    const out = groupViewFor({ name: "Luna" }, transcript);
    const luna = out.find((m) => m.content === "hi!");
    expect(luna?.role).toBe("assistant");
  });

  it("tags other characters' lines with their name as user turns", () => {
    const out = groupViewFor({ name: "Luna" }, transcript);
    const rex = out.find((m) => m.content.startsWith("Rex:"));
    expect(rex?.role).toBe("user");
    expect(rex?.content).toBe("Rex: yo");
  });

  it("keeps the human turn as a plain user message", () => {
    const out = groupViewFor({ name: "Luna" }, transcript);
    expect(out.find((m) => m.content === "hello all")?.role).toBe("user");
  });
});
