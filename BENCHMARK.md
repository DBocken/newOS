# External parity benchmark

This grounds the comparison in **documented features of the leading apps**
(Character.AI, SpicyChat) from third-party reviews, rather than the author's
memory. It is an equal-weighted checklist: every feature counts the same
(1 = present, 🟡 0.5 = partial, 0 = absent), so the number isn't shaped by
chosen weights. The sources below are mostly third-party reviews of varying
age and they sometimes disagree; treat the list as "features these apps are
widely reported to have," not an official spec.

## Sources

Character.AI — group chat, Chat Memories (per-character memory), Character
Voice (TTS) and two-way Character Calls, personas, create/÷browse characters,
c.ai+ subscription, content filters:
- https://www.codaone.ai/blog/character-ai-complete-guide-2026/
- https://arcanumrpgs.com/blog/character-ai-group-chat/
- https://flowith.io/blog/character-ai-faq-memory-content-filters-safety-explained/
- https://tech.yahoo.com/computing/articles/character-ai-just-made-talking-180942071.html
- https://alternativeto.net/news/2023/10/character-ai-introduces-character-group-chat-for-ai-human-simultaneous-conversations

SpicyChat — community character library, custom creation (text or image
upload), memory tied to tiers (4K/16K context), TTS on the top tier,
subscription tiers, bot moderation-before-activation, up to 100 personas:
- https://www.appcritica.com/blog/spicychat-ai-a-genuine-look-at-the-platform/
- https://techshark.io/tools/spicychat-ai/
- https://www.lumichat.ink/blog/character-ai-vs-spicychat
- https://www.aixploria.com/en/spicychat-ai/

## Checklist (this app)

| Feature | Status |
|---------|:------:|
| Text chat with AI characters | ✅ |
| Streaming responses | ✅ |
| Context / memory window | ✅ |
| Persistent cross-chat memory (per character) | ✅ |
| Multiple separate conversations | ✅ |
| Chat with pre-made characters | ✅ |
| Build your own character | ✅ |
| Character appearance via image upload | ✅ |
| AI-generated avatar images | ✅ |
| Shared / community character library | ✅ |
| Discovery: browse / search | ✅ |
| User persona (own identity) | ✅ |
| Multiple personas | ✅ |
| Character voice / TTS | ✅ |
| Two-way voice calls | 🟡 web STT in + native TTS out; native STT pending |
| Voice input / dictation | 🟡 web only |
| Group chat (multiple characters) | ✅ |
| Content moderation / safety | ✅ |
| NSFW / mature toggle | ✅ |
| Moderation before publishing a bot | ✅ |
| Re-engagement notifications | ✅ local |
| Account + automatic cloud sync | ✅ |
| Paid subscription tiers | ⬜ |
| Native mobile app | ✅ |
| Edit a sent message | ✅ |
| Message actions (copy / regenerate) | ✅ |

**26 features · score 24.0 · parity 92.3%**

## What's still missing (the real gap)

- **Paid subscriptions** — needs App Store / Play billing accounts (RevenueCat).
- **Native voice** — two-way calls and dictation work in the web build; the
  native leg needs a speech-recognition module and a custom dev build.

Both require decisions and infrastructure outside a client prototype (store
accounts, a dev build). Everything else the leading apps are reported to offer
is implemented here.

## Reproduce

```python
items = [  # 1 present, 0.5 partial, 0 absent
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.5,0.5,1,1,1,1,1,1,0,1,1,1
]
print(f"{len(items)} features, parity {sum(items)/len(items)*100:.1f}%")  # 92.3%
```

## Honest caveats

- The feature list and the present/partial/absent calls are the author's
  judgement from the cited reviews — not a live, side-by-side test of the apps.
- Independently verified here: `tsc --noEmit` passes and the full Android JS
  bundle exports (≈1.8 MB). The parity % is a structured self-assessment on
  top of that.
- The "weekly reset" deadline in the original goal is not something this
  session can observe, so it is not evidenced either way.
