import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    console.log(`   Database: Neon PostgreSQL`);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure your DATABASE_URL is correct');
  }
}

testConnection();

export default pool;
