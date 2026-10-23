import { buildSystemPrompt } from "../src/prompt";

describe("buildSystemPrompt", () => {
  it("returns the base prompt unchanged with no memory or persona", () => {
    expect(buildSystemPrompt("You are Luna.", "")).toBe("You are Luna.");
  });

  it("appends the active persona", () => {
    const out = buildSystemPrompt("You are Luna.", "", {
      id: "p1",
      name: "Alex",
      description: "Likes hiking.",
    });
    expect(out).toContain("You are Luna.");
    expect(out).toContain("You are talking to Alex. Likes hiking.");
  });

  it("appends memory", () => {
    const out = buildSystemPrompt("You are Luna.", "User's cat is named Pixel.");
    expect(out).toContain("Things to remember about the user:");
    expect(out).toContain("Pixel");
  });

  it("includes both persona and memory when present", () => {
    const out = buildSystemPrompt("Base.", "Mem.", {
      id: "p1",
      name: "Alex",
      description: "Bio.",
    });
    expect(out).toContain("talking to Alex");
    expect(out).toContain("Things to remember");
  });
});
