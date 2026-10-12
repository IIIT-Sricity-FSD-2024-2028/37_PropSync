import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./styles.css";

const API = "http://localhost:3000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

const SP_HEADERS = {
  role: "service_provider",
  "Content-Type": "application/json",
};

function getProviderId() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return Number(currentUser.id) || 10;
  } catch {
    return 10;
  }
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
  };
  return labels[status] || status || "Unknown";
}

function statusClass(status) {
  if (["In Progress", "Completed", "Paid", "Closed"].includes(status)) {
    return "badge badge-green";
  }
  if (["Assigned", "Estimating Cost", "Billed"].includes(status)) {
    return "badge badge-yellow";
  }
  return "badge";
}

function formatDate(value) {
  if (!value || value === "None") return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function validateAttachments(files) {
  if (!files.length) {
    return "Please upload at least one bill PDF or work photo.";
  }
  if (files.length > MAX_FILES) {
    return "You can upload a maximum of 5 attachments.";
  }

  for (const file of files) {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      return `${file.name}: only PDF files and images are allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} exceeds the 5 MB file size limit.`;
    }
  }
  return "";
}

function Icon({ type }) {
  if (type === "back") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    );
  }

  if (type === "upload") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    );
  }

  if (type === "camera") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  }

  if (type === "status") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    );
  }

  return null;
}

