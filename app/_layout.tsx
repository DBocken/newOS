import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0b0b0f" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#0b0b0f" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Characters" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
