// Expo Router API route — runs on the server, NOT in the app bundle.
// This is where the OpenAI key lives, so it never ships to the device.
// The client POSTs { systemPrompt, messages } and gets back a plain-text stream.

import type { ChatMessage } from "../../src/types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// Allow-list of models the client may request, so a tampered request can't
// point us at an arbitrary string.
const ALLOWED_MODELS = new Set([
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
  "o1-mini",
]);

async function isFlagged(text: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!res.ok) return false; // fail open
    const json = await res.json();
    return Boolean(json?.results?.[0]?.flagged);
  } catch {
    return false; // fail open
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  let body: {
    systemPrompt?: string;
    messages?: ChatMessage[];
    model?: string;
    temperature?: number;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { systemPrompt, messages } = body;
  if (!systemPrompt || !Array.isArray(messages)) {
    return Response.json(
      { error: "Expected { systemPrompt, messages }." },
      { status: 400 }
    );
  }

  const model =
    body.model && ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const temperature =
    typeof body.temperature === "number"
      ? Math.max(0, Math.min(2, body.temperature))
      : 0.8;

  // Safety pipeline: screen the latest user message. Fails open on error so a
  // moderation outage doesn't break chat, but blocks clearly-flagged input.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser) {
    const flagged = await isFlagged(lastUser.content, apiKey);
    if (flagged) {
      return new Response(
        "I can't help with that. Let's keep things respectful — try a different message.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
  }

  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `OpenAI error (${upstream.status}): ${detail}` },
      { status: 502 }
    );
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
      "Cache-Control": "no-cache",
    },
  });
}
