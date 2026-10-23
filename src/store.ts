import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CHARACTERS, type Character } from "./characters";
import type { ChatMessage } from "./types";

export type Conversation = {
  id: string;
  characterId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type Settings = {
  model: string;
  temperature: number;
  showMature: boolean; // content-filter toggle
  autoSpeak: boolean; // read assistant replies aloud (TTS)
  onboarded: boolean;
};

type State = {
  userCharacters: Character[];
  conversations: Record<string, Conversation>;
  favorites: string[];
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

  // conversations
  conversationsFor: (characterId: string) => Conversation[];
  createConversation: (characterId: string) => Conversation;
  getConversation: (id: string) => Conversation | undefined;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  renameConversation: (conversationId: string, title: string) => void;
  deleteConversation: (conversationId: string) => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  clearAllData: () => void;
};

const DEFAULT_SETTINGS: Settings = {
  model: "gpt-4o-mini",
  temperature: 0.8,
  showMature: false,
  autoSpeak: false,
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
          settings: { ...DEFAULT_SETTINGS, onboarded: true },
        }),
    }),
    {
      name: "newos-chat-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        userCharacters: s.userCharacters,
        conversations: s.conversations,
        favorites: s.favorites,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state && (state.hydrated = true);
      },
    }
  )
);

export { uid };
