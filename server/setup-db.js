import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Read and execute SQL file
    const sql = fs.readFileSync('./database.sql', 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
        console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
      }
    }

    console.log('\n✅ Database setup complete!');
    console.log('You can now start the server with: npm run dev');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
