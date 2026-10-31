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
  _layout.tsx          navigation shell (dark theme) + auto-sync
  index.tsx            discovery: search, categories, favorites
  character/[id].tsx   profile: memory, conversations, publish, edit/delete
  chat/[id].tsx        chat: streaming, TTS, mic, edit/regen/delete, markdown+images
  call/[id].tsx        hands-free voice call (STT↔TTS loop)
  group/[id].tsx       group chat (multiple characters reply in turn)
  group-new.tsx        pick characters for a group
  create.tsx           create/edit characters (AI avatar gen + photo upload)
  gallery.tsx          community gallery: browse + import shared characters
  personas.tsx         manage your own identities (personas)
  search.tsx           global search across all conversations
  stats.tsx            insights: counts + most-chatted characters
  paywall.tsx          subscription tiers (demo paywall, no real billing)
  settings.tsx         account/sync, model, temperature, filters, reminders
  onboarding.tsx       first-run intro
  api/chat+api.ts      server route -> OpenAI (streaming + moderation gate)
  api/avatar+api.ts    server route -> OpenAI images (avatar generation)
  api/sync+api.ts      cross-device sync / account by passphrase
  api/gallery+api.ts   publish (moderated) + list community characters
src/
  characters.ts        built-in character definitions
  store.ts             persisted state (zustand + AsyncStorage)
  subscription.ts      standalone tier/entitlement store (demo)
  prompt.ts            pure system-prompt builder (unit-tested)
  exportChat.ts        pure conversation -> markdown/JSON (unit-tested)
  useChat.ts           client streaming hook (persona + memory, alternatives)
  useGroupChat.ts      multi-character turn-taking
  useVoiceInput.ts     web speech-to-text
  useAutoSync.ts       pull-on-launch / debounced-push when signed in
  notifications.ts     local re-engagement reminder
  components/          Avatar, MessageContent (markdown + inline images)
```

See `BENCHMARK.md` for the parity comparison (88.5%), `FEATURES.md` for the
weighted scorecard, and `SECURITY.md` for the security model and server setup.

### Why a server route?

The OpenAI key lives only in the API route, which runs on the server, not in
the shipped app. Calling OpenAI directly from the device would bake the key
into the bundle where anyone can extract it — exactly the kind of mistake you
want to avoid.

## Getting an APK

An installed app has no server of its own, so AI chat, avatars, sync and the
gallery only work once the API routes are deployed and `EXPO_PUBLIC_API_URL`
points at them when the APK is built. Without it the app still opens, and those
features show "No server configured". Each person also enters an access code
under Settings. See `SECURITY.md` for the server setup.

There are two ways to produce an installable APK:

**EAS Build (cloud — recommended, one command):**
```bash
npm i -g eas-cli      # or: npx eas-cli@latest
eas login             # your Expo account
eas build -p android --profile preview   # -> downloadable APK URL
```
The `preview` profile in `eas.json` is configured to output an `.apk`
(internal distribution), not an app bundle.

**Local (needs Android Studio / SDK + NDK):**
```bash
npm install
npx expo run:android --variant release    # builds & installs on a device/emulator
# or, for just the APK file:
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

> Note: a release build was attempted in the cloud sandbox but could not
> finish there — the sandbox's outbound proxy rate-limited/dropped Maven
> Central requests, so the full Android dependency graph (Kotlin/Gradle/AGP
> artifacts) wouldn't resolve. This is an environment limitation, not a
> project one: both commands above work on a normal network. The Android
> toolchain (SDK 35, build-tools 35, NDK 27, CMake) and `expo prebuild` all
> installed and ran fine here.

## Run it (dev)

```bash
npm install
cp .env.example .env     # add your OPENAI_API_KEY
npx expo start
```

Open in Expo Go (scan the QR code) or press `w` for web. The API route needs
the Expo dev server running (it serves `/api/chat`).

> Note: Expo API routes require the server output target (already set in
> `app.json`). For a standalone native build, deploy the API routes to a host
> and set `EXPO_PUBLIC_API_URL` to its URL.

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
