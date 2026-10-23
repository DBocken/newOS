import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// NOTE: Billing here is a LOCAL DEMO STUB. There is no real App Store /
// Play Store / Stripe billing wired up — calling setTier() simply flips a
// locally persisted flag. Do NOT treat `isActive` as proof of a real
// purchase; swap this out for a true receipt-validated entitlement before
// charging anyone.

export type Tier = "free" | "plus" | "pro";

export type TierInfo = {
  id: Tier;
  name: string;
  price: string; // human-readable price label (e.g. "Free", "$7.99/mo")
  perks: string[];
};

export const TIERS: TierInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    perks: [
      "Chat with built-in characters",
      "Create up to a few of your own characters",
      "Local chat history on this device",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: "$7.99/mo",
    perks: [
      "Everything in Free",
      "Unlimited custom characters",
      "Group chats with multiple characters",
      "Priority replies",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$14.99/mo",
    perks: [
      "Everything in Plus",
      "Long-term memory for every character",
      "Cross-device cloud sync",
      "Early access to new features",
    ],
  },
];

type SubscriptionState = {
  tier: Tier;
  setTier: (t: Tier) => void;
  // Convenience flag: true for any paid tier (plus or pro).
  isActive: boolean;
};

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set) => ({
      tier: "free",
      isActive: false,
      // LOCAL DEMO STUB: no real billing — this just persists the choice.
      setTier: (t) => set({ tier: t, isActive: t === "plus" || t === "pro" }),
    }),
    {
      name: "newos-sub-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ tier: s.tier }),
      // Recompute the derived flag after rehydration so `isActive` always
      // matches the restored tier.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isActive = state.tier === "plus" || state.tier === "pro";
        }
      },
    }
  )
);
