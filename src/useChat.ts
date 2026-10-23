import { useCallback, useState } from "react";
import { fetch as expoFetch } from "expo/fetch";
import type { Character } from "./characters";
import { useStore } from "./store";
import type { ChatMessage } from "./types";

// Points the client at the API route. In Expo dev, same origin works via a
// relative path; expo/fetch resolves it against the dev server.
const CHAT_ENDPOINT = "/api/chat";

// Keep the context bounded so long chats don't blow up cost/latency.
// Always keep the greeting + a trailing window of turns.
const MAX_TURNS = 24;

function trimForModel(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_TURNS) return messages;
  const head = messages.slice(0, 1); // greeting
  const tail = messages.slice(-(MAX_TURNS - 1));
  return [...head, ...tail];
}

export function useChat(conversationId: string, character: Character) {
  const getConversation = useStore((s) => s.getConversation);
  const setStoreMessages = useStore((s) => s.setMessages);
  const model = useStore((s) => s.settings.model);
  const temperature = useStore((s) => s.settings.temperature);
  const memory = useStore((s) => s.memories[character.id] ?? "");

  const messages = getConversation(conversationId)?.messages ?? [];
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stream = useCallback(
    async (history: ChatMessage[]) => {
      setError(null);
      setStoreMessages(conversationId, [
        ...history,
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      try {
        const res = await expoFetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: memory
              ? `${character.systemPrompt}\n\nThings to remember about the user:\n${memory}`
              : character.systemPrompt,
            messages: trimForModel(history),
            model,
            temperature,
          }),
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
          setStoreMessages(conversationId, [
            ...history,
            { role: "assistant", content: acc },
          ]);
        }
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong.");
        setStoreMessages(conversationId, history); // drop empty bubble
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId, character, model, temperature, memory, setStoreMessages]
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      const current = getConversation(conversationId)?.messages ?? [];
      await stream([...current, { role: "user", content: trimmed }]);
    },
    [conversationId, getConversation, isStreaming, stream]
  );

  // Re-run the model from the last user message, discarding the last reply.
  const regenerate = useCallback(async () => {
    if (isStreaming) return;
    const current = getConversation(conversationId)?.messages ?? [];
    let cut = [...current];
    while (cut.length && cut[cut.length - 1].role === "assistant") cut.pop();
    if (!cut.length) return;
    await stream(cut);
  }, [conversationId, getConversation, isStreaming, stream]);

  return { messages, send, regenerate, isStreaming, error };
}
