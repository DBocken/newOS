import { useCallback, useState } from "react";
import { fetch as expoFetch } from "expo/fetch";
import type { Character } from "./characters";
import type { ChatMessage } from "./types";

// Points the client at the API route. In Expo dev, same origin works via a
// relative path; expo/fetch resolves it against the dev server.
const CHAT_ENDPOINT = "/api/chat";

export function useChat(character: Character) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: character.greeting },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const userMsg: ChatMessage = { role: "user", content: trimmed };
      // History sent to the model (exclude the local greeting bubble is fine
      // to keep; the model just sees it as its own prior turn).
      const history = [...messages, userMsg];

      // Optimistically add the user message plus an empty assistant bubble
      // that we'll fill token by token.
      setMessages([...history, { role: "assistant", content: "" }]);
      setIsStreaming(true);

      try {
        const res = await expoFetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: character.systemPrompt,
            messages: history,
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
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: acc };
            return next;
          });
        }
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong.");
        // Drop the empty assistant bubble on failure.
        setMessages((prev) => {
          const next = [...prev];
          if (next[next.length - 1]?.content === "") next.pop();
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [character, messages, isStreaming]
  );

  return { messages, send, isStreaming, error };
}
