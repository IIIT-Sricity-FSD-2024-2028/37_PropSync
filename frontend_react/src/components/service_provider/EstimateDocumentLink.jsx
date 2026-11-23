import { useState } from "react";
import { API_BASE_URL } from "../../services/api";

export default function EstimateDocumentLink({ estimate, className = "file-row" }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function download(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const response = await fetch(`${API_BASE_URL}/estimates/${estimate.id}/document`, {
        headers: { role: user.role || "service_provider", "x-user-id": String(user.id || 10) },
      });
      if (!response.ok) throw new Error("Could not download the estimate document. Please try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = estimate.documentName || "Estimate document";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <>
    <a className={className} href={`${API_BASE_URL}/estimates/${estimate.id}/document`} onClick={download}>
      {busy ? "Downloading..." : `View / Download: ${estimate.documentName || "Estimate document"}`}
    </a>
    {error && <p role="alert">{error}</p>}
  </>;
}
