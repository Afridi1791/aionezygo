import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { UserData } from '../services/firebase';

export const useAdmin = () => {
  const { currentUser: user, userData } = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = userData?.isAdmin || false;

  const fetchAllUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const users: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          planExpiry: data.planExpiry?.toDate()
        } as UserData);
      });
      
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: string, plan: 'free' | 'basic' | 'pro', credits: number) => {
    if (!isAdmin) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        plan,
        credits,
        planExpiry: plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days for paid plans
      });
      
      // Refresh users list
      await fetchAllUsers();
    } catch (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchAllUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const resetUserCredits = async (userId: string) => {
    if (!isAdmin) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        credits: 3,
        totalMessages: 0
      });
      
      await fetchAllUsers();
    } catch (error) {
      console.error('Error resetting user credits:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  return {
    isAdmin,
    allUsers,
    loading,
    fetchAllUsers,
    updateUserPlan,
    deleteUser,
    resetUserCredits
  };
};
