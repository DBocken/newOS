export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};
