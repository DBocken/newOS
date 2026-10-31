import { useEffect, useState } from "react";
import { useStore } from "./store";

// True once persisted data has loaded from device storage.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useStore.persist.onFinishHydration(() => setHydrated(true));
    // Covers hydration finishing between the first render and this effect.
    setHydrated(useStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
}
