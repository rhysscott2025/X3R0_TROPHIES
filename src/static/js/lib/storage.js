// Browser storage for trophy progress and preferences.
// Every access is wrapped: storage can be blocked (private windows, strict
// privacy settings, embedded previews) and the site must keep working.

const PREFIX = "x3r0:v1:";

let available = null;
export function storageAvailable() {
  if (available !== null) return available;
  try {
    const key = `${PREFIX}__test`;
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

export const progressKey = (slug) => `${PREFIX}progress:${slug}`;

/**
 * Earned trophy ids for a game. Pass validIds to drop ids that no longer
 * exist (for example after a guide renames a trophy).
 */
export function loadProgress(slug, validIds) {
  const data = read(`progress:${slug}`, null);
  const ids = Array.isArray(data?.earned) ? data.earned.filter((id) => typeof id === "string") : [];
  return new Set(validIds ? ids.filter((id) => validIds.has(id)) : ids);
}

export function saveProgress(slug, earned) {
  return write(`progress:${slug}`, { earned: [...earned], updated: new Date().toISOString() });
}

export function clearProgress(slug) {
  return remove(`progress:${slug}`);
}

export function loadPref(name, fallback) {
  return read(`pref:${name}`, fallback);
}

export function savePref(name, value) {
  return write(`pref:${name}`, value);
}
