import fs from 'fs';
import path from 'path';
import db from '@/lib/db';

async function runMigration() {
  try {
    console.log('Running database migrations...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/20230913_add_rate_limits.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements and execute them
    const statements = migrationSQL.split(';').filter(statement => statement.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        console.log(`Executing: ${statement.trim().substring(0, 100)}...`);
        await db.execute(statement);
      }
    }
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await db.end();
    process.exit(0);
  }
}

runMigration();
