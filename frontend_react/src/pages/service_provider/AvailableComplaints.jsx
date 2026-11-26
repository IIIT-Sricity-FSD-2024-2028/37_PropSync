
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import "./styles.css";
import EstimateForm from "../../components/service_provider/EstimateForm";
import { estimateStatus } from "../../services/estimateWorkflow";
import {
  setEstimates as setEstimatesAction,
  deleteEstimate as deleteEstimateAction,
} from "../../redux/features/estimates/estimatesSlice";

import { API_BASE_URL as API } from "../../services/api";
import PageHeader from "../../components/service_provider/PageHeader";
import ComplaintList from "../../components/service_provider/ComplaintList";
import { ErrorMessage } from "../../components/service_provider/FeatureStates";

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

function imageUrl(photo) {
  if (!photo) {
    return "https://placehold.co/400x180/e5e7eb/6b7280?text=No+Image";
  }

  if (/^(https?:|data:)/i.test(photo)) return photo;

  return `${API}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

function urgencyClass(priority) {
  const value = (priority || "").toLowerCase();

  if (value === "high") return "urgency-high";
  if (value === "medium") return "urgency-medium";
  return "urgency-low";
}

function deadlineMatches(deadline, filter) {
  if (filter === "All") return true;
  if (!deadline) return false;

  const due = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "Today") {
    return due.getTime() === today.getTime();
  }

  if (filter === "Week") {
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    return due >= today && due <= endOfWeek;
  }

  if (filter === "Month") {
    return (
      due.getMonth() === today.getMonth() &&
      due.getFullYear() === today.getFullYear()
    );
  }

  return true;
}

function Icon({ type }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    width: 18,
    height: 18,
    "aria-hidden": true,
  };

  if (type === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    );
  }

  if (type === "location") {
    return (
      <svg {...common}>
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </svg>
  );
}

function AvailableComplaints() {
  const dispatch = useDispatch();
  const providerId = getProviderId();

  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateBusy, setEstimateBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All");
  const [deadline, setDeadline] = useState("All");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/complaints`, {
        headers: {
          role: "service_provider",
          "Content-Type": "application/json",
          "x-user-id": String(providerId),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected response from complaints API.");
      }

      // Preserve the original page's availability rule.
      const available = data.filter(
        (complaint) =>
          String(complaint.status).toLowerCase() === "approved" &&
          !complaint.assignedProviderId
      );

      setComplaints(available);
      const estimatesResponse = await fetch(`${API}/estimates/provider/${providerId}`, {
        headers: { role: "service_provider", "x-user-id": String(providerId) },
      });
      if (!estimatesResponse.ok) throw new Error("Could not load submitted estimates. Please retry.");
      const estimates = await estimatesResponse.json();
      dispatch(setEstimatesAction(estimates));
      setApplications(estimates.map(estimate => ({ estimate, complaint: data.find(c => c.id === estimate.complaintId) })).filter(a => a.complaint));
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError(err.message || "Failed to load available complaints.");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    const timer = setTimeout(loadComplaints, 0);
    return () => clearTimeout(timer);
  }, [loadComplaints]);

  const filteredComplaints = complaints.filter((complaint) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      String(complaint.id).toLowerCase().includes(query) ||
      (complaint.title || "").toLowerCase().includes(query);

    const matchesCategory =
      category === "All" || complaint.category === category;

    const matchesLocation =
      location === "All" ||
      (complaint.location || "").startsWith(location);

    const matchesDeadline = deadlineMatches(
      complaint.deadline,
      deadline
    );

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesDeadline
    );
  });

  const openComplaint = useCallback(
    async (complaint) => {
      setSelectedComplaint(complaint);
      setEstimateOpen(false);
      setActionError("");

      try {
        const response = await fetch(
          `${API}/complaints/${complaint.id}`,
          {
            headers: {
              role: "service_provider",
              "Content-Type": "application/json",
              "x-user-id": String(providerId),
            },
          }
        );

        if (response.ok) {
          const freshComplaint = await response.json();

          setSelectedComplaint(freshComplaint);
          setComplaints((current) =>
            current.map((item) =>
              String(item.id) === String(freshComplaint.id)
                ? freshComplaint
                : item
            )
          );
        }
      } catch (err) {
        // The list data is still available if the detail request fails.
        console.error("Failed to refresh complaint details:", err);
      }
    },
    [providerId]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");

    if (!openId || loading) return;

    const complaint = complaints.find(
      (item) => String(item.id) === String(openId)
    ) || applications.find(a => String(a.complaint.id) === String(openId))?.complaint;

    if (complaint) {
      const timer = setTimeout(() => openComplaint(complaint), 0);
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
      return () => clearTimeout(timer);
    }
  }, [complaints, applications, loading, openComplaint]);

  const closeModal = () => {
    if (estimateBusy) return;
    setEstimateOpen(false);
    setSelectedComplaint(null);
    setActionError("");
    setActionLoading("");
  };

  const handleDecision = async (action) => {
    if (!selectedComplaint || actionLoading) return;

    if (action === "accept") { setEstimateOpen(true); return; }
    const complaintId = selectedComplaint.id;
    setActionLoading(action);
    setActionError("");
    try {
      const response = await fetch(`${API}/complaints/${complaintId}/sp-reject`, {
        method: "PATCH",
        headers: { role: "service_provider", "Content-Type": "application/json", "x-user-id": String(providerId) },
        body: JSON.stringify({ providerId, reason: "Declined by service provider" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not reject complaint.");
      setSelectedComplaint(current => ({ ...current, rejectedProviders: data.rejectedProviders }));
      await loadComplaints();
    } catch (err) { setActionError(err.message || "The request failed."); }
    finally { setActionLoading(""); }
  };

  const categories = [
    "All",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "HVAC",
    "Sanitation",
    "Elevator",
    "Painting",
    "Security",
  ];

  const locations = [
    "All",
    "Building A",
    "Building B",
    "Building C",
    "Building D",
    "Main Gate",
    "Tower A",
    "Tower B",
    "Tower C",
    "Tower D",
    "Basement",
    "Clubhouse",
  ];

  const alreadyInterested =
    selectedComplaint?.interestedProviders?.some(
      (id) => Number(id) === providerId
    ) || false;

  const alreadyRejected =
    selectedComplaint?.rejectedProviders?.some(
      (id) => Number(id) === providerId
    ) || false;

  return (
    <div className="app-shell service-provider-app">
      <main className="main-wrap">
        <div className="page-content">
          <PageHeader title="Available Complaints" description="Submit an estimate to accept an available complaint. The Maintenance Manager will compare estimates and select a provider." />

          {error && <ErrorMessage onRetry={loadComplaints} style={{ padding: 16, marginBottom: 20, background: "#FEE2E2", color: "#991B1B", borderRadius: 8 }}>
            {error}
          </ErrorMessage>}

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
                  <Icon type="list" />
                </span>
                <select
                  className="filter-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All Categories" : item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <span className="filter-field-icon">
                  <Icon type="location" />
                </span>
                <select
                  className="filter-select"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  {locations.map((item) => (
                    <option key={item} value={item}>
                      {item === "All" ? "All Locations" : item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <span className="filter-field-icon">
                  <Icon type="calendar" />
                </span>
                <select
                  className="filter-select"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                >
                  <option value="All">All Deadlines</option>
                  <option value="Today">Due Today</option>
                  <option value="Week">This Week</option>
                  <option value="Month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p>
              {loading
                ? "Loading complaints..."
                : `${filteredComplaints.length} complaint${
                    filteredComplaints.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          <div className="complaints-grid">
            {loading ? (
              <div className="empty-state">
                <h3>Loading complaints...</h3>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div
                className="empty-state"
                style={{ gridColumn: "1 / -1" }}
              >
                <Icon type="list" />
                <h3>No Complaints Found</h3>
                <p>
                  No complaints match your current filters, or there
                  are no unassigned approved complaints.
                </p>
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setLocation("All");
                    setDeadline("All");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <ComplaintList complaints={filteredComplaints}
                imageUrl={imageUrl}
                priorityClass={urgencyClass}
                locationIcon={<Icon type="location" />}
                calendarIcon={<Icon type="calendar" />}
                onView={openComplaint} />
            )}
          </div>

          {applications.length > 0 && <section className="card" style={{ marginTop: 24 }}>
            <div className="card-body">
              <h2>My Submitted Estimates</h2>
              {applications.map(({ estimate, complaint }) => (
                <div
                  className="estimate-notes"
                  key={estimate.id}
                  style={estimate.approved === false ? { borderLeft: "4px solid #dc2626" } : undefined}
                >
                  <p><strong>C-{complaint.id}: {complaint.title}</strong> · ₹{Number(estimate.estimatedCost).toLocaleString("en-IN")}</p>
                  <p style={estimate.approved === false ? { color: "#dc2626", fontWeight: 600 } : undefined}>{estimateStatus(estimate)}</p>
                  <button className="btn btn-ghost" onClick={() => { openComplaint(complaint); setEstimateOpen(true); }}>View Submitted Estimate</button>
                </div>
              ))}
            </div>
          </section>}

          {selectedComplaint && (
            <div
              className="modal-backdrop open"
              onClick={closeModal}
              role="presentation"
            >
              <section
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="complaint-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-left">
                    <h2 id="complaint-modal-title">
                      Complaint Details
                    </h2>
                    <span
                      className={`badge urgency-badge ${urgencyClass(
                        selectedComplaint.priority
                      )}`}
                    >
                      {selectedComplaint.priority || "Low"} Priority
                    </span>
                  </div>

                  <button
                    className="modal-close"
                    onClick={closeModal}
                    aria-label="Close complaint details"
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <div className="modal-grid">
                    <div>
                      <img
                        src={imageUrl(selectedComplaint.photo)}
                        alt={selectedComplaint.title || "Complaint"}
                        className="modal-img"
                        style={{ marginBottom: 16 }}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://placehold.co/400x260/e5e7eb/6b7280?text=Image";
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                          }}
                        >
                          C-{selectedComplaint.id}
                        </span>
                        <span className="badge badge-yellow">
                          {selectedComplaint.category || "General"}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.1rem" }}>
                        {selectedComplaint.title}
                      </h3>
                    </div>

                    <div>
                      <div className="detail-section">
                        <p className="detail-label">
                          <span className="detail-label-bar" />
                          Description
                        </p>
                        <p
                          style={{
                            fontSize: "0.95rem",
                            color: "var(--muted-foreground)",
                            lineHeight: 1.6,
                          }}
                        >
                          {selectedComplaint.description ||
                            "No description provided."}
                        </p>
                      </div>

                      <div className="detail-section">
                        <p className="detail-label">
                          <span className="detail-label-bar" />
                          Location
                        </p>
                        <div className="detail-box green">
                          <Icon type="location" />
                          {selectedComplaint.location ||
                            "Unknown Location"}
                        </div>
                      </div>

                      <div className="detail-section">
                        <p className="detail-label">
                          <span className="detail-label-bar" />
                          Deadline
                        </p>
                        <div className="detail-box red">
                          <Icon type="calendar" />
                          {selectedComplaint.deadline || "None"}
                        </div>
                      </div>

                      <div className="modal-action-area">
                        {selectedComplaint.assignedProviderId || applications.some(a => a.estimate.complaintId === selectedComplaint.id && a.estimate.approved === false) ? (
                          <div className={`modal-accepted ${applications.some(a => a.estimate.complaintId === selectedComplaint.id && a.estimate.approved === false) ? "rejected" : ""}`}>
                            <p>{estimateStatus(applications.find(a => a.estimate.complaintId === selectedComplaint.id)?.estimate || {})}</p>
                            <button className="btn btn-ghost" onClick={() => setEstimateOpen(true)}>View Submitted Estimate</button>
                          </div>
                        ) : alreadyInterested && applications.some(a => a.estimate.complaintId === selectedComplaint.id) ? (
                          <div className="modal-accepted">
                            <p
                              className="main"
                              style={{
                                color: "#1a0dab",
                                fontWeight: 700,
                              }}
                            >
                              ✓ Estimate Submitted — Awaiting Manager Selection
                            </p>
                            <p className="sub" style={{ marginTop: 6 }}>
                              Your estimate has been submitted for manager selection.
                            </p>
                            <p className="sub" style={{ marginTop: 4 }}>
                              {selectedComplaint.interestedProviders
                                ?.length || 1}{" "}
                              provider(s) in queue. The Maintenance
                              Manager will select one.
                            </p>
                            <button className="btn btn-ghost btn-full" onClick={() => setEstimateOpen(true)}>View Submitted Estimate</button>
                          </div>
                        ) : alreadyRejected ? (
                          <div
                            className="modal-accepted"
                            style={{
                              background: "#fee2e2",
                              border: "1px solid #fecaca",
                              borderRadius: 8,
                              padding: 12,
                            }}
                          >
                            <p
                              className="main"
                              style={{
                                color: "#dc2626",
                                fontWeight: 700,
                              }}
                            >
                              ✕ Complaint Declined
                            </p>
                            <p
                              className="sub"
                              style={{
                                marginTop: 6,
                                color: "#991b1b",
                              }}
                            >
                              You have declined this complaint.
                            </p>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            {actionError && (
                              <p
                                role="alert"
                                style={{ color: "#B91C1C" }}
                              >
                                {actionError}
                              </p>
                            )}

                            <button
                              className="btn btn-accent btn-full"
                              disabled={Boolean(actionLoading) || estimateBusy || estimateOpen}
                              onClick={() => handleDecision("accept")}
                            >
                              {actionLoading === "accept"
                                ? "Submitting Estimate..."
                                : "Accept Complaint"}
                            </button>

                            <button
                              className="btn btn-red btn-full"
                              disabled={Boolean(actionLoading) || estimateBusy || estimateOpen}
                              onClick={() => handleDecision("reject")}
                            >
                              {actionLoading === "reject"
                                ? "Recording Rejection..."
                                : "Reject Complaint"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {estimateOpen && <EstimateForm key={selectedComplaint.id} embedded complaintId={selectedComplaint.id}
                    onCancel={() => setEstimateOpen(false)} onBusyChange={setEstimateBusy}
                    onSubmitted={() => {
                      loadComplaints();
                      setSelectedComplaint(current => ({ ...current, interestedProviders: [...new Set([...(current.interestedProviders || []), providerId])] }));
                    }}
                    onDeleted={async (deletedId) => {
                      dispatch(deleteEstimateAction(deletedId));
                      setApplications(prev => prev.filter(a => Number(a.estimate.id) !== Number(deletedId)));
                      setEstimateOpen(false);
                      await loadComplaints();
                    }} />}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AvailableComplaints;
