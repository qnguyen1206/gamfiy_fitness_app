import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== USER ROUTES =====

// Create new user (character)
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if username exists
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create user
    const [result] = await db.query('INSERT INTO users (username) VALUES (?)', [username]);
    const userId = result.insertId;

    // Initialize stats for new user
    await db.query(
      'INSERT INTO user_stats (user_id, strength, intelligence, endurance, exp, level) VALUES (?, 0, 0, 0, 0, 1)',
      [userId]
    );

    res.status(201).json({ id: userId, username });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Login (get user by username and id)
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, userId } = req.body;

    const [users] = await db.query(
      'SELECT id, username FROM users WHERE username = ? AND id = ?',
      [username, userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Invalid username or user ID' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, created_at FROM users ORDER BY id');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ===== STATS ROUTES =====

// Get user stats
app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const [stats] = await db.query(
      'SELECT strength, intelligence, endurance, exp, level FROM user_stats WHERE user_id = ?',
      [userId]
    );

    if (stats.length === 0) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    // Convert decimal to float
    const userStats = {
      strength: parseFloat(stats[0].strength),
      intelligence: parseFloat(stats[0].intelligence),
      endurance: parseFloat(stats[0].endurance),
      exp: parseFloat(stats[0].exp),
      level: stats[0].level
    };

    res.json(userStats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Update user stats
app.put('/api/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { strength, intelligence, endurance, exp, level } = req.body;

    await db.query(
      'UPDATE user_stats SET strength = ?, intelligence = ?, endurance = ?, exp = ?, level = ? WHERE user_id = ?',
      [strength, intelligence, endurance, exp, level, userId]
    );

    res.json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// ===== DAILY QUESTS ROUTES =====

// Get daily quests for user
app.get('/api/users/:userId/quests', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [quests] = await db.query(
      'SELECT quest_id, current_progress, completed FROM daily_quests WHERE user_id = ? AND quest_date = ?',
      [userId, today]
    );

    res.json(quests);
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// Update or create daily quest progress
app.put('/api/users/:userId/quests/:questId', async (req, res) => {
  try {
    const { userId, questId } = req.params;
    const { currentProgress, completed } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Insert or update quest progress
    await db.query(
      `INSERT INTO daily_quests (user_id, quest_id, current_progress, completed, quest_date) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE current_progress = ?, completed = ?`,
      [userId, questId, currentProgress, completed, today, currentProgress, completed]
    );

    res.json({ message: 'Quest progress updated' });
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
