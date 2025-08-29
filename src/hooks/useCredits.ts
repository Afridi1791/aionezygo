import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserCredits } from '../services/firebase';

export const useCredits = () => {
  const { currentUser: user, userData, loading } = useAuth();
  const [credits, setCredits] = useState(5);
  const [canSendMessage, setCanSendMessage] = useState(false);

  useEffect(() => {
    if (userData) {
      setCredits(userData.credits);
      setCanSendMessage(userData.credits > 0);
    } else if (!loading) {
      setCredits(0);
      setCanSendMessage(false);
    }
  }, [userData, loading]);

  const useCredit = async () => {
    if (!user || !userData || credits <= 0) {
      throw new Error('No credits available');
    }

    const newCredits = credits - 1;
    setCredits(newCredits);
    
    try {
      await updateUserCredits(user.uid, newCredits);
      setCanSendMessage(newCredits > 0);
    } catch (error) {
      // Revert on error
      setCredits(credits);
      throw error;
    }
  };

  const checkCredits = () => {
    if (!user) {
      throw new Error('Please sign in to send messages');
    }
    
    if (credits <= 0) {
      throw new Error('No credits remaining. Please wait for credits to refresh or upgrade your plan.');
    }
  };

  return {
    credits,
    canSendMessage,
    useCredit,
    checkCredits,
    isLoggedIn: !!user
  };
};
