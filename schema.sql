CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL DEFAULT 'home',
  parent_id INTEGER,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  is_owner INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_page ON comments(page, created_at);
CREATE TABLE IF NOT EXISTS likes (
  comment_id INTEGER NOT NULL,
  voter TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT 'heart',
  PRIMARY KEY (comment_id, voter)
);
