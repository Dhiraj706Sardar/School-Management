'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Clear client-side storage first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
      }
      
      // Call the server-side logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      // Redirect to login page
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, we should still redirect to login
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      aria-label={isLoading ? 'Logging out...' : 'Logout'}
    >
      {isLoading ? (
        <span className="flex items-center">
          <span className="animate-spin mr-2">↻</span>
          <span>Logging out...</span>
        </span>
      ) : (
        <span className="flex items-center">
          <span className="mr-2">🚪</span>
          <span>Logout</span>
        </span>
      )}
    </button>
  );
}