export default function UpdateStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("task");
  const providerId = getProviderId();
  const fileInputRef = useRef(null);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("In Progress");
  const [notes, setNotes] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDescription, setBillDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState({});

  const taskUrl = task
    ? `/service-provider/task-details?task=${encodeURIComponent(task.id)}`
    : "/service-provider/assigned-tasks";

  useEffect(() => {
    let cancelled = false;

    async function fetchTask() {
      if (!taskId) {
        setLoadError("The task you're looking for doesn't exist.");
        setLoading(false);
        return;
      }

      const numericId = String(taskId).replace(/^C-/i, "");

      try {
        const headers = {
          ...SP_HEADERS,
          "x-user-id": String(providerId),
        };

        const response = await fetch(
          `${API}/complaints/${encodeURIComponent(numericId)}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "The task you're looking for doesn't exist."
              : "Could not load task information."
          );
        }

        const complaint = await response.json();

        if (
          complaint.assignedProviderId != null &&
          Number(complaint.assignedProviderId) !== providerId
        ) {
          throw new Error("This task is not assigned to your account.");
        }

        let latestEstimate = null;
        try {
          const estimateResponse = await fetch(
            `${API}/estimates?complaintId=${encodeURIComponent(numericId)}`,
            { headers }
          );

          if (estimateResponse.ok) {
            const estimateData = await estimateResponse.json();
            const estimates = Array.isArray(estimateData)
              ? estimateData
              : estimateData
                ? [estimateData]
                : [];
            latestEstimate = estimates.at(-1) || null;
          }
        } catch {
          // The complaint itself can still be displayed if estimates fail to load.
        }

        const estimateApproved =
          complaint.estimateApproved === true ||
          latestEstimate?.approved === true;
        const status = statusLabel(complaint.status);

        const mappedTask = {
          id: String(complaint.id),
          issueType: complaint.category || "General",
          location: complaint.location || "Unknown",
          deadline: formatDate(complaint.deadline || "None"),
          status,
          backendStatus: complaint.status,
          estimateApproved,
        };

        if (cancelled) return;
        setTask(mappedTask);

        // Stop before showing a form that would submit an invalid transition
        // or create a duplicate unpaid bill.
        if (["billed", "paid", "closed", "completed"].includes(complaint.status)) {
          setLoadError(
            complaint.status === "billed"
              ? "Bill Already Submitted"
              : `This task is already ${statusLabel(complaint.status)}.`
          );
          return;
        }

        if (!estimateApproved) {
          setLoadError("Estimate Approval Required");
          return;
        }

        // The backend changes an approved task to in_progress when the
        // manager approves the estimate. The next valid SP action is billing.
        if (complaint.status !== "in_progress") {
          setLoadError(
            `This task is currently "${status}". Its status must be In Progress before a final bill can be submitted.`
          );
          return;
        }

        setSelectedStatus("Completed");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "Failed to load task.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTask();
    return () => {
      cancelled = true;
    };
  }, [taskId, providerId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function addFiles(incomingFiles) {
    const incoming = Array.from(incomingFiles || []);
    if (!incoming.length) return;

    setFiles((previous) => {
      const combined = [...previous, ...incoming];
      const validationError = validateAttachments(combined);

      if (validationError) {
        setErrors((current) => ({ ...current, files: validationError }));
        return previous;
      }

      setErrors((current) => ({ ...current, files: "" }));
      return combined;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index) {
    setFiles((previous) => previous.filter((_, i) => i !== index));
    setErrors((current) => ({ ...current, files: "" }));
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!task || task.backendStatus !== "in_progress") {
      setToast("This task is not in a state that allows bill submission.");
      return;
    }

    if (!task.estimateApproved) {
      setToast("The estimate must be approved before submitting a bill.");
      return;
    }

    const amount = Number(billAmount);
    const nextErrors = {
      notes: notes.trim() ? "" : "Please provide progress notes.",
      amount:
        billAmount.trim() !== "" && Number.isFinite(amount) && amount >= 0
          ? ""
          : "Please enter a valid bill amount.",
      description: billDescription.trim()
        ? ""
        : "Please provide a bill description.",
      files: validateAttachments(files),
    };

    setErrors(nextErrors);
    if (
      nextErrors.notes ||
      nextErrors.amount ||
      nextErrors.description ||
      nextErrors.files
    ) {
      return;
    }

    const numericId = String(task.id).replace(/^C-/i, "");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("complaintId", numericId);
      formData.append("amount", String(amount));
      formData.append(
        "description",
        `${billDescription.trim()}\n\nProgress notes: ${notes.trim()}`
      );
      files.forEach((file) => formData.append("attachments", file));

      // Do not manually set Content-Type for FormData. The browser adds
      // the multipart boundary automatically.
      const response = await fetch(`${API}/bills`, {
        method: "POST",
        headers: { role: "service_provider" },
        body: formData,
      });

      if (!response.ok) {
        let message = "Unknown error";
        try {
          const result = await response.json();
          message = Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || message;
        } catch {
          // Use fallback message.
        }

        throw new Error(`Could not submit bill: ${message}`);
      }

      setToast("Bill submitted for manager payment review!");
      window.setTimeout(() => navigate(taskUrl), 1200);
    } catch (error) {
      setToast(error.message || "Network error while submitting the bill.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <main className="main-wrap">
          <div className="page-content">
            <div className="empty-state">
              <p>Loading task information...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!task || loadError) {
    const approvalRequired = loadError === "Estimate Approval Required";
    const billAlreadySubmitted = loadError === "Bill Already Submitted";

    return (
      <div className="app-shell">
        <main className="main-wrap">
          <div className="page-content">
            <div className="empty-state">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              <h3>
                {approvalRequired
                  ? "Estimate Approval Required"
                  : billAlreadySubmitted
                    ? "Bill Already Submitted"
                    : task
                      ? "Status Update Unavailable"
                      : "Task Not Found"}
              </h3>

              <p>
                {approvalRequired
                  ? "The maintenance manager must approve your estimate before work status can be updated."
                  : billAlreadySubmitted
                    ? "A bill has already been submitted for this task. Wait for the maintenance manager to review or pay the existing bill."
                    : loadError || "The task you're looking for doesn't exist."}
              </p>

              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() =>
                    navigate(
                      task
                        ? taskUrl
                        : "/service-provider/assigned-tasks"
                    )
                  }
                >
                  {task ? "Back to Task Details" : "Back to Assigned Tasks"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="main-wrap">
        <div className="page-content">
          <div className="update-status-container">
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate(taskUrl)}
            >
              <Icon type="back" />
              Back to Task Details
            </button>

            <div className="page-header">
              <h1>Update Task Status</h1>
              <p>
                Update the progress and status of your assigned maintenance task.
              </p>
            </div>

            <div className="card mb-6">
              <div className="card-body">
                <div className="update-status-task-heading">
                  <h2>Task Information</h2>
                  <span className="badge badge-yellow">C-{task.id}</span>
                </div>

                <div className="info-grid-2" style={{ marginBottom: 0 }}>
                  <div>
                    <span className="update-status-muted-label">Issue Type:</span>
                    <span className="update-status-task-value">{task.issueType}</span>
                  </div>

                  <div>
                    <span className="update-status-muted-label">Current Status:</span>
                    <span className={statusClass(task.status)} style={{ marginLeft: 6 }}>
                      {task.status}
                    </span>
                  </div>

                  <div>
                    <span className="update-status-muted-label">Location:</span>
                    <span className="update-status-task-value">{task.location}</span>
                  </div>

                  <div>
                    <span className="update-status-muted-label">Deadline:</span>
                    <span className="update-status-task-value">{task.deadline}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="colored-card-header dark">
                <h2>Status Update</h2>
              </div>

              <div className="card-body">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-field">
                    <label className="form-label" htmlFor="status-select">
                      <Icon type="status" />
                      Update Status *
                    </label>

                    <select
                      id="status-select"
                      className="form-select"
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                    >
                      <option value="Completed">Completed — Submit Final Bill</option>
                    </select>
                  </div>

                  <div className="update-status-bill-fields">
                    <div className="alert-box yellow" style={{ marginBottom: 20 }}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p className="alert-text">
                        Completing this task requires submitting the final service
                        bill for manager payment review.
                      </p>
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="bill-amount">
                        Bill Amount *
                      </label>
                      <input
                        id="bill-amount"
                        type="number"
                        className="form-input"
                        min="0"
                        step="0.01"
                        placeholder="Enter final bill amount"
                        value={billAmount}
                        onChange={(event) => setBillAmount(event.target.value)}
                      />
                      {errors.amount && (
                        <p className="update-status-error">{errors.amount}</p>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="bill-desc">
                        Bill Description *
                      </label>
                      <textarea
                        id="bill-desc"
                        className="form-textarea"
                        rows={4}
                        placeholder="Describe completed work, materials, labour, and charges..."
                        value={billDescription}
                        onChange={(event) => setBillDescription(event.target.value)}
                      />
                      {errors.description && (
                        <p className="update-status-error">{errors.description}</p>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label" htmlFor="photo-upload">
                        <Icon type="camera" />
                        Upload Bill Attachment *
                      </label>

                      <div
                        className={`upload-zone ${
                          dragging ? "update-status-upload-dragging" : ""
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <Icon type="upload" />
                        <div className="upload-zone-label">
                          Click to upload a bill PDF or work photos
                        </div>
                        <p className="upload-zone-sub">
                          JPG, PNG, or PDF; maximum 5 MB each, up to 5 files
                        </p>

                        <input
                          ref={fileInputRef}
                          type="file"
                          id="photo-upload"
                          accept="image/*,.pdf"
                          multiple
                          hidden
                          onChange={(event) => addFiles(event.target.files)}
                        />

                        {files.length > 0 && (
                          <div
                            className="upload-file-list"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <p>Selected files:</p>
                            {files.map((file, index) => (
                              <div
                                className="upload-file-item"
                                key={`${file.name}-${file.size}-${index}`}
                              >
                                <span>
                                  {file.name} (
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                                <button
                                  type="button"
                                  className="update-status-remove-file"
                                  onClick={() => removeFile(index)}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {errors.files && (
                        <p className="update-status-error">{errors.files}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="notes-input">
                      Progress Notes *
                    </label>
                    <textarea
                      id="notes-input"
                      className="form-textarea"
                      rows={6}
                      placeholder="Describe the work completed, any issues encountered, or next steps..."
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                    {errors.notes && (
                      <p className="update-status-error">{errors.notes}</p>
                    )}
                  </div>

                  <div className="alert-box green" style={{ marginBottom: 24 }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <div>
                      <p className="alert-title">Status Update Guidelines</p>
                      <p className="alert-text">
                        Please provide detailed notes about your progress. If
                        marking as completed, ensure all work has been thoroughly
                        tested. Photos help document the work performed.
                      </p>
                    </div>
                  </div>

                  <div className="form-btn-row">
                    <button
                      type="submit"
                      className="btn btn-accent"
                      disabled={submitting}
                    >
                      <Icon type="status" />
                      {submitting ? "Submitting..." : "Update Status"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-gray"
                      disabled={submitting}
                      onClick={() => navigate(taskUrl)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="update-status-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
