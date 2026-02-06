CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  intensity REAL NOT NULL,
  content TEXT,
  isAftershock INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  tags TEXT,
  type TEXT DEFAULT 'negative'
);

CREATE TABLE IF NOT EXISTS period_files (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  startTs INTEGER NOT NULL,
  endTs INTEGER,
  status TEXT NOT NULL DEFAULT 'not_started',
  description TEXT,
  entries TEXT NOT NULL DEFAULT '[]',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gemini_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  apiKey TEXT NOT NULL,
  model TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);
