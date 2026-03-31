/* ============================================================
   DASHBOARD — Render dashboard page
   ============================================================ */

function renderDashboard() {
  const container = document.getElementById('page-dashboard');

  const statsCards = [
    { title: 'Total System Participants', value: '1,248', change: '+12.5%', trend: 'up',   iconType: 'users',     bgClass: 'bg-purple-100', iconColor: 'text-purple-600' },
    { title: 'Owners',                    value: '456',   change: '+5.2%',  trend: 'up',   iconType: 'home',      bgClass: 'bg-blue-100',   iconColor: 'text-blue-600' },
    { title: 'Maintenance Managers',      value: '89',    change: '+2.1%',  trend: 'up',   iconType: 'wrench',    bgClass: 'bg-green-100',  iconColor: 'text-green-600' },
    { title: 'Service Providers',         value: '703',   change: '+8.3%',  trend: 'up',   iconType: 'briefcase', bgClass: 'bg-orange-100', iconColor: 'text-orange-600' },
    { title: 'Active Complaints',         value: '47',    change: '-15.4%', trend: 'down', iconType: 'alert',     bgClass: 'bg-red-100',    iconColor: 'text-red-600' },
  ];

  const recentRegs = [
    { name: 'John Mitchell',   role: 'Property Owner',      time: '2 hours ago', iconType: 'home',      bg: 'bg-blue-100',   color: 'text-blue-600' },
    { name: 'Sarah Chen',      role: 'Service Provider',    time: '5 hours ago', iconType: 'briefcase', bg: 'bg-orange-100', color: 'text-orange-600' },
    { name: 'David Rodriguez', role: 'Maintenance Manager', time: '1 day ago',   iconType: 'wrench',    bg: 'bg-green-100',  color: 'text-green-600' },
    { name: 'Emily Thompson',  role: 'Property Owner',      time: '2 days ago',  iconType: 'home',      bg: 'bg-blue-100',   color: 'text-blue-600' },
  ];

  const systemHealth = [
    { label: 'Server Status',       value: 'Operational', type: 'success' },
    { label: 'Database Connection', value: 'Healthy',     type: 'success' },
    { label: 'API Response Time',   value: '145ms',       type: 'info' },
    { label: 'Active Sessions',     value: '234',         type: 'info' },
  ];

  container.innerHTML = `
    <div style="margin-bottom:24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin-bottom:4px;">Dashboard Overview</h1>
      <p style="font-size:14px;color:#6b7280;">Monitor system-wide statistics and activity</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid" style="margin-bottom:24px;">
      ${statsCards.map(card => `
        <div class="stat-card">
          <div class="stat-icon-area ${card.bgClass}">
            <span class="${card.iconColor}" style="display:flex;">${ICONS[card.iconType]}</span>
            <div class="stat-trend ${card.trend}">
              ${ICONS[card.trend === 'up' ? 'trending-up' : 'trending-down']}
              <span>${card.change}</span>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${card.value}</div>
            <div class="stat-label">${card.title}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Bottom Grid -->
    <div class="dashboard-bottom">
      <!-- Recent Registrations -->
      <div class="card" style="padding:20px;">
        <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">Recent Registrations</h2>
        ${recentRegs.map(reg => `
          <div class="registration-item">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="reg-icon ${reg.bg} ${reg.color}">${ICONS[reg.iconType]}</div>
              <div>
                <div class="reg-name">${reg.name}</div>
                <div class="reg-role">${reg.role}</div>
              </div>
            </div>
            <div class="reg-time">${reg.time}</div>
          </div>
        `).join('')}
      </div>

      <!-- System Health -->
      <div class="card" style="padding:20px;">
        <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">System Health</h2>
        ${systemHealth.map(item => `
          <div class="health-item">
            <span class="health-label">${item.label}</span>
            <span class="${item.type === 'success' ? 'health-val-success' : 'health-val-info'}">${item.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
