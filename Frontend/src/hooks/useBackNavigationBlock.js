import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Custom hook to completely block back navigation from dashboards
 * This prevents users from going back to any previous page using Alt+Arrow or browser back button
 * Only activates when user is authenticated
 */
export const useBackNavigationBlock = () => {
  const { isAuthenticated } = useAuth();
  const popStateHandlerRef = useRef(null);
  const keyDownHandlerRef = useRef(null);

  useEffect(() => {
    // Only block back navigation if user is authenticated
    if (!isAuthenticated) {
      console.log('🔓 User not authenticated, skipping back navigation block');
      return;
    }

    console.log('🚫 Activating complete back navigation block');

    // Define handlers with refs to maintain references
    popStateHandlerRef.current = (event) => {
      console.log('🚫 Popstate event intercepted');
      event.preventDefault();
      event.stopImmediatePropagation();
      
      // Push current state again to maintain the block
      window.history.pushState(null, null, window.location.href);
      console.log('🚫 Back navigation completely blocked');
    };

    keyDownHandlerRef.current = (event) => {
      // Block Alt+Left Arrow and Alt+Right Arrow
      if ((event.altKey && event.key === 'ArrowLeft') || 
          (event.altKey && event.key === 'ArrowRight')) {
        console.log('🚫 Alt+Arrow navigation blocked:', event.key);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add event listeners to block back navigation
    window.addEventListener('popstate', popStateHandlerRef.current);
    window.addEventListener('keydown', keyDownHandlerRef.current);

    // Push current state to history stack to establish a baseline
    window.history.pushState(null, null, window.location.href);

    // Cleanup event listeners when user logs out or component unmounts
    return () => {
      console.log('🔓 Deactivating back navigation block');
      
      if (popStateHandlerRef.current) {
        window.removeEventListener('popstate', popStateHandlerRef.current);
        popStateHandlerRef.current = null;
      }
      
      if (keyDownHandlerRef.current) {
        window.removeEventListener('keydown', keyDownHandlerRef.current);
        keyDownHandlerRef.current = null;
      }
      
      console.log('🔓 All event listeners removed');
    };
  }, [isAuthenticated]); // Re-run when authentication state changes

  return isAuthenticated; // Return whether blocking is active
};
