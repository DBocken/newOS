// Public character gallery. GET lists shared characters; POST publishes one
// after a moderation check on its text. Storage is a JSON file on the server
// (swap for a real datastore in production — same shape).

import { promises as fs } from "fs";
import os from "os";
import path from "path";

const STORE = path.join(os.tmpdir(), "newos-gallery.json");

type GalleryItem = {
  id: string;
  name: string;
  emoji: string;
  avatarUrl?: string;
  tagline: string;
  greeting: string;
  systemPrompt: string;
  categories: string[];
  publishedAt: number;
};

async function readStore(): Promise<GalleryItem[]> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8"));
  } catch {
    return [];
  }
}

async function writeStore(items: GalleryItem[]) {
  await fs.writeFile(STORE, JSON.stringify(items), "utf8");
}

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
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json?.results?.[0]?.flagged);
  } catch {
    return false;
  }
}

export async function GET() {
  const items = await readStore();
  // Newest first; never return the avatar data URIs in the list to keep it light.
  const list = items
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 100);
  return Response.json({ items: list });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  let c: Partial<GalleryItem>;
  try {
    c = (await request.json())?.character ?? {};
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!c.name || !c.systemPrompt) {
    return Response.json({ error: "Name and personality required." }, { status: 400 });
  }

  // Moderation gate on everything a reader would see.
  if (apiKey) {
    const blob = `${c.name}\n${c.tagline ?? ""}\n${c.greeting ?? ""}\n${c.systemPrompt}`;
    if (await isFlagged(blob, apiKey)) {
      return Response.json(
        { error: "This character didn't pass moderation and wasn't published." },
        { status: 422 }
      );
    }
  }

  const items = await readStore();
  const item: GalleryItem = {
    id: String(c.id ?? Date.now().toString(36)),
    name: c.name,
    emoji: c.emoji ?? "🤖",
    avatarUrl: c.avatarUrl,
    tagline: c.tagline ?? "",
    greeting: c.greeting ?? "Hi!",
    systemPrompt: c.systemPrompt,
    categories: c.categories ?? [],
    publishedAt: Date.now(),
  };
  // Replace any prior publish with the same id.
  await writeStore([item, ...items.filter((x) => x.id !== item.id)]);
  return Response.json({ ok: true });
}
