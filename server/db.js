import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fitness_tracker',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure your database is running and credentials are correct');
  }
}

testConnection();

export default pool;
