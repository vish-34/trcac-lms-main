import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Get token from localStorage with validation
const getStoredToken = () => {
  try {
    console.log('🔍 Checking localStorage...');
    const allKeys = Object.keys(localStorage);
    console.log('📋 localStorage keys:', allKeys);
    
    const storedToken = localStorage.getItem('token');
    console.log('📝 Raw token from localStorage:', storedToken);
    
    if (storedToken && storedToken.trim() !== '') {
      console.log('✅ Token found and not empty');
      return storedToken;
    } else {
      console.log('❌ Token is empty or null');
      return null;
    }
  } catch (error) {
    console.error('💥 Error reading token from localStorage:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken()); // Initialize with stored token
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Store token in localStorage with error handling
  const storeToken = (tokenToStore) => {
    try {
      if (tokenToStore && tokenToStore.trim() !== '') {
        console.log('💾 Storing token in localStorage:', tokenToStore.substring(0, 20) + '...');
        localStorage.setItem('token', tokenToStore);
        console.log('✅ Token stored successfully');
        console.log('🔍 Verification - localStorage.getItem("token"):', localStorage.getItem('token')?.substring(0, 20) + '...');
        return true;
      }
    } catch (error) {
      console.error('💥 Error storing token in localStorage:', error);
    }
    return false;
  };

  // Store user in localStorage with error handling
  const storeUser = (userToStore) => {
    try {
      if (userToStore) {
        console.log('💾 Storing user in localStorage:', userToStore.email);
        localStorage.setItem('user', JSON.stringify(userToStore));
        console.log('✅ User stored successfully');
        return true;
      }
    } catch (error) {
      console.error('💥 Error storing user in localStorage:', error);
    }
    return false;
  };

  // Remove token from localStorage
  const removeStoredToken = () => {
    try {
      console.log('🗑️ Removing token from localStorage...');
      console.log('🔍 Before removal - localStorage.getItem("token"):', localStorage.getItem('token')?.substring(0, 20) + '...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✅ Token and user removed successfully');
      console.log('🔍 After removal - localStorage.getItem("token"):', localStorage.getItem('token'));
    } catch (error) {
      console.error('💥 Error removing token from localStorage:', error);
    }
  };

  // Verify JWT token structure
  const isTokenValid = (tokenString) => {
    if (!tokenString || typeof tokenString !== 'string') return false;
    
    try {
      // Basic JWT structure check (header.payload.signature)
      const parts = tokenString.split('.');
      return parts.length === 3 && parts.every(part => part.length > 0);
    } catch (error) {
      return false;
    }
  };

  // Initialize authentication on mount
  useEffect(() => {
    if (initialized) {
      console.log('⏭️ Already initialized, skipping...');
      return;
    }

    const initializeAuth = async () => {
      console.log('🚀 Initializing authentication...');
      
      // Only proceed if we have a token
      if (token && isTokenValid(token)) {
        console.log('✅ Token already available, verifying with backend...');
        
        try {
          // Verify token with backend
          console.log('🔍 Verifying token with backend...');
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Backend response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Backend verification successful:', userData);
            
            if (userData && userData.user) {
              setUser(userData.user);
              storeUser(userData.user);
              console.log('👤 User authenticated:', userData.user.email, userData.user.role);
            } else {
              console.error('❌ Invalid user data received:', userData);
              throw new Error('Invalid user data received');
            }
          } else {
            const errorData = await response.json();
            console.error('❌ Token verification failed:', response.status, errorData);
            throw new Error(`Token verification failed: ${errorData.message || response.statusText}`);
          }
        } catch (error) {
          console.error('💥 Authentication initialization error:', error);
          // Clear invalid token
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('ℹ️ No valid token found, staying unauthenticated');
      }
      
      console.log('🏁 Authentication initialization completed');
      setLoading(false);
      setInitialized(true);
    };

    initializeAuth();
  }, [initialized, token]); // Include token as dependency

  // Update localStorage when token changes
  useEffect(() => {
    console.log('🔄 Token state changed:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (token && isTokenValid(token)) {
      console.log('💾 Token is valid, storing in localStorage...');
      storeToken(token);
    } else {
      console.log('🗑️ Token is invalid or null, removing from localStorage...');
      removeStoredToken();
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Validate received token
        if (isTokenValid(data.token)) {
          setToken(data.token);
          setUser(data.user);
          storeToken(data.token);
          storeUser(data.user);
          console.log('Login successful, user:', data.user);
          
          // Track login activity for students
          if (data.user?.role === 'student') {
            import('../utils/activityTracker.js').then(({ default: activityTracker }) => {
              activityTracker.setUser(data.user);
              activityTracker.trackLogin();
            }).catch(err => console.log('Failed to track login:', err));
          }
          
          return { success: true, user: data.user };
        } else {
          throw new Error('Invalid token received from server');
        }
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (userData, adminToken = null) => {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (adminToken && isTokenValid(adminToken)) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.token) {
        if (isTokenValid(data.token)) {
          setToken(data.token);
          setUser(data.user);
          storeToken(data.token);
          storeUser(data.user);
          return { success: true, user: data.user };
        } else {
          throw new Error('Invalid token received from server');
        }
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    console.log('🔓 Logging out user - cleaning up navigation blockers');
    
    // Clear authentication state first - this will trigger the hook cleanup
    removeStoredToken();
    setToken(null);
    setUser(null);
    
    console.log('🔓 User logged out successfully');
  };

  // Extract name from email (before @) and remove numbers, then format properly
  const extractNameFromEmail = (email) => {
    if (!email || typeof email !== 'string') return 'User';
    
    // Get the part before @
    const localPart = email.split('@')[0];
    
    // Remove all numbers and special characters, keep only letters and dots
    const nameWithDots = localPart.replace(/[^a-zA-Z.]/g, '');
    
    // Replace dots with spaces and split into words
    const words = nameWithDots.replace(/\./g, ' ').split(' ').filter(word => word.length > 0);
    
    if (words.length === 0) return 'User';
    
    // Capitalize first letter of each word
    const formattedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    
    // Join words with spaces
    const finalName = formattedWords.join(' ');
    
    return finalName || 'User';
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    extractNameFromEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
