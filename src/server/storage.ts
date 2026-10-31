// File storage for the API routes. Server-only. DATA_DIR must point at a
// private, persistent disk; there is deliberately no fallback to the system
// temp directory, which is often shared and gets wiped.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { fail } from "./security";

export async function dataPath(...parts: string[]): Promise<string> {
  const root = process.env.DATA_DIR;
  if (!root) throw fail(503, "Storage is not set up on the server.");
  const dir = path.join(root, ...parts);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  return dir;
}

// Writes to a temp file and renames it, so a crash or a concurrent request
// can't leave a half-written file behind.
export async function writeAtomic(file: string, data: string) {
  const tmp = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmp, data, { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, file);
}
