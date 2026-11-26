import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from './AuthContext';
import { getOwnerComplaints, getOwnerPayments, deleteComplaint as apiDeleteComplaint } from '../services/ownerService';
import { getNotifications, deleteNotification } from '../services/notificationService';
import {
  setComplaints as setComplaintsAction,
  deleteComplaint as deleteComplaintAction,
} from '../redux/features/complaints/complaintsSlice';
import {
  setNotifications as setNotificationsAction,
  cancelComplaintNotifications,
  isComplaintNotification,
} from '../redux/features/notifications/notificationsSlice';

const OwnerContext = createContext(null);

export function OwnerProvider({ children }) {
  const { currentUser } = useAuth();
  const dispatch = useDispatch();
  const reduxComplaints = useSelector((state) => state.complaints);
  const reduxNotifications = useSelector((state) => state.notifications);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
      dispatch(setComplaintsAction(data));
    } catch (err) {
      console.warn('Error fetching owner complaints:', err);
    }
  };

  const removeComplaint = async (id) => {
    try {
      await apiDeleteComplaint(id, currentUser);
    } catch (err) {
      console.warn('API delete complaint failed:', err);
    }

    dispatch(deleteComplaintAction(id));
    dispatch(cancelComplaintNotifications(id));

    // When the owner deletes the complaint, delete any matching notifications from backend so they are wiped
    const notifsToDelete = (notifications || []).filter((n) => isComplaintNotification(n, id));
    for (const notif of notifsToDelete) {
      if (notif?.id) {
        deleteNotification(notif.id, currentUser).catch(() => {});
      }
    }

    setComplaints((prev) => prev.filter((c) => String(c.id) !== String(id)));
    setNotifications((prev) => prev.filter((n) => !isComplaintNotification(n, id)));
  };

  const refreshNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await getNotifications(currentUser);
      setNotifications(data);
      if (Array.isArray(data)) {
        dispatch(setNotificationsAction(data));
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([refreshComplaints(), refreshNotifications()]).finally(() => {
        setLoading(false);
      });
    }
  }, [currentUser]);

  return (
    <OwnerContext.Provider
      value={{
        complaints: reduxComplaints.length > 0 ? reduxComplaints : complaints,
        notifications: reduxNotifications.length > 0 ? reduxNotifications : notifications,
        payments,
        ownerProfile,
        updateProfile,
        refreshComplaints,
        removeComplaint,
        refreshNotifications,
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
