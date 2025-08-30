const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Read environment variables
    require('dotenv').config({ path: '.env.local' });
    
    const dbName = process.env.DB_NAME || 'school_management';
    
    // First connection without database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log('Database created successfully');
    
    await connection.end();

    // Second connection to the specific database
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
    });

    console.log(`Connected to database: ${dbName}`);

    // Create schools table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        contact VARCHAR(15) NOT NULL,
        email_id VARCHAR(255) NOT NULL,
        image VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await dbConnection.query(createTableQuery);
    console.log('Schools table created successfully');

    // Add indexes
    try {
      await dbConnection.query('CREATE INDEX idx_city ON schools(city)');
      await dbConnection.query('CREATE INDEX idx_state ON schools(state)');
      await dbConnection.query('CREATE INDEX idx_email ON schools(email_id)');
      console.log('Indexes created successfully');
    } catch (indexError) {
      // Indexes might already exist, that's okay
      console.log('Indexes already exist or created');
    }

    await dbConnection.end();
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();