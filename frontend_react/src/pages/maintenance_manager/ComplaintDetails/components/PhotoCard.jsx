import React, { useState } from "react";
import Icon from "../../shared/Icon";

/* "Complaint Issue Photo" */
export default function PhotoCard({ url, alt }) {
  const [failed, setFailed] = useState(false);
  const show = url && !failed;
  return (
    <section className="card">
      <p className="detail-label"><span className="detail-label-bar" /> Complaint Issue Photo</p>
      <div className="photo-box" style={show ? { border: "1px solid #E5E7EB" } : undefined}>
        {show ? (
          <img src={url} alt={alt} onError={() => setFailed(true)} />
        ) : (
          <>
            <Icon name="image" size={36} strokeWidth={1.5} />
            {failed ? "Photo could not be loaded" : "No photo attached to this complaint"}
          </>
        )}
      </div>
    </section>
  );
}
