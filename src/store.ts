import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CHARACTERS, type Character } from "./characters";
import type { ChatMessage } from "./types";

export type Conversation = {
  id: string;
  characterId: string; // primary character ("" for groups)
  memberIds?: string[]; // set for group conversations
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type Persona = {
  id: string;
  name: string;
  description: string;
};

export type Settings = {
  model: string;
  temperature: number;
  showMature: boolean; // content-filter toggle
  autoSpeak: boolean; // read assistant replies aloud (TTS)
  dailyReminder: boolean; // local re-engagement notification
  onboarded: boolean;
};

type State = {
  userCharacters: Character[];
  conversations: Record<string, Conversation>;
  favorites: string[];
  memories: Record<string, string>; // per-character long-term memory
  personas: Persona[]; // user identities
  activePersonaId: string | null;
  settings: Settings;
  hydrated: boolean;

  // characters
  allCharacters: () => Character[];
  getCharacter: (id: string) => Character | undefined;
  upsertCharacter: (c: Character) => void;
  deleteCharacter: (id: string) => void;

  // favorites
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // memory
  getMemory: (characterId: string) => string;
  setMemory: (characterId: string, memory: string) => void;

  // personas
  upsertPersona: (p: Persona) => void;
  deletePersona: (id: string) => void;
  setActivePersona: (id: string | null) => void;
  activePersona: () => Persona | undefined;

  // conversations
  conversationsFor: (characterId: string) => Conversation[];
  createConversation: (characterId: string) => Conversation;
  createGroup: (memberIds: string[]) => Conversation;
  getConversation: (id: string) => Conversation | undefined;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  renameConversation: (conversationId: string, title: string) => void;
  deleteConversation: (conversationId: string) => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  clearAllData: () => void;

  // sync
  syncCode: string;
  exportBlob: () => SyncBlob;
  importBlob: (blob: SyncBlob) => void;

  // account (passphrase-based auto-sync)
  accountKey: string | null;
  setAccountKey: (key: string | null) => void;
};

export type SyncBlob = {
  userCharacters: Character[];
  conversations: Record<string, Conversation>;
  favorites: string[];
  memories: Record<string, string>;
};

const DEFAULT_SETTINGS: Settings = {
  model: "gpt-4o-mini",
  temperature: 0.8,
  showMature: false,
  autoSpeak: false,
  dailyReminder: false,
  onboarded: false,
};

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      userCharacters: [],
      conversations: {},
      favorites: [],
      memories: {},
      personas: [],
      activePersonaId: null,
      settings: DEFAULT_SETTINGS,
      hydrated: false,

      allCharacters: () => [...get().userCharacters, ...CHARACTERS],

      getCharacter: (id) =>
        get().userCharacters.find((c) => c.id === id) ??
        CHARACTERS.find((c) => c.id === id),

      upsertCharacter: (c) =>
        set((s) => {
          const exists = s.userCharacters.some((x) => x.id === c.id);
          return {
            userCharacters: exists
              ? s.userCharacters.map((x) => (x.id === c.id ? c : x))
              : [{ ...c, builtin: false }, ...s.userCharacters],
          };
        }),

      deleteCharacter: (id) =>
        set((s) => ({
          userCharacters: s.userCharacters.filter((c) => c.id !== id),
          favorites: s.favorites.filter((f) => f !== id),
          conversations: Object.fromEntries(
            Object.entries(s.conversations).filter(
              ([, c]) => c.characterId !== id
            )
          ),
        })),

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [id, ...s.favorites],
        })),

      isFavorite: (id) => get().favorites.includes(id),

      getMemory: (characterId) => get().memories[characterId] ?? "",

      setMemory: (characterId, memory) =>
        set((s) => ({
          memories: { ...s.memories, [characterId]: memory },
        })),

      upsertPersona: (p) =>
        set((s) => ({
          personas: s.personas.some((x) => x.id === p.id)
            ? s.personas.map((x) => (x.id === p.id ? p : x))
            : [...s.personas, p],
        })),

      deletePersona: (id) =>
        set((s) => ({
          personas: s.personas.filter((p) => p.id !== id),
          activePersonaId: s.activePersonaId === id ? null : s.activePersonaId,
        })),

      setActivePersona: (id) => set({ activePersonaId: id }),

      activePersona: () =>
        get().personas.find((p) => p.id === get().activePersonaId),

      conversationsFor: (characterId) =>
        Object.values(get().conversations)
          .filter((c) => c.characterId === characterId)
          .sort((a, b) => b.updatedAt - a.updatedAt),

      createConversation: (characterId) => {
        const char = get().getCharacter(characterId);
        const now = Date.now();
        const convo: Conversation = {
          id: uid(),
          characterId,
          title: "New chat",
          messages: char ? [{ role: "assistant", content: char.greeting }] : [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          conversations: { ...s.conversations, [convo.id]: convo },
        }));
        return convo;
      },

      createGroup: (memberIds) => {
        const names = memberIds
          .map((mid) => get().getCharacter(mid)?.name)
          .filter(Boolean);
        const now = Date.now();
        const convo: Conversation = {
          id: uid(),
          characterId: "",
          memberIds,
          title: names.join(", ") || "Group chat",
          messages: [
            {
              role: "assistant",
              content: `${names.join(", ")} joined the chat.`,
              name: "Room",
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          conversations: { ...s.conversations, [convo.id]: convo },
        }));
        return convo;
      },

      getConversation: (id) => get().conversations[id],

      setMessages: (conversationId, messages) =>
        set((s) => {
          const prev = s.conversations[conversationId];
          if (!prev) return {};
          // Derive a title from the first user message, once.
          const firstUser = messages.find((m) => m.role === "user");
          const title =
            prev.title === "New chat" && firstUser
              ? firstUser.content.slice(0, 40)
              : prev.title;
          return {
            conversations: {
              ...s.conversations,
              [conversationId]: {
                ...prev,
                messages,
                title,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      renameConversation: (conversationId, title) =>
        set((s) => {
          const prev = s.conversations[conversationId];
          if (!prev) return {};
          return {
            conversations: {
              ...s.conversations,
              [conversationId]: { ...prev, title },
            },
          };
        }),

      deleteConversation: (conversationId) =>
        set((s) => {
          const next = { ...s.conversations };
          delete next[conversationId];
          return { conversations: next };
        }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      clearAllData: () =>
        set({
          userCharacters: [],
          conversations: {},
          favorites: [],
          memories: {},
          settings: { ...DEFAULT_SETTINGS, onboarded: true },
        }),

      syncCode:
        (Math.random().toString(36).slice(2, 6) +
          "-" +
          Math.random().toString(36).slice(2, 6)).toUpperCase(),

      exportBlob: () => {
        const s = get();
        return {
          userCharacters: s.userCharacters,
          conversations: s.conversations,
          favorites: s.favorites,
          memories: s.memories,
        };
      },

      accountKey: null,
      setAccountKey: (key) => set({ accountKey: key }),

      importBlob: (blob) =>
        set((s) => ({
          // Merge: incoming characters/conversations win on id collisions.
          userCharacters: [
            ...blob.userCharacters,
            ...s.userCharacters.filter(
              (c) => !blob.userCharacters.some((b) => b.id === c.id)
            ),
          ],
          conversations: { ...s.conversations, ...blob.conversations },
          favorites: Array.from(
            new Set([...blob.favorites, ...s.favorites])
          ),
          memories: { ...s.memories, ...(blob.memories ?? {}) },
        })),
    }),
    {
      name: "newos-chat-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        userCharacters: s.userCharacters,
        conversations: s.conversations,
        favorites: s.favorites,
        memories: s.memories,
        personas: s.personas,
        activePersonaId: s.activePersonaId,
        settings: s.settings,
        syncCode: s.syncCode,
        accountKey: s.accountKey,
      }),
      onRehydrateStorage: () => (state) => {
        state && (state.hydrated = true);
      },
    }
  )
);

export { uid };
