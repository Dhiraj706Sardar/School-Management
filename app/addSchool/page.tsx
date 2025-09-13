'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';

interface UploadResult {
  url: string;
  public_id: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

interface SchoolFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image: FileList;
  imageData?: UploadResult; // To store the upload result
}

function AddSchoolContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: '', isError: false });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  
  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type using RegExp.exec()
      const imageTypeRegex = /^image\/(jpeg|png|webp)$/;
      if (!imageTypeRegex.exec(file.type)) {
        setSubmitMessage({ 
          text: 'Only JPG, PNG, and WebP images are allowed', 
          isError: true 
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitMessage({ 
          text: 'Image size must be less than 5MB', 
          isError: true 
        });
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setSubmitMessage({ text: '', isError: false });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SchoolFormData>();


  // Handle image upload and validation
  const handleImageUpload = async (imageFile: File): Promise<{ url: string; public_id: string }> => {
    // Validate image type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
      throw new Error('Invalid image format. Only JPG, PNG, and WebP are allowed.');
    }
    
    // Validate image size
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'school_images_unsigned');
    formData.append('folder', 'schools');

    // Upload directly to Cloudinary using their API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  };

  // Clean up uploaded image if school creation fails
  const cleanupImageOnError = async (publicId: string) => {
    if (!publicId) return;
    
    try {
      // Delete directly using Cloudinary API
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded image:', cleanupError);
    }
  };


  // Check if user is authenticated (skipped in development)
  const checkAuthentication = async (): Promise<boolean> => {
    // Skip auth check in development to avoid network issues
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping auth check in development');
      return true;
    }

    try {
      const response = await fetch('/api/auth/check', { 
        credentials: 'include',
        signal: AbortSignal.timeout(3000) // Shorter timeout for faster feedback
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Auth check failed:', response.status, errorData);
        return false;
      }
      
      return true;
    } catch (error) {
      // Don't block submission on network errors - server will validate
      console.warn('Auth check warning:', error instanceof Error ? error.message : error);
      return true;
    }
  };

  // Handle form submission errors
  const handleSubmissionError = (error: unknown, publicId: string = '') => {
    console.error('Form submission error:', error);
    
    // Default error message
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let shouldRedirectToLogin = false;
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        errorMessage = 'Your session has expired. Redirecting to login...';
        shouldRedirectToLogin = true;
      } else {
        errorMessage = error.message || errorMessage;
      }
    }
    
    // Update UI with error message
    setSubmitMessage({ 
      text: `❌ ${errorMessage}`,
      isError: true 
    });
    
    // Clean up uploaded image if there was an error
    if (publicId) {
      cleanupImageOnError(publicId).catch(console.error);
    }
    
    // Redirect to login if needed
    if (shouldRedirectToLogin) {
      console.log('Redirecting to login due to authentication error');
      const returnUrl = encodeURIComponent(window.location.pathname);
      setTimeout(() => {
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }, 2000);
    }
  };

  // Handle successful submission
  const handleSuccessfulSubmission = () => {
    setSubmitMessage({ 
      text: '✅ School added successfully! Redirecting to schools...', 
      isError: false 
    });
    
    // Clear the form
    reset();
    setImagePreview(null);
    
    // Redirect to showSchools page after a short delay
    setTimeout(() => {
      window.location.href = '/showSchools';
    }, 1000);
  };

  // Process image upload if needed
  const processImageUpload = async (imageFile: File) => {
    if (!imageFile) return { url: '', public_id: '' };
    
    try {
      const uploadResult = await handleImageUpload(imageFile);
      return { 
        url: uploadResult.url, 
        public_id: uploadResult.public_id 
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const onSubmit = async (data: SchoolFormData) => {
    setIsSubmitting(true);
    setSubmitMessage({ text: 'Saving school information...', isError: false });

    let publicId = '';
    let imageUrl = '';

    try {
      // Try to process image first (if any)
      if (data.image?.[0]) {
        const uploadResult = await processImageUpload(data.image[0]);
        imageUrl = uploadResult.url;
        publicId = uploadResult.public_id;
      }
      
      // Check authentication (non-blocking in development)
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        // If not authenticated, redirect to login with a return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?returnUrl=${returnUrl}`;
        return;
      }

      // Prepare and send the request
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name.trim(),
          address: data.address.trim(),
          city: data.city.trim(),
          state: data.state.trim(),
          contact: data.contact.trim(),
          email_id: data.email_id.trim().toLowerCase(),
          image_url: imageUrl,
          image_public_id: publicId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to add school');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add school');
      }

      handleSuccessfulSubmission();
      
    } catch (error) {
      handleSubmissionError(error, publicId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Add New School
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* School Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                School Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: 'School name is required' })}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Enter school name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="mb-4">
              <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
                Address
              </label>
              <textarea
                id="address"
                {...register('address', {
                  required: 'Address is required',
                  minLength: { value: 10, message: 'Address must be at least 10 characters' }
                })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                placeholder="Enter complete address"
              />
              {errors.address && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.address.message as string}
                </p>
              )}
            </div>

            {/* City and State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-2">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City"
                />
                {errors.city && (
                  <p className="text-red-500 text-xs italic mt-1">
                    {errors.city.message as string}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="state" className="block text-gray-700 text-sm font-bold mb-2">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  {...register('state', { required: 'State is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State"
                />
                {errors.state && (
                  <p className="text-red-500 text-xs italic mt-1">
                    {errors.state.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="mb-4">
              <label htmlFor="contact" className="block text-gray-700 text-sm font-bold mb-2">
                Contact Number
              </label>
              <input
                id="contact"
                type="tel"
                {...register('contact', {
                  required: 'Contact number is required',
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Please enter a valid 10-digit phone number'
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit number"
              />
              {errors.contact && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.contact.message as string}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email_id" className="block text-gray-700 text-sm font-bold mb-2">
                Email Address
              </label>
              <input
                id="email_id"
                type="email"
                {...register('email_id', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="school@example.com"
              />
              {errors.email_id && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.email_id.message as string}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                School Image {!imagePreview && '(Optional)'}
              </label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div className="relative w-full max-w-xs h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="School preview"
                      fill
                      className="object-cover"
                      priority
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        // Reset the file input
                        const fileInput = document.getElementById('image') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* File Input */}
              <div className="flex items-center">
                <label 
                  htmlFor="image"
                  className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {imagePreview ? 'Change Image' : 'Choose Image'}
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="sr-only"
                  {...register('image', {
                    onChange: handleImageChange
                  })}
                />
                {!imagePreview && (
                  <span className="ml-4 text-sm text-gray-500">
                    JPG, PNG, or WebP (max 5MB)
                  </span>
                )}
              </div>
              
              {/* Error message */}
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.image.message as string}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Add School'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/showSchools')}
                className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>

            {/* Status Message */}
            {submitMessage.text && (
              <div className={`mt-4 p-3 rounded ${
                submitMessage.isError 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
                {submitMessage.text}
              </div>
            )}
          </form>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/showSchools')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Schools →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddSchool() {
  return (
    <ProtectedRoute>
      <AddSchoolContent />
    </ProtectedRoute>
  );
}