/**
 * SECURITY NOTE: This Supabase implementation uses client-side password hashing
 * with SHA-256, which is not ideal for production. For better security:
 * 
 * 1. Migrate to Supabase Auth (https://supabase.com/docs/guides/auth)
 *    - Handles password hashing server-side with bcrypt
 *    - Provides JWT-based session management
 *    - Includes email verification, password reset, etc.
 * 
 * 2. Or use Edge Functions for authentication
 *    - Create a server-side login endpoint
 *    - Hash passwords with bcrypt on the server
 * 
 * The local backend (localApi.js) now uses proper bcrypt hashing server-side.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const hasSupabaseCredentials = Boolean(SUPABASE_URL)
  && Boolean(SUPABASE_KEY)
  && !SUPABASE_KEY.includes('your-publishable-key');

const authHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
});

const supabase = {
  async getUsers() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?select=*`, {
      headers: authHeaders()
    });
    return res.json();
  },
  async loadItems(userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collection_items?user_id=eq.${userId}&select=*`, {
      headers: authHeaders()
    });
    return res.json();
  },
  async createUser(username, password, isAdmin = false) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ username, password, is_admin: isAdmin })
    });
    return res.json();
  },
  async updateUserPassword(username, password) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ password })
    });
    return res.json();
  },
  async updateUser(username, updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  async deleteUser(username) {
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collection_items?user_id=eq.${username}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  },
  async loadData(userId) {
    const items = await this.loadItems(userId);
    if (Array.isArray(items) && items.length > 0 && !items.error) {
      const collectionItems = items.filter((item) => item.item_type === 'collection');
      const wishlistItems = items.filter((item) => item.item_type === 'wishlist');
      const cardTags = {};
      const cardQuantities = {};
      collectionItems.forEach((item) => {
        if (!item.card_id) return;
        cardTags[item.card_id] = item.tags || [];
        cardQuantities[item.card_id] = item.quantity || 1;
      });
      const allTags = Object.values(cardTags).flat().filter((tag, index, arr) => arr.indexOf(tag) === index);
      return {
        collection: collectionItems.map((item) => item.card_data || { id: item.card_id }),
        wishlist: wishlistItems.map((item) => item.card_data || { id: item.card_id }),
        card_tags: cardTags,
        card_quantities: cardQuantities,
        all_tags: allTags
      };
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collections?user_id=eq.${userId}&select=*`, {
      headers: authHeaders()
    });
    const data = await res.json();
    return data[0] || null;
  },
  async saveData(userId, collection, wishlist, cardTags, cardQuantities, allTags) {
    const rows = [
      ...(collection || []).map((card) => ({
        user_id: userId,
        card_id: card.id,
        item_type: 'collection',
        quantity: cardQuantities[card.id] || 1,
        tags: cardTags[card.id] || [],
        card_data: card,
        updated_at: new Date().toISOString()
      })),
      ...(wishlist || []).map((card) => ({
        user_id: userId,
        card_id: card.id,
        item_type: 'wishlist',
        quantity: 1,
        tags: cardTags[card.id] || [],
        card_data: card,
        updated_at: new Date().toISOString()
      }))
    ];
    const collectionIds = (collection || []).map((card) => card.id).filter(Boolean);
    const wishlistIds = (wishlist || []).map((card) => card.id).filter(Boolean);
    const buildDeleteUrl = (itemType, ids) => {
      const params = new URLSearchParams({
        user_id: `eq.${userId}`,
        item_type: `eq.${itemType}`
      });
      if (ids && ids.length > 0) {
        const listValue = ids
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',');
        params.set('card_id', `not.in.(${listValue})`);
      }
      return `${SUPABASE_URL}/rest/v1/pokemon_collection_items?${params.toString()}`;
    };
    await fetch(buildDeleteUrl('collection', collectionIds), {
      method: 'DELETE',
      headers: authHeaders()
    });
    await fetch(buildDeleteUrl('wishlist', wishlistIds), {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (rows.length === 0) return;
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collection_items`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    });
  }
};

export { SUPABASE_URL, SUPABASE_KEY, hasSupabaseCredentials, supabase };
