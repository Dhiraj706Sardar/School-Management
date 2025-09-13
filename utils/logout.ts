import { clearAuthCookie } from './auth';

export const handleLogout = async (redirectTo: string = '/login') => {
  try {
    // Clear all auth data on the client side
    clearAuthCookie();
    
    // Clear any application-specific state if needed
    if (typeof window !== 'undefined') {
      // Clear any application state from context or state management
      window.dispatchEvent(new Event('logout'));
      
      // Redirect to login page
      window.location.href = redirectTo;
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if there's an error, still try to redirect
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }
};

// Add a global logout function for easy access from browser console (for debugging)
declare global {
  interface Window {
    forceLogout: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.forceLogout = () => {
    handleLogout().catch(console.error);
  };
}
