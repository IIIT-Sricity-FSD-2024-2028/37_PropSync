import { useEffect, useMemo, useState } from "react";
import UserProfile from "./UserProfile";
import { useAuth } from "../context/AuthContext";
import { getRoleSession, roleRequest } from "../services/roleApi";
import { API_BASE_URL } from "../services/api";

export default function RoleProfilePage({ role }) {
  const { currentUser, updateUser } = useAuth();
  const session = getRoleSession(role);
  const storageKey = `roleProfile:${role}`;
  const [repositoryUser, setRepositoryUser] = useState(null);
  const [savedProfile, setSavedProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  });
  useEffect(() => {
    if (role !== "admin") return;
    let active = true;
    roleRequest("admin", session.id, `/users/${session.id}`)
      .then((user) => { if (active) setRepositoryUser(user); })
      .catch(() => { if (active) setRepositoryUser(null); });
    return () => { active = false; };
  }, [role, session.id]);
  const profile = useMemo(() => ({
    fullName: role === "admin"
      ? repositoryUser?.name || (String(currentUser?.id) === String(session.id) ? currentUser?.name : "") || session.name
      : savedProfile.fullName || "Super User",
    email: role === "admin"
      ? repositoryUser?.email || (String(currentUser?.id) === String(session.id) ? currentUser?.email : "") || session.email
      : savedProfile.email || "superuser@propsync.com",
    phone: role === "admin"
      ? repositoryUser?.phone || (String(currentUser?.id) === String(session.id) ? currentUser?.phone : "") || ""
      : savedProfile.phone || "+91 98765 43210",
    role: role === "super_user" ? "Super User" : "Administrator",
    id: role === "super_user" ? "0" : currentUser?.id || session.id,
    idLabel: role === "super_user" ? "System ID" : "User ID",
    department: savedProfile.department || "Platform Operations",
    location: role === "admin"
      ? repositoryUser?.communityName || (String(currentUser?.id) === String(session.id) ? currentUser?.communityName : "") || session.communityName || "Community not set"
      : savedProfile.location || "System-wide",
  }), [currentUser, repositoryUser, role, savedProfile, session.communityName, session.email, session.id, session.name]);

  const handleUpdate = async (updated) => {
    if (role === "admin") {
      try {
        const user = await roleRequest("admin", session.id, `/users/${session.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: updated.fullName, email: updated.email, phone: updated.phone, communityName: updated.location }),
        });
        setRepositoryUser(user);
        updateUser({ id: user.id, name: user.name, email: user.email, phone: user.phone, communityName: user.communityName });
      } catch (error) {
        window.alert(`Could not save profile: ${error.message}`);
      }
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
    const response = await fetch(`${API_BASE_URL}/users/${profile.id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", role: "admin", "x-user-id": String(profile.id) },
      body: JSON.stringify(passwords),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Unable to change password.");
  };

  return <UserProfile user={profile} role={role} title="My Profile"
    subtitle={`Manage your ${role === "super_user" ? "system" : "administrator"} account details.`}
    onUpdateProfile={handleUpdate}
    onChangePassword={changePassword} />;
}
