import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import { useToast } from "../shared/Toast";
import BillsSummary from "./components/BillsSummary";
import BillCard from "./components/BillCard";
import PaymentHistoryTable from "./components/PaymentHistoryTable";
import PaymentModal from "./components/PaymentModal";
import PaymentRecordsTable from "./components/PaymentRecordsTable";
import { MM_PATHS } from "../shared/paths";
import { fetchComplaints, fetchProviders } from "../../../services/managerService";
import {
  fetchBills, filterPaidBills, filterPendingBills, isBillPaid as isPaid, markBillPaid,
  selectAllBills, selectBillsError, selectBillsLoading, selectBillsSaving,
} from "../../../redux/features/bills/billsSlice";
import {
  fetchPayments, selectAllPayments, selectPaymentsError, selectPaymentsLoading,
} from "../../../redux/features/payments/paymentsSlice";
import { notifyBillPaid } from "../../../redux/features/notifications/notificationsSlice";
import { createNotification } from "../../../services/notificationService";
const total = (b) => Number(b.totalAmount || b.amount || 0);

/* service-bills.html  (sidebar: "Payment History") */
export default function PaymentHistory() {
  const showToast = useToast();
  const dispatch = useDispatch();

  // Bills & payments come from the Redux store
  const bills = useSelector(selectAllBills);
  const loading = useSelector(selectBillsLoading);
  const billsError = useSelector(selectBillsError);
  const paying = useSelector(selectBillsSaving);
  const payments = useSelector(selectAllPayments);
  const paymentsLoading = useSelector(selectPaymentsLoading);
  const paymentsError = useSelector(selectPaymentsError);

  // complaint titles / provider names are only labels (not part of the bills slice)
  const [complaintsById, setComplaintsById] = useState({});
  const [providersById, setProvidersById] = useState({});
  const [payBill, setPayBill] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchBills());
    dispatch(fetchPayments());
    fetchComplaints().then((c) => setComplaintsById(Object.fromEntries(c.map((x) => [Number(x.id), x])))).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    load();
    fetchProviders().then((l) => setProvidersById(Object.fromEntries(l.map((p) => [Number(p.id), p.name])))).catch(() => {});
  }, [load]);

  const error = billsError && bills.length === 0 ? `Could not load bills from backend. ${billsError}` : "";

  const issueOf = (b) => complaintsById[Number(b.complaintId)]?.title || "Service Bill";
  const providerOf = (b, fallback = "—") => {
    const pid = complaintsById[Number(b.complaintId)]?.assignedProviderId;
    return pid ? providersById[Number(pid)] || `Provider #${pid}` : fallback;
  };
  const pending = useMemo(() => filterPendingBills(bills), [bills]);
  const paid = useMemo(() => filterPaidBills(bills), [bills]);

  // UPDATE: bill -> paid (the slice updates the bill in the store)
  const confirmPayment = async () => {
    try {
      await dispatch(markBillPaid(payBill.id)).unwrap();
      const cid = payBill.complaintId;
      const relatedComp = complaintsById[Number(cid)] || {};
      dispatch(notifyBillPaid({
        complaintId: cid,
        title: issueOf(payBill),
        ownerId: relatedComp.ownerId || 1,
        providerId: relatedComp.assignedProviderId || payBill.providerId || 10,
      }));
      createNotification({
        userId: Number(relatedComp.assignedProviderId || payBill.providerId || 10),
        complaintId: Number(cid),
        message: `Payment is completed and complaint is closed for Complaint #${cid}.`,
        type: "work_completed",
        recipient: "service_provider",
      }, "maintenance_manager").catch(() => {});
      createNotification({
        userId: Number(relatedComp.ownerId || 1),
        complaintId: Number(cid),
        message: `Payment is completed and complaint is closed for Complaint #${cid}.`,
        type: "work_completed",
        recipient: "owner",
      }, "maintenance_manager").catch(() => {});

      setPayBill(null);
      showToast("Payment processed. Complaint closed.");
      load(); // complaint status changed on the backend (billed -> closed)
    } catch (e) {
      showToast("Could not process payment: " + (e.message || "Unknown error"));
    }
  };

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader title="Service Bills & Payments" subtitle={`${pending.length} bill${pending.length !== 1 ? "s" : ""} pending payment approval`} />
      <BillsSummary
        pendingTotal={pending.reduce((s, b) => s + total(b), 0)}
        paidTotal={paid.reduce((s, b) => s + total(b), 0)}
        count={bills.length}
      />

      <h2 className="section-title">Pending Payments <span className="count-pill">{pending.length}</span></h2>
      {error ? <div className="card" style={{ color: "#DC2626" }}>{error}</div>
        : loading && bills.length === 0 ? <div className="card muted">Loading...</div>
        : pending.length === 0 ? <div className="card empty-state"><h3>No bills are pending payment</h3><p>Bills submitted by service providers will appear here.</p></div>
        : pending.map((b) => (
            <BillCard key={b.id} bill={b} issue={issueOf(b)} provider={providerOf(b, "Assigned provider")} onPay={() => setPayBill(b)} />
          ))}

      <PaymentHistoryTable bills={bills} loading={loading} isPaid={isPaid} issueOf={issueOf} providerOf={providerOf} onPay={setPayBill} />

      <PaymentRecordsTable
        payments={payments}
        loading={paymentsLoading}
        error={paymentsError}
        issueOf={(p) => {
          const bill = bills.find((b) => String(b.id) === String(p.billId));
          return bill ? issueOf(bill) : "—";
        }}
      />

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
