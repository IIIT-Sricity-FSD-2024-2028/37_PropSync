
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";

import { API_BASE_URL as API } from "../../services/api";

const STATUS_LABELS = {
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

const ESTIMATE_SUBMITTED_STATUSES = [
  "estimating_cost",
  "in_progress",
  "completed",
  "billed",
  "paid",
  "closed",
  "payment_pending",
  "resolved",
];

const COMPLETED_STATUSES = [
  "Completed",
  "Billed",
  "Paid",
  "Closed",
  "Payment Pending",
  "Resolved",
];

const DEMO_FEEDBACK = [
  {
    name: "Sarah Johnson",
    rating: 5,
    comment:
      "Excellent work! Very professional and quick service.",
    date: "Mar 4, 2026",
  },
  {
    name: "Michael Chen",
    rating: 4,
    comment: "Good service, minor delay but quality work.",
    date: "Mar 2, 2026",
  },
  {
    name: "Emily Davis",
    rating: 5,
    comment: "Outstanding service! Highly recommended.",
    date: "Feb 28, 2026",
  },
];

function getProviderId() {
  try {
    const user = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );

    // Temporary development default: provider 10
    return user?.id || 10;
  } catch {
    return 10;
  }
}

function getProviderName() {
  try {
    const user = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
    return user?.name || "Service Provider";
  } catch {
    return "Service Provider";
  }
}

