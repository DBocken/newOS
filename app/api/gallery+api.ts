// Shared character gallery. GET lists shared characters; POST publishes one
// after a moderation check on its text. Each item is its own file, and ids are
// assigned here so a publisher can't overwrite someone else's entry.

import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  fail,
  guarded,
  isFlagged,
  rateLimit,
  readJson,
  requireAccess,
  requireOpenAIKey,
  sanitizeCharacter,
} from "../../src/server/security";
import { dataPath, writeAtomic } from "../../src/server/storage";

const MAX_ITEMS = 1_000;
const LIST_LIMIT = 50;

export const GET = guarded(async (request) => {
  const caller = requireAccess(request);
  rateLimit(`gallery:${caller}`, 60, 60_000);

  const dir = await dataPath("gallery");
  const names = (await fs.readdir(dir))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .reverse() // names start with the publish time, so this is newest first
    .slice(0, LIST_LIMIT);

  const items = await Promise.all(
    names.map(async (name) =>
      JSON.parse(await fs.readFile(path.join(dir, name), "utf8"))
    )
  );
  return Response.json({ items });
});

export const POST = guarded(async (request) => {
  const caller = requireAccess(request);
  rateLimit(`gallery-publish:${caller}`, 10, 60 * 60_000);
  const apiKey = requireOpenAIKey();

  const body = await readJson(request, 300_000);
  const character = sanitizeCharacter(body?.character);

  // Moderation gate on everything a reader would see.
  const visible = [
    character.name,
    character.tagline,
    character.greeting,
    character.systemPrompt,
  ].join("\n");
  if (await isFlagged(visible, apiKey)) {
    return fail(422, "This character didn't pass moderation and wasn't published.");
  }

  const dir = await dataPath("gallery");
  const existing = await fs.readdir(dir);
  if (existing.length >= MAX_ITEMS) return fail(507, "The gallery is full.");

  const now = Date.now();
  const id = `${now.toString(36).padStart(10, "0")}-${crypto.randomUUID()}`;
  await writeAtomic(
    path.join(dir, `${id}.json`),
    JSON.stringify({ ...character, id, publishedAt: now })
  );
  return Response.json({ ok: true });
});
