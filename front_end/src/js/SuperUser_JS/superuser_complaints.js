/* ============================================================
   COMPLAINTS — Render, filter, CRUD, estimate review
   ============================================================ */

const COMPLAINT_STATUS_LABELS = {
  completed:          'Completed',
  ongoing:            'Ongoing',
  'to-be-resolved':   'To Be Resolved',
  'estimate-approval':'Estimate Approval',
};

const COMPLAINT_STATUS_BADGES = {
  completed:          'badge badge-green',
  ongoing:            'badge badge-blue',
  'to-be-resolved':   'badge badge-red',
  'estimate-approval':'badge badge-yellow',
};

const COMPLAINT_PRIORITY_BADGES = {
  high:   'badge badge-red',
  medium: 'badge badge-orange',
  low:    'badge badge-blue',
};

function renderComplaints() {
  let list   = getComplaints();
  const filter = AppState.complaintsFilter;
  const search = AppState.complaintsSearch.toLowerCase();

  list = list.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search) ||
      c.serviceProvider.toLowerCase().includes(search) ||
      c.providerType.toLowerCase().includes(search) ||
      c.property.toLowerCase().includes(search);
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
      { value: 'completed',         label: 'Completed' },
      { value: 'ongoing',           label: 'Ongoing' },
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
        <p>${search ? 'Try adjusting your search terms or filters' : 'No complaints match the selected filter'}</p>
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
              <div class="complaint-info-col"><p class="label">Property</p><p class="value">${escHtml(c.property)}</p></div>
              <div class="complaint-info-col"><p class="label">Reported By</p><p class="value">${escHtml(c.reportedBy)}</p></div>
            </div>
            <div class="complaint-meta">
              <div class="complaint-meta-left">
                <span style="display:flex;align-items:center;gap:4px;">${ICONS.clock}${new Date(c.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                ${c.estimatedCost ? `<span class="complaint-cost">${ICONS['file-text']}Estimated Cost: ${escHtml(c.estimatedCost)}</span>` : ''}
              </div>
              <div class="action-btns">
                <button class="action-btn view"   data-action="view-c"   data-id="${c.id}" title="View">${ICONS.eye}</button>
                <button class="action-btn edit"   data-action="edit-c"   data-id="${c.id}" title="Edit">${ICONS.pencil}</button>
                <button class="action-btn delete" data-action="delete-c" data-id="${c.id}" title="Delete">${ICONS.trash}</button>
              </div>
            </div>
          </div>
        </div>
        <div class="complaint-right">
          <span class="${COMPLAINT_STATUS_BADGES[c.status] || 'badge badge-gray'}">${COMPLAINT_STATUS_LABELS[c.status] || c.status}</span>
          <span class="${COMPLAINT_PRIORITY_BADGES[c.priority] || 'badge badge-gray'}">${c.priority.toUpperCase()} PRIORITY</span>
          ${c.status === 'estimate-approval' ? `<button class="review-btn" data-action="review-c" data-id="${c.id}">Review Estimate</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

/* ---- View Complaint Modal ---- */
function openViewComplaintModal(id) {
  const c = getComplaints().find(x => x.id === id);
  if (!c) return;
  const statusBadge   = COMPLAINT_STATUS_BADGES[c.status]   || 'badge badge-gray';
  const priorityBadge = COMPLAINT_PRIORITY_BADGES[c.priority] || 'badge badge-gray';

  document.getElementById('view-complaint-body').innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
      <div style="display:flex;align-items:flex-start;gap:16px;">
        <div style="background:#dbeafe;padding:16px;border-radius:8px;">${ICONS.wrench}</div>
        <div>
          <h3 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:4px;">${escHtml(c.title)}</h3>
          <p style="font-size:14px;color:#6b7280;">#${c.id}</p>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <span class="${statusBadge}">${COMPLAINT_STATUS_LABELS[c.status] || c.status}</span>
        <span class="${priorityBadge}">${c.priority.toUpperCase()} PRIORITY</span>
      </div>
    </div>

    <div style="margin-bottom:20px;">
      <label style="font-size:14px;font-weight:500;color:#374151;display:block;margin-bottom:8px;">Description</label>
      <p style="color:#111827;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">${escHtml(c.description)}</p>
    </div>

    <div class="view-details-grid" style="margin-bottom:20px;">
      <div class="view-detail-box" style="background:#eff6ff;border-color:#bfdbfe;">
        <div class="vd-label" style="color:#2563eb;">${ICONS.user}<span>Service Provider</span></div>
        <p class="vd-val">${escHtml(c.serviceProvider)}</p>
        <p class="vd-sub">${escHtml(c.providerType)}</p>
      </div>
      <div class="view-detail-box" style="background:#f0fdf4;border-color:#bbf7d0;">
        <div class="vd-label" style="color:#16a34a;">${ICONS.map}<span>Property</span></div>
        <p class="vd-val">${escHtml(c.property)}</p>
      </div>
      <div class="view-detail-box" style="background:#faf5ff;border-color:#e9d5ff;">
        <div class="vd-label" style="color:#9333ea;">${ICONS.shield}<span>Reported By</span></div>
        <p class="vd-val">${escHtml(c.reportedBy)}</p>
      </div>
      <div class="view-detail-box" style="background:#fff7ed;border-color:#fed7aa;">
        <div class="vd-label" style="color:#ea580c;">${ICONS.calendar}<span>Reported Date</span></div>
        <p class="vd-val">${new Date(c.reportedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>

    ${c.estimatedCost ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;color:#16a34a;margin-bottom:8px;">${ICONS['file-text']}<span style="font-weight:500;">Estimated Cost</span></div>
        <p style="font-size:28px;font-weight:700;color:#166534;">${escHtml(c.estimatedCost)}</p>
      </div>` : ''}

    <div style="display:flex;justify-content:flex-end;">
      <button class="btn" style="background:#4b5563;color:#fff;" data-close="view-complaint-modal">Close</button>
    </div>
  `;
  openModal('view-complaint-modal');
}

/* ---- Edit Complaint Modal ---- */
function openEditComplaintModal(id) {
  const c = getComplaints().find(x => x.id === id);
  if (!c) return;
  document.getElementById('ec-id').value            = c.id;
  document.getElementById('ec-title').value          = c.title;
  document.getElementById('ec-desc').value           = c.description;
  document.getElementById('ec-provider').value       = c.serviceProvider;
  document.getElementById('ec-provider-type').value  = c.providerType;
  document.getElementById('ec-property').value       = c.property;
  document.getElementById('ec-reported-by').value    = c.reportedBy;
  document.getElementById('ec-date').value           = c.reportedDate;
  document.getElementById('ec-status').value         = c.status;
  document.getElementById('ec-priority').value       = c.priority;
  document.getElementById('ec-cost').value           = c.estimatedCost || '';
  openModal('edit-complaint-modal');
}

/* ---- Review Estimate Modal ---- */
function openReviewEstimateModal(id) {
  const c = getComplaints().find(x => x.id === id);
  if (!c) return;
  AppState.selectedComplaint = c;

  document.getElementById('review-estimate-body').innerHTML = `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
      <h3 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;">${escHtml(c.title)}</h3>
      <p style="font-size:14px;color:#4b5563;margin-bottom:12px;">${escHtml(c.description)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
        <div><span style="color:#6b7280;">Complaint ID:</span> <span style="font-weight:500;">#${c.id}</span></div>
        <div><span style="color:#6b7280;">Property:</span> <span style="font-weight:500;">${escHtml(c.property)}</span></div>
        <div><span style="color:#6b7280;">Service Provider:</span> <span style="font-weight:500;">${escHtml(c.serviceProvider)}</span></div>
        <div><span style="color:#6b7280;">Provider Type:</span> <span style="font-weight:500;">${escHtml(c.providerType)}</span></div>
      </div>
    </div>

    <div class="estimate-cost-box" style="margin-bottom:20px;">
      <div class="cost-label">${ICONS['file-text']}<span>Estimated Maintenance Cost</span></div>
      <p class="cost-value">${escHtml(c.estimatedCost || 'N/A')}</p>
      <p class="cost-by">Submitted by ${escHtml(c.serviceProvider)}</p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="font-size:14px;color:#1e40af;"><strong>Note:</strong> Approving this estimate will change the complaint status to "Ongoing" and the service provider will be notified. Rejecting will mark it as "To Be Resolved".</p>
    </div>

    <div class="review-action-btns">
      <button class="btn btn-red"   id="reject-estimate-btn">${ICONS['x-circle']}<span>Reject Estimate</span></button>
      <button class="btn btn-green" id="approve-estimate-btn">${ICONS['check-circle']}<span>Approve Estimate</span></button>
    </div>
    <div style="display:flex;justify-content:center;margin-top:16px;">
      <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:14px;" data-close="review-estimate-modal">Cancel Review</button>
    </div>
  `;

  document.getElementById('approve-estimate-btn').addEventListener('click', () => reviewEstimate(c.id, 'approve'));
  document.getElementById('reject-estimate-btn').addEventListener('click',  () => reviewEstimate(c.id, 'reject'));

  openModal('review-estimate-modal');
}

function reviewEstimate(id, action) {
  const list = getComplaints().map(c => {
    if (c.id !== id) return c;
    return { ...c, status: action === 'approve' ? 'ongoing' : 'to-be-resolved' };
  });
  saveComplaints(list);
  renderComplaints();
  closeModal('review-estimate-modal');
}
