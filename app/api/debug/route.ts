import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      MYSQLHOST: process.env.MYSQLHOST || 'NOT_SET',
      MYSQLUSER: process.env.MYSQLUSER || 'NOT_SET',
      MYSQLPASSWORD: process.env.MYSQLPASSWORD ? '***SET***' : 'NOT_SET',
      MYSQLDATABASE: process.env.MYSQLDATABASE || 'NOT_SET',
      MYSQLPORT: process.env.MYSQLPORT || 'NOT_SET',
      // Fallback variables
      MYSQL_HOST: process.env.MYSQL_HOST || 'NOT_SET',
      MYSQL_USER: process.env.MYSQL_USER || 'NOT_SET',
      MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? '***SET***' : 'NOT_SET',
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'NOT_SET',
      MYSQL_PORT: process.env.MYSQL_PORT || 'NOT_SET',
      // Local fallbacks
      DB_HOST: process.env.DB_HOST || 'NOT_SET',
      DB_USER: process.env.DB_USER || 'NOT_SET',
      DB_PASSWORD: process.env.DB_PASSWORD ? '***SET***' : 'NOT_SET',
      DB_NAME: process.env.DB_NAME || 'NOT_SET',
    };

    // Test database connection
    let connectionTest = 'FAILED';
    let connectionError = '';
    let tableExists = false;
    
    try {
      // Test basic connection
      const [rows] = await db.execute('SELECT 1 as test');
      connectionTest = 'SUCCESS';
      
      // Check if schools table exists
      try {
        const [tableCheck] = await db.execute('SELECT COUNT(*) as count FROM schools LIMIT 1');
        tableExists = true;
      } catch (tableError) {
        tableExists = false;
      }
      
    } catch (error) {
      connectionError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      debug: {
        environmentVariables: envVars,
        databaseConnection: {
          status: connectionTest,
          error: connectionError,
          tableExists: tableExists
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}