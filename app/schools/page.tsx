'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

function SchoolsContent() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/schools', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch schools');
        }

        const data = await response.json();
        setSchools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
          <button
            onClick={() => router.push('/addSchool')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New School
          </button>
        </div>

        {schools.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">No schools found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school) => (
              <div
                key={school.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
              >
                {school.image_url ? (
                  <img
                    src={school.image_url}
                    alt={school.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{school.name}</h2>
                  <p className="text-gray-600 mb-2">{school.address}</p>
                  <p className="text-gray-600 mb-2">
                    {school.city}, {school.state}
                  </p>
                  <p className="text-gray-600 mb-2">{school.contact}</p>
                  <p className="text-blue-600 mb-4">{school.email_id}</p>
                  <button
                    onClick={() => router.push(`/schools/${school.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <ProtectedRoute>
      <SchoolsContent />
    </ProtectedRoute>
  );
}
