// Expo Router API route — runs on the server, NOT in the app bundle.
// This is where the OpenAI key lives, so it never ships to the device.
// The client POSTs { systemPrompt, messages } and gets back a plain-text stream.

import {
  fail,
  guarded,
  isFlagged,
  rateLimit,
  readJson,
  requireAccess,
  requireOpenAIKey,
  sanitizeChat,
} from "../../src/server/security";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_BODY_BYTES = 256_000;
const MAX_REPLY_TOKENS = 1_024;

// Allow-list of models the client may request, so a tampered request can't
// pick an arbitrary (or expensive) model.
const ALLOWED_MODELS = new Set([
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
]);

export const POST = guarded(async (request) => {
  const caller = requireAccess(request);
  rateLimit(`chat:${caller}`, 30, 60_000);

  const body = await readJson(request, MAX_BODY_BYTES);
  const { systemPrompt, messages } = sanitizeChat(body);
  const apiKey = requireOpenAIKey();

  const model =
    typeof body.model === "string" && ALLOWED_MODELS.has(body.model)
      ? body.model
      : DEFAULT_MODEL;
  const temperature =
    typeof body.temperature === "number"
      ? Math.max(0, Math.min(2, body.temperature))
      : 0.8;

  // The system prompt is user-editable, so it is screened along with the
  // latest message.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (await isFlagged(`${systemPrompt}\n\n${lastUser?.content ?? ""}`, apiKey)) {
    return new Response(
      "I can't help with that. Let's keep things respectful — try a different message.",
      {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: true,
        max_completion_tokens: MAX_REPLY_TOKENS,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return fail(502, "The AI service can't be reached right now.");
  }

  if (!upstream.ok || !upstream.body) {
    // Upstream errors can name account details, so they stay in the server log.
    console.error("OpenAI chat error:", upstream.status);
    return fail(502, "The AI service couldn't answer right now.");
  }

  // Parse OpenAI's SSE stream and re-emit only the text deltas as a plain
  // text stream. Keeps the client parsing dead simple.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          controller.close();
          return;
        }
        try {
          const json = JSON.parse(data);
          const delta: string = json.choices?.[0]?.delta?.content ?? "";
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          // ignore keep-alive / partial lines
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});
