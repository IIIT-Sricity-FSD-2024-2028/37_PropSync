import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { store } from "./redux/store";
import "./index.css";

if (typeof window !== "undefined") {
  window.store = store;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
