import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiFileText, FiRefreshCw, FiShield, FiTool } from "react-icons/fi";
import { formatMoney, getRoleSession, roleRequest } from "../../services/roleApi";
import "./SuperUserPages.css";

function monthKey(value) {
  if (!value) return "";
  const isoMonth = String(value).match(/^(\d{4})-(\d{2})/);
  if (isoMonth) return `${isoMonth[1]}-${isoMonth[2]}`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthlyTimeline(breakdown = []) {
  const amounts = new Map();
  breakdown.forEach((payment) => {
    const key = monthKey(payment.feeSettledAt || payment.paidAt || payment.month);
    if (key) amounts.set(key, (amounts.get(key) || 0) + Number(payment.platformRevenue || 0));
  });
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 3 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }), platformRevenue: amounts.get(key) || 0 };
  });
}

export default function SuperUserRevenue() {
  const session = getRoleSession("super_user");
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [state, setState] = useState({ loading: true, error: "" });

  const load = useCallback(async () => {
    setState({ loading: true, error: "" });
    try {
      const result = await roleRequest("super_user", session.id, "/maintenance/revenue");
      setData(result);
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }, [session.id]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.breakdown || []).filter((row) => !query || [row.owner, row.maintenanceManager, row.month, row.paymentId].join(" ").toLowerCase().includes(query));
  }, [data, search]);
  const months = useMemo(() => buildMonthlyTimeline(data?.breakdown || []), [data]);
  const maxRevenue = Math.max(...months.map((month) => Number(month.platformRevenue) || 0), 1);
  const monthsWithRevenue = months.filter((month) => Number(month.platformRevenue) > 0).length;
  const metrics = [
    { label: "Total Maintenance Collected", value: formatMoney(data?.totalMaintenanceCollected), icon: FiFileText, tone: "blue" },
    { label: "PropSync Platform Revenue (5%)", value: formatMoney(data?.platformRevenue), icon: FiShield, tone: "purple" },
    { label: "Manager Amount (95%)", value: formatMoney(data?.managerAmount), icon: FiTool, tone: "green" },
    { label: "Settled Payments Count", value: `${data?.paidPaymentCount || 0} Transactions`, icon: FiCheckCircle, tone: "orange" },
  ];

  return <main className="role-page superuser-role-page superuser-revenue">
    <header className="role-head"><div><h1>Platform Revenue</h1><p>Real-time platform revenue monetization derived from settled monthly maintenance platform fees.</p></div><div className="role-actions"><span className="su-settled-pill">5% Platform Fee · Settled Only</span><button className="role-button secondary" onClick={load} disabled={state.loading}><FiRefreshCw /> Refresh Data</button></div></header>
    {state.error && <div className="role-alert" role="alert">Revenue data unavailable: {state.error}</div>}
    {state.loading ? <div className="role-empty">Loading settled revenue...</div> : data && <>
      <section className="su-revenue-grid">{metrics.map(({ label, value, icon: Icon, tone }) => <article className={`su-stat-card ${tone}`} key={label}><div className="su-stat-icon"><Icon /></div><div className="su-stat-body"><strong>{value}</strong><span>{label}</span></div></article>)}</section>
      <section className="role-panel role-section su-revenue-chart-panel"><h2>Platform Fee Received — Month over Month</h2><p>Only settled (actually remitted) platform fees are counted as revenue here. Months with no settlements show as an empty dashed bar, not a skipped gap.</p>
        <div className="su-revenue-chart">{months.map((month) => {
          const amount = Number(month.platformRevenue) || 0;
          const barHeight = amount > 0 ? Math.max(18, amount / maxRevenue * 210) : 22;
          return <div className="su-revenue-month" key={month.key} title={`${month.label}: ${formatMoney(amount)}`}>
            <div className="su-revenue-plot"><span className={`su-revenue-value ${amount > 0 ? "has-value" : ""}`} style={{ bottom: `${barHeight + 30}px` }}>{formatMoney(amount)}</span><div className={amount > 0 ? "has-revenue" : "empty-revenue"} style={{ height: `${barHeight}px` }} /></div>
            <span className="su-revenue-label">{month.label}</span>
          </div>;
        })}</div>
        {monthsWithRevenue < 2 && <div className="su-revenue-notice"><span aria-hidden="true">ℹ️</span><span>Not enough monthly history yet to compare month-over-month — settle platform fees in at least two different months to see a trend.</span></div>}
      </section>
      <section className="role-panel role-section su-revenue-history"><div className="role-head"><div><h2>Settled Platform Revenue Breakdown</h2><p>Reconciled payment records with settled 5% platform fees</p></div><input className="role-input" placeholder="Search by owner, manager, month..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search revenue history" /></div>
        <div className="role-table-wrap"><table className="role-table"><thead><tr><th>Payment</th><th>Owner</th><th>Manager</th><th>Month</th><th>Collected</th><th>Platform (5%)</th><th>Manager (95%)</th><th>Settled</th></tr></thead><tbody>{rows.map((row) => <tr key={row.paymentId}><td>#{row.paymentId}</td><td>{row.owner}</td><td>{row.maintenanceManager}</td><td>{row.month}</td><td>{formatMoney(row.amountPaid)}</td><td>{formatMoney(row.platformRevenue)}</td><td>{formatMoney(row.managerAmount)}</td><td>{row.feeSettledAt || row.paidAt || "—"}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="role-empty">No settled platform revenue records found yet. Settle platform fees to populate this report.</div>}</div>
      </section>
    </>}
  </main>;
}