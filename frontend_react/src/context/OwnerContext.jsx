// Owner context: complaints and notifications are read from Redux; every
// change goes through a thunk (backend first, Redux updated on success).
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "./AuthContext";
import {
  complaintListKey,
  deleteComplaint,
  fetchOwnerComplaints,
  selectComplaintList,
} from "../redux/features/complaints/complaintsSlice";
import {
  cancelComplaintNotifications,
  deleteNotification,
  fetchNotifications,
  isComplaintNotification,
} from "../redux/features/notifications/notificationsSlice";

const OwnerContext = createContext(null);

export function OwnerProvider({ children }) {
  const { currentUser } = useAuth();
  const dispatch = useDispatch();
  const ownerId = currentUser?.id || 1;
  const viewer = useMemo(
    () => ({ role: currentUser?.role || "owner", id: ownerId }),
    [currentUser?.role, ownerId],
  );
  const complaints = useSelector((state) =>
    selectComplaintList(state, complaintListKey.owner(ownerId)),
  );
  const notifications = useSelector((state) => state.notifications);
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
        if (parsed && typeof parsed === "object") {
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
    const key = email ? `ownerProfile:${email}` : "ownerProfile";
    localStorage.setItem(key, JSON.stringify(newProfile));
  };

  // READ: backend -> Redux
  const refreshComplaints = useCallback(async () => {
    if (!currentUser) return;
    try {
      await dispatch(fetchOwnerComplaints({ viewer, ownerId })).unwrap();
      setError(null);
    } catch (err) {
      console.warn("Error fetching owner complaints:", err);
      setError(err.message);
    }
  }, [currentUser, dispatch, viewer, ownerId]);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      await dispatch(fetchNotifications({ viewer })).unwrap();
    } catch (err) {
      console.warn("Error fetching notifications:", err);
    }
  }, [currentUser, dispatch, viewer]);

  // DELETE: backend first; Redux removes it only after success
  const removeComplaint = async (id) => {
    const target = complaints.find((c) => String(c.id) === String(id));
    if (target) {
      const s = (target.status || "").toLowerCase();
      const canDelete =
        s === "pending" ||
        s === "rejected" ||
        s === "resolved" ||
        s === "closed";
      if (!canDelete) {
        throw new Error(
          `Complaint cannot be deleted in "${target.status}" status.`,
        );
      }
    }
    await dispatch(deleteComplaint({ viewer, id })).unwrap();

    // the complaint is gone: delete its notifications in the backend too
    const related = (notifications || []).filter((n) =>
      isComplaintNotification(n, id),
    );
    await Promise.allSettled(
      related
        .filter((n) => n?.id)
        .map((n) =>
          dispatch(deleteNotification({ id: n.id, viewer })).unwrap(),
        ),
    );
    dispatch(cancelComplaintNotifications(id));
  };

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      Promise.all([refreshComplaints(), refreshNotifications()]).finally(() => {
        setLoading(false);
      });
    }
  }, [currentUser, refreshComplaints, refreshNotifications]);

  return (
    <OwnerContext.Provider
      value={{
        complaints,
        notifications,
        ownerProfile,
        updateProfile,
        refreshComplaints,
        removeComplaint,
        refreshNotifications,
        loading,
        error,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwner() {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error("useOwner must be used within an OwnerProvider");
  }
  return context;
}
