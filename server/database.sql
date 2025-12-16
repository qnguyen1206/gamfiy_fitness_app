-- Fitness Tracker Database Schema
-- PostgreSQL (Neon DB) Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  strength DECIMAL(10, 1) DEFAULT 0,
  intelligence DECIMAL(10, 1) DEFAULT 0,
  endurance DECIMAL(10, 1) DEFAULT 0,
  exp DECIMAL(10, 1) DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- Daily quests table
CREATE TABLE IF NOT EXISTS daily_quests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  quest_id VARCHAR(50) NOT NULL,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  quest_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, quest_id, quest_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stats ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_date ON daily_quests(quest_date);

-- Create trigger to auto-update updated_at in user_stats
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
