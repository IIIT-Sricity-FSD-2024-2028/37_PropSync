
import { useCallback, useEffect, useState } from "react";
import "./styles.css";

import { API_BASE_URL as API } from "../../services/api";

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
  const providerId = getProviderId();

  const [complaints, setComplaints] = useState([]);
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
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError(err.message || "Failed to load available complaints.");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadComplaints();
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
    );

    if (complaint) {
      openComplaint(complaint);
      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );
    }
  }, [complaints, loading, openComplaint]);

  const closeModal = () => {
    setSelectedComplaint(null);
    setActionError("");
    setActionLoading("");
  };

  const handleDecision = async (action) => {
    if (!selectedComplaint || actionLoading) return;

    const complaintId = selectedComplaint.id;
    const isAccept = action === "accept";

    setActionLoading(action);
    setActionError("");

    try {
      const response = await fetch(
        `${API}/complaints/${complaintId}/${
          isAccept ? "sp-interest" : "sp-reject"
        }`,
        {
          method: "PATCH",
          headers: {
            role: "service_provider",
            "Content-Type": "application/json",
            "x-user-id": String(providerId),
          },
          body: JSON.stringify(
            isAccept
              ? { providerId }
              : {
                  providerId,
                  reason: "Declined by service provider",
                }
          ),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Could not ${
              isAccept ? "register interest" : "reject complaint"
            }.`
        );
      }

      setComplaints((current) =>
        current.map((item) => {
          if (String(item.id) !== String(complaintId)) return item;

          const interestedProviders = [
            ...(item.interestedProviders || []),
          ].filter((id) => Number(id) !== providerId);

          const rejectedProviders = [
            ...(item.rejectedProviders || []),
          ].filter((id) => Number(id) !== providerId);

          if (isAccept) interestedProviders.push(providerId);
          else rejectedProviders.push(providerId);

          return {
            ...item,
            interestedProviders,
            rejectedProviders,
          };
        })
      );

      setSelectedComplaint((current) => {
        if (!current || String(current.id) !== String(complaintId)) {
          return current;
        }

        const interestedProviders = [
          ...(current.interestedProviders || []),
        ].filter((id) => Number(id) !== providerId);

        const rejectedProviders = [
          ...(current.rejectedProviders || []),
        ].filter((id) => Number(id) !== providerId);

        if (isAccept) interestedProviders.push(providerId);
        else rejectedProviders.push(providerId);

        return {
          ...current,
          interestedProviders,
          rejectedProviders,
        };
      });

      // The original workflow keeps the complaint visible after
      // registering interest or declining it.
      if (isAccept && data.queue) {
        setSelectedComplaint((current) =>
          current
            ? { ...current, interestedProviders: data.queue }
            : current
        );
      }
    } catch (err) {
      console.error("Complaint action failed:", err);
      setActionError(err.message || "The request failed.");
    } finally {
      setActionLoading("");
    }
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
          <div className="page-header">
            <h1>Available Complaints</h1>
            <p>
              View available complaints and register your interest.
              The Maintenance Manager will select a provider.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: 16,
                marginBottom: 20,
                background: "#FEE2E2",
                color: "#991B1B",
                borderRadius: 8,
              }}
            >
              <p>{error}</p>
              <button
                className="btn btn-accent"
                onClick={loadComplaints}
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
              filteredComplaints.map((complaint) => {
                const priority = complaint.priority || "Low";

                return (
                  <div
                    className="complaint-grid-card"
                    key={complaint.id}
                    onClick={() => openComplaint(complaint)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        openComplaint(complaint);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="complaint-grid-img-wrap">
                      <img
                        src={imageUrl(complaint.photo)}
                        alt={complaint.title || "Complaint"}
                        className="complaint-grid-img"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://placehold.co/400x180/e5e7eb/6b7280?text=Image";
                        }}
                      />
                      <div
                        className={`urgency-badge ${urgencyClass(
                          priority
                        )}`}
                      >
                        {priority} Priority
                      </div>
                    </div>

                    <div className="complaint-grid-body">
                      <div className="complaint-grid-id-row">
                        <span className="complaint-grid-id">
                          C-{complaint.id}
                        </span>
                        <span className="badge badge-yellow">
                          {complaint.category || "General"}
                        </span>
                      </div>

                      <h3 className="complaint-grid-title">
                        {complaint.title}
                      </h3>

                      <p
                        className="complaint-grid-desc"
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {complaint.description ||
                          "No description provided."}
                      </p>

                      <div className="complaint-grid-meta">
                        <div className="complaint-grid-meta-row">
                          <Icon type="location" />
                          {complaint.location || "Unknown Location"}
                        </div>
                        <div className="complaint-grid-meta-row">
                          <Icon type="calendar" />
                          Deadline: {complaint.deadline || "None"}
                        </div>
                      </div>

                      <button
                        className="btn btn-accent btn-full"
                        onClick={(event) => {
                          event.stopPropagation();
                          openComplaint(complaint);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

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
                        {alreadyInterested ? (
                          <div className="modal-accepted">
                            <p
                              className="main"
                              style={{
                                color: "#1a0dab",
                                fontWeight: 700,
                              }}
                            >
                              ✓ Interest Registered!
                            </p>
                            <p className="sub" style={{ marginTop: 6 }}>
                              You have been added to the provider queue.
                            </p>
                            <p className="sub" style={{ marginTop: 4 }}>
                              {selectedComplaint.interestedProviders
                                ?.length || 1}{" "}
                              provider(s) in queue. The Maintenance
                              Manager will select one.
                            </p>
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
                              disabled={Boolean(actionLoading)}
                              onClick={() => handleDecision("accept")}
                            >
                              {actionLoading === "accept"
                                ? "Registering Interest..."
                                : "Accept Complaint"}
                            </button>

                            <button
                              className="btn btn-red btn-full"
                              disabled={Boolean(actionLoading)}
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
