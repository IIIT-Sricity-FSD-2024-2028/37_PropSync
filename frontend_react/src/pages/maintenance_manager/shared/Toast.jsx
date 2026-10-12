import "./maintenance_manager.css";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

/* Toast message (replaces showToast() from maintenance_manager.js).
   <ToastProvider> wraps all manager routes; any component calls useToast(). */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState("");
  const timer = useRef(null);

  const showToast = useCallback((text, duration = 3500) => {
    setMsg(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {msg && <div className="mm-toast">{msg}</div>}
    </ToastContext.Provider>
  );
}
