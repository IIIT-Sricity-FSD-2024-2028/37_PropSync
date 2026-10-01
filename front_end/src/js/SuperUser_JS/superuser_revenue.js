/* ============================================================
   PLATFORM REVENUE — Super User Platform Revenue Dashboard
   ============================================================ */

function formatRevenueMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function renderPlatformRevenue() {
  const container = document.getElementById('page-revenue');
  if (!container) return;

  container.innerHTML = `
    <!-- Revenue Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
      <div>
        <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 4px;">Platform Revenue</h1>
        <p style="font-size:14px;color:#6b7280;margin:0;">Real-time platform revenue monetization derived from settled monthly maintenance platform fees.</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge badge-green" style="font-size:12px;padding:6px 12px;font-weight:600;">
          5% Platform Fee · Settled Only
        </span>
        <button class="btn btn-outline" id="refresh-revenue-btn" style="padding:6px 12px;font-size:13px;gap:6px;" onclick="loadPlatformRevenue()">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" style="width:16px;height:16px;stroke:#374151;"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          Refresh Data
        </button>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <section style="margin-bottom:24px;">
      <div class="stats-grid-4" id="revenue-cards">
        <div class="stat-card">
          <div class="stat-icon-area bg-blue-100">
            <span class="text-blue-600" style="display:flex;">${ICONS['file-text'] || ICONS.users}</span>
          </div>
          <div class="stat-body">
            <div class="stat-value" id="rev-total-collected">₹0</div>
            <div class="stat-label">Total Maintenance Collected</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-area bg-purple-100">
            <span class="text-purple-600" style="display:flex;">${ICONS.shield}</span>
          </div>
          <div class="stat-body">
            <div class="stat-value" style="color:#7c3aed;" id="rev-platform-revenue">₹0</div>
            <div class="stat-label">PropSync Platform Revenue (5%)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-area bg-green-100">
            <span class="text-green-600" style="display:flex;">${ICONS.wrench}</span>
          </div>
          <div class="stat-body">
            <div class="stat-value" style="color:#16a34a;" id="rev-manager-amount">₹0</div>
            <div class="stat-label">Manager Amount (95%)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-area bg-orange-100">
            <span class="text-orange-600" style="display:flex;">${ICONS.check}</span>
          </div>
          <div class="stat-body">
            <div class="stat-value" id="rev-payment-count">0</div>
            <div class="stat-label">Settled Payments Count</div>
          </div>
        </div>
      </div>
    </section>

    <!-- MONTH OVER MONTH BAR CHART -->
    <section class="card" style="padding:24px;margin-bottom:24px;background:#ffffff;">
      <div style="margin-bottom:20px;">
        <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;">Platform Fee Received — Month over Month</h2>
        <p style="font-size:13px;color:#6b7280;margin:0;">Only settled (actually remitted) platform fees are counted as revenue here. Months with no settlements show as an empty dashed bar, not a skipped gap.</p>
      </div>

      <!-- Chart Container -->
      <div id="chart-container" style="padding:24px 16px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
        <div id="revenue-bar-chart" style="display:flex;align-items:flex-end;justify-content:space-around;height:240px;gap:16px;border-bottom:2px solid #cbd5e1;padding-bottom:12px;">
          <p style="color:#6b7280;margin:auto;">Loading chart…</p>
        </div>
        <div id="chart-x-labels" style="display:flex;justify-content:space-around;margin-top:8px;color:#64748b;font-size:12px;font-weight:600;"></div>
      </div>

      <!-- Historical Note if < 2 months -->
      <div id="insufficient-history-notice" style="display:none;margin-top:16px;padding:12px 16px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;font-size:13px;color:#92400e;align-items:center;gap:10px;">
        <span style="font-size:16px;">ℹ️</span>
        <span>Not enough monthly history yet to compare month-over-month — settle platform fees in at least two different months to see a trend.</span>
      </div>
    </section>

    <!-- Paid & Settled Revenue History Table -->
    <section class="card" style="padding:24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;">Settled Platform Revenue Breakdown</h2>
          <p style="font-size:13px;color:#6b7280;margin:0;">Reconciled payment records with settled 5% platform fees</p>
        </div>
        <div class="search-wrap" style="max-width:320px;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          <input type="text" id="revenue-table-search" class="search-input" placeholder="Search by owner, manager, month..." oninput="filterRevenueHistoryTable()" />
        </div>
      </div>
      <div id="revenue-history" style="overflow-x:auto;">
        <p style="color:#6b7280;">Loading revenue history…</p>
      </div>
    </section>
  `;

  loadPlatformRevenue();
}

let cachedRevenueData = null;

