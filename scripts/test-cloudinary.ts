import { cloudinary } from '../lib/cloudinary';

async function testCloudinary() {
  try {
    console.log('🔍 Testing Cloudinary configuration...');
    
    // Test configuration
    console.log('☁️ Cloudinary Configuration:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'not set',
      api_key: process.env.CLOUDINARY_API_KEY ? '***SET***' : 'not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'not set',
      upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'not set'
    });

    // Test a simple upload with a small text file
    console.log('🔄 Testing file upload...');
    const testBuffer = Buffer.from('This is a test file for Cloudinary');
    
    const result = await cloudinary.uploader.upload('data:text/plain;base64,' + testBuffer.toString('base64'), {
      resource_type: 'auto',
      folder: 'test_uploads',
      public_id: 'test-file-' + Date.now()
    });

    console.log('✅ Upload successful!');
    console.log('📝 Upload result:', {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format
    });

    // Test deletion
    console.log('🗑️ Testing file deletion...');
    const deleteResult = await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ Deletion result:', deleteResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCloudinary();
