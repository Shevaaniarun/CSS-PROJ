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

export function normalizeCredentialPayload(raw: Record<string, unknown>): Record<string, unknown> {
  if ("credential" in raw && typeof raw.credential === "object" && raw.credential) {
    const credential = raw.credential as Record<string, unknown>;
    return {
      credential_id: raw.credential_id ?? raw.pseudonym_id ?? credential.worker_id ?? crypto.randomUUID(),
      company: credential.company ?? raw.company,
      role: credential.role ?? raw.role,
      expiry: credential.expiry ?? raw.expiry,
      ...credential,
      source_payload: raw
    };
  }
  return raw;
}

export function validateImportedCredential(payload: Record<string, unknown>): { ok: true; credential: StoredCredential } | { ok: false; error: string } {
  const normalized = normalizeCredentialPayload(payload);
  const company = normalized.company;
  const role = normalized.role;
  const expiry = normalized.expiry;
  const credentialId = normalized.credential_id ?? normalized.worker_id;

  if (typeof company !== "string" || typeof role !== "string" || typeof expiry !== "string" || typeof credentialId !== "string") {
    return {
      ok: false,
      error: "Credential must include company, role, expiry, and credential_id or worker_id."
    };
  }

  return {
    ok: true,
    credential: {
      id: String(credentialId),
      credentialId: String(credentialId),
      company,
      role,
      expiry,
      importedAt: new Date().toISOString(),
      blob: normalized
    }
  };
}

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
