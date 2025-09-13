const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
  // Database connection configuration
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    multipleStatements: true, // Allow multiple SQL statements
  };

  let connection;
  try {
    // Create a connection to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to the database');

    // Read the SQL file
    const sql = await fs.readFile(
      path.join(__dirname, 'create_users_table.sql'),
      'utf8'
    );

    // Execute the SQL
    console.log('🚀 Running migration...');
    const [results] = await connection.query(sql);
    
    console.log('✅ Migration completed successfully');
    console.log('Results:', results);
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    // Close the connection
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration();
