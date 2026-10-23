import { fetch as expoFetch } from "expo/fetch";
import { useEffect, useRef } from "react";
import { useStore } from "./store";

// When the user is "signed in" (an account passphrase is set), their data
// syncs automatically: pulled once on launch, and pushed (debounced) whenever
// characters / conversations / memories change. The passphrase doubles as the
// sync key against /api/sync.
export function useAutoSync() {
  const hydrated = useStore((s) => s.hydrated);
  const accountKey = useStore((s) => s.accountKey);
  const userCharacters = useStore((s) => s.userCharacters);
  const conversations = useStore((s) => s.conversations);
  const favorites = useStore((s) => s.favorites);
  const memories = useStore((s) => s.memories);

  const pulledFor = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull once per sign-in.
  useEffect(() => {
    if (!hydrated || !accountKey || pulledFor.current === accountKey) return;
    pulledFor.current = accountKey;
    (async () => {
      try {
        const res = await expoFetch(
          `/api/sync?code=${encodeURIComponent(accountKey)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json?.blob) useStore.getState().importBlob(json.blob);
      } catch {
        /* offline — keep local data */
      }
    })();
  }, [hydrated, accountKey]);

  // Debounced push on change.
  useEffect(() => {
    if (!hydrated || !accountKey) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await expoFetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: accountKey,
            blob: useStore.getState().exportBlob(),
          }),
        });
      } catch {
        /* offline — will push on next change */
      }
    }, 1500);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [hydrated, accountKey, userCharacters, conversations, favorites, memories]);
}
