// Shared guards for the API routes. Server-only: import from app/api/* and
// never from client code, because it reads server secrets.

import crypto from "crypto";
import type { ChatMessage } from "../types";

export const MAX_SYSTEM_PROMPT_CHARS = 12_000;
export const MAX_MESSAGE_CHARS = 8_000;
export const MAX_MESSAGES = 40;
export const MAX_AVATAR_CHARS = 200_000;

export const fail = (status: number, error: string) =>
  Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } }
  );

// Wraps a route so guards can `throw fail(...)`, and unexpected errors never
// reach the client with internal details.
export function guarded(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (e) {
      if (e instanceof Response) return e;
      console.error("API error:", e instanceof Error ? e.message : "unknown");
      return fail(500, "Something went wrong on the server.");
    }
  };
}

const digest = (value: string) =>
  crypto.createHash("sha256").update(value).digest();

// Short codes can be guessed, so they are treated as if none were configured.
export function parseAccessCodes(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length >= 24);
}

// Returns a stable bucket id for the caller, used for rate limiting. Fails
// closed: with no codes configured, every request is refused.
export function requireAccess(request: Request): string {
  const codes = parseAccessCodes(process.env.API_ACCESS_CODES);
  if (!codes.length) throw fail(503, "The server has no access codes set up.");

  const header = request.headers.get("authorization") ?? "";
  const presented = digest(header.replace(/^Bearer\s+/i, ""));
  // Compare against every code so timing doesn't reveal which one matched.
  let matched: string | null = null;
  for (const code of codes) {
    if (crypto.timingSafeEqual(presented, digest(code))) matched = code;
  }
  if (!matched) throw fail(401, "Access code is missing or wrong.");
  return digest(matched).toString("hex").slice(0, 16);
}

const windows = new Map<string, { start: number; count: number }>();

// Fixed-window limit per caller. In-memory, so it applies per server process.
export function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
) {
  if (windows.size > 10_000) windows.clear();
  const entry = windows.get(bucket);
  if (!entry || now - entry.start >= windowMs) {
    windows.set(bucket, { start: now, count: 1 });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) throw fail(429, "Too many requests. Try again soon.");
}

// Counts the bytes actually received, because Content-Length can be absent or
// false.
export async function readJson(
  request: Request,
  maxBytes: number
): Promise<any> {
  const tooLarge = () => fail(413, "Request is too large.");
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) {
    throw tooLarge();
  }
  if (!request.body) throw fail(400, "Invalid JSON body.");

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw tooLarge();
    }
    text += decoder.decode(value, { stream: true });
  }

  try {
    return JSON.parse(text);
  } catch {
    throw fail(400, "Invalid JSON body.");
  }
}

export function requireOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw fail(503, "The AI service is not set up on the server.");
  return key;
}

// Fails closed: content is never passed on unchecked during an outage.
export async function isFlagged(text: string, apiKey: string): Promise<boolean> {
  let res: globalThis.Response;
  try {
    res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw fail(503, "The safety check is unavailable. Try again soon.");
  }
  if (!res.ok) throw fail(503, "The safety check is unavailable. Try again soon.");
  const json = await res.json();
  return Boolean(json?.results?.[0]?.flagged);
}

// Rebuilds the conversation from known fields only. Clients can't inject
// "system" turns, and local fields such as `alternatives` never reach OpenAI.
export function sanitizeChat(body: any): {
  systemPrompt: string;
  messages: ChatMessage[];
} {
  const systemPrompt = body?.systemPrompt;
  if (
    typeof systemPrompt !== "string" ||
    !systemPrompt.trim() ||
    systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS ||
    !Array.isArray(body?.messages)
  ) {
    throw fail(400, "Expected a system prompt and a list of messages.");
  }

  const messages: ChatMessage[] = [];
  for (const m of body.messages) {
    if (m?.role !== "user" && m?.role !== "assistant") continue;
    if (typeof m.content !== "string" || !m.content) continue;
    if (m.content.length > MAX_MESSAGE_CHARS) {
      throw fail(413, "A message is too long.");
    }
    messages.push({ role: m.role, content: m.content });
  }
  return { systemPrompt, messages: messages.slice(-MAX_MESSAGES) };
}

const text = (value: unknown, max: number, fallback = "") =>
  typeof value === "string" ? value.trim().slice(0, max) : fallback;

// Inline images only: a remote URL would let a publisher log the IP address of
// everyone who opens the gallery.
export function safeAvatar(value: unknown): string | undefined {
  return typeof value === "string" &&
    value.length <= MAX_AVATAR_CHARS &&
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value)
    ? value
    : undefined;
}

export function sanitizeCharacter(c: any) {
  const name = text(c?.name, 60);
  const systemPrompt = text(c?.systemPrompt, MAX_SYSTEM_PROMPT_CHARS);
  if (!name || !systemPrompt) throw fail(400, "Name and personality are required.");
  if (c?.mature) throw fail(422, "Mature characters can't be published.");

  return {
    name,
    systemPrompt,
    emoji: text(c?.emoji, 16, "🤖") || "🤖",
    avatarUrl: safeAvatar(c?.avatarUrl),
    tagline: text(c?.tagline, 160),
    greeting: text(c?.greeting, 1_000, "Hi!") || "Hi!",
    categories: Array.isArray(c?.categories)
      ? c.categories
          .filter((x: unknown) => typeof x === "string")
          .slice(0, 5)
          .map((x: string) => x.slice(0, 30))
      : [],
  };
}
