const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    port: parseInt(process.env.DB_PORT || '3306'),
  };

  console.log('🔧 Setting up local database...');
  console.log('📍 Host:', config.host);
  console.log('👤 User:', config.user);
  console.log('🗄️ Database:', config.database);

  try {
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connected to database');

    // Create schools table
    await connection.execute(`
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
    `);

    console.log('✅ Schools table created');

    // Create indexes
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_city ON schools(city)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_state ON schools(state)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_email ON schools(email_id)');

    console.log('✅ Indexes created');

    // Check if table has data
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM schools');
    const count = rows[0].count;

    if (count === 0) {
      // Insert sample data
      await connection.execute(`
        INSERT INTO schools (name, address, city, state, contact, email_id) VALUES
        ('Demo High School', '123 Education Street', 'New York', 'NY', '1234567890', 'info@demohigh.edu'),
        ('Tech Academy', '456 Innovation Ave', 'San Francisco', 'CA', '9876543210', 'contact@techacademy.edu')
      `);
      console.log('✅ Sample data inserted');
    } else {
      console.log(`ℹ️ Table already has ${count} records`);
    }

    await connection.end();
    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();