'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useAuth(redirectTo = '/login') {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', { 
          credentials: 'include' 
        });
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          if (redirectTo) {
            const redirectUrl = `${redirectTo}?from=${encodeURIComponent(pathname)}`;
            router.push(redirectUrl);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, redirectTo, router]);

  return { isAuthenticated, user, loading };
}
