export default function AvailableComplaintCard({ complaint, imageUrl, priorityClass, locationIcon, calendarIcon, onView }) {
  return (
    <article className="complaint-grid-card" onClick={() => onView(complaint)} onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onView(complaint); }
    }} role="button" tabIndex={0}>
      <div className="complaint-grid-img-wrap">
        <img src={imageUrl} alt={complaint.title || "Complaint"} className="complaint-grid-img"
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://placehold.co/400x180/e5e7eb/6b7280?text=Image"; }} />
        <div className={`urgency-badge ${priorityClass}`}>{complaint.priority || "Low"} Priority</div>
      </div>
      <div className="complaint-grid-body">
        <div className="complaint-grid-id-row"><span className="complaint-grid-id">C-{complaint.id}</span><span className="badge badge-yellow">{complaint.category || "General"}</span></div>
        <h3 className="complaint-grid-title">{complaint.title}</h3>
        <p className="complaint-grid-desc" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{complaint.description || "No description provided."}</p>
        <div className="complaint-grid-meta">
          <div className="complaint-grid-meta-row">{locationIcon}{complaint.location || "Unknown Location"}</div>
          <div className="complaint-grid-meta-row">{calendarIcon}Deadline: {complaint.deadline || "None"}</div>
        </div>
        <button className="btn btn-accent btn-full" onClick={(event) => { event.stopPropagation(); onView(complaint); }}>View Details</button>
      </div>
    </article>
  );
}
