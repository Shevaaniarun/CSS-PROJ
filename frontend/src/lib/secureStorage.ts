const STORAGE_KEY = "worker-wallet:v1";
const KEY_KEY = "worker-wallet:key";

function ensureKey(): string {
  const existing = localStorage.getItem(KEY_KEY);
  if (existing) {
    return existing;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const generated = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(KEY_KEY, generated);
  return generated;
}

function xorWithKey(value: string, key: string): string {
  const output = Array.from(value).map((char, index) => {
    const mixed = char.charCodeAt(0) ^ key.charCodeAt(index % key.length);
    return String.fromCharCode(mixed);
  });
  return output.join("");
}

function encode(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function decode(value: string): string {
  return decodeURIComponent(escape(atob(value)));
}

export type StoredCredential = {
  id: string;
  company: string;
  role: string;
  expiry: string;
  credentialId: string;
  importedAt: string;
  blob: Record<string, unknown>;
};

export function loadStoredCredentials(): StoredCredential[] {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) {
    return [];
  }

  try {
    const key = ensureKey();
    const json = xorWithKey(decode(encrypted), key);
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as StoredCredential[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredCredentials(credentials: StoredCredential[]): void {
  const key = ensureKey();
  const json = JSON.stringify(credentials);
  const encrypted = encode(xorWithKey(json, key));
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function upsertStoredCredential(credential: StoredCredential): StoredCredential[] {
  const existing = loadStoredCredentials();
  const next = [...existing.filter((item) => item.id !== credential.id), credential];
  saveStoredCredentials(next);
  return next;
}
