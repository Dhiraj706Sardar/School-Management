'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', { credentials: 'include' });
        const data = await response.json();
        setIsLoggedIn(data.authenticated);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setIsLoggedIn(false);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>;
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      Sign in
    </Link>
  );
}
