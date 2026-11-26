import { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  currentUserUpdated, loggedOut, loginUser, selectAuthStatus, selectCurrentUser,
} from '../redux/features/users/usersSlice';
import { clearMaintenance } from '../redux/features/maintenance/maintenanceSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { status } = useSelector(selectAuthStatus);

  // Authenticate user against the backend API (Redux is updated only after success)
  const login = async (email, password, role) => {
    const user = await dispatch(loginUser({ email, password, role })).unwrap();
    dispatch(clearMaintenance()); // maintenance lists belong to the previous session
    return user;
  };

  const logout = () => {
    dispatch(loggedOut());
    dispatch(clearMaintenance());
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  // Call after the backend has saved the profile
  const updateUser = (updated) => {
    dispatch(currentUserUpdated(updated));
    const next = currentUser ? { ...currentUser, ...updated } : updated;
    localStorage.setItem('currentUser', JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading: status === 'loading',
        login,
        logout,
        updateUser,
        isAuthenticated: !!currentUser,
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