import mysql from 'mysql2/promise';

// Database configuration with SSL support for cloud databases
const isCloudDatabase = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // SSL configuration for cloud databases like Aiven
  ssl: isCloudDatabase ? { rejectUnauthorized: false } : undefined,
};

// Log configuration in development
if (process.env.NODE_ENV !== 'production') {
  console.log('🗄️ Database Configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    password: dbConfig.password ? '***SET***' : 'NOT_SET'
  });
}

const connection = mysql.createPool(dbConfig);

// Test connection on startup
connection.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
  })
  .catch((err: Error) => {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Make sure MySQL is running and database exists');
  });

export default connection;