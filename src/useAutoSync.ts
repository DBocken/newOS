import * as Crypto from "expo-crypto";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api";
import { getSecret } from "./secrets";
import { useStore } from "./store";
import {
  decryptBlob,
  deriveSyncKeys,
  encryptBlob,
  NONCE_BYTES,
} from "./syncCrypto";
import { useHydrated } from "./useHydrated";

// While sync is on, data is pulled once on launch and pushed (debounced)
// whenever characters / conversations / memories change. Everything is
// encrypted here, before it leaves the device.
export function useAutoSync() {
  const hydrated = useHydrated();
  const syncEnabled = useStore((s) => s.syncEnabled);
  const userCharacters = useStore((s) => s.userCharacters);
  const conversations = useStore((s) => s.conversations);
  const favorites = useStore((s) => s.favorites);
  const memories = useStore((s) => s.memories);

  // Pushing before the first pull finishes would overwrite newer server data
  // with whatever this device happens to hold.
  const [pulled, setPulled] = useState(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPulled(false);
    if (!hydrated || !syncEnabled) return;
    let cancelled = false;
    (async () => {
      try {
        const key = await getSecret("syncKey");
        if (!key) return;
        const { id, encryptionKey } = deriveSyncKeys(key);
        const res = await apiFetch("/api/sync", {
          headers: { "x-sync-id": id },
        });
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          useStore.getState().importBlob(decryptBlob(json.ciphertext, encryptionKey));
        } else if (res.status !== 404) {
          return; // 404 only means nothing was uploaded yet
        }
        setPulled(true);
      } catch {
        /* offline or wrong key — keep local data and don't push */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, syncEnabled]);

  useEffect(() => {
    if (!pulled || !syncEnabled) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        const key = await getSecret("syncKey");
        if (!key) return;
        const { id, encryptionKey } = deriveSyncKeys(key);
        const nonce = await Crypto.getRandomBytesAsync(NONCE_BYTES);
        await apiFetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            ciphertext: encryptBlob(
              useStore.getState().exportBlob(),
              encryptionKey,
              nonce
            ),
          }),
        });
      } catch {
        /* offline — will push on next change */
      }
    }, 1500);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [pulled, syncEnabled, userCharacters, conversations, favorites, memories]);
}
