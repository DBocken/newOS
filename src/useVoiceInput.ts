import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

// Lightweight speech-to-text using the Web Speech API. Works in the web
// build today; on native it reports unsupported (a dev build with a native
// speech-recognition module would fill that in — same hook surface).
export function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported =
    Platform.OS === "web" &&
    typeof globalThis !== "undefined" &&
    !!((globalThis as any).SpeechRecognition ||
      (globalThis as any).webkitSpeechRecognition);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor =
      (globalThis as any).SpeechRecognition ||
      (globalThis as any).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      if (text) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, supported, onResult]);

  return { supported, listening, toggle };
}
