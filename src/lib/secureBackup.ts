import { z } from "zod";
import { backupSchema, type Backup } from "./model";
const envelopeSchema = z.object({
  format: z.literal("self-care-encrypted"),
  version: z.literal(1),
  kdf: z.literal("PBKDF2-SHA256"),
  iterations: z.literal(600000),
  cipher: z.literal("AES-256-GCM"),
  salt: z.string().max(32),
  iv: z.string().max(24),
  data: z.string().max(30 * 1024 * 1024),
});
function encode(bytes: Uint8Array) {
  let value = "";
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
function decode(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function key(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  usage: KeyUsage[],
) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    usage,
  );
}
export async function encryptBackup(backup: Backup, password: string) {
  if (password.length < 12) throw new Error("備份密碼至少 12 個字元");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(password, salt, ["encrypt"]),
    new TextEncoder().encode(JSON.stringify(backupSchema.parse(backup))),
  );
  return {
    format: "self-care-encrypted",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: 600000,
    cipher: "AES-256-GCM",
    salt: encode(salt),
    iv: encode(iv),
    data: encode(new Uint8Array(encrypted)),
  };
}
export async function decryptBackup(
  input: unknown,
  password: string,
): Promise<Backup> {
  const envelope = envelopeSchema.parse(input);
  const salt = decode(envelope.salt),
    iv = decode(envelope.iv);
  if (salt.length !== 16 || iv.length !== 12) throw new Error("備份格式無效");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    await key(password, salt, ["decrypt"]),
    decode(envelope.data),
  );
  return backupSchema.parse(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plain)),
  );
}
