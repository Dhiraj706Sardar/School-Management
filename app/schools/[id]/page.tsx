'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';

interface School {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function SchoolDetailContent() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const schoolId = params?.id;

  useEffect(() => {
    const fetchSchool = async () => {
      if (!schoolId) return;
      
      try {
        const response = await fetch(`/api/schools/${schoolId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch school details');
        }

        const data = await response.json();
        setSchool(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">School not found</h2>
            <p className="text-gray-600 mb-4">The requested school could not be found.</p>
            <Link 
              href="/schools" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Schools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/schools" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Schools
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {school.image_url ? (
            <div className="relative w-full h-64">
              <Image
                src={school.image_url}
                alt={school.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image Available</span>
            </div>
          )}

          <div className="px-6 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{school.name}</h1>
                <p className="text-gray-600 mb-6">
                  {school.city}, {school.state}
                </p>
              </div>
              <Link
                href={`/schools/${school.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Edit School
              </Link>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.city}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">State</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.state}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact</dt>
                  <dd className="mt-1 text-sm text-gray-900">{school.contact}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-blue-600">{school.email_id}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Last updated: {new Date(school.updated_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to list
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchoolDetailPage() {
  return (
    <ProtectedRoute>
      <SchoolDetailContent />
    </ProtectedRoute>
  );
}
