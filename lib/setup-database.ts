import db from './db';

export async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
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

    await db.execute(createTableQuery);
    console.log('✅ Schools table created successfully');

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_city ON schools(city)',
      'CREATE INDEX IF NOT EXISTS idx_state ON schools(state)', 
      'CREATE INDEX IF NOT EXISTS idx_email ON schools(email_id)'
    ];

    for (const indexQuery of indexes) {
      try {
        await db.execute(indexQuery);
      } catch {
        // Index might already exist, that's okay
        console.log('Index already exists or created');
      }
    }

    console.log('✅ Database indexes created successfully');
    console.log('✅ Database setup completed!');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    return false;
  }
}