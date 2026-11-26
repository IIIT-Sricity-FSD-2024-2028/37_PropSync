import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserProfile from "./UserProfile";
import { useAuth } from "../context/AuthContext";
import { formatRole, getRoleSession } from "../services/roleApi";
import {
  changeUserPassword, fetchUserById, saveUser, selectUserById,
} from "../redux/features/users/usersSlice";

export default function RoleProfilePage({ role }) {
  const { currentUser, updateUser } = useAuth();
  const session = getRoleSession(role);
  const storageKey = `roleProfile:${role}`;
  const dispatch = useDispatch();
  const userSession = { role, id: session.id };
  // the profile comes from the Redux users slice (loaded below)
  const repositoryUser = useSelector((state) => selectUserById(state, userSession, session.id)) || null;
  const [savedProfile, setSavedProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  });
  useEffect(() => {
    if (role !== "admin" && role !== "service_provider") return;
    const request = dispatch(fetchUserById({ session: { role, id: session.id }, id: session.id }));
    return () => request.abort();
  }, [dispatch, role, session.id]);
  const profile = useMemo(() => ({
    fullName: role === "admin"
      ? repositoryUser?.name || (String(currentUser?.id) === String(session.id) ? currentUser?.name : "") || session.name
      : role === "service_provider"
        ? repositoryUser?.name || currentUser?.name || (savedProfile.fullName !== "Super User" ? savedProfile.fullName : "") || "Service Provider"
        : savedProfile.fullName || "Super User",
    email: role === "admin"
      ? repositoryUser?.email || (String(currentUser?.id) === String(session.id) ? currentUser?.email : "") || session.email
      : role === "service_provider"
        ? repositoryUser?.email || currentUser?.email || savedProfile.email || ""
        : savedProfile.email || "superuser@propsync.com",
    phone: role === "admin"
      ? repositoryUser?.phone || (String(currentUser?.id) === String(session.id) ? currentUser?.phone : "") || ""
      : role === "service_provider"
        ? repositoryUser?.phone || currentUser?.phone || savedProfile.phone || ""
        : savedProfile.phone || "+91 98765 43210",
    role: formatRole(role),
    id: role === "super_user" ? "0" : currentUser?.id || session.id,
    idLabel: role === "super_user" ? "System ID" : "User ID",
    department: role === "service_provider"
      ? repositoryUser?.category || currentUser?.category || currentUser?.serviceCategory || savedProfile.department || ""
      : savedProfile.department || "Platform Operations",
    location: role === "admin"
      ? repositoryUser?.communityName || (String(currentUser?.id) === String(session.id) ? currentUser?.communityName : "") || session.communityName || "Community not set"
      : role === "service_provider"
        ? repositoryUser?.location || repositoryUser?.communityName || currentUser?.location || currentUser?.communityName || savedProfile.location || ""
        : savedProfile.location || "System-wide",
  }), [currentUser, repositoryUser, role, savedProfile, session.communityName, session.email, session.id, session.name]);

  const handleUpdate = async (updated) => {
    if (role === "admin") {
      try {
        // UPDATE: backend first; the slice stores the saved user
        const user = await dispatch(saveUser({
          session: userSession,
          id: session.id,
          data: { name: updated.fullName, email: updated.email, phone: updated.phone, communityName: updated.location },
        })).unwrap();
        updateUser({ id: user.id, name: user.name, email: user.email, phone: user.phone, communityName: user.communityName });
      } catch (error) {
        window.alert(`Could not save profile: ${error.message}`);
      }
      return;
    }
    if (role === "service_provider") {
      try {
        const user = await dispatch(saveUser({
          session: userSession,
          id: session.id,
          data: { name: updated.fullName, phone: updated.phone, communityName: updated.location },
        })).unwrap();
        updateUser({ id: user.id, name: user.name, phone: user.phone, communityName: user.communityName, location: user.communityName });
      } catch (error) {
        window.alert(`Could not save profile: ${error.message}`);
      }
      const next = { ...savedProfile, ...updated };
      setSavedProfile(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return;
    }
    const next = { ...savedProfile, ...updated };
    setSavedProfile(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const changePassword = async (passwords) => {
    if (role !== "admin") {
      throw new Error("Password changes are only available for administrator accounts.");
    }
    try {
      await dispatch(changeUserPassword({
        session: { role: "admin", id: profile.id }, id: profile.id, passwords,
      })).unwrap();
    } catch (error) {
      throw new Error(error.message || "Unable to change password.");
    }
  };

  return <UserProfile user={profile} role={role} title="My Profile"
    subtitle={`Manage your ${role === "super_user" ? "system" : formatRole(role).toLowerCase()} account details.`}
    onUpdateProfile={handleUpdate}
    onChangePassword={changePassword} />;
}