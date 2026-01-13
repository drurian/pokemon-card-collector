const SESSION_STORAGE_KEY = 'pokemon-collector-session';
const AVATAR_STORAGE_PREFIX = 'pokemon-collector-avatar:';

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

export { SESSION_STORAGE_KEY, AVATAR_STORAGE_PREFIX, getStoredAvatar, storeAvatar };
