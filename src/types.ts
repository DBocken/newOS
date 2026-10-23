export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
  name?: string; // speaker label in group chats
};
