import { v2 as cloudinary } from 'cloudinary';
import { createHash } from 'crypto';

// Log Cloudinary configuration (masking sensitive data)
const logConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '***SET***' : 'NOT_SET',
  api_key: process.env.CLOUDINARY_API_KEY ? '***SET***' : 'NOT_SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT_SET',
};

console.log('☁️ Cloudinary Configuration:', logConfig);

// Configure Cloudinary with optimized connection settings
try {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Missing required Cloudinary environment variables');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
    // Use alternative upload URL that might work better
    upload_prefix: 'https://api.cloudinary.com',
    // Disable HTTP/2 which can cause issues
    force_version: false,
  });
  console.log('✅ Cloudinary configured successfully');
} catch (error) {
  console.error('❌ Failed to configure Cloudinary:', error);
  throw error;
}

// Helper function to upload a file buffer to Cloudinary with multiple endpoint fallbacks
export const uploadToCloudinary = async (buffer: Buffer, folder = 'schools'): Promise<string> => {
  const config = cloudinary.config();
  
  // Alternative Cloudinary endpoints to try
  const endpoints = [
    `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`,
    `https://res.cloudinary.com/v1_1/${config.cloud_name}/image/upload`,
    `https://${config.cloud_name}-res.cloudinary.com/v1_1/${config.cloud_name}/image/upload`
  ];
  
  // Convert buffer to base64 for more reliable upload
  const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  
  // Generate timestamp and signature
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${config.api_secret}`;
  const signature = createHash('sha1').update(paramsToSign).digest('hex');
  
  const uploadData = {
    file: base64Image,
    folder: folder,
    api_key: config.api_key,
    timestamp: timestamp.toString(),
    signature: signature
  };
  
  let lastError: Error | null = null;
  
  // Try each endpoint
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`☁️ Attempting Cloudinary upload via endpoint ${i + 1}/${endpoints.length}...`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds per attempt
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.secure_url) {
        throw new Error('No secure URL returned from Cloudinary');
      }
      
      console.log(`✅ Successfully uploaded to Cloudinary via endpoint ${i + 1}:`, result.secure_url);
      return result.secure_url;
      
    } catch (err) {
      const error = err as Error & { name?: string };
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.log(`⏱️ Endpoint ${i + 1} timed out, trying next...`);
      } else {
        console.log(`❌ Endpoint ${i + 1} failed: ${error.message}, trying next...`);
      }
      
      // If this is the last endpoint, don't continue
      if (i === endpoints.length - 1) {
        break;
      }
    }
  }
  
  // All endpoints failed
  console.error('❌ All Cloudinary endpoints failed');
  throw new Error(`Cloudinary upload failed on all endpoints. Last error: ${lastError?.message || 'Unknown error'}`);
};

// Fallback function to save image locally when Cloudinary fails
export const saveImageLocally = async (buffer: Buffer, originalName: string): Promise<string> => {
  const fs = (await import('fs')).promises;
  const path = await import('path');
  
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'schools');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
    console.log('Directory already exists or could not be created:', err);
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  const filename = `school-${timestamp}${extension}`;
  const filepath = path.join(uploadDir, filename);
  
  // Save file
  await fs.writeFile(filepath, buffer);
  
  // Return public URL
  return `/uploads/schools/${filename}`;
};

// Combined upload function with fallback
export const uploadImageWithFallback = async (buffer: Buffer, originalName: string, folder = 'schools'): Promise<{ url: string; isCloudinary: boolean }> => {
  try {
    console.log('🌤️ Attempting Cloudinary upload...');
    const cloudinaryUrl = await uploadToCloudinary(buffer, folder);
    console.log('✅ Cloudinary upload successful');
    return { url: cloudinaryUrl, isCloudinary: true };
  } catch (error) {
    console.log('⚠️ Cloudinary upload failed, falling back to local storage');
    console.error('Cloudinary error:', error);
    
    try {
      const localUrl = await saveImageLocally(buffer, originalName);
      console.log('✅ Local image save successful:', localUrl);
      return { url: localUrl, isCloudinary: false };
    } catch (localError) {
      console.error('❌ Local image save also failed:', localError);
      throw new Error('Both Cloudinary and local image storage failed');
    }
  }
};

// Helper to delete an image from Cloudinary (optional, for future use)
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
  const regex = /upload\/v\d+\/([^/]+)\.\w+$/;
  const matches = regex.exec(url);
  return matches ? matches[1] : null;
};

export default cloudinary;
