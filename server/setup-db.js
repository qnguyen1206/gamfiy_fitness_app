import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Client } = pg;

async function setupDatabase() {
  console.log('Setting up Neon PostgreSQL database...');
  
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute SQL file
    const sql = fs.readFileSync('./database.sql', 'utf8');
    
    // Execute the entire SQL at once (PostgreSQL supports this)
    await client.query(sql);
    console.log('✅ Database schema created successfully');

    console.log('\n✅ Database setup complete!');
    console.log('You can now start the server with: npm run dev');
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('   Make sure your DATABASE_URL is correct in .env');
    process.exit(1);
  }
}

setupDatabase();