function getImageUrl(photo) {
  if (!photo) {
    return "https://placehold.co/128x128/e5e7eb/6b7280?text=Image";
  }

  if (/^(https?:|data:)/i.test(photo)) {
    return photo;
  }

  return `${API}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getStatusClass(status) {
  const normalized = status.toLowerCase().replaceAll("_", "-");

  if (normalized === "assigned") {
    return "badge-status-assigned";
  }

  if (normalized === "in-progress") {
    return "badge-status-in-progress";
  }

  if (normalized === "completed") {
    return "badge-status-completed";
  }

  if (normalized === "estimating-cost") {
    return "badge-status-estimate";
  }

  if (normalized === "payment-pending" || normalized === "billed") {
    return "badge-status-waiting";
  }

  return "badge-gray";
}

function Stars({ rating, size = 16 }) {
  return (
    <span
      className="stars-row"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3,4,5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= rating ? "#F59E0B" : "#D1D5DB",
            fontSize: size,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function DashboardIcon({ type }) {
  const paths = {
    assigned: (
      <>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </>
    ),
    progress: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    completed: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
    estimate: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: 24,
        height: 24,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }}
    >
      {paths[type]}
    </svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const providerId = getProviderId();
  const providerName = getProviderName();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);

  const fetchProviderTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/complaints/provider/${providerId}`,
        {
          headers: {
            role: "service_provider",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not load complaints (HTTP ${response.status}).`
        );
      }

      const complaints = await response.json();

      if (!Array.isArray(complaints)) {
        throw new Error("Unexpected response from the server.");
      }

      const mappedTasks = complaints.map((complaint) => ({
        id: String(complaint.id),
        issueType: complaint.category || "General",
        title: complaint.title || "Untitled complaint",
        description:
          complaint.description || "No description provided.",
        imageUrl: getImageUrl(complaint.photo),
        location: complaint.location || "Unknown",
        deadline: complaint.deadline || "None",
        rawStatus: complaint.status,
        status: getStatusLabel(complaint.status),
        estimateSubmitted: ESTIMATE_SUBMITTED_STATUSES.includes(
          complaint.status
        ),
      }));

      setTasks(mappedTasks);
    } catch(err){
      console.error("Failed to load provider tasks:", err);
      setError(
        err.message ||
          "Unable to connect to the backend. Check that the NestJS server is running."
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchProviderTasks();
  }, [fetchProviderTasks]);

  const handleReject = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this complaint?"
    );

    if (!confirmed) return;

    setRejectingId(taskId);
    setActionError("");

    try {
      const response = await fetch(
        `${API}/complaints/${Number(taskId)}/sp-reject`,
        {
          method: "PATCH",
          headers: {
            role: "service_provider",
            "Content-Type": "application/json",
            "x-user-id": String(providerId),
          },
          body: JSON.stringify({
            providerId: Number(providerId),
            reason: "Declined from dashboard",
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || `Reject failed (HTTP ${response.status}).`
        );
      }

      await fetchProviderTasks();
    } catch (err) {
      console.error("Failed to reject complaint:", err);
      setActionError(
        err.message || "Unable to reject this complaint."
      );
    } finally {
      setRejectingId(null);
    }
  };

  const totalAssigned = tasks.length;

  const inProgress = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completed = tasks.filter((task) =>
    COMPLETED_STATUSES.includes(task.status)
  ).length;

  const pendingEstimates = tasks.filter(
    (task) => !task.estimateSubmitted
  ).length;

  const recentComplaints = tasks.slice(0, 3);
  const tableTasks = tasks.slice(0, 4);

  return (
    <div className="app-shell">
      <main className="main-wrap">
        <div className="page-content">
          <div className="page-header">
            <h1>Dashboard</h1>
            <p>
              Welcome back, {providerName}! Here's your overview.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: 16,
                marginBottom: 20,
                borderRadius: 8,
                background: "#FEE2E2",
                color: "#991B1B",
              }}
            >
              <p>{error}</p>
              <button
                className="btn btn-green btn-sm"
                onClick={fetchProviderTasks}
                style={{ marginTop: 10 }}
              >
                Retry
              </button>
            </div>
          )}

          {actionError && (
            <p
              role="alert"
              style={{ color: "#B91C1C", marginBottom: 16 }}
            >
              {actionError}
            </p>
          )}

          {/* Dashboard statistics */}
          <div className="stat-cards-grid">
            <div className="stat-card">
              <div className="stat-card-info">
                <p className="label">Total Complaints Assigned</p>
                <p className="value">
                  {loading ? "—" : totalAssigned}
                </p>
              </div>
              <div className="stat-icon blue">
                <DashboardIcon type="assigned" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-info">
                <p className="label">Complaints In Progress</p>
                <p className="value">
                  {loading ? "—" : inProgress}
                </p>
              </div>
              <div className="stat-icon yellow">
                <DashboardIcon type="progress" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-info">
                <p className="label">Completed Complaints</p>
                <p className="value">
                  {loading ? "—" : completed}
                </p>
              </div>
              <div className="stat-icon green">
                <DashboardIcon type="completed" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-info">
                <p className="label">Pending Estimates</p>
                <p className="value">
                  {loading ? "—" : pendingEstimates}
                </p>
              </div>
              <div className="stat-icon black">
                <DashboardIcon type="estimate" />
              </div>
            </div>
          </div>

          {/* Recent complaints and notifications */}
          <div className="two-col-grid mb-8">
            <section className="card">
              <div className="card-body">
                <h2 style={{ marginBottom: 20 }}>
                  Recent Complaints
                </h2>

                {loading ? (
                  <p>Loading complaints...</p>
                ) : recentComplaints.length === 0 ? (
                  <p style={{ color: "var(--muted-foreground)" }}>
                    No assigned complaints found.
                  </p>
                ) : (
                  recentComplaints.map((task) => (
                    <div className="complaint-card" key={task.id}>
                      <img
                        src={task.imageUrl}
                        alt={task.title}
                        className="complaint-img"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://placehold.co/128x128/e5e7eb/6b7280?text=Image";
                        }}
                      />

                      <div className="complaint-content">
                        <div className="complaint-badges">
                          <span className="badge badge-green">
                            #{task.id}
                          </span>
                          <span className="badge badge-dark">
                            {task.issueType}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: "#16A34A",
                              color: "#fff",
                              borderRadius: 999,
                            }}
                          >
                            ✓ Assigned
                          </span>
                        </div>

                        <p className="complaint-title">
                          {task.title}
                        </p>
                        <p className="complaint-desc">
                          {task.description}
                        </p>

                        <div className="complaint-meta">
                          <div className="complaint-meta-row">
                            <span>📍</span>
                            <span>{task.location}</span>
                          </div>
                          <div className="complaint-meta-row">
                            <span>◷</span>
                            <span>Deadline: {task.deadline}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <button
                            className="btn-link"
                            onClick={() =>
                              navigate(
                                `/service-provider/assigned-tasks`
                              )
                            }
                          >
                            View in Assigned Tasks →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-body">
                <div className="notif-panel-header">
                  <div className="notif-panel-title">
                    <h2
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                      }}
                    >
                      Notifications
                    </h2>
                    <span className="notif-count-badge">0</span>
                  </div>

                  <button
                    className="btn-link"
                    onClick={() =>
                      navigate("/service-provider/notifications")
                    }
                  >
                    View All →
                  </button>
                </div>

                <p
                  style={{
                    color: "var(--muted-foreground)",
                    fontSize: "0.9rem",
                  }}
                >
                  Notifications integration is not connected yet.
                </p>
              </div>
            </section>
          </div>

          {/* Assigned tasks table */}
          <div className="mb-8">
            <h2 style={{ marginBottom: 16 }}>Assigned Tasks</h2>

            <section className="card">
              <div className="card-header-bar">
                <h2>Recent Tasks</h2>
              </div>

              <div className="table-wrap">
                {loading ? (
                  <p style={{ padding: 24 }}>Loading tasks...</p>
                ) : tableTasks.length === 0 ? (
                  <p
                    style={{
                      padding: 24,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    No assigned tasks yet.
                  </p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Complaint ID</th>
                        <th>Issue Type</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {tableTasks.map((task) => (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 600 }}>
                            {task.id}
                          </td>
                          <td>{task.issueType}</td>
                          <td>
                            <span
                              className={`badge ${getStatusClass(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td
                            style={{
                              color: "var(--muted-foreground)",
                              fontSize: "0.88rem",
                            }}
                          >
                            {task.deadline}
                          </td>
                          <td>
                            <button
                              className="btn-link"
                              onClick={() =>
                                navigate(
                                  `/service-provider/update-status?task=${encodeURIComponent(
                                    task.id
                                  )}`
                                )
                              }
                            >
                              Update Status →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Feedback: these entries are demo data from the original page */}
          <section className="card">
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                  gap: 12,
                }}
              >
                <h2
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                  }}
                >
                  Recent Feedback
                </h2>

                <button
                  className="btn-link"
                  onClick={() =>
                    navigate("/service-provider/ratings")
                  }
                >
                  View All →
                </button>
              </div>

              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted-foreground)",
                  marginBottom: 16,
                }}
              >
                Sample feedback from the original prototype; not live
                backend data.
              </p>

              <div className="ratings-summary">
                <div className="ratings-avg">
                  <div className="ratings-avg-num">4.8</div>
                  <Stars rating={5} />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Average Rating
                  </p>
                </div>

                <div className="ratings-total">
                  <div className="ratings-total-num">127</div>
                  <p className="ratings-total-label">Total Reviews</p>
                </div>
              </div>

              {DEMO_FEEDBACK.map((feedback) => (
                <div className="feedback-item" key={feedback.name}>
                  <div className="feedback-header">
                    <div className="feedback-user">
                      <div className="feedback-avatar">
                        {feedback.name.charAt(0)}
                      </div>
                      <div>
                        <div className="feedback-name">
                          {feedback.name}
                        </div>
                        <div className="feedback-date">
                          {feedback.date}
                        </div>
                      </div>
                    </div>

                    <Stars rating={feedback.rating} size={12} />
                  </div>

                  <p className="feedback-comment">
                    {feedback.comment}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
