import bcrypt from 'bcryptjs';
import express from 'express';
import { query, waitForDb } from './db.js';

const app = express();
app.use(express.json());

const BCRYPT_ROUNDS = 12;

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (err) {
    return fallback;
  }
};

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    next(err);
  }
};

// Check if a string is a legacy SHA-256 hash (64 hex characters)
const isLegacySha256 = (value) => /^[a-f0-9]{64}$/i.test(value);

// Check if a string is a bcrypt hash
const isBcryptHash = (value) => /^\$2[aby]?\$\d{1,2}\$.{53}$/.test(value);

// Hash a password with bcrypt
const hashPassword = async (password) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Verify a password against a stored hash (supports both bcrypt and legacy SHA-256)
const verifyPassword = async (password, storedHash) => {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }
  // Legacy SHA-256 support for migration
  if (isLegacySha256(storedHash)) {
    const crypto = await import('node:crypto');
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    return sha256Hash === storedHash;
  }
  return false;
};

// Migrate a legacy SHA-256 hash to bcrypt
const migratePasswordIfNeeded = async (username, password, storedHash) => {
  if (isLegacySha256(storedHash)) {
    const newHash = await hashPassword(password);
    await query('UPDATE users SET password = ? WHERE username = ?', [newHash, username]);
    console.log(`Migrated password hash for user: ${username}`);
    return newHash;
  }
  return storedHash;
};

const seedAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  // Check if admin already exists
  const existing = await query('SELECT password FROM users WHERE username = ?', [username]);

  if (existing.length === 0) {
    // Create new admin with bcrypt hash
    const hashedPassword = await hashPassword(password);
    await query(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
      [username, hashedPassword, true]
    );
    console.log('Admin user created');
  } else if (isLegacySha256(existing[0].password)) {
    // Migrate existing admin to bcrypt
    const hashedPassword = await hashPassword(password);
    await query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
    console.log('Admin password migrated to bcrypt');
  }
};

app.get('/api/health', asyncHandler(async (_req, res) => {
  res.json({ ok: true });
}));

// Login endpoint - verifies credentials server-side
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  const rows = await query('SELECT username, password, is_admin, avatar_url FROM users WHERE username = ?', [username]);

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = rows[0];
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Migrate legacy hash if needed (transparent to user)
  await migratePasswordIfNeeded(username, password, user.password);

  // Return user info WITHOUT password hash
  res.json({
    username: user.username,
    is_admin: Boolean(user.is_admin),
    avatar_url: user.avatar_url
  });
}));

// Get users - NO LONGER returns password hashes
app.get('/api/users', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT username, is_admin, avatar_url FROM users');
  res.json(rows);
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const { username, password, is_admin } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing username/password' });

  // Hash password with bcrypt before storing
  const hashedPassword = await hashPassword(password);

  await query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password), is_admin = VALUES(is_admin)', [
    username,
    hashedPassword,
    Boolean(is_admin)
  ]);
  res.status(201).json({ ok: true });
}));

app.patch('/api/users/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { password, is_admin, avatar_url } = req.body || {};
  const updates = [];
  const params = [];

  if (password) {
    // Hash new password with bcrypt
    const hashedPassword = await hashPassword(password);
    updates.push('password = ?');
    params.push(hashedPassword);
  }
  if (typeof is_admin === 'boolean') { updates.push('is_admin = ?'); params.push(is_admin); }
  if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }
  if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });
  params.push(username);
  await query(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`, params);
  res.json({ ok: true });
}));

app.delete('/api/users/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  await query('DELETE FROM users WHERE username = ?', [username]);
  await query('DELETE FROM collection_items WHERE user_id = ?', [username]);
  res.status(204).end();
}));

app.get('/api/collection', asyncHandler(async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'Missing user_id' });
  const items = await query('SELECT * FROM collection_items WHERE user_id = ?', [userId]);
  const collection = items.filter((item) => item.item_type === 'collection').map((item) => ({
    id: item.card_id,
    ...(parseJson(item.card_data, {}) || {})
  }));
  const wishlist = items.filter((item) => item.item_type === 'wishlist').map((item) => ({
    id: item.card_id,
    ...(parseJson(item.card_data, {}) || {})
  }));
  const cardTags = {};
  const cardQuantities = {};
  items.forEach((item) => {
    if (!item.card_id) return;
    cardTags[item.card_id] = parseJson(item.tags, []);
    cardQuantities[item.card_id] = item.quantity || 1;
  });
  const allTags = Object.values(cardTags).flat().filter((tag, index, arr) => arr.indexOf(tag) === index);
  res.json({
    collection,
    wishlist,
    card_tags: cardTags,
    card_quantities: cardQuantities,
    all_tags: allTags
  });
}));

app.get('/api/collection/items', asyncHandler(async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'Missing user_id' });
  const items = await query('SELECT * FROM collection_items WHERE user_id = ?', [userId]);
  res.json(items);
}));

app.post('/api/collection/save', asyncHandler(async (req, res) => {
  const { user_id, collection, wishlist, card_tags, card_quantities } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  const collectionIds = (collection || []).map((card) => card.id).filter(Boolean);
  const wishlistIds = (wishlist || []).map((card) => card.id).filter(Boolean);

  const deleteNotInList = async (itemType, ids) => {
    if (!ids.length) {
      await query('DELETE FROM collection_items WHERE user_id = ? AND item_type = ?', [user_id, itemType]);
      return;
    }
    const placeholders = ids.map(() => '?').join(', ');
    await query(
      `DELETE FROM collection_items WHERE user_id = ? AND item_type = ? AND card_id NOT IN (${placeholders})`,
      [user_id, itemType, ...ids]
    );
  };

  await deleteNotInList('collection', collectionIds);
  await deleteNotInList('wishlist', wishlistIds);

  const rows = [
    ...(collection || []).map((card) => ({
      user_id,
      card_id: card.id,
      item_type: 'collection',
      quantity: (card_quantities || {})[card.id] || 1,
      tags: JSON.stringify((card_tags || {})[card.id] || []),
      card_data: JSON.stringify(card),
      updated_at: new Date()
    })),
    ...(wishlist || []).map((card) => ({
      user_id,
      card_id: card.id,
      item_type: 'wishlist',
      quantity: 1,
      tags: JSON.stringify((card_tags || {})[card.id] || []),
      card_data: JSON.stringify(card),
      updated_at: new Date()
    }))
  ];

  for (const row of rows) {
    await query(
      `INSERT INTO collection_items (user_id, card_id, item_type, quantity, tags, card_data, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), tags = VALUES(tags), card_data = VALUES(card_data), updated_at = VALUES(updated_at)`,
      [row.user_id, row.card_id, row.item_type, row.quantity, row.tags, row.card_data, row.updated_at]
    );
  }

  res.json({ ok: true });
}));

app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT || 3001);
waitForDb()
  .then(seedAdmin)
  .then(() => {
    app.listen(port, () => {
      console.log(`Local API listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start API:', err);
    process.exit(1);
  });
