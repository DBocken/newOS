import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../../src/store";
import { useChat } from "../../src/useChat";
import { useVoiceInput } from "../../src/useVoiceInput";
import { Avatar } from "../../src/components/Avatar";
import { MessageContent } from "../../src/components/MessageContent";

export default function ChatScreen() {
  // `id` here is the conversation id.
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const convo = useStore((s) => s.conversations[id]);
  const getCharacter = useStore((s) => s.getCharacter);
  const setStoreMessages = useStore((s) => s.setMessages);
  const autoSpeak = useStore((s) => s.settings.autoSpeak);
  const character = convo ? getCharacter(convo.characterId) : undefined;

  if (!convo || !character) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Conversation not found.</Text>
      </View>
    );
  }

  const { messages, send, regenerate, isStreaming, error } = useChat(
    id,
    character
  );
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList>(null);
  const voice = useVoiceInput((text) => setDraft((d) => (d ? d + " " : "") + text));

  useEffect(() => {
    const t = setTimeout(
      () => listRef.current?.scrollToEnd({ animated: true }),
      50
    );
    return () => clearTimeout(t);
  }, [messages.length]);

  // Read the latest assistant reply aloud once it has finished streaming.
  useEffect(() => {
    if (!autoSpeak || isStreaming) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.content) {
      Speech.stop();
      Speech.speak(last.content);
    }
  }, [isStreaming]);

  const deleteAt = (index: number) =>
    setStoreMessages(
      id,
      messages.filter((_, i) => i !== index)
    );

  // Edit a prior user message: drop it and everything after, then reload the
  // text into the composer so the next send re-runs from that point.
  const editAt = (index: number, content: string) => {
    setStoreMessages(id, messages.slice(0, index));
    setDraft(content);
  };

  const onLongPress = (index: number, content: string, isAssistant: boolean) => {
    Haptics.selectionAsync();
    const options: any[] = [
      { text: "Copy", onPress: () => Clipboard.setStringAsync(content) },
      { text: "Speak", onPress: () => Speech.speak(content) },
    ];
    if (isAssistant && !isStreaming) {
      options.push({ text: "Regenerate", onPress: regenerate });
    }
    if (!isAssistant && !isStreaming) {
      options.push({ text: "Edit", onPress: () => editAt(index, content) });
    }
    if (index > 0) {
      options.push({
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAt(index),
      });
    }
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Message", undefined, options);
  };

  const showStarters =
    messages.length === 1 && !isStreaming && character.starters?.length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 44}
    >
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Avatar character={character} size={28} />
              <Text style={styles.headerName}>{character.name}</Text>
            </View>
          ),
          headerRight: () => (
            <Link href={`/call/${id}`} asChild>
              <Pressable hitSlop={10}>
                <Text style={{ fontSize: 20 }}>📞</Text>
              </Pressable>
            </Link>
          ),
        }}
      />

      <FlatList
        ref={listRef}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => {
          const mine = item.role === "user";
          return (
            <Pressable
              onLongPress={() => onLongPress(index, item.content, !mine)}
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
            >
              {item.content ? (
                <MessageContent content={item.content} />
              ) : (
                <Text style={styles.bubbleText}>{isStreaming ? "…" : ""}</Text>
              )}
            </Pressable>
          );
        }}
      />

      {showStarters ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.starters}
        >
          {character.starters!.map((s) => (
            <Pressable
              key={s}
              style={styles.starterChip}
              onPress={() => send(s)}
            >
              <Text style={styles.starterText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        {voice.supported ? (
          <Pressable
            style={[styles.micBtn, voice.listening && styles.micOn]}
            onPress={voice.toggle}
          >
            <Text style={styles.micText}>{voice.listening ? "●" : "🎤"}</Text>
          </Pressable>
        ) : null}
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${character.name}…`}
          placeholderTextColor="#6b6b78"
          multiline
        />
        <Pressable
          style={[styles.sendBtn, isStreaming && styles.sendBtnDisabled]}
          disabled={isStreaming}
          onPress={() => {
            const t = draft;
            setDraft("");
            send(t);
          }}
        >
          <Text style={styles.sendText}>{isStreaming ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#9a9aa8" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "700" },
  messages: { padding: 12, gap: 8 },
  bubble: { maxWidth: "82%", borderRadius: 16, padding: 12 },
  mine: { alignSelf: "flex-end", backgroundColor: "#6d4aff" },
  theirs: { alignSelf: "flex-start", backgroundColor: "#1d1d26" },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 21 },
  starters: { paddingHorizontal: 10, paddingBottom: 8, gap: 8 },
  starterChip: {
    backgroundColor: "#1d1d26",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2c2c38",
  },
  starterText: { color: "#cfcfe0", fontSize: 13 },
  error: { color: "#ff6b6b", paddingHorizontal: 14, paddingBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#262630",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "#17171f",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: "#6d4aff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontWeight: "700" },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1d1d26",
    alignItems: "center",
    justifyContent: "center",
  },
  micOn: { backgroundColor: "#ff4d6d" },
  micText: { fontSize: 16, color: "#fff" },
});
