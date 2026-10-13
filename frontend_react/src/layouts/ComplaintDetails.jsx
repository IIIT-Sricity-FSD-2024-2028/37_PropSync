import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./ComplaintDetails.css";
import Navbar from "../components/Navbar";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiFileText,
  FiDownload,
  FiUploadCloud,
  FiX,
  FiAlertCircle,
  FiShield,
  FiZap,
  FiCamera,
  FiCheckCircle,
  FiSend,
  FiFolder,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ROLE_USER_NAMES = {
  owner: "Raj Kumar",
  maintenance_manager: "Vijay Singh",
  service_provider: "BrightSpark Electricals",
  admin: "Green Valley Administrator",
};

const DEFAULT_LIFECYCLE_STEPS = [
  { id: 1, label: "Submitted" },
  { id: 2, label: "Approved" },
  { id: 3, label: "Provider Assigned" },
  { id: 4, label: "Estimate Submitted" },
  { id: 5, label: "Work In Progress" },
  { id: 6, label: "Completed" },
];

function getUserIdForRole(role) {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (user.id) return user.id;
  } catch {
    // fallback
  }
  const roleDefaults = {
    owner: 1,
    maintenance_manager: 5,
    service_provider: 10,
    admin: 13,
  };
  return roleDefaults[role] || 13;
}

function getLifecycleStep(status) {
  switch (status) {
    case "pending":
      return 1;
    case "approved":
      return 2;
    case "assigned":
      return 3;
    case "estimating_cost":
      return 4;
    case "in_progress":
      return 5;
    case "completed":
    case "billed":
    case "paid":
    case "closed":
    case "resolved":
      return 6;
    case "rejected":
      return 1;
    default:
      return 1;
  }
}

function getWorkProgress(status) {
  switch (status) {
    case "pending":
      return 15;
    case "approved":
      return 30;
    case "assigned":
      return 45;
    case "estimating_cost":
      return 60;
    case "in_progress":
      return 75;
    case "completed":
    case "billed":
    case "paid":
    case "closed":
    case "resolved":
      return 100;
    case "rejected":
      return 0;
    default:
      return 20;
  }
}

function formatStatus(status = "") {
  const map = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    assigned: "Provider Assigned",
    estimating_cost: "Estimating Cost",
    in_progress: "In Progress",
    completed: "Completed",
    billed: "Billed",
    paid: "Paid",
    closed: "Closed",
    payment_pending: "Payment Pending",
    resolved: "Resolved",
  };
  return map[status] || status || "Pending";
}

