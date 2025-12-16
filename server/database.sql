-- Fitness Tracker Database Schema
-- Run this script in your MySQL database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  strength DECIMAL(10, 1) DEFAULT 0,
  intelligence DECIMAL(10, 1) DEFAULT 0,
  endurance DECIMAL(10, 1) DEFAULT 0,
  exp DECIMAL(10, 1) DEFAULT 0,
  level INT DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_stats (user_id),
  INDEX idx_user_stats (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily quests table
CREATE TABLE IF NOT EXISTS daily_quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quest_id VARCHAR(50) NOT NULL,
  current_progress INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  quest_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_quest_date (user_id, quest_id, quest_date),
  INDEX idx_daily_quests_user (user_id),
  INDEX idx_daily_quests_date (quest_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
