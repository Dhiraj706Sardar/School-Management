import { v2 as cloudinaryBase, UploadApiResponse } from 'cloudinary';

// Log configuration (without sensitive data)
const logConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '***SET***' : 'NOT_SET',
  api_key: process.env.CLOUDINARY_API_KEY ? '***SET***' : 'NOT_SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT_SET',
};

console.log('☁️ Cloudinary Configuration:', logConfig);

// Create a mock implementation for when Cloudinary is not configured
const createMockCloudinary = () => ({
  config: () => ({
    cloud_name: 'mock',
    api_key: 'mock',
    api_secret: 'mock',
  }),
  uploader: {
    upload: (): Promise<UploadApiResponse> => Promise.reject(new Error('Cloudinary not configured')),
    destroy: (): Promise<{ result: string }> => Promise.reject(new Error('Cloudinary not configured')),
  },
  utils: {
    url: () => ({
      generate: () => ''
    })
  }
});

// Initialize Cloudinary with environment variables
const initCloudinary = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary environment variables not set. File uploads will not work.');
    return createMockCloudinary();
  }

  try {
    cloudinaryBase.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
      upload_prefix: 'https://api.cloudinary.com',
      force_version: false,
    });
    console.log('✅ Cloudinary configured successfully');
    return cloudinaryBase;
  } catch (error) {
    console.error('❌ Failed to configure Cloudinary:', error);
    return createMockCloudinary();
  }
};

export const cloudinary = initCloudinary();

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

export const uploadToCloudinary = async (buffer: Buffer, folder = 'schools'): Promise<string> => {
  const config = cloudinary.config() as unknown as CloudinaryConfig;
  
  // If using mock Cloudinary (no environment variables set)
  if (config.cloud_name === 'mock') {
    throw new Error('Cloudinary is not configured. Please set up Cloudinary environment variables for file uploads.');
  }
  
  try {
    // Convert buffer to base64 for upload
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      base64Image,
      {
        folder,
        resource_type: 'auto',
        timeout: 30000, // 30 seconds timeout
      }
    );
    
    if (!result.secure_url) {
      throw new Error('No URL returned from Cloudinary');
    }
    
    return result.secure_url;
  } catch (error) {
    console.error('Failed to upload to Cloudinary:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const getPublicIdFromUrl = (url: string): string | null => {
  const matches = url.match(/upload\/v\d+\/([^/]+)\.\w+$/);
  return matches ? matches[1] : null;
};
