/**
 * localStorage helpers.
 * All keys are namespaced under 'gestion:' to avoid collisions.
 */

const NS = 'gestion:';

/**
 * Read a value from localStorage.
 * Returns `fallback` if the key doesn't exist or JSON.parse fails.
 */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a value to localStorage.
 * Silently ignores errors (e.g. private browsing quota exceeded).
 */
export function save(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — fail silently
  }
}

/**
 * Remove a key from localStorage.
 */
export function remove(key) {
  try {
    localStorage.removeItem(NS + key);
  } catch {
    // ignore
  }
}
