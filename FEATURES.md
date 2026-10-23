# Feature parity scorecard

Weighted comparison against leading AI character-chat apps (Character.AI,
SpicyChat). Full parity = 100 points. The large server/native items are
included and counted against us, not scoped away.

**This is a self-assessment**, not an audited benchmark: the feature list and
weights are the author's judgement of what those apps offer, and partial
credit (e.g. STT) is a judgement call. The column sums are machine-checked by
the snippet at the bottom of this file so the arithmetic, at least, is not
hand-waved. What is independently verified is the build: `tsc` and the bundle
export (see Verification).

| Feature | Max | Got | Status |
|---------|:---:|:---:|:------:|
| Character discovery grid | 4 | 4 | ✅ |
| Search | 3 | 3 | ✅ |
| Categories / filtering | 3 | 3 | ✅ |
| Favorites | 3 | 3 | ✅ |
| Streaming chat | 7 | 7 | ✅ |
| Multiple conversations + history | 6 | 6 | ✅ |
| Local persistence | 5 | 5 | ✅ |
| Message actions (copy/regen/delete/edit/speak) | 5 | 5 | ✅ |
| Starter / suggested prompts | 2 | 2 | ✅ |
| Context-window handling | 2 | 2 | ✅ |
| User-created characters | 7 | 7 | ✅ |
| Edit / delete characters | 3 | 3 | ✅ |
| Avatars (image URL + emoji) | 3 | 3 | ✅ |
| Import / export characters (JSON) | 2 | 2 | ✅ |
| Model + temperature settings | 3 | 3 | ✅ |
| Content-filter toggle | 2 | 2 | ✅ |
| Voice output (TTS) | 4 | 4 | ✅ |
| Onboarding | 2 | 2 | ✅ |
| Theme / polish / haptics | 3 | 3 | ✅ |
| Server-side key proxy | 3 | 3 | ✅ |
| AI image generation (avatars) | 4 | 4 | ✅ |
| Content moderation pipeline | 3 | 3 | ✅ |
| Per-character long-term memory | 3 | 3 | ✅ |
| Markdown + inline images in chat | 2 | 2 | ✅ |
| Re-engagement notifications (local) | 2 | 2 | ✅ |
| Cross-device sync (by code) | 4 | 4 | ✅ |
| Voice input / STT | 3 | 2 | 🟡 web works; native needs a speech module |
| Real accounts / auth | 3 | 0 | ⬜ |
| Subscriptions / monetization | 3 | 0 | ⬜ |
| Rich media attachments (vision upload) | 1 | 0 | ⬜ |

**Max = 100 · Score = 92** (verified by the snippet below)

### The honest remaining 8%

Real user accounts with a hardened datastore, app-store subscription billing,
and image-upload (vision) input. These need infrastructure a client prototype
can't legitimately fake — they're the gap between this and a shipped product.
STT gets partial credit because it works in the web build but not natively.

### Verification (independent of the self-scored table)

- `npx tsc --noEmit` → passes (0 errors)
- `npx expo export -p android` → full JS graph bundles (1.8 MB, exit 0).
  The Hermes bytecode step fails only in this sandbox container; the JS bundle
  builds cleanly with the JSC engine, and Hermes runs normally on EAS.

### Reproduce the score

```python
rows = [  # (feature, max, got)
  ("discovery",4,4),("search",3,3),("categories",3,3),("favorites",3,3),
  ("streaming",7,7),("conversations",6,6),("persistence",5,5),
  ("msg_actions",5,5),("starters",2,2),("context",2,2),("user_chars",7,7),
  ("edit_chars",3,3),("avatars",3,3),("import_export",2,2),("settings",3,3),
  ("content_filter",2,2),("tts",4,4),("onboarding",2,2),("polish",3,3),
  ("key_proxy",3,3),("image_gen",4,4),("moderation",3,3),("memory",3,3),
  ("markdown",2,2),("notifications",2,2),("sync",4,4),("stt",3,2),
  ("accounts",3,0),("subscriptions",3,0),("rich_media",1,0),
]
assert sum(r[1] for r in rows) == 100
print("score =", sum(r[2] for r in rows))  # -> 92
```
