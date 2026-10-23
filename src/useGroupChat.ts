import { useCallback, useState } from "react";
import { fetch as expoFetch } from "expo/fetch";
import type { Character } from "./characters";
import { useStore } from "./store";
import type { ChatMessage } from "./types";

const CHAT_ENDPOINT = "/api/chat";

// Read the whole plain-text stream from /api/chat into one string.
async function complete(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  temperature: number
): Promise<string> {
  const res = await expoFetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, messages, model, temperature }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
  }
  return acc.trim();
}

// Map the shared transcript into a single member's point of view: their own
// lines become assistant turns, everyone else (human + other characters)
// becomes user turns tagged with the speaker.
function viewFor(member: Character, transcript: ChatMessage[]): ChatMessage[] {
  return transcript
    .filter((m) => m.name !== "Room")
    .map((m) => {
      if (m.role === "user") return { role: "user" as const, content: m.content };
      if (m.name === member.name)
        return { role: "assistant" as const, content: m.content };
      return { role: "user" as const, content: `${m.name}: ${m.content}` };
    });
}

export function useGroupChat(conversationId: string, members: Character[]) {
  const getConversation = useStore((s) => s.getConversation);
  const setStoreMessages = useStore((s) => s.setMessages);
  const model = useStore((s) => s.settings.model);
  const temperature = useStore((s) => s.settings.temperature);

  const messages = getConversation(conversationId)?.messages ?? [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setError(null);
      setBusy(true);

      const names = members.map((m) => m.name).join(", ");
      let transcript: ChatMessage[] = [
        ...(getConversation(conversationId)?.messages ?? []),
        { role: "user", content: trimmed },
      ];
      setStoreMessages(conversationId, transcript);

      try {
        // Each member replies once, in order, seeing what came before.
        for (const member of members) {
          const system =
            `${member.systemPrompt}\n\nYou are in a group chat with ${names} ` +
            `and a human. Reply only as ${member.name}, in one short turn. ` +
            `Do not speak for anyone else and do not prefix your name.`;
          const reply = await complete(
            system,
            viewFor(member, transcript),
            model,
            temperature
          );
          transcript = [
            ...transcript,
            { role: "assistant", content: reply, name: member.name },
          ];
          setStoreMessages(conversationId, transcript);
        }
      } catch (e: any) {
        setError(e?.message ?? "Group reply failed.");
      } finally {
        setBusy(false);
      }
    },
    [conversationId, members, busy, model, temperature, getConversation, setStoreMessages]
  );

  return { messages, send, busy, error };
}