async function loadPlatformRevenue() {
  try {
    const response = await fetch('http://localhost:3000/maintenance/revenue', {
      headers: { role: 'super_user', 'x-user-id': '0' },
    });
    if (!response.ok) throw new Error('Revenue data could not be loaded');
    const revenue = await response.json();
    cachedRevenueData = revenue;

    // Update KPI cards
    const totalCollectedEl = document.getElementById('rev-total-collected');
    const platformRevEl    = document.getElementById('rev-platform-revenue');
    const managerAmtEl     = document.getElementById('rev-manager-amount');
    const paymentCountEl   = document.getElementById('rev-payment-count');

    if (totalCollectedEl) totalCollectedEl.textContent = formatRevenueMoney(revenue.totalMaintenanceCollected);
    if (platformRevEl)    platformRevEl.textContent    = formatRevenueMoney(revenue.platformRevenue);
    if (managerAmtEl)     managerAmtEl.textContent     = formatRevenueMoney(revenue.managerAmount);
    if (paymentCountEl)   paymentCountEl.textContent   = `${revenue.paidPaymentCount || 0} Transactions`;

    // Render Month over Month Bar Chart
    renderMonthOverMonthChart(revenue.breakdown || [], revenue.monthlyBreakdown || []);

    // Render Table
    renderRevenueHistoryTable(revenue.breakdown || []);

  } catch (error) {
    console.error('Failed to load platform revenue', error);
    const container = document.getElementById('page-revenue');
    if (container) {
      const errorMsg = `
        <div class="card empty-state" style="padding:32px;text-align:center;">
          ${ICONS.alert}
          <h3 style="font-size:18px;font-weight:700;color:#111827;margin:12px 0 6px;">Revenue Data Unavailable</h3>
          <p style="color:#6b7280;max-width:500px;margin:0 auto 16px;">Unable to fetch platform revenue from backend. Please ensure the backend server is running.</p>
          <button class="btn btn-green" onclick="loadPlatformRevenue()">Retry</button>
        </div>`;
      const history = document.getElementById('revenue-history');
      if (history) history.innerHTML = errorMsg;
    }
  }
}

