import { createContext, useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser } from '../services/authService';
import { clearUsers } from '../redux/features/users/usersSlice';

import { clearMaintenance } from '../redux/features/maintenance/maintenanceSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Authenticate user against the backend API
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password, role);
      // Backend returns either user object or { user, ... }
      const user = response.user || response;
      dispatch(clearUsers());
      dispatch(clearMaintenance());
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    dispatch(clearUsers());
    dispatch(clearMaintenance());
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  const updateUser = (updated) => {
    setCurrentUser((prev) => {
      if (!prev) return updated;
      const next = { ...prev, ...updated };
      localStorage.setItem('currentUser', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
