import React, { useCallback, useEffect, useMemo, useState } from "react";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import ConfirmModal from "../shared/ConfirmModal";
import { useToast } from "../shared/Toast";
import MaintenanceChargeForm from "./components/MaintenanceChargeForm";
import MaintenanceStats from "./components/MaintenanceStats";
import MaintenancePaymentsTable from "./components/MaintenancePaymentsTable";
import { MM_PATHS } from "../shared/paths";
import {
  createMaintenanceCharges, deleteMaintenancePayment, fetchMaintenancePayments, getCurrentManager, markMaintenancePaid, settlePlatformFees,
} from "../../../services/managerService";

const fee = (p) => Number(p.platformFee) || Number(p.amount || 0) * 0.05;

/* maintenance.html */
export default function Maintenance() {
  const showToast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      setPayments(await fetchMaintenancePayments());
      setError("");
    } catch (e) {
      setPayments([]);
      setError(e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // same rules as updateMaintenanceStats() in the HTML page
  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    const unsettled = paid.filter((p) => p.feeSettlementStatus !== "settled");
    const settled = paid.filter((p) => p.feeSettlementStatus === "settled");
    const unsettledGross = unsettled.reduce((s, p) => s + Number(p.amount || 0), 0);
    const settledNet = settled.reduce((s, p) => s + Number(p.amount || 0) - fee(p), 0);
    return {
      total: payments.length,
      pending: payments.filter((p) => p.status === "pending" || p.status === "payment_submitted").length,
      paid: paid.length,
      collected: unsettledGross > 0 ? unsettledGross : settledNet,
      pendingFee: unsettled.reduce((s, p) => s + fee(p), 0),
    };
  }, [payments]);

  const createCharges = async (month, amount) => {
    try {
      const res = await createMaintenanceCharges(month, amount);
      const block = getCurrentManager().block;
      showToast(block ? `Maintenance charges created successfully for Block ${block} owners` : "Maintenance charges created successfully for block owners.");
      load();
      return { text: res.message || "Maintenance charges sent to owners.", type: "success" };
    } catch (e) {
      return { text: e.message || "Failed to create charges", type: "error" };
    }
  };

  const run = async (fn, okMsg) => {
    try {
      const res = await fn();
      showToast(res?.message || okMsg);
      load();
    } catch (e) {
      showToast(e.message || "Something went wrong");
    }
  };

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader title="Maintenance Payments" subtitle="Create monthly charges and track owner maintenance payment status." />
      <MaintenanceChargeForm onSubmit={createCharges} />
      <MaintenanceStats stats={stats} onPayFee={() => run(settlePlatformFees, "Platform fee remitted to platform successfully.")} />
      <MaintenancePaymentsTable
        payments={payments}
        loading={loading}
        error={error}
        onMarkPaid={(id) => run(() => markMaintenancePaid(id), "Payment marked as paid.")}
        onDelete={setToDelete}
      />
      <ConfirmModal
        open={toDelete !== null}
        icon="trash"
        danger
        title={`Delete maintenance payment #${toDelete}?`}
        message="This removes the charge for this owner. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const id = toDelete;
          setToDelete(null);
          run(() => deleteMaintenancePayment(id), "Maintenance payment deleted.");
        }}
      />
    </ManagerLayout>
  );
}
