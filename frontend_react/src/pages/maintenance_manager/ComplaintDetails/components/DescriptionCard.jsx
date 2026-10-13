import React from "react";

/* "Description & Notes" */
export default function DescriptionCard({ description }) {
  return (
    <section className="card">
      <p className="detail-label"><span className="detail-label-bar" /> Description &amp; Notes</p>
      <p style={{ fontSize: "0.95rem", color: "#374151", lineHeight: 1.6 }}>{description || "—"}</p>
    </section>
  );
}
