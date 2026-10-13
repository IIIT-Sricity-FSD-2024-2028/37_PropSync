import React, { useState } from "react";
import { getOwnerDisplay } from "../../../../services/managerService";

export const stars = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

/* "Customer Reviews (n)" with Show / Hide toggle (styled like the SP feedback list).
   reviews = backend ratings: { id, ownerId, score, feedback, ratedAt } */
export default function ReviewList({ reviews }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16 }}>
      <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>Customer Reviews ({reviews.length})</p>
      {open &&
        reviews.map((r) => {
          const name = getOwnerDisplay(r.ownerId).name;
          return (
            <div key={r.id} className="review-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="review-user">
                  <div className="review-avatar">{name.charAt(0)}</div>
                  <div>
                    <p className="review-author">{name}</p>
                    <p className="review-date">{r.ratedAt}</p>
                  </div>
                </div>
                <span className="review-stars">{stars(r.score)}</span>
              </div>
              <p className="review-text">{r.feedback}</p>
            </div>
          );
        })}
      {reviews.length > 0 ? (
        <button className="reviews-toggle" onClick={() => setOpen(!open)}>
          {open ? "Hide reviews" : `Show ${reviews.length} review${reviews.length > 1 ? "s" : ""} →`}
        </button>
      ) : (
        <p className="muted" style={{ marginTop: 4 }}>No reviews yet</p>
      )}
    </div>
  );
}
