-- 迁移脚本：为 logs 表添加 type 字段
ALTER TABLE logs ADD COLUMN type TEXT DEFAULT 'negative';
