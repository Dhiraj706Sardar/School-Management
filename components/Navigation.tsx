'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';

export default function Navigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex
           space-x-8">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                School Management
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                href="/showSchools"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/showSchools')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                View Schools
              </Link>
              <Link
                href="/addSchool"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/addSchool')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Add School
              </Link>
            </div>
          </div>
          <div className="flex items-center
           space-x-4">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
