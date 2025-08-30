import { Pool } from 'pg';

// PostgreSQL configuration for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Log configuration in development
if (process.env.NODE_ENV !== 'production') {
  console.log('🗄️ PostgreSQL Database Configuration:', {
    connectionString: process.env.DATABASE_URL ? '***SET***' : 'NOT_SET',
  });
}

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL database connected successfully');
    client.release();
  })
  .catch((err: Error) => {
    console.error('❌ PostgreSQL database connection failed:', err.message);
  });

export default pool;