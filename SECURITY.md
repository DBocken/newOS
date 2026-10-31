# Security

This app handles intimate conversations and spends money on a paid API, so the
server refuses work by default. It is built for a small, private group of
people with access codes. It is not ready for a public store release; see
[Open before a public release](#open-before-a-public-release).

## How it is protected

| Area | Protection |
|------|------------|
| API access | Every route needs an access code from `API_ACCESS_CODES`, compared in constant time. With no codes set, the server refuses all requests. |
| API costs | Per-code rate limits, a body size limit on every route, capped reply length, an allow-list of models. |
| OpenAI key | Server only. Upstream errors stay in the server log. |
| Moderation | Screens the system prompt and latest message, avatar prompts and published characters. If moderation is down, the request is refused. |
| Prompt integrity | The server rebuilds each conversation from known fields, so clients can't inject `system` turns. |
| Sync | End-to-end encrypted with XChaCha20-Poly1305. A random 256-bit key stays on the devices. The server stores ciphertext under a derived id and can't read it. |
| Gallery | The server assigns ids, validates every field, and rejects mature characters. Avatars must be inline images. |
| Remote content | Chat bubbles render inline images only, so a shared character can't leak data through an image URL. |
| On the device | Access code and sync key are in the OS keystore. Android cloud backup is off, and unused permissions are removed. |
| Transport | Native builds refuse a server address that isn't `https`. |

## Server setup

Set these on the server, never in the app:

- `OPENAI_API_KEY`
- `API_ACCESS_CODES`: comma-separated, one per person, at least 24 random
  characters. Generate each one separately so a single person can be removed.
- `DATA_DIR`: a private, persistent folder. Sync and the gallery stay off without
  it, and there is no fallback to the system temp folder.

Then do these in the OpenAI dashboard and on the host:

1. Set a hard monthly spending limit in OpenAI. The rate limits here are counted
   per server process, so this is the real ceiling on costs.
2. Serve the app over HTTPS only.
3. Run one Node process with a persistent disk. Serverless hosts lose both the
   files and the rate-limit counters.

## Known limits

- **Sync key loss:** there is no recovery. Without the key, synced data is gone.
- **Sync metadata:** the server can see the size and timing of uploads.
- **Chats on the device:** stored in the app's private storage, not separately
  encrypted. Someone with a rooted or unlocked device can read them.
- **Chats and OpenAI:** message text is sent to OpenAI to generate replies.
- **Streaming replies:** model output is not moderated, only the input.
- **Group chats:** each reply is checked, but only against the latest human
  message and that character's prompt.
- **Access codes:** anyone holding a code has full API access until it is removed
  from `API_ACCESS_CODES`.
- **Dependencies:** `npm audit` still reports findings, including high and
  critical ones. All of them come from build tooling that isn't in the app
  bundle, and the moderate entries on Expo packages are inherited from that
  tooling. Clearing them needs an Expo SDK upgrade. Build machines and CI still
  run this tooling, so it matters for them.

## Open before a public release

- **Real accounts** with per-user limits, instead of shared access codes.
- **Age verification.** "Show mature characters" is only a display filter and
  doesn't verify anyone's age.
- **Reporting and takedown** for gallery content. App stores require both for
  user-generated content.
- **Privacy policy and data deletion**, including GDPR terms for sending chat
  content to OpenAI.
- **Real billing.** The paywall is a local demo that unlocks nothing and proves
  no purchase.
- **A persistent rate limiter**, such as Redis, if running more than one server.
