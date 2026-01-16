import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'pokemon',
  password: process.env.DB_PASSWORD || 'pokemon',
  database: process.env.DB_NAME || 'pokemon_collector',
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10)
});

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const waitForDb = async ({ retries = 20, delayMs = 1500 } = {}) => {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      return;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export { pool, query, waitForDb };
