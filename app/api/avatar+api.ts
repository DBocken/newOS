// Server-side avatar generation. The client sends a short prompt; we ask
// OpenAI's image API for a square portrait and return it as a data URI so the
// client can store/display it without any extra hosting. Key stays on server.

import {
  fail,
  guarded,
  isFlagged,
  rateLimit,
  readJson,
  requireAccess,
  requireOpenAIKey,
} from "../../src/server/security";

const IMAGE_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

export const POST = guarded(async (request) => {
  const caller = requireAccess(request);
  rateLimit(`avatar:${caller}`, 10, 60 * 60_000); // images are the costly call
  const apiKey = requireOpenAIKey();

  const body = await readJson(request, 4_000);
  const prompt = typeof body?.prompt === "string" ? body.prompt.slice(0, 400) : "";
  if (!prompt.trim()) return fail(400, "Prompt is required.");
  if (await isFlagged(prompt, apiKey)) {
    return fail(422, "That description didn't pass the safety check.");
  }

  let res: Response;
  try {
    res = await fetch(IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: `Portrait avatar, friendly, centered, simple background. ${prompt}`,
        size: "1024x1024",
        n: 1,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    return fail(502, "The image service can't be reached right now.");
  }

  if (!res.ok) {
    console.error("OpenAI image error:", res.status);
    return fail(502, "The image service couldn't create that avatar.");
  }

  const json = await res.json();
  const b64: string | undefined = json?.data?.[0]?.b64_json;
  if (!b64) return fail(502, "No image was returned.");
  return Response.json({ dataUri: `data:image/png;base64,${b64}` });
});
