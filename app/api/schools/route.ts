import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// GET - Fetch all schools
export async function GET() {
  try {
    console.log('🔍 Attempting to fetch schools from database...');
    const [rows] = await db.execute('SELECT * FROM schools ORDER BY id DESC');
    console.log('✅ Successfully fetched schools:', Array.isArray(rows) ? rows.length : 0, 'records');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Database error in GET /api/schools:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schools',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST - Add new school
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Attempting to add new school...');
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const contact = formData.get('contact') as string;
    const email_id = formData.get('email_id') as string;
    const image = formData.get('image') as File;

    console.log('📋 Form data received:', { name, city, state, contact, email_id, hasImage: !!image });

    // Validate required fields
    if (!name || !address || !city || !state || !contact || !email_id) {
      console.log('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    let imagePath = null;
    
    if (image && image.size > 0) {
      try {
        console.log('📸 Processing image upload...');
        // Handle image upload
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const timestamp = Date.now();
        const filename = `school-${timestamp}-${image.name}`;
        const filepath = `public/schoolImages/${filename}`;
        
        // Ensure directory exists
        const dir = path.dirname(filepath);
        
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch {
          // Directory might already exist
        }
        
        // Save file
        await fs.writeFile(filepath, buffer);
        
        imagePath = `/schoolImages/${filename}`;
        console.log('✅ Image saved successfully:', imagePath);
      } catch (imageError) {
        console.error('❌ Image upload failed:', imageError);
        // Continue without image - this is important for production
        console.log('⚠️ Continuing without image due to upload failure');
      }
    }

    // Insert into database
    console.log('💾 Inserting into database...');
    const [result] = await db.execute(
      'INSERT INTO schools (name, address, city, state, contact, email_id, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, address, city, state, contact, email_id, imagePath]
    );

    const insertId = (result as { insertId: number }).insertId;
    console.log('✅ School added successfully with ID:', insertId);

    return NextResponse.json({
      success: true,
      message: 'School added successfully',
      data: { id: insertId }
    });

  } catch (error) {
    console.error('❌ Error adding school:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add school',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}