import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getComplaintDetails, getOwnerRatings, submitOwnerRating } from '../../services/ownerService';
import OwnerLayout from './components/OwnerLayout';
import './owner.css';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rating state
  const [existingRating, setExistingRating] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getComplaintDetails(id, currentUser);
      setComplaint(data);
      document.title = `PropSync – ${data.title || 'Complaint Detail'}`;

      // Check existing rating if complaint has assignedProviderId
      const ownerId = currentUser?.id || data.ownerId || 1;
      const ratings = await getOwnerRatings(ownerId, id, currentUser);
      if (ratings && ratings.length > 0) {
        setExistingRating(ratings[0]);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
      setError('Error loading complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    fetchDetails();
    // 15s polling cleanup
    const interval = setInterval(fetchDetails, 15000);
    return () => clearInterval(interval);
  }, [fetchDetails]);

  const normalizeStatus = (status) => {
    return String(status || 'pending').toLowerCase().replace(/_/g, ' ');
  };

  const displayStatus = (status) => {
    const normalized = normalizeStatus(status);
    const map = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      assigned: 'Assigned',
      'estimating cost': 'Estimating Cost',
      'in progress': 'In Progress',
      completed: 'Completed',
      billed: 'Billed',
      paid: 'Paid',
      closed: 'Closed',
      'payment pending': 'Payment Pending',
      resolved: 'Resolved',
    };
    return map[normalized] || status || 'Pending';
  };

  const RATABLE_STATUSES = new Set([
    'completed',
    'payment pending',
    'resolved',
    'paid',
    'closed',
  ]);

  const isComplaintRatable = (status) => {
    return RATABLE_STATUSES.has(normalizeStatus(status));
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!complaint) return;
    setSubmittingRating(true);
    try {
      const ownerId = currentUser?.id || complaint.ownerId || 1;
      const result = await submitOwnerRating(
        {
          ownerId,
          complaintId: complaint.id,
          score: ratingScore,
          feedback: ratingFeedback.trim() || undefined,
        },
        currentUser
      );
      setExistingRating(result);
    } catch (err) {
      alert(err.message || 'Error submitting rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading && !complaint) {
    return (
      <OwnerLayout>
        <main className="complaint-details-page main">
          <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading complaint details...</p>
        </main>
      </OwnerLayout>
    );
  }

  if (error && !complaint) {
    return (
      <OwnerLayout>
        <main className="complaint-details-page main">
          <h2 style={{ textAlign: 'center', marginTop: '50px' }}>{error}</h2>
        </main>
      </OwnerLayout>
    );
  }

  const currentStatus = normalizeStatus(complaint?.status);

  // Stepper calculations (6 steps)
  const statusStepMap = {
    pending: 1,
    rejected: 1,
    approved: 2,
    assigned: 3,
    'estimating cost': 4,
    'in progress': 5,
    completed: 6,
    billed: 6,
    paid: 6,
    closed: 6,
    'payment pending': 6,
    resolved: 6,
  };
  const currentStep = statusStepMap[currentStatus] || 1;

  const stepperSteps = [
    { num: 1, label: 'Submitted' },
    { num: 2, label: 'Approved' },
    { num: 3, label: 'Provider Assigned' },
    { num: 4, label: 'Estimate Submitted' },
    { num: 5, label: 'Work In Progress' },
    { num: 6, label: 'Completed' },
  ];

  // Lifecycle calculations (8 stages)
  const lifecycleStages = [
    { name: 'Complaint Submitted', date: complaint?.submittedOn || null },
    { name: 'Complaint Approved', date: null },
    { name: 'Service Provider Assigned', date: null },
    { name: 'Estimate Submitted', date: null },
    { name: 'Estimate Approved', date: null },
    { name: 'Work In Progress', date: null },
    { name: 'Work Completed', date: null },
    { name: 'Payment Processed', date: null },
  ];

  const lifecycleStepMap = {
    pending: 1,
    rejected: 1,
    approved: 2,
    assigned: 3,
    'estimating cost': 4,
    'in progress': 6,
    completed: 7,
    billed: 7,
    paid: 8,
    closed: 8,
    'payment pending': 8,
    resolved: 8,
  };
  const lifecycleCurrentStep = lifecycleStepMap[currentStatus] || 1;

  const workStatusMap = {
    pending: 'Waiting for Maintenance Manager to approve…',
    approved: 'Complaint approved. Waiting for provider assignment.',
    rejected: complaint?.rejectionReason
      ? `Complaint rejected. Reason: ${complaint.rejectionReason}`
      : 'Complaint was rejected by the Maintenance Manager.',
    assigned: `Assigned to: ${complaint?.assignedTo || 'a service provider'}`,
    'estimating cost': 'Service provider is submitting cost estimate.',
    'in progress': 'Work is currently in progress.',
    completed: 'Service provider marked the work as completed and submitted a bill.',
    billed: 'Service bill submitted. Payment is awaiting manager approval.',
    paid: 'Service bill payment has been completed.',
    closed: 'Payment completed. Complaint is closed.',
    'payment pending': 'Work is completed. Payment is pending.',
    resolved: 'Work has been completed and resolved.',
  };

  const statusColorMap = {
    pending: { background: 'var(--amber-lt)', color: 'var(--amber)', borderColor: 'rgba(217,119,6,.25)' },
    approved: { background: 'var(--green-lt)', color: 'var(--green)', borderColor: 'rgba(22,163,74,.25)' },
    rejected: { background: '#fee2e2', color: '#b91c1c', borderColor: 'rgba(185,28,28,.25)' },
    assigned: { background: 'var(--blue-lt)', color: 'var(--blue)', borderColor: 'rgba(29,78,216,.25)' },
    'estimating cost': { background: '#f5f3ff', color: '#7c3aed', borderColor: 'rgba(124,58,237,.25)' },
    'in progress': { background: 'var(--teal-lt)', color: 'var(--teal)', borderColor: 'rgba(13,148,136,.25)' },
    completed: { background: 'var(--green-lt)', color: 'var(--green)', borderColor: 'rgba(22,163,74,.25)' },
    billed: { background: '#f5f3ff', color: '#7c3aed', borderColor: 'rgba(124,58,237,.25)' },
    paid: { background: 'var(--green-lt)', color: 'var(--green)', borderColor: 'rgba(22,163,74,.25)' },
    closed: { background: 'var(--green-lt)', color: 'var(--green)', borderColor: 'rgba(22,163,74,.25)' },
    'payment pending': { background: '#f5f3ff', color: '#7c3aed', borderColor: 'rgba(124,58,237,.25)' },
    resolved: { background: '#f3f4f6', color: '#374151', borderColor: 'rgba(55,65,81,.25)' },
  };

  const badgeStyle = statusColorMap[currentStatus] || {};
  const photoSrc = complaint?.image || complaint?.photo;

  return (
    <OwnerLayout>
      <div className="complaint-details-page">
        <main className="main">
          {/* Back link */}
          <a
            className="back-link"
            onClick={(e) => {
              e.preventDefault();
              navigate(-1);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#34a853',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Complaints
          </a>

          {/* Dynamic page title */}
          <h2
            className="hdr-title"
            style={{
              fontFamily: '"Fraunces", serif',
              fontSize: '22px',
              fontWeight: 800,
              marginBottom: '18px',
              color: 'var(--text)',
            }}
          >
            {complaint?.title || 'Complaint Details'}
          </h2>

          {/* ── LIFECYCLE STEPPER ── */}
          <div className="stepper-card">
            <p className="card-section-label">Complaint Lifecycle Progress</p>
            <div className="stepper">
              {stepperSteps.map((step, idx) => {
                const isDone = step.num < currentStep;
                const isCurrent = step.num === currentStep;
                return (
                  <React.Fragment key={step.num}>
                    <div className="step-wrap">
                      <div
                        className={`step-circle ${isDone ? 'done' : isCurrent ? 'current' : ''}`}
                      >
                        {isDone ? '✓' : step.num}
                      </div>
                      <div className={`step-label ${isDone || isCurrent ? 'active' : ''}`}>
                        {step.label}
                      </div>
                    </div>
                    {idx < stepperSteps.length - 1 && (
                      <div className={`step-connector ${isDone ? 'done' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── TWO-COLUMN: INFO + LIFECYCLE ── */}
          <div className="grid-2">
            {/* Complaint Information */}
            <div className="card">
              <div className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Complaint Information
              </div>

              <div className="info-row">
                <div className="info-lbl">Issue</div>
                <div className="info-val" id="detail-title">{complaint?.title || '—'}</div>
              </div>

              <div className="info-row">
                <div className="info-lbl">Category</div>
                <div className="info-val" id="detail-category">{complaint?.category || '—'}</div>
              </div>

              <div className="info-row">
                <div className="info-lbl">Complaint Id</div>
                <div className="info-val" id="detail-id">C-{complaint?.id}</div>
              </div>

              <div className="info-row">
                <div className="info-lbl">Submitted By</div>
                <div className="info-val" id="detail-issuedby">{complaint?.issuedBy || '—'}</div>
              </div>

              <div className="info-row">
                <div className="info-lbl">Location</div>
                <div className="info-val" id="detail-location">{complaint?.location || 'Location not provided'}</div>
              </div>

              <div className="info-row">
                <div className="info-lbl">Work Status</div>
                <div
                  className="info-val"
                  id="detail-workstatus"
                  style={{ fontWeight: 500, color: 'var(--muted)' }}
                >
                  {workStatusMap[currentStatus] || displayStatus(complaint?.status) || '—'}
                </div>
              </div>

              <div className="info-row">
                <div className="info-lbl">Current Status</div>
                <div style={{ marginTop: '5px' }}>
                  <span
                    className="status-badge"
                    id="detail-status-badge"
                    style={badgeStyle}
                  >
                    <span className="status-dot"></span>
                    <span id="detail-status-text">{displayStatus(complaint?.status)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Complaint Lifecycle */}
            <div className="card">
              <div className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Complaint Lifecycle
              </div>

              <div className="lc-list">
                {lifecycleStages.map((stage, idx) => {
                  const stageStep = idx + 1;
                  const isDone = stageStep < lifecycleCurrentStep;
                  const isCur = stageStep === lifecycleCurrentStep;

                  return (
                    <div
                      key={idx}
                      className="lc-item"
                      style={idx === lifecycleStages.length - 1 ? { paddingBottom: 0 } : undefined}
                    >
                      <div className={`lc-dot ${isDone ? 'done' : isCur ? 'cur' : ''}`} />
                      <div>
                        <div className={`lc-name ${!isDone && !isCur ? 'dim' : ''}`}>
                          {stage.name} {isCur && <span className="cur-pill">Current</span>}
                        </div>
                        {isCur && stage.date && (
                          <div className="lc-date">{stage.date}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          <div className="card card-full">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Description &amp; Notes
            </div>
            <p className="desc-text">{complaint?.caption || complaint?.description || 'No description provided.'}</p>
          </div>

          {/* Owner Rating (Shown for ratable statuses only & if provider assigned) */}
          {isComplaintRatable(currentStatus) && complaint?.assignedProviderId && (
            <div className="card card-full" id="owner-rating-card">
              <div className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Rate Service Provider
              </div>

              {existingRating ? (
                <div className="rating-state" id="owner-rating-state">
                  You rated this service {existingRating.score}/5
                  {existingRating.feedback ? `: ${existingRating.feedback}` : '.'}
                </div>
              ) : (
                <form className="rating-form" id="owner-rating-form" onSubmit={handleRatingSubmit}>
                  <div className="rating-options" role="radiogroup" aria-label="Rating score">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <label key={s} className="rating-option">
                        <input
                          type="radio"
                          name="owner-rating-score"
                          value={s}
                          checked={ratingScore === s}
                          onChange={() => setRatingScore(s)}
                        />
                        <span>{s} star{s > 1 ? 's' : ''}</span>
                      </label>
                    ))}
                  </div>
                  <textarea
                    className="rating-feedback"
                    id="owner-rating-feedback"
                    maxLength="500"
                    placeholder="Share feedback for the completed service"
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                  />
                  <button
                    className="rating-submit"
                    id="owner-rating-submit"
                    type="submit"
                    disabled={submittingRating}
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── PHOTO ── */}
          <div className="card card-full">
            <div className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Complaint Issue Photo
            </div>
            <div className="photo-wrap">
              {photoSrc ? (
                <>
                  <img
                    src={photoSrc.startsWith('http') ? photoSrc : `http://localhost:3000${photoSrc.startsWith('/') ? '' : '/'}${photoSrc}`}
                    alt={complaint.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="photo-caption">
                    <strong>{complaint.title}</strong>
                    <small>Submitted by {complaint.issuedBy || 'resident'}</small>
                  </div>
                </>
              ) : (
                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No photo attached to this complaint.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </OwnerLayout>
  );
}
