-- 迁移脚本：新增 period_files 表，用于记录“国家时期文件”与情绪时间线
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