function renderMonthOverMonthChart(breakdown, monthlyBreakdown) {
  const chartEl = document.getElementById('revenue-bar-chart');
  const labelsEl = document.getElementById('chart-x-labels');
  const noticeEl = document.getElementById('insufficient-history-notice');
  if (!chartEl || !labelsEl) return;

  // Build a standard 6-month continuous timeline (e.g., Jul 2026, Aug 2026, Sep 2026, Oct 2026, Nov 2026, Dec 2026)
  // Or dynamic based on settled payments
  const monthsTimeline = [
    { key: '2026-07', label: 'Jul 2026', short: 'Jul 2026' },
    { key: '2026-08', label: 'Aug 2026', short: 'Aug 2026' },
    { key: '2026-09', label: 'Sep 2026', short: 'Sep 2026' },
    { key: '2026-10', label: 'Oct 2026', short: 'Oct 2026' },
    { key: '2026-11', label: 'Nov 2026', short: 'Nov 2026' },
    { key: '2026-12', label: 'Dec 2026', short: 'Dec 2026' },
  ];

  // Map settled amounts by month key
  const revenueByMonth = new Map();
  breakdown.forEach(item => {
    let monthKey = '';
    if (item.feeSettledAt) {
      const d = new Date(item.feeSettledAt);
      monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (item.month && /^\d{4}-\d{2}/.test(item.month)) {
      monthKey = item.month.slice(0, 7);
    }
    const current = revenueByMonth.get(monthKey) || 0;
    revenueByMonth.set(monthKey, current + Number(item.platformRevenue || 0));
  });

  // Calculate max revenue for bar scaling
  let maxRevenue = 0;
  monthsTimeline.forEach(m => {
    const val = revenueByMonth.get(m.key) || 0;
    if (val > maxRevenue) maxRevenue = val;
  });
  if (maxRevenue < 200) maxRevenue = 200; // sensible ceiling for aesthetic height

  // Count distinct non-zero months
  let activeMonthsCount = 0;
  monthsTimeline.forEach(m => {
    if ((revenueByMonth.get(m.key) || 0) > 0) activeMonthsCount++;
  });

  // Render bars
  chartEl.innerHTML = monthsTimeline.map(m => {
    const amount = revenueByMonth.get(m.key) || 0;
    const hasRevenue = amount > 0;
    const barHeightPercent = hasRevenue ? Math.max(18, Math.min(95, (amount / maxRevenue) * 90)) : 8;

    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;position:relative;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:${hasRevenue ? '#15803d' : '#9ca3af'};">
          ${formatRevenueMoney(amount)}
        </div>
        <div style="
          width:54px;
          height:${barHeightPercent}%;
          max-height:170px;
          border-radius:8px 8px 0 0;
          transition:height 0.4s ease;
          ${
            hasRevenue
              ? 'background:linear-gradient(180deg, #22c55e 0%, #16a34a 100%);box-shadow:0 4px 10px rgba(22,163,74,0.25);'
              : 'border:2px dashed #cbd5e1;background:#f8fafc;min-height:16px;'
          }
        " title="${m.label}: ${formatRevenueMoney(amount)}"></div>
      </div>
    `;
  }).join('');

  // Render X-axis labels
  labelsEl.innerHTML = monthsTimeline.map(m => `
    <div style="flex:1;text-align:center;font-size:12px;color:#475569;font-weight:600;">
      ${m.short}
    </div>
  `).join('');

  // Show notice if fewer than 2 distinct months have revenue
  if (noticeEl) {
    noticeEl.style.display = activeMonthsCount < 2 ? 'flex' : 'none';
  }
}

function filterRevenueHistoryTable() {
  if (!cachedRevenueData) return;
  const searchInput = document.getElementById('revenue-table-search');
  const term = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const allRows = cachedRevenueData.breakdown || [];

  if (!term) {
    renderRevenueHistoryTable(allRows);
    return;
  }

  const filtered = allRows.filter(item => 
    String(item.owner || '').toLowerCase().includes(term) ||
    String(item.maintenanceManager || '').toLowerCase().includes(term) ||
    String(item.month || '').toLowerCase().includes(term)
  );

  renderRevenueHistoryTable(filtered);
}

function renderRevenueHistoryTable(rows) {
  const history = document.getElementById('revenue-history');
  if (!history) return;

  if (rows.length === 0) {
    history.innerHTML = '<p style="color:#6b7280;padding:24px 0;text-align:center;">No settled platform revenue records found yet. Settle platform fees to populate this report.</p>';
    return;
  }

  const totalGross = rows.reduce((s, r) => s + (r.amountPaid || 0), 0);
  const totalPlatform = rows.reduce((s, r) => s + (r.platformRevenue || 0), 0);
  const totalManager = rows.reduce((s, r) => s + (r.managerAmount || 0), 0);

  history.innerHTML = `
    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:13px;min-width:760px;">
      <thead>
        <tr style="text-align:left;color:#4b5563;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
          <th style="padding:12px 14px;font-weight:600;">Property Owner</th>
          <th style="padding:12px 14px;font-weight:600;">Maintenance Manager</th>
          <th style="padding:12px 14px;font-weight:600;">Billing Month</th>
          <th style="padding:12px 14px;font-weight:600;">Gross Paid</th>
          <th style="padding:12px 14px;font-weight:600;color:#7c3aed;">Platform (5%)</th>
          <th style="padding:12px 14px;font-weight:600;color:#16a34a;">Manager (95%)</th>
          <th style="padding:12px 14px;font-weight:600;">Settlement Date</th>
          <th style="padding:12px 14px;font-weight:600;text-align:center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(item => `
          <tr style="border-bottom:1px solid #f3f4f6;transition:background 0.15s ease;">
            <td style="padding:12px 14px;font-weight:500;color:#111827;">${escHtml(item.owner)}</td>
            <td style="padding:12px 14px;color:#4b5563;">${escHtml(item.maintenanceManager)}</td>
            <td style="padding:12px 14px;"><span class="badge badge-gray" style="font-size:12px;">${escHtml(item.month)}</span></td>
            <td style="padding:12px 14px;font-weight:600;color:#111827;">${formatRevenueMoney(item.amountPaid)}</td>
            <td style="padding:12px 14px;font-weight:700;color:#7c3aed;">${formatRevenueMoney(item.platformRevenue)}</td>
            <td style="padding:12px 14px;font-weight:600;color:#16a34a;">${formatRevenueMoney(item.managerAmount)}</td>
            <td style="padding:12px 14px;color:#6b7280;">${item.feeSettledAt ? new Date(item.feeSettledAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : (item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—')}</td>
            <td style="padding:12px 14px;text-align:center;"><span class="badge badge-green">Settled</span></td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight:700;background:#f9fafb;border-top:2px solid #e5e7eb;">
          <td colspan="3" style="padding:12px 14px;color:#111827;">Total Settled (${rows.length} records)</td>
          <td style="padding:12px 14px;color:#111827;">${formatRevenueMoney(totalGross)}</td>
          <td style="padding:12px 14px;color:#7c3aed;">${formatRevenueMoney(totalPlatform)}</td>
          <td style="padding:12px 14px;color:#16a34a;">${formatRevenueMoney(totalManager)}</td>
          <td colspan="2" style="padding:12px 14px;text-align:right;color:#6b7280;font-size:12px;">Settled & Reconciled</td>
        </tr>
      </tfoot>
    </table>
  `;
}

