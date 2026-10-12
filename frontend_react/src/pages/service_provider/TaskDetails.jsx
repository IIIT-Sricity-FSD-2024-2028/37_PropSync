
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./styles.css";

const API = "http://localhost:3000";

function getProviderId() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return user.id || 10;
  } catch {
    return 10;
  }
}

function imageUrl(photo) {
  if (!photo) {
    return "https://placehold.co/600x260/e5e7eb/6b7280?text=Maintenance";
  }

  if (/^(https?:|data:|blob:)/i.test(photo)) return photo;
  return `${API}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

function statusLabel(status) {
  const labels = {
    assigned: "Assigned",
    estimating_cost: "Estimating Cost",
    in_progress: "In Progress",
    completed: "Completed",
    billed: "Billed",
    paid: "Paid",
    closed: "Closed",
    payment_pending: "Payment Pending",
    resolved: "Resolved",
  };

  return labels[status] || status || "Unknown";
}

function getTask(complaint, estimate) {
  const status = complaint.status;

  const estimateSubmitted =
    Boolean(estimate) ||
    [
      "estimating_cost",
      "in_progress",
      "completed",
      "billed",
      "paid",
      "closed",
      "payment_pending",
      "resolved",
    ].includes(status);

  const estimateApproved =
    Boolean(complaint.estimateApproved) ||
    estimate?.approved === true ||
    [
      "in_progress",
      "completed",
      "billed",
      "paid",
      "closed",
      "payment_pending",
      "resolved",
    ].includes(status);

  return {
    id: String(complaint.id),
    issueType: complaint.category || "General",
    title: complaint.title || `Complaint ${complaint.id}`,
    description: complaint.description || "No description provided.",
    image: imageUrl(complaint.photo),
    location: complaint.location || "Unknown",
    deadline: complaint.deadline || "None",
    priority: complaint.priority
      ? complaint.priority.charAt(0).toUpperCase() +
        complaint.priority.slice(1)
      : "Low",
    assignedDate:
      complaint.updatedAt || complaint.submittedAt || "Not recorded",
    status,
    estimateSubmitted,
    estimate: estimate
      ? {
          cost: `₹${estimate.estimatedCost ?? "—"}`,
          completionTime:
            estimate.completionTime || "Awaiting manager review",
          workDescription: estimate.notes || "No notes provided.",
          uploadedFile: estimate.documentName || "No file uploaded",
        }
      : null,
    progress: {
      assigned: [
        "assigned",
        "estimating_cost",
        "in_progress",
        "completed",
        "billed",
        "paid",
        "closed",
        "payment_pending",
        "resolved",
      ].includes(status),
      estimateSent: estimateSubmitted,
      approved: estimateApproved,
      inProgress: [
        "in_progress",
        "completed",
        "billed",
        "paid",
        "closed",
        "payment_pending",
        "resolved",
      ].includes(status),
      completed: [
        "completed",
        "billed",
        "paid",
        "closed",
        "payment_pending",
        "resolved",
      ].includes(status),
    },
  };
}

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        stroke: "currentColor",
        strokeWidth: 2,
        fill: "none",
        flexShrink: 0,
      }}
    >
      {children}
    </svg>
  );
}

function ProgressStep({ done, label, sub }) {
  return (
    <div className="progress-step">
      <div className={`progress-step-icon ${done ? "done" : "pending"}`}>
        <Icon>
          {done ? (
            <>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </>
          )}
        </Icon>
      </div>

      <div className="progress-step-info">
        <p className={`progress-step-title ${done ? "done" : "pending"}`}>
          {label}
        </p>
        <p className="progress-step-sub">{sub}</p>
      </div>
    </div>
  );
}

function ProgressConnector({ done }) {
  return (
    <div className={`progress-connector ${done ? "done" : "pending"}`} />
  );
}

export default function TaskDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("task");

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTask = useCallback(async () => {
    if (!taskId) {
      setError("The task you're looking for doesn't exist.");
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const numericId = String(taskId).replace(/^C-/i, "");
    const headers = {
      role: "service_provider",
      "x-user-id": String(getProviderId()),
      "Content-Type": "application/json",
    };

    try {
      const complaintResponse = await fetch(
        `${API}/complaints/${numericId}`,
        { headers }
      );

      if (!complaintResponse.ok) {
        throw new Error("The task you're looking for doesn't exist.");
      }

      const complaint = await complaintResponse.json();

      let latestEstimate = null;

      try {
        const estimateResponse = await fetch(
          `${API}/estimates?complaintId=${numericId}`,
          { headers }
        );

        if (estimateResponse.ok) {
          const estimates = await estimateResponse.json();
          latestEstimate = estimates.length
            ? estimates[estimates.length - 1]
            : null;
        }
      } catch {
        // Complaint details can still be shown if estimates are unavailable.
      }

      setTask(getTask(complaint, latestEstimate));
    } catch (err) {
      setTask(null);
      setError(err.message || "Failed to load task details.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  if (loading) {
    return (
      <div className="app-shell">
        <main className="main-wrap">
          <div className="page-content">
            <p>Loading task details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="app-shell">
        <main className="main-wrap">
          <div className="page-content">
            <div className="empty-state">
              <Icon>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </Icon>
              <h3>Task Not Found</h3>
              <p>{error || "The task you're looking for doesn't exist."}</p>
              <div style={{ marginTop: 20 }}>
                <button
                  className="btn btn-dark"
                  onClick={() =>
                    navigate("/service-provider/assigned-tasks")
                  }
                >
                  Back to Assigned Tasks
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const p = task.progress;
  const canUpdateStatus =
    task.status === "in_progress" ||
    (task.status !== "completed" && p.approved);

  const goToEstimate = () =>
    navigate(`/service-provider/submit-estimate?task=${task.id}`);

  const goToStatus = () =>
    navigate(`/service-provider/update-status?task=${task.id}`);

  const goToTasks = () =>
    navigate("/service-provider/assigned-tasks");

  return (
    <div className="app-shell">
      <main className="main-wrap">
        <div className="page-content">
          <button className="back-btn" onClick={goToTasks}>
            <Icon>
              <polyline points="15 18 9 12 15 6" />
            </Icon>
            Back to Assigned Tasks
          </button>

          <h1 style={{ marginBottom: 32 }}>Task Details</h1>

          <div className="task-details-grid">
            {/* LEFT COLUMN */}
            <div>
              {/* Complaint Information */}
              <div className="card mb-6">
                <div className="colored-card-header dark">
                  <h2>Complaint Information</h2>
                </div>

                <div className="card-body">
                  <div className="info-grid-2">
                    <div className="info-field">
                      <label>Complaint ID</label>
                      <p
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}
                      >
                        {task.id}
                      </p>
                    </div>

                    <div className="info-field">
                      <label>Issue Type</label>
                      <span className="badge badge-yellow">
                        {task.issueType}
                      </span>
                    </div>

                    <div className="info-field">
                      <label>Property Location</label>
                      <div className="meta-row">
                        <Icon>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </Icon>
                        <span>{task.location}</span>
                      </div>
                    </div>

                    <div className="info-field">
                      <label>Deadline</label>
                      <div className="meta-row">
                        <Icon>
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </Icon>
                        <span>{task.deadline}</span>
                      </div>
                    </div>

                    <div className="info-field">
                      <label>Priority</label>
                      <span
                        className={`badge ${
                          task.priority === "High"
                            ? "badge-red"
                            : task.priority === "Medium"
                              ? "badge-yellow"
                              : "badge-green"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="info-field">
                      <label>Assigned Date</label>
                      <div className="meta-row">
                        <Icon>
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </Icon>
                        <span>{task.assignedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#374151",
                        marginBottom: 8,
                      }}
                    >
                      Complaint Description
                    </label>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        color: "var(--muted-foreground)",
                        lineHeight: 1.6,
                      }}
                    >
                      {task.description}
                    </p>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#374151",
                        marginBottom: 10,
                      }}
                    >
                      Uploaded Image
                    </label>
                    <img
                      src={task.image}
                      alt={task.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://placehold.co/600x260/e5e7eb/6b7280?text=Image";
                      }}
                      style={{
                        width: "100%",
                        height: 260,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Service Estimate */}
              {task.estimateSubmitted && task.estimate ? (
                <div className="card">
                  <div className="colored-card-header green">
                    <h2>Service Estimate</h2>
                  </div>

                  <div className="card-body">
                    <div className="alert-box green">
                      <Icon>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </Icon>
                      <p
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}
                      >
                        {p.approved
                          ? "Estimate Approved – You can now begin work on this task"
                          : "Estimate Submitted – Awaiting Maintenance Manager Approval"}
                      </p>
                    </div>

                    <div
                      className="info-grid-2"
                      style={{ marginBottom: 20 }}
                    >
                      <div>
                        <label className="task-detail-label">
                          Estimated Cost
                        </label>
                        <p
                          style={{
                            fontSize: "1.6rem",
                            fontWeight: 700,
                            color: "#16A34A",
                          }}
                        >
                          {task.estimate.cost}
                        </p>
                      </div>

                      <div>
                        <label className="task-detail-label">
                          Estimated Completion Time
                        </label>
                        <p
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {task.estimate.completionTime}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label className="task-detail-label">
                        Description of Work
                      </label>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--muted-foreground)",
                          lineHeight: 1.6,
                        }}
                      >
                        {task.estimate.workDescription}
                      </p>
                    </div>

                    <div>
                      <label className="task-detail-label">
                        Uploaded File
                      </label>
                      <div className="file-row">
                        <Icon>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </Icon>
                        <span>{task.estimate.uploadedFile}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !task.estimateSubmitted ? (
                <div className="card">
                  <div className="colored-card-header green">
                    <h2>Service Estimate</h2>
                  </div>

                  <div className="card-body">
                    <div className="alert-box yellow">
                      <Icon>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </Icon>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "#92400E",
                        }}
                      >
                        You need to submit a service estimate before work can
                        begin on this task.
                      </p>
                    </div>

                    <button
                      className="btn btn-accent btn-full"
                      onClick={goToEstimate}
                    >
                      <Icon>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </Icon>
                      Submit Service Estimate
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT COLUMN */}
            <div>
              {/* Quick Actions */}
              <div className="card mb-6">
                <div className="card-body">
                  <h2 style={{ fontSize: "1.05rem", marginBottom: 16 }}>
                    Quick Actions
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {!task.estimateSubmitted && (
                      <button
                        className="btn btn-accent btn-full"
                        onClick={goToEstimate}
                      >
                        <Icon>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </Icon>
                        Submit Estimate
                      </button>
                    )}

                    {canUpdateStatus && (
                      <button
                        className="btn btn-dark btn-full"
                        onClick={goToStatus}
                      >
                        <Icon>
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </Icon>
                        Update Status
                      </button>
                    )}

                    <button
                      className="btn btn-ghost btn-full"
                      onClick={goToTasks}
                    >
                      <Icon>
                        <polyline points="15 18 9 12 15 6" />
                      </Icon>
                      Back to Tasks
                    </button>
                  </div>
                </div>
              </div>

              {/* Task Progress */}
              <div className="card">
                <div className="card-body">
                  <h2 style={{ fontSize: "1.05rem", marginBottom: 20 }}>
                    Task Progress
                  </h2>

                  <div className="progress-tracker">
                    <ProgressStep
                      done={p.assigned}
                      label="Assigned"
                      sub="Task assigned to you"
                    />
                    <ProgressConnector done={p.estimateSent} />

                    <ProgressStep
                      done={p.estimateSent}
                      label="Estimate Submitted"
                      sub="Service estimate sent"
                    />
                    <ProgressConnector done={p.approved} />

                    <ProgressStep
                      done={p.approved}
                      label="Approved"
                      sub="Manager approved estimate"
                    />
                    <ProgressConnector done={p.inProgress} />

                    <ProgressStep
                      done={p.inProgress}
                      label="In Progress"
                      sub="Work in progress"
                    />
                    <ProgressConnector done={p.completed} />

                    <ProgressStep
                      done={p.completed}
                      label="Completed"
                      sub="Task completed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
