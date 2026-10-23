# newOS Chat

A minimal AI character-chat app (Expo / React Native) — a clean-room
prototype in the same category as apps like SpicyChat, built from scratch.
No third-party code, assets, or branding are copied; the only thing borrowed
is the general architecture of how such an app is put together.

## How it works

A **character** (`src/characters.ts`) is just a system prompt plus display
metadata. The chat screen sends the character's system prompt and the running
conversation to a **server-side API route** (`app/api/chat+api.ts`), which
calls OpenAI with streaming enabled and pipes the text back token by token.

```
app/
  _layout.tsx          navigation shell (dark theme)
  index.tsx            discovery: search, categories, favorites
  character/[id].tsx   character profile + conversation list
  chat/[id].tsx        chat: streaming, TTS, copy/regen/delete, mic (web STT)
  create.tsx           create / edit characters (+ AI avatar generation)
  settings.tsx         model, temperature, content filter, sync, reminders
  onboarding.tsx       first-run intro
  api/chat+api.ts      server route -> OpenAI (streaming + moderation)
  api/avatar+api.ts    server route -> OpenAI images (avatar generation)
  api/sync+api.ts      cross-device sync by code
src/
  characters.ts        built-in character definitions
  store.ts             persisted state (zustand + AsyncStorage)
  useChat.ts           client streaming hook
  useVoiceInput.ts     web speech-to-text
  notifications.ts     local re-engagement reminder
  components/Avatar.tsx image-or-emoji avatar
```

See `FEATURES.md` for the honest parity scorecard against leading apps.

### Why a server route?

The OpenAI key lives only in the API route, which runs on the server, not in
the shipped app. Calling OpenAI directly from the device would bake the key
into the bundle where anyone can extract it — exactly the kind of mistake you
want to avoid.

## Run it

```bash
npm install
cp .env.example .env     # add your OPENAI_API_KEY
npx expo start
```

Open in Expo Go (scan the QR code) or press `w` for web. The API route needs
the Expo dev server running (it serves `/api/chat`).

> Note: Expo API routes require the server output target (already set in
> `app.json`). For a standalone native build you'd deploy the API route to a
> host (EAS Hosting, Vercel, your own server) and point `CHAT_ENDPOINT` in
> `src/useChat.ts` at its URL.

## Add a character

Append an entry to `CHARACTERS` in `src/characters.ts`:

```ts
{
  id: "nova",
  name: "Nova",
  emoji: "⭐",
  tagline: "…",
  greeting: "…",
  systemPrompt: "You are Nova, …",
}
```

## Roadmap ideas

- Auth (Kinde / Clerk / Supabase) and per-user chat history
- Persist conversations (SQLite / a backend DB)
- User-created characters + a creation form
- Search / discovery once there are many characters
- Subscriptions via RevenueCat
- Real avatar images instead of emoji
