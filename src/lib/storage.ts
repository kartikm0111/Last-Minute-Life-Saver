// Safe wrap on storage access to prevent DOMExceptions in security-restricted iframe environments
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[Storage Warning] localStorage.getItem blocked or unavailable for key "${key}":`, e);
    }
    return memoryStorage[key] || null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[Storage Warning] localStorage.setItem blocked or unavailable for key "${key}":`, e);
    }
    memoryStorage[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[Storage Warning] localStorage.removeItem blocked or unavailable for key "${key}":`, e);
    }
    delete memoryStorage[key];
  }
};
