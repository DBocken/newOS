import * as Speech from "expo-speech";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { useStore } from "../../src/store";
import { useChat } from "../../src/useChat";
import { useVoiceInput } from "../../src/useVoiceInput";

type CallState = "off" | "listening" | "thinking" | "speaking";

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const convo = useStore((s) => s.conversations[id]);
  const getCharacter = useStore((s) => s.getCharacter);
  const character = convo ? getCharacter(convo.characterId) : undefined;

  if (!convo || !character) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Conversation not found.</Text>
      </View>
    );
  }

  const { messages, send, isStreaming } = useChat(id, character);
  const [state, setState] = useState<CallState>("off");
  const voice = useVoiceInput((text) => {
    if (text.trim()) send(text);
  });
  const lastSpokenRef = useRef<string>("");

  // Drive the loop off the streaming flag and message list.
  const last = messages[messages.length - 1];

  useEffect(() => {
    if (state === "off") {
      Speech.stop();
      voice.listening && voice.toggle();
      return;
    }
    if (isStreaming) {
      setState("thinking");
      return;
    }
    // Finished thinking: speak the new assistant reply once.
    if (
      last?.role === "assistant" &&
      last.content &&
      last.content !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = last.content;
      setState("speaking");
      Speech.stop();
      Speech.speak(last.content, {
        onDone: () => setState((s) => (s === "off" ? "off" : "listening")),
        onStopped: () => {},
      });
    }
  }, [isStreaming, last?.content, state]);

  // When we enter "listening", start the mic (web). On native STT is
  // unsupported, so the call falls back to tap-to-talk via the chat screen.
  useEffect(() => {
    if (state === "listening" && voice.supported && !voice.listening) {
      voice.toggle();
    }
  }, [state]);

  const start = () => {
    if (!voice.supported) return;
    lastSpokenRef.current = last?.content ?? "";
    setState("listening");
  };
  const hangUp = () => setState("off");

  const label =
    state === "off"
      ? "Tap to start the call"
      : state === "listening"
      ? "Listening…"
      : state === "thinking"
      ? "Thinking…"
      : "Speaking…";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Call · ${character.name}` }} />
      <View style={styles.top}>
        <View style={[styles.ring, state !== "off" && styles.ringActive]}>
          <Avatar character={character} size={140} />
        </View>
        <Text style={styles.name}>{character.name}</Text>
        <Text style={styles.state}>{label}</Text>
        {!voice.supported ? (
          <Text style={styles.warn}>
            Live calls need speech recognition (available in the web build).
            On this platform, use tap-to-talk in the chat screen.
          </Text>
        ) : null}
      </View>

      <View style={styles.controls}>
        {state === "off" ? (
          <Pressable
            style={[styles.btn, styles.callBtn, !voice.supported && styles.disabled]}
            onPress={start}
            disabled={!voice.supported}
          >
            <Text style={styles.btnText}>Start</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.hangBtn]} onPress={hangUp}>
            <Text style={styles.btnText}>End call</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#9a9aa8" },
  top: { alignItems: "center", marginTop: 48 },
  ring: {
    padding: 8,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "transparent",
  },
  ringActive: { borderColor: "#6d4aff" },
  name: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 20 },
  state: { color: "#9a9aa8", fontSize: 16, marginTop: 8 },
  warn: {
    color: "#ffb86b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 19,
  },
  controls: { alignItems: "center", marginBottom: 24 },
  btn: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 40,
    alignItems: "center",
  },
  callBtn: { backgroundColor: "#2ecc71" },
  hangBtn: { backgroundColor: "#ff4d6d" },
  disabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
