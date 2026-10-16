export function LoadingState({ children = "Loading...", className = "" }) {
  return <p className={className} role="status">{children}</p>;
}

export function ErrorMessage({ children, onRetry, retryLabel = "Retry", style }) {
  return (
    <div className="sp-error-message" role="alert" style={style}>
      <p>{children}</p>
      {onRetry && <button type="button" className="btn btn-accent" onClick={onRetry}>{retryLabel}</button>}
    </div>
  );
}

export function EmptyState({ title, children, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {onAction && <button type="button" className="btn btn-accent" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

export function StatusBadge({ status, className = "", style }) {
  const slug = String(status || "unknown").toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
  const classes = {
    assigned: "badge-status-assigned",
    "in-progress": "badge-status-in-progress",
    completed: "badge-status-completed",
    "estimating-cost": "badge-status-estimate",
    billed: "badge-status-waiting",
    "payment-pending": "badge-status-waiting",
  };
  return <span className={`badge ${classes[slug] || "badge-gray"} ${className}`.trim()} style={style}>{status || "Unknown"}</span>;
}
