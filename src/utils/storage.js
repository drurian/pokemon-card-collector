const SESSION_STORAGE_KEY = 'pokemon-collector-session';
const AVATAR_STORAGE_PREFIX = 'pokemon-collector-avatar:';
const VIEW_PREFS_KEY = 'pokemon-collector-view-prefs';

const getStoredAvatar = (username) => {
  if (!username) return null;
  const key = `${AVATAR_STORAGE_PREFIX}${username}`;
  return localStorage.getItem(key);
};

const storeAvatar = (username, avatarUrl) => {
  if (!username) return;
  const key = `${AVATAR_STORAGE_PREFIX}${username}`;
  if (!avatarUrl) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, avatarUrl);
  }
};

/**
 * Get stored view preferences
 * @returns {{ viewMode: string, sortBy: string }}
 */
const getViewPreferences = () => {
  try {
    const stored = localStorage.getItem(VIEW_PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parse errors
  }
  return { viewMode: 'grid', sortBy: '' };
};

/**
 * Store view preferences
 * @param {{ viewMode?: string, sortBy?: string }} prefs
 */
const setViewPreferences = (prefs) => {
  try {
    const current = getViewPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore storage errors
  }
};

export {
  SESSION_STORAGE_KEY,
  AVATAR_STORAGE_PREFIX,
  VIEW_PREFS_KEY,
  getStoredAvatar,
  storeAvatar,
  getViewPreferences,
  setViewPreferences
};
