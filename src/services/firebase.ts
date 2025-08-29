import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs, enableNetwork, disableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyeoZp656wR0y5rn4Z0-rQKO83QTYgCgw",
  authDomain: "one-zygo-ai.firebaseapp.com",
  projectId: "one-zygo-ai",
  storageBucket: "one-zygo-ai.firebasestorage.app",
  messagingSenderId: "843559126098",
  appId: "1:843559126098:web:c14e89a7ebbc69934f8b8b",
  measurementId: "G-RHVX0X4H7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to LOCAL to maintain auth state across page refreshes
try {
  setPersistence(auth, browserLocalPersistence);
} catch (error) {
  console.warn('Failed to set auth persistence:', error);
}

auth.useDeviceLanguage();

// Add connection retry and error handling for Firestore
let connectionRetries = 0;
const maxRetries = 3;

export const initializeFirestore = async () => {
  try {
    // Enable network connection
    await enableNetwork(db);
    connectionRetries = 0;
    console.log('Firestore connected successfully');
  } catch (error) {
    console.error('Firestore connection error:', error);
    if (connectionRetries < maxRetries) {
      connectionRetries++;
      console.log(`Retrying Firestore connection (${connectionRetries}/${maxRetries})...`);
      setTimeout(initializeFirestore, 2000 * connectionRetries);
    } else {
      console.error('Max Firestore connection retries reached');
    }
  }
};

// Initialize connection
initializeFirestore();

// Authentication functions
export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => 
  onAuthStateChanged(auth, callback);

// User data interface
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  credits: number;
  totalMessages: number;
  isAdmin: boolean;
  plan: 'free' | 'basic' | 'pro';
  planExpiry?: Date;
}

// Firestore functions
export const createUserProfile = async (user: User) => {
  // Check if user profile already exists
  const existingProfile = await getUserProfile(user.uid);
  if (existingProfile) {
    // Update admin status for existing users
    const isAdmin = user.email === 'afridigt7@gmail.com';
    if (isAdmin && !existingProfile.isAdmin) {
      const updatedProfile = {
        ...existingProfile,
        isAdmin: true,
        credits: 999999
      };
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      return updatedProfile;
    }
    return existingProfile;
  }

  const isAdmin = user.email === 'afridigt7@gmail.com';
  const userData: UserData = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    createdAt: new Date(),
    credits: isAdmin ? 999999 : 3, // Admin gets unlimited, free users get 3
    totalMessages: 0,
    isAdmin: isAdmin,
    plan: 'free'
  };

  await setDoc(doc(db, 'users', user.uid), userData);
  return userData;
};

export const getUserProfile = async (uid: string): Promise<UserData | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

export const updateUserCredits = async (uid: string, newCredits: number) => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    credits: newCredits,
    totalMessages: newCredits === 4 ? 1 : 5 - newCredits // Update message count
  });
};

export const listenToUserProfile = (uid: string, callback: (data: UserData | null) => void) => {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserData);
    } else {
      callback(null);
    }
  });
};

// Manual admin update function
export const makeUserAdmin = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    isAdmin: true,
    credits: 999999,
    plan: 'pro'
  });
  console.log('Admin status updated for user:', uid);
};

// Force update admin for specific email
export const forceUpdateAdmin = async (email: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(userDoc.ref, {
        isAdmin: true,
        credits: 999999,
        plan: 'pro'
      });
      console.log('Force admin update successful for:', email);
      return true;
    } else {
      console.log('User not found with email:', email);
      return false;
    }
  } catch (error) {
    console.error('Error in force update admin:', error);
    return false;
  }
};

export default app;
