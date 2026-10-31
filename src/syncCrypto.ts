// End-to-end encryption for sync. A random 256-bit key stays on the user's
// devices; the server only sees an id derived from it, plus ciphertext. The key
// is random rather than a passphrase, so it can't be guessed offline.

import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import type { SyncBlob } from "./store";

const NONCE_BYTES = 24;
const KEY_PATTERN = /^[0-9a-f]{64}$/;

// Accepts a pasted key with spaces, dashes or capitals. Returns null if invalid.
export function normalizeSyncKey(input: string): string | null {
  const key = input.toLowerCase().replace(/[\s-]/g, "");
  return KEY_PATTERN.test(key) ? key : null;
}

export function deriveSyncKeys(keyHex: string) {
  const key = hexToBytes(keyHex);
  return {
    id: bytesToHex(hkdf(sha256, key, undefined, "newos-sync-id-v1", 32)),
    encryptionKey: hkdf(sha256, key, undefined, "newos-sync-enc-v1", 32),
  };
}

export function encryptBlob(
  blob: SyncBlob,
  encryptionKey: Uint8Array,
  nonce: Uint8Array
): string {
  const plaintext = new TextEncoder().encode(JSON.stringify(blob));
  const sealed = xchacha20poly1305(encryptionKey, nonce).encrypt(plaintext);
  return bytesToHex(nonce) + bytesToHex(sealed);
}

// Throws if the data was tampered with or the key is wrong.
export function decryptBlob(
  ciphertextHex: string,
  encryptionKey: Uint8Array
): SyncBlob {
  const data = hexToBytes(ciphertextHex);
  const nonce = data.slice(0, NONCE_BYTES);
  const sealed = data.slice(NONCE_BYTES);
  const plaintext = xchacha20poly1305(encryptionKey, nonce).decrypt(sealed);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export { NONCE_BYTES };
