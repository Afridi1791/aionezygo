import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthError } from 'firebase/auth';
import { auth, createUserProfile, getUserProfile, listenToUserProfile, UserData } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Create or update user in Firestore with retry logic
  const createOrUpdateUser = async (firebaseUser: User, retryCount = 0) => {
    try {
      // Check if user profile already exists
      const existingProfile = await getUserProfile(firebaseUser.uid);
      
      if (existingProfile) {
        // Check if user should be admin
        const isAdmin = firebaseUser.email === 'afridigt7@gmail.com';
        if (isAdmin && !existingProfile.isAdmin) {
          // Update admin status
          const updatedProfile = {
            ...existingProfile,
            isAdmin: true,
            credits: 999999
          };
          await createUserProfile(firebaseUser);
          setUserData(updatedProfile);
        } else {
          setUserData(existingProfile);
        }
      } else {
        // Create new profile if doesn't exist
        const userProfile = await createUserProfile(firebaseUser);
        setUserData(userProfile);
      }
      
      // Listen to user data changes
      const unsubscribeProfile = listenToUserProfile(firebaseUser.uid, (data) => {
        if (data) {
          console.log('AuthContext Debug - User Data Updated:', data);
          setUserData(data);
        }
      });

      return unsubscribeProfile;
      
    } catch (error) {
      console.error('Error creating/updating user:', error);
      
      // Retry logic for Firestore errors
      if (retryCount < 3 && error instanceof Error && error.message.includes('Firestore')) {
        console.log(`Retrying user creation/update (${retryCount + 1}/3)...`);
        setTimeout(() => createOrUpdateUser(firebaseUser, retryCount + 1), 2000);
      } else {
        setAuthError('Failed to load user data. Please refresh the page.');
        toast.error('Failed to load user data. Please refresh the page.');
      }
    }
  };

  // Initialize auth with retry logic
  const initializeAuth = async (retryCount = 0) => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            setCurrentUser(user);
            // Don't wait for createOrUpdateUser to complete before setting loading to false
            // This prevents the loading state from blocking the UI
            createOrUpdateUser(user).catch(error => {
              console.error('Error creating/updating user:', error);
              // Don't set auth error for user creation issues, just log them
            });
          } else {
            setCurrentUser(null);
            setUserData(null);
          }
          setAuthError(null);
          setLoading(false);
        } catch (error) {
          console.error('Error in auth state change:', error);
          setAuthError('Authentication error. Please refresh the page.');
          setLoading(false);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing auth:', error);
      
      // Retry logic for auth initialization
      if (retryCount < 3) {
        console.log(`Retrying auth initialization (${retryCount + 1}/3)...`);
        setTimeout(() => initializeAuth(retryCount + 1), 3000);
      } else {
        setAuthError('Failed to initialize authentication. Please refresh the page.');
        setLoading(false);
        toast.error('Authentication failed. Please refresh the page.');
      }
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    initializeAuth();
  }, []);

  // Retry authentication
  const retryAuth = async () => {
    setLoading(true);
    setAuthError(null);
    await initializeAuth();
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      setUserData(null);
      setCurrentUser(null);
      setLoading(false);
      toast.success('Logged out successfully');
    } catch (error) {
      setLoading(false);
      toast.error('Logout failed');
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    logout,
    retryAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {authError && !loading ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary border border-border-primary rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Authentication Error</h3>
              <p className="text-text-secondary mb-4">{authError}</p>
              <button
                onClick={retryAuth}
                className="bg-gradient-accent text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
