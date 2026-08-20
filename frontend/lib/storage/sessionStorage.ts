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
    clearVotedSuggestionIds();
  } catch (err) {
    console.warn("[sessionStorage] Failed to clear session auth:", err);
  }
}

const VOTED_KEY_PREFIX = "movie_picker_voted_";

export function saveVotedSuggestionId(roomCode: string, userId: number, suggestionId: number): void {
  if (typeof window === "undefined" || !roomCode || !userId) return;
  try {
    const key = `${VOTED_KEY_PREFIX}${roomCode.trim().toUpperCase()}_${userId}`;
    const existing = loadVotedSuggestionIds(roomCode, userId);
    if (!existing.includes(suggestionId)) {
      existing.push(suggestionId);
      sessionStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn("[sessionStorage] Failed to save voted suggestion:", err);
  }
}

export function loadVotedSuggestionIds(roomCode: string, userId: number): number[] {
  if (typeof window === "undefined" || !roomCode || !userId) return [];
  try {
    const key = `${VOTED_KEY_PREFIX}${roomCode.trim().toUpperCase()}_${userId}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearVotedSuggestionIds(roomCode?: string, userId?: number): void {
  if (typeof window === "undefined") return;
  try {
    if (roomCode && userId) {
      const key = `${VOTED_KEY_PREFIX}${roomCode.trim().toUpperCase()}_${userId}`;
      sessionStorage.removeItem(key);
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(VOTED_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    }
  } catch (err) {
    console.warn("[sessionStorage] Failed to clear voted suggestions:", err);
  }
}
