'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the LoginForm component with no SSR
const LoginForm = dynamic(() => import('./LoginForm'), { ssr: false });

// This component is needed to properly handle the search params with Suspense
function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/';
  
  return <LoginForm redirectTo={redirectTo} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
