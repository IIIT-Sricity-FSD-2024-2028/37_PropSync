import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getOwnerComplaints, getOwnerPayments } from '../services/ownerService';
import { getNotifications } from '../services/notificationService';

const OwnerContext = createContext(null);

export function OwnerProvider({ children }) {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile management dynamically sourced from backend authenticated currentUser
  const [ownerProfile, setOwnerProfileState] = useState(() => {
    try {
      const email = currentUser?.email;
      const key = email ? `ownerProfile:${email}` : null;
      const saved = key ? localStorage.getItem(key) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...currentUser, ...parsed };
        }
      }
      return currentUser || {};
    } catch {
      return currentUser || {};
    }
  });

  useEffect(() => {
    if (currentUser) {
      setOwnerProfileState((prev) => ({ ...currentUser, ...prev }));
    }
  }, [currentUser]);

  const updateProfile = (updatedData) => {
    const newProfile = { ...ownerProfile, ...updatedData };
    setOwnerProfileState(newProfile);
    const email = currentUser?.email;
    const key = email ? `ownerProfile:${email}` : 'ownerProfile';
    localStorage.setItem(key, JSON.stringify(newProfile));
  };

  const refreshComplaints = async () => {
    if (!currentUser) return;
    try {
      const ownerId = currentUser.id || 1;
      const data = await getOwnerComplaints(ownerId, currentUser);
      setComplaints(data);
    } catch (err) {
      console.warn('Error fetching owner complaints:', err);
    }
  };

  const refreshNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await getNotifications(currentUser);
      setNotifications(data);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  const refreshPayments = async () => {
    if (!currentUser) return;
    try {
      const ownerId = currentUser.id || 1;
      const data = await getOwnerPayments(ownerId, currentUser);
      setPayments(data || []);
    } catch (err) {
      console.warn('Error fetching owner payments:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([refreshComplaints(), refreshNotifications(), refreshPayments()]).finally(() => {
        setLoading(false);
      });
    }
  }, [currentUser]);

  return (
    <OwnerContext.Provider
      value={{
        complaints,
        notifications,
        payments,
        ownerProfile,
        updateProfile,
        refreshComplaints,
        refreshNotifications,
        refreshPayments,
        loading,
        error
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwner must be used within an OwnerProvider');
  }
  return context;
}
