import { Platform } from "react-native";

// Base URL of the deployed API routes, baked in at build time. On web the app
// and API share an origin, but an installed app has no origin of its own, so
// native builds must set EXPO_PUBLIC_API_URL or every API call fails.
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

export function joinApiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

export function apiUrl(path: string): string {
  if (!API_BASE && Platform.OS !== "web") {
    throw new Error(
      "No server configured. Build the app with EXPO_PUBLIC_API_URL set."
    );
  }
  return joinApiUrl(API_BASE, path);
}
