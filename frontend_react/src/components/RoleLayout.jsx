import Navbar from "./Navbar";
import { getRoleSession } from "../services/roleApi";

export default function RoleLayout({ role, children }) {
  const session = getRoleSession(role);
  return <div className={`role-app-shell role-app-shell-${role}`}><Navbar name={session.name} role={role} />{children}</div>;
}
