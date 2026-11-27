
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "../../pages/service_provider/styles.css";
import EstimateDocumentLink from "./EstimateDocumentLink";
import { estimateStatus, estimateFileError, validateEstimate, MAX_ESTIMATE_COST } from "../../services/estimateWorkflow";
import {
  createEstimate as createEstimateAction,
  setEstimates as setEstimatesAction,
  updateEstimate as updateEstimateAction,
  deleteEstimate as deleteEstimateAction,
  checkDuplicateEstimate as checkDuplicateEstimateAction,
} from "../../redux/features/estimates/estimatesSlice";
import { notifyEstimateSubmitted } from "../../redux/features/notifications/notificationsSlice";

import { API_BASE_URL as API } from "../../services/api";

function getProviderId() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return user.id || 10;
  } catch {
    return 10;
  }
}

function Icon({ type }) {
  const paths = {
    back: <polyline points="15 18 9 12 15 6" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
    money: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    upload: (
      <>
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </>
    ),
    success: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
    warning: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
  };

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
      {paths[type]}
    </svg>
  );
}

export default function EstimateForm({ complaintId, embedded = false, onCancel, onSubmitted, onDeleted, onBusyChange }) {
  const Layout = embedded ? "div" : "main";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxEstimates = useSelector((state) => state.estimates);
  const [searchParams] = useSearchParams();
  const taskId = complaintId || searchParams.get("task");
  const submitLock = useRef(false);
  const fileInputRef = useRef(null);

  const [task, setTask] = useState(null);
  const [existingEstimate, setExistingEstimate] = useState(null);
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [costError, setCostError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [estimateLoadFailed, setEstimateLoadFailed] = useState(false);
  const [toast, setToast] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editCost, setEditCost] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFile, setEditFile] = useState(null);

  const providerId = getProviderId();
  const numericId = String(taskId || "").replace(/^C-/i, "");

  const goToDetails = useCallback(() => {
    if (onCancel) return onCancel();
    if (task && Number(task.assignedProviderId) !== Number(providerId)) {
      navigate(`/service-provider/available-complaints?open=${numericId}`);
    } else if (numericId) {
      navigate(`/service-provider/task-details?task=${numericId}`);
    } else {
      navigate("/service-provider/assigned-tasks");
    }
  }, [navigate, numericId, onCancel, task, providerId]);

  const loadTask = useCallback(async () => {
    if (!numericId) {
      setError("The task you're looking for doesn't exist.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setEstimateLoadFailed(false);

    const headers = {
      role: "service_provider",
      "x-user-id": String(providerId),
    };

    try {
      const response = await fetch(
        `${API}/complaints/${numericId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("The task you're looking for doesn't exist.");
      }

      const complaint = await response.json();
      setTask(complaint);

      try {
        const estimateResponse = await fetch(
          `${API}/estimates?complaintId=${numericId}`,
          { headers }
        );

        if (estimateResponse.ok) {
          const estimates = await estimateResponse.json();
          dispatch(setEstimatesAction(estimates));
          const matchingEstimate = estimates
            .filter(
              (estimate) =>
                Number(estimate.complaintId) === Number(numericId) &&
                Number(estimate.providerId) === Number(providerId)
            )
            .at(-1);

          setExistingEstimate(matchingEstimate || null);
        } else {
          throw new Error("Unable to load submitted estimates. Please reopen the complaint and retry.");
        }
      } catch (err) {
        setEstimateLoadFailed(true);
        setError(err.message || "Unable to load submitted estimates.");
      }
    } catch (err) {
      setError(err.message || "Unable to load this task.");
    } finally {
      setLoading(false);
    }
  }, [numericId, providerId]);

  useEffect(() => {
    const timer = setTimeout(loadTask, 0);
    return () => clearTimeout(timer);
  }, [loadTask]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeout = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  function chooseFile(selectedFile) {
    if (!selectedFile) return;

    const message = estimateFileError(selectedFile);
    if (message) {
      setFileError(message);
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setFileError("");
  }

  function handleFileChange(event) {
    chooseFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("estimate-upload-dragging");
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitLock.current || estimateLoadFailed || !task || !((task.status === "approved" && !task.assignedProviderId) || (Number(task.assignedProviderId) === Number(providerId) && ["assigned", "estimating_cost"].includes(task.status) && !task.estimateApproved))) return;

    const parsedCost = Number(cost);
    const errors = validateEstimate({ cost, description, file });
    setCostError(errors.cost);
    setDescriptionError(errors.description);
    setFileError(errors.file);
    if (!file) {
      setFileError("Please upload the estimate document before submitting.");
    }
    if (Object.values(errors).some(Boolean) || !file) {
      setError(errors.cost || errors.file || errors.description || "Please upload an estimate document and enter a valid cost.");
      return;
    }

    const formData = new FormData();
    formData.append("complaintId", numericId);
    formData.append("providerId", String(providerId));
    formData.append("estimatedCost", String(parsedCost));
    formData.append("notes", description.trim());
    formData.append("document", file);

    submitLock.current = true;
    setSubmitting(true);
    onBusyChange?.(true);
    dispatch(checkDuplicateEstimateAction({ complaintId: numericId, providerId }));

    try {
      const response = await fetch(`${API}/estimates`, {
        method: "POST",
        headers: {
          role: "service_provider",
          "x-user-id": String(providerId),
        },
        body: formData,
      });

      if (response.ok) {
        const estimate = await response.json();
        dispatch(createEstimateAction(estimate));
        setExistingEstimate(estimate);
        dispatch(notifyEstimateSubmitted({
          complaintId: numericId,
          title: task?.title || `Complaint #${numericId}`,
          ownerId: task?.ownerId || 1,
          providerId,
          cost: Number(cost),
          managerId: 5,
        }));
        createNotification({
          userId: 5,
          complaintId: Number(numericId),
          message: `Service Provider #${providerId} submitted an estimate of ₹${cost} for Complaint #${numericId}.`,
          type: "estimate_submitted",
          recipient: "maintenance_manager",
        }, "service_provider").catch(() => {});
        createNotification({
          userId: Number(task?.ownerId || 1),
          complaintId: Number(numericId),
          message: `An estimate of ₹${cost} has been submitted for your complaint #${numericId}.`,
          type: "estimate_submitted",
          recipient: "owner",
        }, "service_provider").catch(() => {});

        setToast("Estimate submitted \u2014 awaiting manager selection");
        onSubmitted?.(estimate);
      } else {
        const result = await response.json().catch(() => ({}));
        const message = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message;

        setError(message || "Could not submit estimate. Please try again.");
      }
    } catch {
      setError("Network error while submitting estimate.");
    } finally {
      submitLock.current = false;
      setSubmitting(false);
      onBusyChange?.(false);
    }
  }

  async function handleUpdateEstimate(e) {
    e.preventDefault();
    if (existingEstimate?.approved === true || existingEstimate?.selectionStatus === "selected" || (task && Number(task.assignedProviderId) === Number(providerId) && task.estimateApproved)) {
      return setError("This estimate has already been accepted and assigned by the manager and cannot be edited.");
    }
    const parsed = Number(editCost);
    if (!parsed || parsed <= 0) return setError("Please enter a valid positive cost.");
    if (parsed > MAX_ESTIMATE_COST) return setError(`Estimated cost cannot exceed ₹${MAX_ESTIMATE_COST.toLocaleString("en-IN")}.`);
    if (!existingEstimate?.documentUrl && !editFile) return setError("An estimate document file is required. Please upload a file.");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("estimatedCost", String(parsed));
      formData.append("notes", editDescription.trim());
      if (editFile) formData.append("document", editFile);

      const response = await fetch(`${API}/estimates/${existingEstimate.id}`, {
        method: "PATCH",
        headers: { role: "service_provider", "x-user-id": String(providerId) },
        body: formData,
      });
      if (response.ok) {
        const updated = await response.json();
        dispatch(updateEstimateAction(updated));
        setExistingEstimate(updated);
        setIsEditing(false);
        setEditFile(null);
        setToast("Estimate and document updated successfully!");
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Failed to update estimate");
      }
    } catch {
      setError("Network error updating estimate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEstimate() {
    if (!existingEstimate || !window.confirm("Are you sure you want to delete this estimate?")) return;
    setSubmitting(true);
    const estId = existingEstimate.id;
    try {
      await fetch(`${API}/estimates/${estId}`, {
        method: "DELETE",
        headers: { role: "service_provider", "x-user-id": String(providerId) },
      });
    } catch {}
    dispatch(deleteEstimateAction(estId));
    setExistingEstimate(null);
    setCost("");
    setDescription("");
    setFile(null);
    setToast("Estimate deleted successfully.");
    onDeleted?.(estId);
    setSubmitting(false);
    if (embedded) await loadTask();
    else goToDetails();
  }

  if (loading) {
    return (
      <div className={embedded ? "embedded-estimate" : "app-shell service-provider-app"}>
        <Layout className={embedded ? undefined : "main-wrap"}>
          <div className={embedded ? undefined : "page-content"}>
            <p>Loading task information...</p>
          </div>
        </Layout>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={embedded ? "embedded-estimate" : "app-shell service-provider-app"}>
        <Layout className={embedded ? undefined : "main-wrap"}>
          <div className={embedded ? undefined : "page-content"}>
            <div className="empty-state">
              <Icon type="warning" />
              <h3>Task Not Found</h3>
              <p>{error || "The task you're looking for doesn't exist."}</p>
              <button className="btn btn-dark" onClick={goToDetails}>
                Back to Assigned Tasks
              </button>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  const canSubmit = (task.status === "approved" && !task.assignedProviderId) ||
    (Number(task.assignedProviderId) === Number(providerId) &&
      ["assigned", "estimating_cost"].includes(task.status) && !task.estimateApproved);
  const priority = (task.priority || "low").toLowerCase();
  const priorityColor =
    priority === "high"
      ? "#DC2626"
      : priority === "medium"
        ? "#F59E0B"
        : "#10B981";

  return (
    <div className={embedded ? "embedded-estimate" : "app-shell service-provider-app"}>
      <Layout className={embedded ? undefined : "main-wrap"}>
        <div className={embedded ? undefined : "page-content"}>
          <div className="estimate-page-container">
            {!embedded && <button className="back-btn" onClick={goToDetails}>
              <Icon type="back" />
              Back to Task Details
            </button>}

            {existingEstimate ? (
              <>
                <div className="page-header">
                  <h1>Estimate Already Submitted</h1>
                  <p>
                    A service estimate has already been submitted for this
                    task.
                  </p>
                </div>

                <div className="card">
                  <div className={`colored-card-header ${existingEstimate.approved === false || existingEstimate.selectionStatus === "not_selected" ? "red" : "green"}`}>
                    <h2>Submitted Estimate</h2>
                  </div>

                  <div className="card-body">
                    <div className={`alert-box ${existingEstimate.approved === false || existingEstimate.selectionStatus === "not_selected" ? "red" : "green"} estimate-alert`}>
                      <Icon type={existingEstimate.approved === false || existingEstimate.selectionStatus === "not_selected" ? "warning" : "success"} />
                      <p style={existingEstimate.approved === false || existingEstimate.selectionStatus === "not_selected" ? { color: "#b91c1c", fontWeight: 600 } : undefined}>
                        {estimateStatus(existingEstimate)}
                      </p>
                    </div>

                    {isEditing && !(existingEstimate?.approved === true || existingEstimate?.selectionStatus === "selected" || (task && Number(task.assignedProviderId) === Number(providerId) && (task.estimateApproved || task.status === "in_progress" || task.status === "assigned"))) ? (
                      <form onSubmit={handleUpdateEstimate} style={{ marginTop: 16 }}>
                        <div style={{ marginBottom: 16 }}>
                          <label className="estimate-field-label">Estimated Cost (₹) * (Max ₹50,000)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            required
                            min="1"
                            max={MAX_ESTIMATE_COST}
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                          />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label className="estimate-field-label">Notes / Description of Work</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                          />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label className="estimate-field-label">Update Uploaded File</label>
                          {existingEstimate.documentName && (
                            <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 6 }}>
                              Current file: <strong>{existingEstimate.documentName}</strong>
                            </p>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                          />
                          {editFile ? (
                            <p style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>
                              Selected replacement: {editFile.name} ({(editFile.size / 1024).toFixed(1)} KB)
                            </p>
                          ) : (
                            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                              Choose a new PDF, Word, or Excel document to replace the uploaded file.
                            </p>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                          <button className="btn btn-dark" type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : "Save Changes"}
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => { setIsEditing(false); setEditFile(null); }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="info-grid-2 estimate-summary-grid">
                          <div>
                            <label className="estimate-field-label">Cost</label>
                            <p className="estimate-cost">
                              ₹{existingEstimate.estimatedCost}
                              {existingEstimate.isEdited && (
                                <span style={{ marginLeft: 8, fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "#eff6ff", color: "#2563eb", border: "1px solid #93c5fd", fontWeight: 600 }}>
                                  Edited &bull; New
                                </span>
                              )}
                            </p>
                          </div>

                          <div>
                            <label className="estimate-field-label">
                              Submitted By
                            </label>
                            <p className="estimate-provider">
                              Provider ID: {existingEstimate.providerId}
                            </p>
                          </div>
                        </div>

                        <div className="estimate-notes">
                          <label className="estimate-field-label">
                            Notes / Description
                          </label>
                          <p>
                            {existingEstimate.notes || "No notes provided."}
                          </p>
                        </div>

                        {existingEstimate.documentUrl && <EstimateDocumentLink estimate={existingEstimate} />}

                        {existingEstimate?.approved === true || existingEstimate?.selectionStatus === "selected" || (task && Number(task.assignedProviderId) === Number(providerId) && (task.estimateApproved || task.status === "in_progress" || task.status === "assigned")) ? (
                          <div style={{ marginTop: 16, marginBottom: 8, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534", fontSize: "13px", fontWeight: 600 }}>
                            ✓ Estimate Accepted &amp; Assigned by Manager — Locked
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 10, marginTop: 16, marginBottom: 8 }}>
                            <button
                              className="btn btn-dark"
                              type="button"
                              onClick={() => {
                                setIsEditing(true);
                                setEditCost(String(existingEstimate.estimatedCost || ""));
                                setEditDescription(existingEstimate.notes || "");
                                setEditFile(null);
                              }}
                            >
                              Edit Estimate & File
                            </button>
                            {(!existingEstimate.approved || existingEstimate.approved === false) && (
                              <button
                                className="btn btn-danger"
                                style={{ background: "#ef4444", color: "#fff" }}
                                type="button"
                                onClick={handleDeleteEstimate}
                                disabled={submitting}
                              >
                                {submitting ? "Deleting..." : "Delete Estimate"}
                              </button>
                            )}
                          </div>
                        )}

                        <button
                          className="btn btn-ghost btn-full"
                          style={{ marginTop: 8 }}
                          onClick={goToDetails}
                        >
                          {embedded ? "Close Estimate" : "View Full Task Details"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="page-header">
                  <h1>Submit Estimate</h1>
                  <p>
                    Provide a detailed estimate for this maintenance complaint.
                  </p>
                </div>

                <div className="card mb-6">
                  <div className="card-body">
                    <div className="estimate-task-heading">
                      <h2>Task Information</h2>
                      <span className="badge badge-yellow">
                        C-{task.id}
                      </span>
                    </div>

                    <div className="info-grid-2 estimate-task-grid">
                      <div>
                        <span className="estimate-muted-label">
                          Issue Type:
                        </span>
                        <span className="estimate-task-value">
                          {task.category || "General"}
                        </span>
                      </div>

                      <div>
                        <span className="estimate-muted-label">
                          Priority:
                        </span>
                        <span
                          className="estimate-task-value"
                          style={{ color: priorityColor }}
                        >
                          {task.priority
                            ? task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            : "Low"}
                        </span>
                      </div>

                      <div>
                        <span className="estimate-muted-label">
                          Location:
                        </span>
                        <span className="estimate-task-value">
                          {task.location || "Unknown"}
                        </span>
                      </div>

                      <div>
                        <span className="estimate-muted-label">
                          Deadline:
                        </span>
                        <span className="estimate-task-value">
                          {task.deadline || "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="colored-card-header green">
                    <h2>Estimate Details</h2>
                  </div>

                  <form className="card-body" onSubmit={handleSubmit} noValidate>
                    {!canSubmit && <p role="alert">This complaint is no longer accepting estimate submissions.</p>}
                    {error && (
                      <div className="alert-box yellow estimate-error-alert">
                        <Icon type="warning" />
                        <p>{error}</p>
                        {estimateLoadFailed && <button type="button" className="btn btn-ghost" onClick={loadTask}>Retry</button>}
                      </div>
                    )}

                    <div className="form-field">
                      <label className="form-label" htmlFor="cost-input">
                        <Icon type="money" />
                        Estimated Cost (₹) * (Max ₹50,000)
                      </label>

                      <input
                        id="cost-input"
                        type="number"
                        min="0.01"
                        max={MAX_ESTIMATE_COST}
                        step="0.01"
                        className="form-input"
                        placeholder="e.g., 4500"
                        value={cost}
                        onChange={(event) => setCost(event.target.value)}
                        aria-invalid={Boolean(costError)}
                      />

                      {costError && (
                        <p className="estimate-validation-error">
                          {costError}
                        </p>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="desc-input">
                        Description of Work &amp; Notes *
                      </label>

                      <textarea
                        id="desc-input"
                        className="form-textarea"
                        rows={6}
                        placeholder="Provide a detailed description of the work to be performed..."
                        value={description}
                        onChange={(event) =>
                          setDescription(event.target.value)
                        }
                        aria-invalid={Boolean(descriptionError)}
                      />

                      {descriptionError && (
                        <p className="estimate-validation-error">
                          {descriptionError}
                        </p>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">
                        Upload Estimate Document * (Mandatory)
                      </label>

                      <div
                        className={`upload-zone ${
                          file ? "estimate-file-selected" : ""
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.currentTarget.classList.add(
                            "estimate-upload-dragging"
                          );
                        }}
                        onDragLeave={(event) => {
                          event.currentTarget.classList.remove(
                            "estimate-upload-dragging"
                          );
                        }}
                        onDrop={handleDrop}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload estimate document"
                      >
                        <Icon type="upload" />

                        <input
                          ref={fileInputRef}
                          type="file"
                          style={{ display: "none" }}
                          accept=".pdf,.doc,.docx,.xlsx,.xls"
                          onChange={handleFileChange}
                        />

                        <div className="upload-zone-label">
                          {file
                            ? file.name
                            : "Click to upload or drag and drop"}
                        </div>

                        <p className="upload-zone-sub">
                          PDF, Word, or Excel (max 5 MB)
                        </p>

                        {file && (
                          <button
                            type="button"
                            className="estimate-remove-file"
                            onClick={(event) => {
                              event.stopPropagation();
                              setFile(null);
                              setFileError("");
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            Remove file
                          </button>
                        )}
                      </div>

                      {fileError && (
                        <p className="estimate-validation-error">
                          {fileError}
                        </p>
                      )}
                    </div>

                    <div className="form-btn-row">
                      <button
                        type="submit"
                        className="btn btn-accent"
                        disabled={submitting || estimateLoadFailed || !canSubmit}
                      >
                        <Icon type="file" />
                        {submitting ? "Submitting..." : task.status === "approved" ? "Accept Complaint & Submit Estimate" : "Submit Estimate"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-gray"
                        onClick={goToDetails}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </Layout>

      {toast && (
        <div className="estimate-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
