import { md5 } from "@noble/hashes/legacy.js";
import { utf8Encode } from "../crypto/encoding";
import {
  axFingerprint,
  buildFingerprintPlain,
  type CryptoSecrets,
  type DeviceInfo,
} from "../crypto/crypto-helper";
import { USER_AX_FP } from "../storage/keys";
import type { StorageBackend } from "../storage/types";

export interface FingerprintPair {
  deviceId: string;
  fingerprint: string;
}

const DEFAULT_DEVICE: DeviceInfo = {
  manufacturer: "samsung",
  model: "SM-N935F",
  lang: "en",
  resolution: "720x1540",
  tzShort: "GMT07:00",
  ip: "192.169.69.69",
  fontScale: 1.0,
  androidRelease: "13",
  msisdn: "6281398370564",
};

export function axDeviceId(fingerprint: string): string {
  const digest = md5(utf8Encode(fingerprint));
  return Array.from(digest as Uint8Array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function loadAxFingerprint(
  storage: StorageBackend,
  username: string,
  secrets: CryptoSecrets,
  override?: string,
): Promise<string> {
  if (override?.trim()) return override.trim();
  const existing = await storage.getBlob(username, USER_AX_FP);
  if (existing && typeof existing === "string" && existing.trim()) return existing.trim();

  const fp = await axFingerprint(secrets, DEFAULT_DEVICE);
  await storage.putBlob(username, USER_AX_FP, fp);
  return fp;
}

export async function resolveFingerprint(
  storage: StorageBackend,
  username: string,
  secrets: CryptoSecrets,
  override?: string,
): Promise<FingerprintPair> {
  const fingerprint = await loadAxFingerprint(storage, username, secrets, override);
  return { deviceId: axDeviceId(fingerprint), fingerprint };
}

export { buildFingerprintPlain, DEFAULT_DEVICE };