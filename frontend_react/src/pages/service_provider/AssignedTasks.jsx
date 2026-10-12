
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";

const API = "http://localhost:3000";

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

function getProviderId() {
  try {
    const user = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
    return Number(user?.id || 10);
  } catch {
    return 10;
  }
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getPriorityLabel(priority) {
  if (!priority) return "Low";
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

function getPriorityColor(priority) {
  if (priority === "High") {
    return { background: "#FEE2E2", color: "#991B1B" };
  }
  if (priority === "Medium") {
    return { background: "#FEF3C7", color: "#92400E" };
  }
  return { background: "#DCFCE7", color: "#166534" };
}

function getStatusColor(status) {
  if (status === "Completed" || status === "Paid" || status === "Resolved") {
    return { background: "#DCFCE7", color: "#166534" };
  }
  if (status === "In Progress") {
    return { background: "#DBEAFE", color: "#1D4ED8" };
  }
  if (status === "Assigned" || status === "Estimating Cost") {
    return { background: "#FEF3C7", color: "#92400E" };
  }
  return { background: "#F3F4F6", color: "#374151" };
}

function parseDate(dateString) {
  if (!dateString || dateString === "None") return null;

  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isOverdue(deadline, status) {
  if (status === "Completed" || status === "Closed" ||
      status === "Paid" || status === "Resolved") {
    return false;
  }

  const date = parseDate(deadline);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
}

function matchesDeadline(task, filter) {
  if (filter === "All") return true;

  const date = parseDate(task.deadline);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "Overdue") {
    return isOverdue(task.deadline, task.status);
  }

  if (filter === "Today") {
    return date.getTime() === today.getTime();
  }

  if (filter === "This Week") {
    const end = new Date(today);
    end.setDate(today.getDate() + 7);
    return date >= today && date <= end;
  }

  if (filter === "This Month") {
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  return true;
}

function Icon({ type }) {
  const props = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "search") {
    return (
      <svg {...props}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    );
  }

  if (type === "filter") {
    return (
      <svg {...props}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function AssignedTasks() {
  const navigate = useNavigate();
  const providerId = getProviderId();

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [deadlineFilter, setDeadlineFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    const headers = {
      role: "service_provider",
      "Content-Type": "application/json",
      "x-user-id": String(providerId),
    };

    try {
      const [complaintResponse, estimateResponse] = await Promise.all([
        fetch(`${API}/complaints/provider/${providerId}`, { headers }),
        fetch(`${API}/estimates/provider/${providerId}`, { headers }),
      ]);

      const complaintData = await complaintResponse.json();

      if (!complaintResponse.ok) {
        throw new Error(
          complaintData.message ||
            `Could not load assigned tasks (${complaintResponse.status}).`
        );
      }

      if (!Array.isArray(complaintData)) {
        throw new Error("Unexpected response from the complaints API.");
      }

      // Estimates are supplemental. A failed estimate request should not
      // prevent the assigned complaints from being displayed.
      let estimates = [];

      if (estimateResponse.ok) {
        const result = await estimateResponse.json();
        if (Array.isArray(result)) estimates = result;
      }

      const mappedTasks = complaintData.map((complaint) => {
        const estimate = estimates.find(
          (item) =>
            Number(item.complaintId) === Number(complaint.id)
        );

        return {
          id: String(complaint.id),
          issueType: complaint.category || "General",
          title: complaint.title || "Untitled complaint",
          description: complaint.description || "",
          location: complaint.location || "Unknown",
          deadline: complaint.deadline || "None",
          priority: getPriorityLabel(complaint.priority),
          status: getStatusLabel(complaint.status),
          estimateSubmitted: Boolean(
            complaint.estimateSubmitted || estimate
          ),
          estimateApproved: Boolean(
            complaint.estimateApproved || estimate?.approved === true
          ),
        };
      });

      setTasks(mappedTasks);
    } catch (err) {
      console.error("Failed to load assigned tasks:", err);
      setError(err.message || "Could not load assigned tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        task.id.toLowerCase().includes(query) ||
        task.title.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDeadline(task, deadlineFilter)
      );
    });
  }, [tasks, search, statusFilter, priorityFilter, deadlineFilter]);

  function canUpdateStatus(task) {
    return (
      task.status === "In Progress" ||
      (task.status !== "Completed" && task.estimateApproved)
    );
  }

  function openTaskDetails(taskId) {
    navigate(
      `/service-provider/task-details?task=${encodeURIComponent(taskId)}`
    );
  }

  function submitEstimate(event, taskId) {
    event.stopPropagation();
    navigate(
      `/service-provider/submit-estimate?task=${encodeURIComponent(taskId)}`
    );
  }

  function updateTaskStatus(event, taskId) {
    event.stopPropagation();
    navigate(
      `/service-provider/update-status?task=${encodeURIComponent(taskId)}`
    );
  }

  return (
    <div className="app-shell">
      <main className="main-wrap">
        <div className="page-content">
          <div className="page-header">
            <h1>Assigned Tasks</h1>
            <p>
              View complaints that have been officially assigned to you
              by the maintenance manager.
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
                className="btn btn-accent"
                onClick={loadTasks}
                style={{ marginTop: 10 }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="filters-bar">
            <div className="filters-grid">
              <div className="filter-field">
                <span className="filter-field-icon">
                  <Icon type="search" />
                </span>
                <input
                  className="filter-input"
                  type="text"
                  placeholder="Search by Complaint ID or title"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="filter-field">
                <span className="filter-field-icon">
                  <Icon type="filter" />
                </span>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Estimating Cost">Estimating Cost</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Billed">Billed</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Closed">Closed</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="filter-field">
                <span className="filter-field-icon">
                  <Icon type="filter" />
                </span>
                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <option value="All">All Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div className="filter-field">
                <span className="filter-field-icon">
                  <Icon type="calendar" />
                </span>
                <select
                  className="filter-select"
                  value={deadlineFilter}
                  onChange={(event) => setDeadlineFilter(event.target.value)}
                >
                  <option value="All">All Deadlines</option>
                  <option value="Today">Due Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          <p style={{ marginBottom: 16 }}>
            {loading
              ? "Loading assigned tasks..."
              : `${filteredTasks.length} task${
                  filteredTasks.length === 1 ? "" : "s"
                } found`}
          </p>

          {!loading && filteredTasks.length === 0 ? (
            <div className="empty-state">
              <Icon type="document" />
              <h3>No Assigned Tasks Found</h3>
              <p>
                You currently have no assigned maintenance tasks matching
                your filters.
              </p>
              <button
                className="btn btn-accent"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPriorityFilter("All");
                  setDeadlineFilter("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="card" id="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Issue Type</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7}>Loading tasks...</td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const overdue = isOverdue(
                          task.deadline,
                          task.status
                        );

                        return (
                          <tr
                            key={task.id}
                            className="clickable"
                            onClick={() => openTaskDetails(task.id)}
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                openTaskDetails(task.id);
                              }
                            }}
                          >
                            <td>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "var(--foreground)",
                                }}
                              >
                                {task.id}
                              </span>
                            </td>

                            <td>
                              <span
                                className="badge badge-green"
                                style={{ borderRadius: 999 }}
                              >
                                {task.issueType}
                              </span>
                            </td>

                            <td
                              style={{
                                fontSize: "0.88rem",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {task.location}
                            </td>

                            <td>
                              <span
                                className="badge"
                                style={{
                                  ...getPriorityColor(task.priority),
                                  borderRadius: 999,
                                }}
                              >
                                {task.priority}
                              </span>
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 8,
                                }}
                              >
                                <Icon type="calendar" />
                                <span
                                  className={overdue ? "overdue-text" : ""}
                                  style={{ fontSize: "0.88rem" }}
                                >
                                  {task.deadline}
                                </span>
                                {overdue && (
                                  <span className="overdue-badge">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <span
                                className="badge"
                                style={{
                                  ...getStatusColor(task.status),
                                  borderRadius: 999,
                                }}
                              >
                                {task.status}
                              </span>
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {!task.estimateSubmitted && (
                                  <button
                                    type="button"
                                    title="Submit Estimate"
                                    aria-label={`Submit estimate for task ${task.id}`}
                                    onClick={(event) =>
                                      submitEstimate(event, task.id)
                                    }
                                    style={{
                                      padding: 7,
                                      background: "none",
                                      border: 0,
                                      cursor: "pointer",
                                      color: "#16A34A",
                                    }}
                                  >
                                    <Icon type="document" />
                                  </button>
                                )}

                                {canUpdateStatus(task) && (
                                  <button
                                    type="button"
                                    title="Update Status"
                                    aria-label={`Update status for task ${task.id}`}
                                    onClick={(event) =>
                                      updateTaskStatus(event, task.id)
                                    }
                                    style={{
                                      padding: 7,
                                      background: "none",
                                      border: 0,
                                      cursor: "pointer",
                                      color: "#D97706",
                                    }}
                                  >
                                    ↻
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AssignedTasks;
