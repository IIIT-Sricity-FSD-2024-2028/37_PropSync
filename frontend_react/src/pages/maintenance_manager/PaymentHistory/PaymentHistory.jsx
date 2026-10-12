import React, { useCallback, useEffect, useState } from "react";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import { useToast } from "../shared/Toast";
import BillsSummary from "./components/BillsSummary";
import BillCard from "./components/BillCard";
import PaymentHistoryTable from "./components/PaymentHistoryTable";
import PaymentModal from "./components/PaymentModal";
import { MM_PATHS } from "../shared/paths";
import { fetchBills, fetchComplaints, fetchProviders, markBillPaid } from "../../../services/managerService";

const isPaid = (b) => (b.status || (b.isPaid ? "paid" : "submitted")) === "paid";
const total = (b) => Number(b.totalAmount || b.amount || 0);

/* service-bills.html  (sidebar: "Payment History") */
export default function PaymentHistory() {
  const showToast = useToast();
  const [bills, setBills] = useState([]);
  const [complaintsById, setComplaintsById] = useState({});
  const [providersById, setProvidersById] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [payBill, setPayBill] = useState(null);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([fetchBills(), fetchComplaints()]);
      setBills(b);
      setComplaintsById(Object.fromEntries(c.map((x) => [Number(x.id), x])));
      setError("");
    } catch {
      setError("Could not load bills from backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchProviders().then((l) => setProvidersById(Object.fromEntries(l.map((p) => [Number(p.id), p.name])))).catch(() => {});
  }, [load]);

  const issueOf = (b) => complaintsById[Number(b.complaintId)]?.title || "Service Bill";
  const providerOf = (b, fallback = "—") => {
    const pid = complaintsById[Number(b.complaintId)]?.assignedProviderId;
    return pid ? providersById[Number(pid)] || `Provider #${pid}` : fallback;
  };
  const pending = bills.filter((b) => !isPaid(b));

  const confirmPayment = async () => {
    setPaying(true);
    try {
      await markBillPaid(payBill.id);
      setPayBill(null);
      await load();
      showToast("Payment processed. Complaint closed.");
    } catch (e) {
      showToast("Could not process payment: " + (e.message || "Unknown error"));
    } finally {
      setPaying(false);
    }
  };

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader title="Service Bills & Payments" subtitle={`${pending.length} bill${pending.length !== 1 ? "s" : ""} pending payment approval`} />
      <BillsSummary
        pendingTotal={pending.reduce((s, b) => s + total(b), 0)}
        paidTotal={bills.filter(isPaid).reduce((s, b) => s + total(b), 0)}
        count={bills.length}
      />

      <h2 className="section-title">Pending Payments <span className="count-pill">{pending.length}</span></h2>
      {error ? <div className="card" style={{ color: "#DC2626" }}>{error}</div>
        : loading ? <div className="card muted">Loading...</div>
        : pending.length === 0 ? <div className="card empty-state"><h3>No bills are pending payment</h3><p>Bills submitted by service providers will appear here.</p></div>
        : pending.map((b) => (
            <BillCard key={b.id} bill={b} issue={issueOf(b)} provider={providerOf(b, "Assigned provider")} onPay={() => setPayBill(b)} />
          ))}

      <PaymentHistoryTable bills={bills} loading={loading} isPaid={isPaid} issueOf={issueOf} providerOf={providerOf} onPay={setPayBill} />

      <PaymentModal
        bill={payBill}
        issue={payBill ? issueOf(payBill) : ""}
        provider={payBill ? providerOf(payBill, "Assigned provider") : ""}
        busy={paying}
        onCancel={() => setPayBill(null)}
        onConfirm={confirmPayment}
      />
    </ManagerLayout>
  );
}
