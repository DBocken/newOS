import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type SecretName = "accessCode" | "syncKey";

// Native builds keep secrets in the OS keystore. SecureStore doesn't exist on
// web, so the web build falls back to ordinary browser storage.
export async function getSecret(name: SecretName): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(`secret:${name}`);
  return SecureStore.getItemAsync(name);
}

export async function setSecret(name: SecretName, value: string | null) {
  if (Platform.OS === "web") {
    if (value === null) await AsyncStorage.removeItem(`secret:${name}`);
    else await AsyncStorage.setItem(`secret:${name}`, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(name);
  else await SecureStore.setItemAsync(name, value);
}
