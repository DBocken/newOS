// Minimal cross-device sync. The client uploads its data blob (characters,
// conversations, favorites) under a sync code and can pull it on another
// device with the same code. Storage here is a JSON file on the server;
// for production this should be a real datastore (the shape stays the same).

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const STORE = path.join(os.tmpdir(), "newos-sync.json");

async function readStore(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8"));
  } catch {
    return {};
  }
}

async function writeStore(data: Record<string, unknown>) {
  await fs.writeFile(STORE, JSON.stringify(data), "utf8");
}

// Never store the raw code; key by a hash so the file isn't a code list.
const keyFor = (code: string) =>
  crypto.createHash("sha256").update(code.trim().toLowerCase()).digest("hex");

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return Response.json({ error: "Missing code." }, { status: 400 });
  const store = await readStore();
  const entry = store[keyFor(code)];
  if (!entry) return Response.json({ error: "Nothing found." }, { status: 404 });
  return Response.json({ blob: entry });
}

export async function POST(request: Request) {
  let body: { code?: string; blob?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.code || body.blob === undefined) {
    return Response.json({ error: "Expected { code, blob }." }, { status: 400 });
  }
  const store = await readStore();
  store[keyFor(body.code)] = body.blob;
  await writeStore(store);
  return Response.json({ ok: true });
}
