/**
 * localStorage and sessionStorage utilities with type safety
 */

/**
 * Get item from localStorage
 * @param key
 * @returns
 */
export const getLocalStorage = <T>(key: string): T | null => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Set item in localStorage
 * @param key
 * @param value
 */
export const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to set localStorage:", error);
  }
};

/**
 * Remove item from localStorage
 * @param key
 */
export const removeLocalStorage = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove from localStorage:", error);
  }
};

/**
 * Clear all localStorage
 */
export const clearLocalStorage = (): void => {
  try {
    window.localStorage.clear();
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
};

/**
 * Get item from sessionStorage
 * @param key
 * @returns
 */
export const getSessionStorage = <T>(key: string): T | null => {
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
};

/**
 * Set item in sessionStorage
 * @param key
 * @param value
 */
export const setSessionStorage = <T>(key: string, value: T): void => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to set sessionStorage:", error);
  }
};

/**
 * Remove item from sessionStorage
 * @param key
 */
export const removeSessionStorage = (key: string): void => {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove from sessionStorage:", error);
  }
};

/**
 * Clear all sessionStorage
 */
export const clearSessionStorage = (): void => {
  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.error("Failed to clear sessionStorage:", error);
  }
};
