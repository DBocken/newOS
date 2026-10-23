import {
  conversationToJSON,
  conversationToMarkdown,
  type Conversation,
} from "../src/exportChat";

const convo: Conversation = {
  id: "c1",
  characterId: "luna",
  title: "Late night",
  createdAt: 1,
  updatedAt: 2,
  messages: [
    { role: "assistant", content: "Hey there." },
    { role: "user", content: "Hi Luna." },
    {
      role: "assistant",
      content: "ignored",
      alternatives: ["first", "second"],
      altIndex: 1,
    },
  ],
};

describe("conversationToMarkdown", () => {
  it("renders a title heading", () => {
    expect(conversationToMarkdown(convo, "Luna")).toContain("# Late night");
  });

  it("labels user turns as You and uses the character name otherwise", () => {
    const md = conversationToMarkdown(convo, "Luna");
    expect(md).toContain("**You:** Hi Luna.");
    expect(md).toContain("**Luna:** Hey there.");
  });

  it("respects the selected alternative", () => {
    const md = conversationToMarkdown(convo, "Luna");
    expect(md).toContain("**Luna:** second");
    expect(md).not.toContain("ignored");
  });
});

describe("conversationToJSON", () => {
  it("round-trips the conversation", () => {
    const parsed = JSON.parse(conversationToJSON(convo));
    expect(parsed.id).toBe("c1");
    expect(parsed.messages).toHaveLength(3);
  });
});
