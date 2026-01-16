CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(64) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  is_admin TINYINT(1) DEFAULT 0,
  avatar_url TEXT NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  card_id VARCHAR(64) NOT NULL,
  item_type ENUM('collection', 'wishlist') NOT NULL,
  quantity INT DEFAULT 1,
  tags JSON NULL,
  card_data JSON NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_item (user_id, card_id, item_type),
  CONSTRAINT fk_collection_user FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE
);
