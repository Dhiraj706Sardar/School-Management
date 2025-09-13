import { v2 as cloudinaryBase, UploadApiResponse, UploadApiErrorResponse, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import https from 'https';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ensureUploadsDir = async () => {
  if (!await exists(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Development mode file upload
const uploadToLocal = async (buffer: Buffer, filename: string): Promise<{ url: string; public_id: string }> => {
  await ensureUploadsDir();
  const publicId = `dev-${Date.now()}-${filename}`;
  const filePath = path.join(UPLOAD_DIR, publicId);
  await writeFile(filePath, buffer);
  return {
    url: `/uploads/${publicId}`,
    public_id: publicId
  };
};

// Extend Cloudinary types to include upload_stream
declare module 'cloudinary' {
  interface UploadApi {
    upload_stream(
      options: UploadApiOptions, 
      callback?: (error?: UploadApiErrorResponse, result?: UploadApiResponse) => void
    ): NodeJS.ReadableStream & { on: (event: string, callback: (result: UploadApiResponse) => void) => void };
  }
}

// Log configuration (without sensitive data)
const logConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '***SET***' : 'NOT_SET',
  api_key: process.env.CLOUDINARY_API_KEY ? '***SET***' : 'NOT_SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT_SET',
  upload_preset: 'school_images_unsigned',
  folder: 'school_images'
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
    upload_stream: () => ({
      on: (event: string, callback: (error: Error) => void) => {
        if (event === 'error') {
          callback(new Error('Cloudinary not configured'));
        }
        return { pipe: () => {} };
      }
    }),
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
    // Configure with optimized settings
    const config: Record<string, string | number | boolean | undefined> = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
      cdn_subdomain: false,
      upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'school_images_unsigned',
      timeout: 60000, // 60 seconds timeout
      chunk_size: 6000000, // 6MB chunks for large files
      cname: 'api.cloudinary.com',
      upload_prefix: 'https://api.cloudinary.com/v1_1',
      secure_distribution: undefined, // Use undefined instead of null
      private_cdn: false,
      shorten: false,
      sign_url: false,
      long_url_signature: false,
      force_version: true,
    };
    
    // Apply configuration
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined) {
        cloudinaryBase.config(key, value);
      }
    });
    
    // Configure agent for better connection handling
    const agentOptions: https.AgentOptions = {
      keepAlive: true,
      maxSockets: 25,
      timeout: 60000, // 60 seconds
      rejectUnauthorized: true
    };
    const agent = new https.Agent(agentOptions);
    
    // Add agent to config
    // Safely extend the config with agent
    const cloudinaryConfig = cloudinaryBase.config() as Record<string, unknown>;
    if (cloudinaryConfig) {
      const apiConfig = (cloudinaryConfig.api || {}) as Record<string, unknown>;
      cloudinaryConfig.api = {
        ...apiConfig,
        agent: agent
      };
    }

    console.log('✅ Cloudinary configured successfully');
    return cloudinaryBase;
  } catch (error) {
    console.error('❌ Failed to configure Cloudinary:', error);
    return createMockCloudinary();
  }
};

export const cloudinary = initCloudinary();

interface UploadOptions {
  folder?: string;
  use_filename?: boolean;
  unique_filename?: boolean;
  overwrite?: boolean;
  upload_preset?: string;
}

interface UploadResult {
  url: string;
  public_id: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

/**
 * Uploads a file to Cloudinary
 * @param buffer - The file buffer to upload
 * @param options - Upload options
 * @returns Promise that resolves with the secure URL of the uploaded file
 */
export const uploadToCloudinary = async (
  buffer: Buffer,
  options: UploadOptions & { filename?: string } = {}
): Promise<UploadResult> => {
  // Use local storage in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Using local file storage (development mode)');
    try {
      const filename = options.filename || `file-${Date.now()}`;
      const result = await uploadToLocal(buffer, filename);
      console.log('✅ File saved locally:', result);
      return result;
    } catch (error) {
      console.error('❌ Local file upload failed:', error);
      throw new Error('Failed to save file locally');
    }
  }

  // Production: Use Cloudinary
  if (!cloudinary) {
    console.error('❌ Cloudinary not configured');
    throw new Error('Cloudinary not configured');
  }

  // Set default options
  const uploadOptions: UploadApiOptions = {
    folder: 'school_images',
    use_filename: true,
    unique_filename: false,
    overwrite: false,
    upload_preset: 'school_images_unsigned',
    resource_type: 'auto',
    ...options
  };

  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(new Error(error.message || 'Failed to upload file to Cloudinary'));
            return;
          }
          if (!result?.secure_url) {
            console.error('❌ Invalid Cloudinary response:', result);
            reject(new Error('No secure URL returned from Cloudinary'));
            return;
          }
          
          console.log('✅ File uploaded to Cloudinary:', {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height
          });
          
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height
          });
        }
      );

      // Handle upload stream errors
      uploadStream.on('error', (error: Error) => {
        const errorMessage = `Upload stream error: ${error.message || 'Unknown error'}`;
        console.error(`❌ ${errorMessage}`);
        reject(new Error(errorMessage));
      });
      
      // Pipe the buffer to the upload stream
      const stream = Readable.from(buffer);
      (stream as NodeJS.ReadableStream).pipe(uploadStream as unknown as NodeJS.WritableStream);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during upload';
      console.error('❌ Error in uploadToCloudinary:', errorMessage);
      reject(new Error(`Upload failed: ${errorMessage}`));
    }
  });
};

/**
 * Deletes a file from Cloudinary using its public ID
 * @param publicId - The public ID of the file to delete
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Handle local file deletion in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { existsSync, unlinkSync } = await import('fs');
      const { join } = await import('path');
      const filePath = join(process.cwd(), 'public', 'uploads', publicId);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        console.log(`✅ Successfully deleted local file: ${publicId}`);
      } else {
        console.warn(`⚠️ File not found: ${publicId}`);
      }
      return;
    } catch (error) {
      console.error('❌ Error deleting local file:', error);
      throw new Error('Failed to delete local file');
    }
  }

  // Production: Delete from Cloudinary
  if (!cloudinary) {
    console.error('❌ Cloudinary not configured');
    throw new Error('Cloudinary not configured');
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Successfully deleted ${publicId} from Cloudinary`);
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

/**
 * Extracts the public ID from a Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns The public ID or null if not found
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  const regex = /upload\/v\d+\/([^/]+)\.\w+$/;
  const match = regex.exec(url);
  return match ? match[1] : null;
};
