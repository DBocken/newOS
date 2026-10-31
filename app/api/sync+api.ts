// Encrypted cross-device sync. The client encrypts its data with a key that
// never leaves the device (see src/syncCrypto.ts); this route only ever stores
// ciphertext under an id derived from that key.

import { promises as fs } from "fs";
import path from "path";
import {
  fail,
  guarded,
  rateLimit,
  readJson,
  requireAccess,
} from "../../src/server/security";
import { dataPath, writeAtomic } from "../../src/server/storage";

const MAX_CIPHERTEXT_CHARS = 16_000_000;
const SYNC_ID = /^[0-9a-f]{64}$/;

// The strict pattern also keeps the id safe to use as a file name.
function fileName(id: unknown): string {
  if (typeof id !== "string" || !SYNC_ID.test(id)) {
    throw fail(400, "Invalid sync id.");
  }
  return `${id}.json`;
}

export const GET = guarded(async (request) => {
  const caller = requireAccess(request);
  rateLimit(`sync:${caller}`, 30, 60_000);

  const file = fileName(request.headers.get("x-sync-id"));
  const dir = await dataPath("sync");
  try {
    const ciphertext = await fs.readFile(path.join(dir, file), "utf8");
    return Response.json(
      { ciphertext },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return fail(404, "Nothing found.");
  }
});

export const POST = guarded(async (request) => {
  const caller = requireAccess(request);
  rateLimit(`sync:${caller}`, 30, 60_000);

  const body = await readJson(request, MAX_CIPHERTEXT_CHARS + 1_000);
  const file = fileName(body?.id);
  if (
    typeof body?.ciphertext !== "string" ||
    !/^[0-9a-f]+$/.test(body.ciphertext)
  ) {
    return fail(400, "Invalid sync data.");
  }

  const dir = await dataPath("sync");
  await writeAtomic(path.join(dir, file), body.ciphertext);
  return Response.json({ ok: true });
});
