export interface StoredSessionAuth {
  roomCode: string;
  userId: number;
  displayName: string;
  isHost: boolean;
  savedAt: number;
}

const STORAGE_KEY = "movie_picker_session_auth";
const MAX_SESSION_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours TTL

export function saveSessionAuth(auth: StoredSessionAuth): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn("[sessionStorage] Failed to save session auth:", err);
  }
}

export function loadSessionAuth(): StoredSessionAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: StoredSessionAuth = JSON.parse(raw);
    if (!parsed?.roomCode || !parsed?.userId) {
      clearSessionAuth();
      return null;
    }

    // Check TTL
    if (parsed.savedAt && Date.now() - parsed.savedAt > MAX_SESSION_AGE_MS) {
      clearSessionAuth();
      return null;
    }

    return parsed;
  } catch {
    clearSessionAuth();
    return null;
  }
}

export function clearSessionAuth(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[sessionStorage] Failed to clear session auth:", err);
  }
}
