const LOCAL_API_BASE = import.meta.env.VITE_LOCAL_API_URL || '/api';

const requestJson = async (path, options = {}) => {
  const res = await fetch(`${LOCAL_API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || `Local API request failed (HTTP ${res.status})`);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
};

const localApi = {
  // Server-side authentication - returns user without password hash
  async login(username, password) {
    return requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  // Get users list (no password hashes returned)
  async getUsers() {
    return requestJson('/users');
  },

  async loadItems(userId) {
    return requestJson(`/collection/items?user_id=${encodeURIComponent(userId)}`);
  },

  // Create user - send plain password, server hashes with bcrypt
  async createUser(username, password, isAdmin = false) {
    return requestJson('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, is_admin: isAdmin })
    });
  },

  async updateUserPassword(username, password) {
    return localApi.updateUser(username, { password });
  },

  async updateUser(username, updates) {
    return requestJson(`/users/${encodeURIComponent(username)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteUser(username) {
    return requestJson(`/users/${encodeURIComponent(username)}`, {
      method: 'DELETE'
    });
  },

  async loadData(userId) {
    return requestJson(`/collection?user_id=${encodeURIComponent(userId)}`);
  },

  async saveData(userId, collection, wishlist, cardTags, cardQuantities, allTags) {
    return requestJson('/collection/save', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, collection, wishlist, card_tags: cardTags, card_quantities: cardQuantities, all_tags: allTags })
    });
  }
};

export { localApi };
