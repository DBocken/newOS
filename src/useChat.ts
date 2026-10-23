import { useCallback, useState } from "react";
import { fetch as expoFetch } from "expo/fetch";
import type { Character } from "./characters";
import { useStore } from "./store";
import { buildSystemPrompt } from "./prompt";
import { trimForModel } from "./context";

export { buildSystemPrompt };
import type { ChatMessage } from "./types";

// Points the client at the API route. In Expo dev, same origin works via a
// relative path; expo/fetch resolves it against the dev server.
const CHAT_ENDPOINT = "/api/chat";

export function useChat(conversationId: string, character: Character) {
  const getConversation = useStore((s) => s.getConversation);
  const setStoreMessages = useStore((s) => s.setMessages);
  const model = useStore((s) => s.settings.model);
  const temperature = useStore((s) => s.settings.temperature);
  const memory = useStore((s) => s.memories[character.id] ?? "");
  const persona = useStore((s) =>
    s.personas.find((p) => p.id === s.activePersonaId)
  );

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
            systemPrompt: buildSystemPrompt(
              character.systemPrompt,
              memory,
              persona
            ),
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
    [conversationId, character, model, temperature, memory, persona, setStoreMessages]
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

  // Regenerate the last reply but KEEP the previous one as an alternative the
  // user can swipe back to (Character.AI-style). Streams the new variant into
  // the last bubble, then folds both into its `alternatives` list.
  const regenerate = useCallback(async () => {
    if (isStreaming) return;
    const current = getConversation(conversationId)?.messages ?? [];
    if (!current.length || current[current.length - 1].role !== "assistant")
      return;
    const lastIdx = current.length - 1;
    const prev = current[lastIdx];
    const prevAlts =
      prev.alternatives && prev.alternatives.length
        ? prev.alternatives
        : [prev.content];
    const history = current.slice(0, lastIdx);

    setError(null);
    setIsStreaming(true);
    const writeLast = (patch: Partial<ChatMessage>) => {
      const msgs = getConversation(conversationId)?.messages ?? current;
      const next = [...msgs];
      next[lastIdx] = { ...next[lastIdx], ...patch };
      setStoreMessages(conversationId, next);
    };

    try {
      const res = await expoFetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(character.systemPrompt, memory, persona),
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
        writeLast({ content: acc });
      }
      const alternatives = [...prevAlts, acc];
      writeLast({ content: acc, alternatives, altIndex: alternatives.length - 1 });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
      writeLast({ content: prevAlts[prevAlts.length - 1] });
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId, getConversation, isStreaming, character, memory, persona, model, temperature, setStoreMessages]);

  // Switch which stored alternative is shown for a message.
  const cycleAlt = useCallback(
    (index: number, dir: 1 | -1) => {
      const msgs = getConversation(conversationId)?.messages ?? [];
      const m = msgs[index];
      if (!m?.alternatives?.length) return;
      const n = m.alternatives.length;
      const cur = m.altIndex ?? n - 1;
      const nextIdx = (cur + dir + n) % n;
      const next = [...msgs];
      next[index] = {
        ...m,
        altIndex: nextIdx,
        content: m.alternatives[nextIdx],
      };
      setStoreMessages(conversationId, next);
    },
    [conversationId, getConversation, setStoreMessages]
  );

  return { messages, send, regenerate, cycleAlt, isStreaming, error };
}
