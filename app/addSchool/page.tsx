'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

interface SchoolFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image: FileList;
}

function AddSchoolContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ text: '', isError: false });
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SchoolFormData>();


  const onSubmit = async (data: SchoolFormData) => {
    setIsSubmitting(true);
    setSubmitMessage({ text: '', isError: false });

    try {
      // Get the token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('school_management_token='))
        ?.split('=')[1];

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('contact', data.contact);
      formData.append('email_id', data.email_id);

      if (data.image?.[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add school');
      }

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({ 
          text: 'School added successfully! Redirecting...', 
          isError: false 
        });
        reset();
        // Redirect to schools list after 1.5 seconds
        setTimeout(() => {
          router.push('/showSchools');
        }, 1500);
      } else {
        setSubmitMessage({ 
          text: `Error: ${result.error}`,
          isError: true 
        });
      }
    } catch (error) {
      setSubmitMessage({ 
        text: error instanceof Error ? error.message : 'Error adding school. Please try again.',
        isError: true 
      });
      console.error('Error:', error);
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

            {/* School Image */}
            <div className="mb-6">
              <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">
                School Image
              </label>
              <div className="mt-1 flex items-center">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  {...register('image')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Upload a high-quality image of the school (optional)
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Adding School...' : 'Add School'}
              </button>
            </div>

            {/* Success/Error Message */}
            {submitMessage.text && (
              <div className={`mb-4 p-4 rounded ${
                submitMessage.isError 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
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