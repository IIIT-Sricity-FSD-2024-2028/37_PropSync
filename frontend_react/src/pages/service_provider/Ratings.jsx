import { useEffect, useMemo, useState } from "react";
import "./styles.css";

import { API_BASE_URL as API } from "../../services/api";
import PageHeader from "../../components/service_provider/PageHeader";

function getProviderId() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser?.id) return Number(currentUser.id);
  } catch (error) {
    console.error("Could not read current user:", error);
  }
  return 10;
}

function renderStars(rating, size = 16) {
  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      style={{ display: "inline-flex", gap: 2, alignItems: "center" }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{
            fill: star <= Math.round(Number(rating) || 0) ? "#F59E0B" : "none",
            stroke: star <= Math.round(Number(rating) || 0) ? "#F59E0B" : "#D1D5DB",
            strokeWidth: 1.5,
          }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function isWithinDateFilter(dateValue, filter) {
  if (filter === "All") return true;
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (filter === "week") {
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
  } else if (filter === "month") {
    start.setDate(1);
  } else if (filter === "3months") {
    start.setMonth(start.getMonth() - 3);
  }

  return date >= start && date <= now;
}

export default function Ratings() {
  const [providerId] = useState(getProviderId);
  const [tasks, setTasks] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [ratingFilter, setRatingFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRatingsFromAPI() {
      setLoading(true);
      setError("");

      const headers = {
        role: "service_provider",
        "Content-Type": "application/json",
        "x-user-id": String(providerId),
      };

      try {
        const [taskRes, ratingRes] = await Promise.all([
          fetch(`${API}/complaints/provider/${providerId}`, { headers }),
          fetch(`${API}/ratings`, { headers }),
        ]);

        if (!taskRes.ok) {
          throw new Error(`Could not load service-provider complaints (${taskRes.status}).`);
        }
        if (!ratingRes.ok) {
          throw new Error(`Could not load ratings (${ratingRes.status}).`);
        }

        const taskData = await taskRes.json();
        const ratingData = await ratingRes.json();

        const safeTasks = Array.isArray(taskData) ? taskData : [];
        const safeRatings = Array.isArray(ratingData) ? ratingData : [];
        const taskMap = new Map(safeTasks.map((complaint) => [Number(complaint.id), complaint]));
        const taskIds = new Set(safeTasks.map((complaint) => Number(complaint.id)));

        // The API exposes ratings globally to permitted roles. Only show ratings
        // for complaints assigned to this service provider.
        const providerRatings = safeRatings.filter((rating) =>
          taskIds.has(Number(rating.complaintId))
        );
        console.log("Provider ID:", providerId);
    console.log("Provider complaints:", safeTasks);
    console.log("All ratings:", safeRatings);
    console.log("Complaint IDs:", [...taskIds]);

        const mappedFeedback = providerRatings.map((rating) => {
          const complaint = taskMap.get(Number(rating.complaintId)) || {};
          return {
            id: String(rating.id),
            complaintId: `C-${rating.complaintId}`,
            serviceType: complaint.category || complaint.issueType || "General",
            rating: Number(rating.score) || 0,
            comment: rating.feedback || "No written feedback.",
            date: rating.ratedAt || "",
            location: complaint.location || "Unknown",
            ownerName: `Owner #${rating.ownerId}`,
          };
        });

        if (!cancelled) {
          setTasks(safeTasks);
          setFeedbackList(mappedFeedback);
        }
      } catch (err) {
        console.error("Failed to load ratings:", err);
        if (!cancelled) setError(err.message || "Failed to load ratings and feedback.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRatingsFromAPI();
    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const overviewStats = useMemo(() => {
    const total = feedbackList.length;
    const average = total
      ? feedbackList.reduce((sum, item) => sum + item.rating, 0) / total
      : 0;
    return {
      averageRating: average.toFixed(1),
      totalReviews: total,
      completedComplaints: tasks.filter((complaint) =>
        ["completed", "billed", "paid", "closed", "payment_pending", "resolved"].includes(
          String(complaint.status || "").toLowerCase()
        )
      ).length,
      satisfactionRate: total
        ? Math.round((feedbackList.filter((item) => item.rating >= 4).length / total) * 100)
        : 0,
    };
  }, [feedbackList, tasks]);

  const ratingDistribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((stars) => {
        const count = feedbackList.filter((item) => item.rating === stars).length;
        return {
          stars,
          count,
          percentage: feedbackList.length
            ? Math.round((count / feedbackList.length) * 100)
            : 0,
        };
      }),
    [feedbackList]
  );

  const filteredFeedback = useMemo(
    () =>
      feedbackList.filter((item) => {
        const matchesRating = ratingFilter === "All" || item.rating === Number(ratingFilter);
        const matchesService = serviceFilter === "All" || item.serviceType === serviceFilter;
        const matchesDate = isWithinDateFilter(item.date, dateFilter);
        return matchesRating && matchesService && matchesDate;
      }),
    [feedbackList, ratingFilter, serviceFilter, dateFilter]
  );

  const statCards = [
    {
      title: "Average Rating",
      value: overviewStats.averageRating,
      suffix: "/ 5.0",
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "#F59E0B", stroke: "#F59E0B", strokeWidth: 1 }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      iconStyle: { background: "rgba(245,158,11,0.1)" },
      extra: renderStars(Math.round(Number(overviewStats.averageRating)), 12),
    },
    {
      title: "Total Reviews",
      value: overviewStats.totalReviews,
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: "#42a443", strokeWidth: 2, fill: "none" }}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      iconStyle: { background: "rgba(66,164,67,0.15)" },
    },
    {
      title: "Completed Complaints",
      value: overviewStats.completedComplaints,
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: "#42a443", strokeWidth: 2, fill: "none" }}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      ),
      iconStyle: { background: "rgba(104,213,176,0.25)" },
    },
    {
      title: "Satisfaction Rate",
      value: `${overviewStats.satisfactionRate}%`,
      icon: (
        <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: "#42a443", strokeWidth: 2, fill: "none" }}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      iconStyle: { background: "rgba(66,164,67,0.15)" },
    },
  ];

  return (
    <div className="page-content ratings-page service-provider-app">
      <PageHeader title="Ratings & Feedback" description="View ratings and feedback from property owners for completed services." />

      {error && (
        <div className="update-status-error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="stat-cards-grid mb-8">
        {statCards.map((card) => (
          <div className="card" key={card.title}>
            <div className="card-body">
              <div
                style={{
                  padding: 10,
                  borderRadius: 8,
                  display: "inline-flex",
                  marginBottom: 12,
                  ...card.iconStyle,
                }}
              >
                {card.icon}
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)", marginBottom: 4 }}>
                {card.title}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: "2rem", fontWeight: 700 }}>{card.value}</span>
                {card.suffix && (
                  <span style={{ color: "var(--muted-foreground)" }}>{card.suffix}</span>
                )}
              </div>
              {card.extra && <div style={{ marginTop: 6 }}>{card.extra}</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: "1rem", marginBottom: 16 }}>Rating Distribution</h2>
            {ratingDistribution.map((item) => (
              <div className="rating-dist-row" key={item.stars}>
                <span className="stars-label">{item.stars}★</span>
                <div className="rating-bar-wrap">
                  <div className="rating-bar-fill" style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="rating-dist-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "row", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="filter-field" style={{ flex: 1 }}>
                <StarIcon />
                <select
                  className="filter-select"
                  aria-label="Filter by rating"
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                >
                  <option value="All">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="filter-field" style={{ flex: 1 }}>
                <FilterIcon />
                <select
                  className="filter-select"
                  aria-label="Filter by service type"
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                >
                  <option value="All">All Service Types</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC</option>
                </select>
              </div>

              <div className="filter-field" style={{ flex: 1 }}>
                <CalendarIcon />
                <select
                  className="filter-select"
                  aria-label="Filter by date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                >
                  <option value="All">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="3months">Last 3 Months</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>
        Recent Feedback (<span>{filteredFeedback.length}</span>)
      </h2>

      {loading ? (
        <div className="card">
          <div className="card-body">Loading ratings and feedback...</div>
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          <h3>No Feedback Found</h3>
          <p>No feedback matches your current filters.</p>
        </div>
      ) : (
        <div id="feedback-list">
          {filteredFeedback.map((item) => (
            <div className="feedback-full-item" key={item.id}>
              <div className="feedback-full-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span className="feedback-full-id">{item.complaintId}</span>
                    <span className="badge badge-green" style={{ borderRadius: 999 }}>
                      {item.serviceType}
                    </span>
                  </div>
                  <div className="feedback-full-rating">
                    {renderStars(item.rating, 16)}
                    <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                      {item.rating}.0
                    </span>
                  </div>
                  <p className="feedback-full-by">
                    by <strong style={{ color: "var(--foreground)" }}>{item.ownerName}</strong>
                  </p>
                  <p className="feedback-full-comment">{item.comment}</p>
                </div>
                <div className="feedback-full-right">
                  <div className="date-row">
                    <CalendarIcon />
                    {item.date || "Date unavailable"}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--muted-foreground)" }}>
                    {item.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
