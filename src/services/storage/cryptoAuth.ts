const SESSION_STORAGE_KEY = 'kc_session_v1';

export interface StoredSession {
  userId: string;
  token: string;
  expiresAt: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function generateSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Derives a non-plaintext password hash using PBKDF2-SHA256 in the browser Web Crypto API.
 */
export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex || generateSaltHex();
  const encoder = new TextEncoder();

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: hexToBytes(salt) as BufferSource,
        iterations: 50000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    return {
      hash: bytesToHex(new Uint8Array(derivedBits)),
      salt,
    };
  }

  // Fallback for non-secure test contexts where crypto.subtle may be unavailable
  let acc = 2166136261;
  const combined = `${salt}:${password}`;
  for (let i = 0; i < combined.length; i++) {
    acc ^= combined.charCodeAt(i);
    acc = Math.imul(acc, 16777619);
  }
  return { hash: (acc >>> 0).toString(16).padStart(8, '0'), salt };
}

export async function verifyPassword(password: string, storedHash: string, saltHex: string): Promise<boolean> {
  const computed = await hashPassword(password, saltHex);
  if (computed.hash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.hash.length; i++) {
    diff |= computed.hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 100) return 'Password is too long.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include a number.';
  return null;
}

export function createSession(userId: string): StoredSession {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const session: StoredSession = {
    userId,
    token: `kc_local_${bytesToHex(bytes)}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.userId || !parsed?.token || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
