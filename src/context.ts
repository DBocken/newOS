import type { Character } from "./characters";
import type { ChatMessage } from "./types";

// Keep the context bounded so long chats don't blow up cost/latency.
// Always keep the greeting (first message) + a trailing window of turns.
export const MAX_TURNS = 24;

export function trimForModel(
  messages: ChatMessage[],
  maxTurns: number = MAX_TURNS
): ChatMessage[] {
  if (messages.length <= maxTurns) return messages;
  const head = messages.slice(0, 1); // greeting
  const tail = messages.slice(-(maxTurns - 1));
  return [...head, ...tail];
}

// Map a shared group transcript into a single member's point of view: their
// own lines become assistant turns, everyone else (human + other characters)
// becomes user turns tagged with the speaker. "Room" system lines are dropped.
export function groupViewFor(
  member: Pick<Character, "name">,
  transcript: ChatMessage[]
): ChatMessage[] {
  return transcript
    .filter((m) => m.name !== "Room")
    .map((m) => {
      if (m.role === "user") return { role: "user" as const, content: m.content };
      if (m.name === member.name)
        return { role: "assistant" as const, content: m.content };
      return { role: "user" as const, content: `${m.name}: ${m.content}` };
    });
}
