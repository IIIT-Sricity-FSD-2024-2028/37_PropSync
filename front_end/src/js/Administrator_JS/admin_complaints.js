/* ============================================================
   COMPLAINTS — Administrator Complaints
   ============================================================ */

const COMPLAINT_STATUS_LABELS = {
  pending:            'Pending',
  approved:           'Approved',
  assigned:           'Assigned',
  billed:             'Billed',
  paid:               'Paid',
  closed:             'Closed',
  rejected:           'Rejected',
  completed:          'Completed',
  ongoing:            'Ongoing',
  in_progress:        'In Progress',
  estimating_cost:    'Estimating Cost',
  'to-be-resolved':   'To Be Resolved',
  'estimate-approval':'Estimate Approval',
};

const COMPLAINT_STATUS_BADGES = {
  pending:            'badge badge-yellow',
  approved:           'badge badge-green',
  assigned:           'badge badge-blue',
  billed:             'badge badge-yellow',
  paid:               'badge badge-green',
  closed:             'badge badge-green',
  rejected:           'badge badge-red',
  completed:          'badge badge-green',
  ongoing:            'badge badge-blue',
  in_progress:        'badge badge-blue',
  estimating_cost:    'badge badge-yellow',
  'to-be-resolved':   'badge badge-red',
  'estimate-approval':'badge badge-yellow',
};

const COMPLAINT_PRIORITY_BADGES = {
  high:   'badge badge-red',
  medium: 'badge badge-orange',
  low:    'badge badge-blue',
};

