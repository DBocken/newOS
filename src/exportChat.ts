// Pure, dependency-free helpers for exporting a conversation.
// No React, no React Native, no store imports — just data in, string out.
// Kept side-effect free so it is trivially unit-testable.

export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
  name?: string; // speaker label in group chats
  alternatives?: string[]; // regenerated variants (assistant messages)
  altIndex?: number; // which alternative is shown
};

export type Conversation = {
  id: string;
  characterId: string; // primary character ("" for groups)
  memberIds?: string[]; // set for group conversations
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

/**
 * Resolve the display label for a single message.
 * - "user" messages are always "You".
 * - Group messages carry their speaker in `name`.
 * - Otherwise fall back to the supplied character name.
 * - "system" messages are labelled "System".
 */
function speakerLabel(msg: ChatMessage, characterName: string): string {
  if (msg.role === "user") return "You";
  if (msg.name && msg.name.trim().length > 0) return msg.name.trim();
  if (msg.role === "system") return "System";
  return characterName;
}

/**
 * The visible text of a message, respecting the selected alternative when present.
 */
function messageText(msg: ChatMessage): string {
  if (
    msg.alternatives &&
    msg.alternatives.length > 0 &&
    typeof msg.altIndex === "number" &&
    msg.altIndex >= 0 &&
    msg.altIndex < msg.alternatives.length
  ) {
    return msg.alternatives[msg.altIndex] ?? msg.content;
  }
  return msg.content;
}

/**
 * Render a conversation as a readable Markdown transcript.
 * Produces a title heading followed by one blank-line-separated turn per message,
 * each formatted as "**Speaker:** text".
 */
export function conversationToMarkdown(
  convo: Conversation,
  characterName: string
): string {
  const title = convo.title && convo.title.trim().length > 0 ? convo.title.trim() : "Conversation";
  const lines: string[] = [`# ${title}`, ""];

  for (const msg of convo.messages) {
    const label = speakerLabel(msg, characterName);
    const text = messageText(msg).trim();
    lines.push(`**${label}:** ${text}`);
    lines.push("");
  }

  // Drop the trailing blank line for a clean tail.
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

/**
 * Serialize the conversation to pretty-printed JSON.
 */
export function conversationToJSON(convo: Conversation): string {
  return JSON.stringify(convo, null, 2);
}
