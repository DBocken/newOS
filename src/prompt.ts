import type { Persona } from "./store";

// Compose the system prompt from the character persona, any long-term memory,
// and the user's active persona (their own identity). Pure + dependency-free
// so it can be unit-tested without the React/native module graph.
export function buildSystemPrompt(
  base: string,
  memory: string,
  persona?: Persona
): string {
  let prompt = base;
  if (persona) {
    prompt += `\n\nYou are talking to ${persona.name}. ${persona.description}`;
  }
  if (memory) {
    prompt += `\n\nThings to remember about the user:\n${memory}`;
  }
  return prompt;
}
