export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
  name?: string; // speaker label in group chats
  alternatives?: string[]; // regenerated variants (assistant messages)
  altIndex?: number; // which alternative is shown
};
