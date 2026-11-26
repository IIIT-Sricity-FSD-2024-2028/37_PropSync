import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaidBillsByProvider, filterPaidBills, selectAllBills, selectBillsError, selectBillsLoading,
} from "../../redux/features/bills/billsSlice";
import PageHeader from "../../components/service_provider/PageHeader";
import { EmptyState, ErrorMessage, LoadingState } from "../../components/service_provider/FeatureStates";
import "./styles.css";

function getProviderId() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    return Number(user?.id || 10);
  } catch {
    return 10;
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function Earnings() {
  const providerId = getProviderId();
  const dispatch = useDispatch();
  // READ: paid bills come from the Redux store
  const allBills = useSelector(selectAllBills);
  const bills = useMemo(() => filterPaidBills(allBills), [allBills]);
  const loading = useSelector(selectBillsLoading);
  const storeError = useSelector(selectBillsError);
  const error = storeError ? `Could not load your earnings. ${storeError}` : "";
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    dispatch(fetchPaidBillsByProvider(providerId));
  }, [dispatch, providerId, reloadKey]);

  const totalReceived = useMemo(
    () => bills.reduce((total, bill) => total + Number(bill.totalAmount ?? bill.amount ?? 0), 0),
    [bills],
  );

  return (
    <div className="page-content service-provider-app earnings-page">
      <PageHeader title="My Earnings" description="Payments the maintenance manager has marked as paid for your completed work." />

      {error && <ErrorMessage onRetry={() => setReloadKey((key) => key + 1)} style={{ marginBottom: 20, padding: 16, background: "#FEE2E2", color: "#991B1B", borderRadius: 8 }}>{error}</ErrorMessage>}

      <section className="earnings-summary-grid" aria-label="Earnings summary">
        <div className="card"><div className="card-body">
          <p className="earnings-summary-label">Total received</p>
          <p className="earnings-summary-value">{loading ? "—" : formatAmount(totalReceived)}</p>
        </div></div>
        <div className="card"><div className="card-body">
          <p className="earnings-summary-label">Payments received</p>
          <p className="earnings-summary-value">{loading ? "—" : bills.length}</p>
        </div></div>
      </section>

      <section className="card earnings-history-card">
        <div className="card-header-bar"><h2>Payment History</h2></div>
        <div className="table-wrap">
          {loading ? <div className="earnings-state"><LoadingState>Loading earnings...</LoadingState></div>
            : error ? null
              : bills.length === 0 ? <div className="earnings-state"><EmptyState title="No payments received yet">Paid service bills will appear here after the manager marks them as paid.</EmptyState></div>
                : <table>
                  <thead><tr><th>Complaint</th><th>Description</th><th>Paid on</th><th>Amount received</th><th>Status</th></tr></thead>
                  <tbody>{bills.map((bill) => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: 600 }}>C-{bill.complaintId}</td>
                      <td>{bill.description || "Service work"}</td>
                      <td>{formatDate(bill.paidAt)}</td>
                      <td className="earnings-amount">{formatAmount(bill.totalAmount ?? bill.amount)}</td>
                      <td><span className="badge badge-status-completed">Paid</span></td>
                    </tr>
                  ))}</tbody>
                </table>}
        </div>
      </section>
    </div>
  );
}
