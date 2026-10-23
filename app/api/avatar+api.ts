// Server-side avatar generation. The client sends a short prompt; we ask
// OpenAI's image API for a square portrait and return it as a data URI so the
// client can store/display it without any extra hosting. Key stays on server.

const IMAGE_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not set." }, { status: 500 });
  }

  let prompt = "";
  try {
    prompt = String((await request.json())?.prompt ?? "").slice(0, 400);
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!prompt.trim()) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  const res = await fetch(IMAGE_URL, {
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
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json(
      { error: `Image API error (${res.status}): ${detail}` },
      { status: 502 }
    );
  }

  const json = await res.json();
  const b64: string | undefined = json?.data?.[0]?.b64_json;
  const url: string | undefined = json?.data?.[0]?.url;
  if (b64) {
    return Response.json({ dataUri: `data:image/png;base64,${b64}` });
  }
  if (url) {
    return Response.json({ dataUri: url });
  }
  return Response.json({ error: "No image returned." }, { status: 502 });
}
