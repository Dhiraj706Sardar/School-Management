import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/setup-database';

export async function GET() {
  try {
    console.log('🚀 Starting database setup...');
    console.log('🔧 Environment check:', {
      MYSQLHOST: process.env.MYSQLHOST ? '✅ SET' : '❌ NOT SET',
      MYSQLUSER: process.env.MYSQLUSER ? '✅ SET' : '❌ NOT SET',
      MYSQLPASSWORD: process.env.MYSQLPASSWORD ? '✅ SET' : '❌ NOT SET',
      MYSQLDATABASE: process.env.MYSQLDATABASE ? '✅ SET' : '❌ NOT SET',
    });
    
    const success = await setupDatabase();
    
    if (success) {
      console.log('✅ Database setup completed successfully!');
      return NextResponse.json({ 
        success: true, 
        message: 'Database setup completed successfully!' 
      });
    } else {
      console.log('❌ Database setup failed');
      return NextResponse.json({ 
        success: false, 
        error: 'Database setup failed' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Setup API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  // Same as GET for convenience
  return GET();
}