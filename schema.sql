CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  intensity REAL NOT NULL,
  content TEXT,
  isAftershock INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL
);