async function renderComplaints() {
  await refreshAdminComplaintsFromBackend().catch(() => {});
  let list = getComplaints();
  const filter = AppState.complaintsFilter || 'all';
  const search = (AppState.complaintsSearch || '').toLowerCase();

  list = list.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search) ||
      String(c.serviceProvider || '').toLowerCase().includes(search) ||
      String(c.providerType || '').toLowerCase().includes(search) ||
      String(c.property || '').toLowerCase().includes(search) ||
      String(c.reportedBy || '').toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  // Update count
  const countEl = document.getElementById('complaints-count');
  if (countEl) countEl.textContent = `${list.length} ${list.length === 1 ? 'Complaint' : 'Complaints'}`;

  // Render filter dropdown options
  const filterMenu = document.getElementById('complaints-filter-menu');
  if (filterMenu) {
    const filterOptions = [
      { value: 'all',               label: 'All Complaints' },
      { value: 'pending',           label: 'Pending' },
      { value: 'approved',          label: 'Approved' },
      { value: 'assigned',          label: 'Assigned' },
      { value: 'completed',         label: 'Completed' },
      { value: 'ongoing',           label: 'Ongoing' },
      { value: 'billed',            label: 'Billed' },
      { value: 'paid',              label: 'Paid' },
      { value: 'closed',            label: 'Closed' },
      { value: 'rejected',          label: 'Rejected' },
      { value: 'to-be-resolved',    label: 'To Be Resolved' },
      { value: 'estimate-approval', label: 'Maintenance Estimate Approval' },
    ];
    filterMenu.innerHTML = filterOptions.map(opt => `
      <button class="filter-option-btn ${filter === opt.value ? 'active' : ''}" data-cfilter="${opt.value}">${opt.label}</button>
    `).join('');
    filterMenu.querySelectorAll('[data-cfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.complaintsFilter = btn.dataset.cfilter;
        document.getElementById('complaints-filter-label').textContent = btn.textContent;
        filterMenu.classList.remove('open');
        renderComplaints();
      });
    });
  }

  const listEl = document.getElementById('complaints-list');
  if (!listEl) return;

  if (list.length === 0) {
    listEl.innerHTML = `
      <div class="card empty-state">
        ${ICONS.alert}
        <h3>No Complaints Found</h3>
        <p>${search ? 'Try adjusting your search terms or filters' : 'No complaints match the selected filter for your community'}</p>
      </div>`;
    return;
  }

  listEl.innerHTML = list.map(c => `
    <div class="complaint-card">
      <div class="complaint-inner">
        <div class="complaint-left">
          <div class="complaint-icon">${ICONS.wrench}</div>
          <div class="complaint-details">
            <div>
              <span class="complaint-title">${escHtml(c.title)}</span>
              <span class="complaint-id">#${c.id}</span>
            </div>
            <p class="complaint-desc">${escHtml(c.description)}</p>
            <div class="complaint-info-grid">
              <div class="complaint-info-col"><p class="label">Service Provider</p><p class="value">${escHtml(c.serviceProvider)}</p></div>
              <div class="complaint-info-col"><p class="label">Provider Type</p><p class="value">${escHtml(c.providerType)}</p></div>
              <div class="complaint-info-col"><p class="label">Property / Location</p><p class="value">${escHtml(c.property)}</p></div>
              <div class="complaint-info-col"><p class="label">Reported By</p><p class="value">${escHtml(c.reportedBy)}</p></div>
            </div>
            <div class="complaint-meta">
              <div class="complaint-meta-left">
                <span style="display:flex;align-items:center;gap:4px;">${ICONS.clock}${new Date(c.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                ${c.estimatedCost ? `<span class="complaint-cost">${ICONS['file-text']}Estimated Cost: ${escHtml(c.estimatedCost)}</span>` : ''}
              </div>
              <div class="action-btns">
                <button class="btn btn-outline" data-action="view-c" data-id="${c.id}" title="View Details" style="padding:4px 10px;font-size:12px;gap:6px;border-radius:6px;cursor:pointer;">
                  ${ICONS.eye}
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="complaint-right">
          <span class="${COMPLAINT_STATUS_BADGES[c.status] || 'badge badge-gray'}">${COMPLAINT_STATUS_LABELS[c.status] || c.status}</span>
          <span class="${COMPLAINT_PRIORITY_BADGES[c.priority] || 'badge badge-gray'}">${(c.priority || 'medium').toUpperCase()} PRIORITY</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ---- Maintenance Manager-Style View Complaint Modal for Administrator ---- */
function openViewComplaintModal(id) {
  const list = getComplaints();
  const c = list.find(x => x.id === id || String(x.id) === String(id));
  if (!c) return;

  const body = document.getElementById('view-complaint-body');
  if (!body) return;

  const raw = c.rawComplaint || {};
  const statusKey = String(c.status || 'pending').toLowerCase();
  const priorityKey = String(c.priority || 'medium').toLowerCase();

  const stepLabels = ['Submitted', 'Approved', 'Provider Assigned', 'Estimate Submitted', 'Work in Progress', 'Completed'];
  const stepIndexMap = {
    pending: 0,
    approved: 1,
    assigned: 2,
    estimating_cost: 3,
    'estimate-approval': 3,
    in_progress: 4,
    ongoing: 4,
    completed: 5,
    billed: 5,
    paid: 5,
    closed: 5,
    rejected: 0,
  };
  const si = stepIndexMap[statusKey] !== undefined ? stepIndexMap[statusKey] : 1;

  const lifecycleSteps = [
    { title: 'Complaint Submitted', date: c.reportedDate || '2024-03-08' },
    { title: 'Complaint Approved', date: si >= 1 ? 'Approved by Maintenance Manager' : 'Pending review' },
    { title: 'Service Provider Assigned', date: si >= 2 ? (c.serviceProvider !== 'Not Assigned' ? c.serviceProvider : 'Assigned') : 'Pending assignment' },
    { title: 'Estimate Submitted', date: si >= 3 ? (c.estimatedCost ? `Estimate: ${c.estimatedCost}` : 'Estimate Submitted') : 'Pending estimate' },
    { title: 'Estimate Approved', date: si >= 4 ? 'Estimate Approved' : 'Pending estimate review' },
    { title: 'Work In Progress', date: si >= 4 ? 'Service provider on-site' : 'Pending work start' },
    { title: 'Work Completed', date: si >= 5 ? 'Work completed & verified' : 'Pending completion' },
    { title: 'Payment Processed', date: (statusKey === 'paid' || statusKey === 'closed') ? 'Payment processed' : 'Pending final billing' },
  ];

  const progressPercent = {
    pending: 10,
    approved: 25,
    assigned: 35,
    estimating_cost: 50,
    'estimate-approval': 50,
    in_progress: 65,
    ongoing: 65,
    completed: 85,
    billed: 90,
    paid: 100,
    closed: 100,
    rejected: 0,
  }[statusKey] || 35;

  const statusLabel = COMPLAINT_STATUS_LABELS[statusKey] || c.status;
  const priorityBadge = COMPLAINT_PRIORITY_BADGES[priorityKey] || 'badge badge-gray';
  const statusBadge = COMPLAINT_STATUS_BADGES[statusKey] || 'badge badge-gray';

  body.innerHTML = `
    <div style="margin-bottom:20px;">
      <!-- Stepper -->
      <div class="stepper" style="margin-bottom:24px;">
        ${stepLabels.map((s, i) => `
          <div class="step ${i < si ? 'done' : i === si ? 'current' : ''}">
            <div class="step-circle">${i < si ? '✓' : i + 1}</div>
            <div class="step-label">${s}</div>
          </div>
        `).join('')}
      </div>

      <!-- Information & Lifecycle Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div class="detail-card">
          <div class="detail-card-title">📋 Complaint Information</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <div style="font-size:11px;color:#6b7280;">Complaint ID</div>
              <div style="font-weight:700;font-family:monospace;color:#111827;">${escHtml(c.id)}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Priority</div>
              <div><span class="${priorityBadge}">${priorityKey.toUpperCase()}</span></div>
            </div>
            <div style="grid-column:1/-1;">
              <div style="font-size:11px;color:#6b7280;">Issue</div>
              <div style="font-weight:700;color:#111827;">${escHtml(c.title)}</div>
            </div>
            <div style="grid-column:1/-1;">
              <div style="font-size:11px;color:#6b7280;">Location</div>
              <div style="font-weight:600;color:#111827;">${escHtml(c.property || '—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Submitted By</div>
              <div style="font-weight:600;color:#111827;">${escHtml(c.reportedBy || 'Property Owner')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Submitted Date</div>
              <div style="color:#111827;">${c.reportedDate || '—'}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Assigned Provider</div>
              <div style="color:#111827;font-weight:600;">${escHtml(c.serviceProvider || 'Not yet assigned')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Due Date</div>
              <div style="color:#111827;">${raw.deadline || 'Within 7 days'}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Current Status</div>
              <div><span class="${statusBadge}">${statusLabel}</span></div>
            </div>
            <div>
              <div style="font-size:11px;color:#6b7280;">Estimated Cost</div>
              <div style="font-weight:700;color:#16a34a;">${escHtml(c.estimatedCost || '₹4,500 (Standard)')}</div>
            </div>
          </div>
        </div>

        <!-- Complaint Lifecycle -->
        <div class="detail-card">
          <div class="detail-card-title">🔄 Complaint Lifecycle</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${lifecycleSteps.map((step, idx) => `
              <div class="lifecycle-item">
                <div class="lifecycle-radio ${idx <= si + 1 ? 'active' : ''}"></div>
                <div>
                  <div class="lifecycle-text ${idx <= si + 1 ? 'active' : ''}">${step.title}</div>
                  <div class="lifecycle-date">${step.date}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Work Progress -->
      <div class="detail-card" style="margin-bottom:16px;">
        <div class="detail-card-title">📊 Work Progress</div>
        <div class="progress-pct-label">${progressPercent}% Completed</div>
        <div class="work-progress-bar-wrap">
          <div class="work-progress-bar" style="width:${progressPercent}%;"></div>
        </div>
        <div class="work-meta" style="margin-top:14px;">
          <div>
            <div class="work-meta-label">📅 Submitted On</div>
            <div class="work-meta-value">${c.reportedDate || '—'}</div>
          </div>
          <div>
            <div class="work-meta-label">🕐 Due Date</div>
            <div class="work-meta-value">${raw.deadline || 'Standard TAT (7 Days)'}</div>
          </div>
          <div>
            <div class="work-meta-label">👤 Service Provider</div>
            <div class="work-meta-value">${escHtml(c.serviceProvider || 'Unassigned')}</div>
          </div>
        </div>
      </div>

      <!-- Work Updates & Timeline -->
      <div class="detail-card" style="margin-bottom:16px;">
        <div class="detail-card-title">🕐 Work Updates &amp; Timeline</div>
        <div style="padding-left:4px;">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <div class="timeline-title">Issue Reported &amp; Logged <span class="timeline-time">${c.reportedDate || 'Just now'}</span></div>
              <div class="timeline-desc">Resident reported issue: ${escHtml(c.title)}</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot" style="background:#16a34a;border-color:#bbf7d0;"></div>
            <div>
              <div class="timeline-title">Review &amp; Assignment Status <span class="timeline-time">System Log</span></div>
              <div class="timeline-desc">Status: <strong>${statusLabel}</strong> · Provider: ${escHtml(c.serviceProvider)}</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot" style="background:#9333ea;border-color:#e9d5ff;"></div>
            <div>
              <div class="timeline-title">Community Record Synchronized <span class="timeline-time">Active Record</span></div>
              <div class="timeline-desc">Complaint visible to community administrator and assigned maintenance manager.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description & Notes -->
      <div class="detail-card" style="margin-bottom:16px;">
        <div class="detail-card-title">📝 Description &amp; Notes</div>
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">
          ${escHtml(c.description || 'No additional description provided.')}
        </p>
      </div>

      <!-- Service Provider Documents -->
      <div class="detail-card" style="margin-bottom:16px;">
        <div class="detail-card-title">📄 Service Provider Documents</div>
        <div style="font-size:13px;color:#4b5563;display:flex;align-items:center;gap:12px;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">
          <div style="background:#dbeafe;padding:8px;border-radius:6px;color:#2563eb;">${ICONS['file-text']}</div>
          <div>
            <div style="font-weight:600;color:#111827;">Service Estimate Document: ${c.id}-EST.pdf</div>
            <div style="font-size:12px;color:#6b7280;">Estimated Cost: ${escHtml(c.estimatedCost || '₹4,500')} · Verified by PropSync</div>
          </div>
        </div>
      </div>

      <!-- Complaint Issue Photo -->
      <div class="detail-card">
        <div class="detail-card-title">📷 Complaint Issue Photo</div>
        <div style="background:#f9fafb;border-radius:8px;height:160px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:14px;border:2px dashed #e5e7eb;">
          📷 Issue Photo Captured &amp; Stored on Server
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-top:20px;">
      <button class="btn btn-outline" data-close="view-complaint-modal">Close</button>
    </div>
  `;

  openModal('view-complaint-modal');
}
