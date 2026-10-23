import { useStore, type Conversation } from "../src/store";
import type { Character } from "../src/characters";

const S = () => useStore.getState();

const makeChar = (id: string, name = id): Character => ({
  id,
  name,
  emoji: "🤖",
  tagline: "t",
  greeting: "hi",
  systemPrompt: "You are " + name,
  categories: ["Companion"],
});

// Reset to a clean slate before each test.
beforeEach(() => {
  useStore.setState({
    userCharacters: [],
    conversations: {},
    favorites: [],
    memories: {},
    personas: [],
    activePersonaId: null,
    accountKey: null,
  });
});

describe("characters", () => {
  it("adds then updates a user character by id", () => {
    S().upsertCharacter(makeChar("a", "Ada"));
    expect(S().userCharacters).toHaveLength(1);
    S().upsertCharacter({ ...makeChar("a", "Ada2") });
    expect(S().userCharacters).toHaveLength(1);
    expect(S().getCharacter("a")?.name).toBe("Ada2");
  });

  it("deletes a character along with its conversations and favorite", () => {
    S().upsertCharacter(makeChar("a"));
    S().toggleFavorite("a");
    const convo = S().createConversation("a");
    expect(S().getConversation(convo.id)).toBeTruthy();
    S().deleteCharacter("a");
    expect(S().getCharacter("a")).toBeUndefined();
    expect(S().favorites).not.toContain("a");
    expect(S().getConversation(convo.id)).toBeUndefined();
  });
});

describe("favorites", () => {
  it("toggles on and off", () => {
    S().toggleFavorite("x");
    expect(S().isFavorite("x")).toBe(true);
    S().toggleFavorite("x");
    expect(S().isFavorite("x")).toBe(false);
  });
});

describe("conversations", () => {
  it("seeds a greeting from the character", () => {
    S().upsertCharacter(makeChar("a", "Ada"));
    const c = S().createConversation("a");
    expect(c.messages[0]).toEqual({ role: "assistant", content: "hi" });
  });

  it("derives the title from the first user message", () => {
    S().upsertCharacter(makeChar("a"));
    const c = S().createConversation("a");
    S().setMessages(c.id, [
      ...c.messages,
      { role: "user", content: "Tell me about the stars tonight please" },
    ]);
    expect(S().getConversation(c.id)?.title).toBe(
      "Tell me about the stars tonight please".slice(0, 40)
    );
  });

  it("creates a group with memberIds and a joined-title", () => {
    S().upsertCharacter(makeChar("a", "Ada"));
    S().upsertCharacter(makeChar("b", "Bo"));
    const g = S().createGroup(["a", "b"]);
    expect(g.memberIds).toEqual(["a", "b"]);
    expect(g.title).toContain("Ada");
    expect(g.title).toContain("Bo");
  });
});

describe("memory & personas", () => {
  it("stores and reads per-character memory", () => {
    S().setMemory("a", "likes tea");
    expect(S().getMemory("a")).toBe("likes tea");
  });

  it("tracks the active persona", () => {
    S().upsertPersona({ id: "p1", name: "Alex", description: "d" });
    S().setActivePersona("p1");
    expect(S().activePersona()?.name).toBe("Alex");
    S().deletePersona("p1");
    expect(S().activePersona()).toBeUndefined();
    expect(S().activePersonaId).toBeNull();
  });
});

describe("importBlob", () => {
  it("merges characters, conversations, favorites and memories", () => {
    S().upsertCharacter(makeChar("local"));
    const blob = {
      userCharacters: [makeChar("remote", "Remote")],
      conversations: {
        z: {
          id: "z",
          characterId: "remote",
          title: "T",
          messages: [],
          createdAt: 1,
          updatedAt: 1,
        } as Conversation,
      },
      favorites: ["remote"],
      memories: { remote: "note" },
    };
    S().importBlob(blob);
    expect(S().getCharacter("remote")?.name).toBe("Remote");
    expect(S().getCharacter("local")).toBeTruthy();
    expect(S().getConversation("z")).toBeTruthy();
    expect(S().favorites).toContain("remote");
    expect(S().getMemory("remote")).toBe("note");
  });
});
