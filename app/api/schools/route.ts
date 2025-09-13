import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { verifyToken } from '@/utils/auth';

export const runtime = 'nodejs';

interface School extends RowDataPacket {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

// Helper function to verify authentication and get user info
function getAuthenticatedUser(request: NextRequest) {
  const token = 
    request.cookies.get('school_management_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { isAuthenticated: false, error: 'No authentication token provided' };
  }

  const user = verifyToken(token);
  if (!user) {
    return { isAuthenticated: false, error: 'Invalid or expired token' };
  }

  return { 
    isAuthenticated: true, 
    userId: user.userId,
    userEmail: user.email,
    userRole: user.role || 'user'
  };
}

// GET - Fetch all schools (public)
export async function GET() {
  try {
    console.log('🔍 Fetching all schools...');
    const [rows] = await db.query<School[]>('SELECT * FROM schools ORDER BY id DESC');
    
    // Return only necessary fields for public access
    const schools = rows.map(school => ({
      id: school.id,
      name: school.name,
      address: school.address,
      city: school.city,
      state: school.state,
      contact: school.contact,
      email_id: school.email_id,
      image: school.image
    }));
    
    console.log(`✅ Fetched ${schools.length} schools`);
    return NextResponse.json({ success: true, data: schools });
  } catch (error) {
    console.error('❌ Error in GET /api/schools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schools',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



// Helper function to save school to database
async function saveSchoolToDB(
  schoolData: Omit<School, 'id' | 'created_at' | 'updated_at'>,
  userId: number
): Promise<number> {
  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO schools 
       (name, address, city, state, contact, email_id, image, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolData.name,
        schoolData.address,
        schoolData.city,
        schoolData.state,
        schoolData.contact,
        schoolData.email_id,
        schoolData.image, // This is the URL from Cloudinary or local storage
        userId
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error('❌ Database error in saveSchoolToDB:', error);
    throw new Error('Failed to save school to database');
  }
}


// POST - Add new school (protected)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and get user info
    const auth = getAuthenticatedUser(request);
    if (!auth.isAuthenticated || !auth.userId) {
      console.log('❌ Unauthorized access attempt to POST /api/schools');
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`📝 User ${auth.userEmail} is adding a new school...`);
    
    // Parse JSON body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('❌ Error parsing request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'address', 'city', 'state', 'contact', 'email_id'];
    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Prepare school data
    const schoolData = {
      name: requestData.name.trim(),
      address: requestData.address.trim(),
      city: requestData.city.trim(),
      state: requestData.state.trim(),
      contact: requestData.contact.trim(),
      email_id: requestData.email_id.trim().toLowerCase(),
      image: requestData.image_url || null
    };

    console.log('📋 Processing school data:', schoolData.name);
    
    // Use the image URL provided by the client (already uploaded via the client)

    // Save to database
    console.log('💾 Saving school to database...');
    const schoolId = await saveSchoolToDB(schoolData, auth.userId);
    console.log(`✅ School added successfully with ID: ${schoolId}`);

    return NextResponse.json({
      success: true,
      message: 'School added successfully',
      data: { id: schoolId }
    });

  } catch (error) {
    console.error('❌ Error in POST /api/schools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add school',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update a school
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and get user info
    const auth = getAuthenticatedUser(request);
    if (!auth.isAuthenticated || !auth.userId) {
      console.log('❌ Unauthorized access attempt to PUT /api/schools');
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'School ID is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const updates: Record<string, string | null> = {};
    const validFields = ['name', 'address', 'city', 'state', 'contact', 'email_id'];
    
    // Process regular fields
    validFields.forEach(field => {
      const value = formData.get(field);
      if (value !== null && typeof value === 'string') {
        updates[field] = value;
      }
    });

    // Handle image upload if present
    const image = formData.get('image') as File | null;
    if (image && image.size > 0) {
      try {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const result = await uploadToCloudinary(buffer, { 
          folder: 'schools',
          upload_preset: 'school_images_unsigned'
        });
        updates.image = result.url;
      } catch (error) {
        console.error('❌ Error uploading image:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    // Build and execute update query
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    await db.execute(
      `UPDATE schools SET ${setClause} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'School updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/schools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update school',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove a school
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and get user info
    const auth = getAuthenticatedUser(request);
    if (!auth.isAuthenticated || !auth.userId) {
      console.log('❌ Unauthorized access attempt to DELETE /api/schools');
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'School ID is required' },
        { status: 400 }
      );
    }

    // First, get the school to check if it exists and get the image URL
    const [schools] = await db.execute('SELECT image FROM schools WHERE id = ?', [id]);
    
    if (!Array.isArray(schools) || schools.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Delete the school from the database
    await db.execute('DELETE FROM schools WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'School deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/schools:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete school',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}