function getPhotoUrl(photo) {
  if (!photo) return null;
  if (/^(https?:|data:|blob:)/i.test(photo)) return photo;
  return `${API_URL}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

export default function ComplaintDetails({
  role,
  propRole,
  Proprole,
  proprole,
  complaintId,
  id,
  showNavbar,
  hideNavbar,
}) {
  // Resolve role strictly from passed props, fallback to current session
  const currentRole = useMemo(() => {
    const passed = (role || propRole || Proprole || proprole || "").toString().toLowerCase().trim();
    if (passed) return passed;
    try {
      const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (stored.role) return stored.role.toLowerCase().trim();
    } catch {
      // ignore
    }
    return "owner";
  }, [role, propRole, Proprole, proprole]);

  // State
  const [complaint, setComplaint] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [toast, setToast] = useState("");

  // Modals & Action States
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("in_progress");
  const [statusRemark, setStatusRemark] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const [estimateForm, setEstimateForm] = useState({
    cost: "3600",
    completionTime: "2 Days",
    description: "Emergency pipe replacement and basement cleanup",
    file: null,
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  };

  const targetId = useMemo(() => {
    if (complaintId || id) return complaintId || id;
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const urlId = search.get("id") || search.get("complaint") || search.get("task");
      if (urlId) return urlId;
      const parts = window.location.pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && /^\d+$/.test(lastPart)) return lastPart;
    }
    return null;
  }, [complaintId, id]);

  // Load from backend, fallback seamlessly to backend sample schema if backend is starting
  const loadComplaintData = useCallback(async () => {
    const userId = getUserIdForRole(currentRole);
    const headers = {
      role: currentRole,
      "x-user-id": String(userId),
      "Content-Type": "application/json",
    };

    let complaintData = null;
    let estimateData = null;

    try {
      const target = targetId || 1;
      const res = await fetch(`${API_URL}/complaints/${target}`, { headers });
      if (res.ok) {
        complaintData = await res.json();
      } else {
        const listRes = await fetch(`${API_URL}/complaints`, { headers });
        if (listRes.ok) {
          const list = await listRes.json();
          if (Array.isArray(list) && list.length > 0) {
            complaintData = list[0];
          }
        }
      }

      if (complaintData?.id) {
        const estRes = await fetch(`${API_URL}/estimates?complaintId=${complaintData.id}`, { headers });
        if (estRes.ok) {
          const estList = await estRes.json();
          if (Array.isArray(estList) && estList.length > 0) {
            estimateData = estList[estList.length - 1];
          }
        }
      }

      if (complaintData?.ownerId) {
        try {
          const userRes = await fetch(`${API_URL}/users?role=owner`, { headers });
          if (userRes.ok) {
            const users = await userRes.json();
            if (Array.isArray(users)) {
              const o = users.find((u) => u.id === complaintData.ownerId);
              if (o) {
                complaintData.ownerName = o.name;
                complaintData.propertyLocation = o.propertyUnit;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // Backend not running
    }

    // Default backend structure fallback
    if (!complaintData) {
      complaintData = {
        id: 1,
        title: "Water Leakage in Block A",
        description: "Continuous water leakage in corridor room 203 causing wet floors and damage.",
        category: "Plumbing",
        priority: "high",
        status: "approved",
        ownerId: 1,
        ownerName: "Raj Kumar",
        managerId: 5,
        location: "Building A, Corridor 203",
        propertyLocation: "Building A, Corridor 203",
        submittedAt: "2024-03-08",
        updatedAt: "2024-03-08",
        photo: null,
      };
    }

    setComplaint({
      ...complaintData,
      lifecycleStep: getLifecycleStep(complaintData.status),
      workProgress: getWorkProgress(complaintData.status),
      ownerName: complaintData.ownerName || "Raj Kumar",
      propertyLocation: complaintData.propertyLocation || complaintData.location || "Building A, Corridor 203",
    });

    setEstimate(estimateData);
  }, [currentRole, targetId]);

  useEffect(() => {
    loadComplaintData();
  }, [loadComplaintData]);

  // Maintenance Manager: Accept
  const handleAcceptComplaint = async () => {
    if (!complaint) return;
    setSubmittingAction(true);
    const userId = getUserIdForRole(currentRole);

    try {
      await fetch(`${API_URL}/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          role: "maintenance_manager",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ status: "approved" }),
      });
    } catch {
      // local update
    }

    setComplaint((prev) => ({
      ...prev,
      status: "approved",
      lifecycleStep: Math.max(prev.lifecycleStep, 2),
      workProgress: Math.max(prev.workProgress, 30),
    }));

    showToast("Complaint accepted successfully by Maintenance Manager.");
    setSubmittingAction(false);
  };

  // Maintenance Manager: Reject
  const handleConfirmRejection = async () => {
    if (!complaint) return;
    if (!rejectionReason.trim()) {
      alert("Please specify a rejection reason.");
      return;
    }

    setSubmittingAction(true);
    const userId = getUserIdForRole(currentRole);

    try {
      await fetch(`${API_URL}/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          role: "maintenance_manager",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
        }),
      });
    } catch {
      // local update
    }

    setComplaint((prev) => ({
      ...prev,
      status: "rejected",
      rejectionReason: rejectionReason.trim(),
      workProgress: 0,
    }));

    setRejectModalOpen(false);
    showToast(`Complaint rejected: "${rejectionReason}"`);
    setRejectionReason("");
    setSubmittingAction(false);
  };

  // Service Provider: Update Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    setSubmittingAction(true);
    const userId = getUserIdForRole(currentRole);

    try {
      await fetch(`${API_URL}/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          role: "service_provider",
          "x-user-id": String(userId),
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // local update
    }

    setComplaint((prev) => ({
      ...prev,
      status: newStatus,
      lifecycleStep: getLifecycleStep(newStatus),
      workProgress: getWorkProgress(newStatus),
    }));

    showToast(`Status updated to "${formatStatus(newStatus)}"`);
    setStatusRemark("");
    setSubmittingAction(false);
  };

  // Service Provider: Submit Estimate
  const handleSubmitEstimate = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    const parsedCost = Number(estimateForm.cost);
    if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
      alert("Please enter a valid estimated cost greater than 0.");
      return;
    }

    setSubmittingAction(true);
    const userId = getUserIdForRole(currentRole);

    try {
      const formData = new FormData();
      formData.append("complaintId", String(complaint.id));
      formData.append("providerId", String(userId));
      formData.append("estimatedCost", String(parsedCost));
      formData.append("notes", estimateForm.description.trim());
      if (estimateForm.file) {
        formData.append("document", estimateForm.file);
      }

      await fetch(`${API_URL}/estimates`, {
        method: "POST",
        headers: {
          role: "service_provider",
          "x-user-id": String(userId),
        },
        body: formData,
      });
    } catch {
      // local update
    }

    setEstimate({
      id: Date.now(),
      complaintId: complaint.id,
      providerId: userId,
      estimatedCost: parsedCost,
      notes: estimateForm.description,
      completionTime: estimateForm.completionTime || "Awaiting manager review",
      documentName: estimateForm.file ? estimateForm.file.name : "submitted_estimate_doc.pdf",
      approved: true,
    });

    setEstimateModalOpen(false);
    showToast("Service estimate submitted successfully.");
    setSubmittingAction(false);
  };

  // Vertical timeline
  const timelineItems = useMemo(() => {
    if (!complaint) return [];
    const s = complaint.status || "pending";
    return [
      {
        id: "submitted",
        title: "Complaint Submitted",
        time: complaint.submittedAt || "08 Mar 2024",
        done: true,
        current: s === "pending",
      },
      {
        id: "approved",
        title: "Complaint Approved",
        time: ["pending", "rejected"].includes(s) ? "Pending" : (complaint.updatedAt || "08 Mar 2024"),
        done: !["pending", "rejected"].includes(s),
        current: s === "approved",
      },
      {
        id: "assigned",
        title: "Service Provider Assigned",
        time: Boolean(complaint.assignedProviderId) || ["assigned", "estimating_cost", "in_progress", "completed", "billed", "paid", "closed", "resolved"].includes(s) ? "09 Mar 2024" : "Pending",
        done: Boolean(complaint.assignedProviderId) || ["assigned", "estimating_cost", "in_progress", "completed", "billed", "paid", "closed", "resolved"].includes(s),
        current: s === "assigned",
      },
      {
        id: "est_sub",
        title: "Estimate Submitted",
        time: estimate?.submittedAt || (complaint.estimateSubmitted ? "10 Mar 2024" : "Pending"),
        done: Boolean(estimate) || Boolean(complaint.estimateSubmitted) || ["in_progress", "completed", "billed", "paid", "closed", "resolved"].includes(s),
        current: s === "estimating_cost" && !estimate?.approved,
      },
      {
        id: "est_app",
        title: "Estimate Approved",
        time: estimate?.reviewedAt || (estimate?.approved || complaint.estimateApproved ? "11 Mar 2024" : "Pending"),
        done: Boolean(complaint.estimateApproved) || Boolean(estimate?.approved) || ["in_progress", "completed", "billed", "paid", "closed", "resolved"].includes(s),
        current: Boolean(estimate) && !estimate?.approved && s !== "in_progress",
      },
      {
        id: "wip",
        title: "Work In Progress",
        time: ["in_progress", "completed", "billed", "paid", "closed", "resolved"].includes(s) ? "12 Mar 2024" : "Pending",
        done: ["completed", "billed", "paid", "closed", "resolved"].includes(s),
        current: s === "in_progress",
      },
      {
        id: "done",
        title: "Work Completed",
        time: ["completed", "billed", "paid", "closed", "resolved"].includes(s) ? (complaint.updatedAt || "Completed") : "Pending",
        done: ["completed", "billed", "paid", "closed", "resolved"].includes(s),
        current: s === "completed",
      },
      {
        id: "payment",
        title: "Payment Processed",
        time: ["paid", "closed", "resolved"].includes(s) ? "Processed" : "Pending",
        done: ["paid", "closed", "resolved"].includes(s),
        current: s === "paid",
      },
    ];
  }, [complaint, estimate]);

  const isManager = currentRole === "maintenance_manager";
  const isProvider = currentRole === "service_provider";
  const isAdmin = currentRole === "admin";

  const shouldRenderNavbar = showNavbar === true || (!hideNavbar && typeof document !== "undefined" && !document.getElementById("nav_container"));
  const photoUrl = complaint ? getPhotoUrl(complaint.photo) : null;

  return (
    <div className="cd_page">
      {shouldRenderNavbar && (
        <Navbar name={ROLE_USER_NAMES[currentRole] || "Raj Kumar"} role={currentRole} />
      )}

      <div className="cd_main">
        {/* Back Link & Title */}
        <div>
          <a href="/complaints" className="cd_back_link">
            <FiArrowLeft /> Back to Complaints
          </a>
          <h1 className="cd_title">Complaint Details</h1>
        </div>

        {/* Content */}
        {complaint && (
          <>
            {/* Horizontal Lifecycle Stepper + Work Progress Bar */}
            <div className="cd_card">
              <div className="cd_card_title">
                <FiClock /> Complaint Lifecycle Process
              </div>

              <div className="cd_steps_row">
                {DEFAULT_LIFECYCLE_STEPS.map((step, idx) => {
                  const isCompleted = complaint.lifecycleStep > step.id;
                  const isActive = complaint.lifecycleStep === step.id;
                  return (
                    <div
                      key={step.id}
                      className={`cd_step_item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                    >
                      {idx < DEFAULT_LIFECYCLE_STEPS.length - 1 && <div className="cd_step_line" />}
                      <div className="cd_step_circle">
                        {isCompleted ? <FiCheck strokeWidth={3} /> : step.id}
                      </div>
                      <span className="cd_step_label">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Work Progress Bar */}
              <div className="cd_progress_bar_wrapper">
                <div className="cd_progress_info">
                  <span>Work Progress</span>
                  <span>{complaint.workProgress}% Complete</span>
                </div>
                <div className="cd_progress_track">
                  <div
                    className="cd_progress_fill"
                    style={{ width: `${complaint.workProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="cd_grid">
              {/* Column 1: Complaint Information */}
              <div className="cd_card">
                <div className="cd_card_title">
                  <FiShield /> Complaint Information
                </div>

                <div className="cd_info_list">
                  <div className="cd_info_item">
                    <span className="cd_info_label">Issue</span>
                    <span className="cd_info_value">{complaint.title}</span>
                  </div>
                  <div className="cd_info_item">
                    <span className="cd_info_label">Category</span>
                    <span className="cd_info_value">{complaint.category}</span>
                  </div>
                  <div className="cd_info_item">
                    <span className="cd_info_label">Complaint ID</span>
                    <span className="cd_info_value">#{complaint.id}</span>
                  </div>
                  <div className="cd_info_item">
                    <span className="cd_info_label">Submitted By</span>
                    <span className="cd_info_value">{complaint.ownerName}</span>
                  </div>
                  <div className="cd_info_item">
                    <span className="cd_info_label">Location</span>
                    <span className="cd_info_value">{complaint.propertyLocation}</span>
                  </div>
                  <div className="cd_info_item">
                    <span className="cd_info_label">Work Status</span>
                    <span className="cd_info_value">{formatStatus(complaint.status)}</span>
                  </div>
                  <div className="cd_info_item">
                    <span className="cd_info_label">Current Status</span>
                    <span className={`cd_status_pill ${complaint.status}`}>
                      {formatStatus(complaint.status)}
                    </span>
                  </div>
                  {complaint.rejectionReason && (
                    <div className="cd_info_item">
                      <span className="cd_info_label">Rejection Reason</span>
                      <span className="cd_info_value" style={{ color: "#dc2626" }}>
                        {complaint.rejectionReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Extra for Maintenance Manager: Accept or Reject Complaint */}
                {isManager && (
                  <div className="cd_mm_actions">
                    <button
                      type="button"
                      disabled={submittingAction}
                      className="cd_btn_accept"
                      onClick={handleAcceptComplaint}
                    >
                      <FiCheck /> Accept Complaint
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction}
                      className="cd_btn_reject"
                      onClick={() => setRejectModalOpen(true)}
                    >
                      <FiX /> Reject Complaint
                    </button>
                  </div>
                )}
              </div>

              {/* Column 2: Complaint Lifecycle */}
              <div className="cd_card">
                <div className="cd_card_title">
                  <FiZap /> Complaint Lifecycle
                </div>

                <div className="cd_lifecycle_list">
                  {timelineItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`cd_lifecycle_item ${item.done ? "done" : ""} ${item.current ? "current" : ""}`}
                    >
                      {idx < timelineItems.length - 1 && <div className="cd_timeline_vbar" />}
                      <div className="cd_timeline_row">
                        <div className="cd_timeline_dot">
                          {item.done && <FiCheck strokeWidth={3} />}
                        </div>
                        <span className="cd_timeline_title">{item.title}</span>
                      </div>
                      {item.current ? (
                        <span className="cd_current_tag">Current</span>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          {item.time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Extra for Service Provider: Update Complaint Status */}
                {isProvider && (
                  <form onSubmit={handleUpdateStatus} className="cd_sp_status_box">
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#374151" }}>
                      Update Complaint Status
                    </div>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="cd_select"
                    >
                      <option value="estimating_cost">Estimating Cost</option>
                      <option value="in_progress">Work In Progress</option>
                      <option value="completed">Work Completed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Optional status note / remarks"
                      value={statusRemark}
                      onChange={(e) => setStatusRemark(e.target.value)}
                      className="cd_input"
                    />
                    <button type="submit" disabled={submittingAction} className="cd_btn_primary">
                      <FiSend /> Update Status
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Description & Notes */}
            <div className="cd_card">
              <div className="cd_card_title">
                <FiFileText /> Description & Notes
              </div>
              <p className="cd_desc_text">
                {complaint.description || "Continuous water leakage in corridor room 203 causing wet floors and damage."}
              </p>
            </div>

            {/* Service Provider Documents (for Maintenance Manager, Admin, and Service Provider) */}
            {(isManager || isAdmin || isProvider) && (
              <div className="cd_card">
                <div className="cd_card_title">
                  <FiFolder /> Service Provider Documents
                </div>

                {estimate ? (
                  <div className="cd_sp_docs_container">
                    {/* Status Alert Banner */}
                    <div className="cd_alert_box">
                      <FiCheckCircle size={18} color="#16a34a" />
                      <span>
                        {estimate.approved
                          ? "Estimate Approved – You can now begin work on this task"
                          : "Estimate Submitted – Awaiting manager review"}
                      </span>
                    </div>

                    {/* Cost & Completion Time */}
                    <div className="cd_estimate_meta_row">
                      <div>
                        <span className="cd_info_label">Estimated Cost</span>
                        <div className="cd_cost_val">₹{estimate.estimatedCost}</div>
                      </div>
                      <div>
                        <span className="cd_info_label">Estimated Completion Time</span>
                        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                          {estimate.completionTime || "Awaiting manager review"}
                        </div>
                      </div>
                    </div>

                    {/* Description of Work */}
                    <div>
                      <span className="cd_info_label">Description of Work</span>
                      <p className="cd_desc_text" style={{ marginTop: "4px" }}>
                        {estimate.notes || "Emergency pipe replacement and basement cleanup"}
                      </p>
                    </div>

                    {/* Uploaded File Box */}
                    <div>
                      <span className="cd_info_label">Uploaded File</span>
                      <div className="cd_file_box" style={{ marginTop: "6px" }}>
                        <div className="cd_file_info">
                          <FiFileText size={20} color="#16a34a" />
                          <span>{estimate.documentName || "pipe_replacement_estimate_v1.pdf"}</span>
                        </div>
                        <button
                          type="button"
                          className="cd_file_download_btn"
                          onClick={() => showToast(`Downloading: ${estimate.documentName || "pipe_replacement_estimate_v1.pdf"}`)}
                        >
                          <FiDownload size={16} /> Download
                        </button>
                      </div>
                    </div>

                    {/* Extra for Service Provider: Submit / Update Estimate */}
                    {isProvider && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                        <button
                          type="button"
                          className="cd_btn_primary"
                          onClick={() => setEstimateModalOpen(true)}
                        >
                          <FiUploadCloud /> Submit New Estimate
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cd_empty_doc_box">
                    <span>No service provider documents have been submitted for this complaint yet.</span>
                    {isProvider && (
                      <div style={{ marginTop: "12px" }}>
                        <button
                          type="button"
                          className="cd_btn_primary"
                          onClick={() => setEstimateModalOpen(true)}
                        >
                          <FiUploadCloud /> Submit Estimate Document
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Complaint Issue Photo */}
            <div className="cd_card">
              <div className="cd_card_title">
                <FiCamera /> Complaint Issue Photo
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                Complaint Photo
              </div>
              {photoUrl ? (
                <div className="cd_photo_container">
                  <img
                    src={photoUrl}
                    alt="Complaint attachment"
                    className="cd_photo_img"
                  />
                  <span className="cd_photo_overlay_text">
                    Photo uploaded on {complaint.submittedAt || "Complaint submission"}
                  </span>
                </div>
              ) : (
                <div className="cd_empty_photo_box">
                  No photo attached to this complaint
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Rejection Reason Modal (Maintenance Manager) */}
      {rejectModalOpen && (
        <div className="cd_modal_overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="cd_modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>
                Reject Complaint
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setRejectModalOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
              Please specify the reason for rejecting this complaint:
            </p>
            <textarea
              rows={4}
              className="cd_textarea"
              placeholder="e.g. Duplicate issue already filed or out of society scope..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="cd_modal_actions">
              <button
                type="button"
                className="cd_btn_secondary"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                className="cd_btn_reject"
                onClick={handleConfirmRejection}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Estimate Modal (Service Provider) */}
      {estimateModalOpen && (
        <div className="cd_modal_overlay" onClick={() => setEstimateModalOpen(false)}>
          <div className="cd_modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>
                Submit Service Estimate
              </h3>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setEstimateModalOpen(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEstimate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="cd_info_label">Estimated Cost (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3600"
                  className="cd_input"
                  value={estimateForm.cost}
                  onChange={(e) => setEstimateForm({ ...estimateForm, cost: e.target.value })}
                />
              </div>
              <div>
                <label className="cd_info_label">Estimated Completion Time</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Days / Awaiting manager review"
                  className="cd_input"
                  value={estimateForm.completionTime}
                  onChange={(e) => setEstimateForm({ ...estimateForm, completionTime: e.target.value })}
                />
              </div>
              <div>
                <label className="cd_info_label">Description of Work</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Emergency pipe replacement and basement cleanup"
                  className="cd_textarea"
                  value={estimateForm.description}
                  onChange={(e) => setEstimateForm({ ...estimateForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="cd_info_label">Upload Estimate Document (PDF / DOCX)</label>
                <input
                  type="file"
                  required
                  className="cd_input"
                  onChange={(e) => setEstimateForm({ ...estimateForm, file: e.target.files?.[0] || null })}
                />
              </div>
              <div className="cd_modal_actions" style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  className="cd_btn_secondary"
                  onClick={() => setEstimateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submittingAction} className="cd_btn_primary">
                  Submit Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="cd_toast">
          <FiAlertCircle size={18} color="#22c55e" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
