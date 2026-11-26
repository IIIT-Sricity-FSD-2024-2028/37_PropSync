import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import ManagerLayout from "../shared/ManagerLayout";
import PageHeader from "../shared/PageHeader";
import ConfirmModal from "../shared/ConfirmModal";
import { useToast } from "../shared/Toast";
import MaintenanceChargeForm from "./components/MaintenanceChargeForm";
import MaintenanceStats from "./components/MaintenanceStats";
import MaintenancePaymentsTable from "./components/MaintenancePaymentsTable";
import { MM_PATHS } from "../shared/paths";
import { getCurrentManager, getManagerId } from "../../../services/managerService";
import {
  createMaintenanceCharges, fetchMaintenance, markMaintenancePaid, removeMaintenance, settleMaintenanceFees,
} from "../../../services/maintenanceService";
import { selectMaintenance, selectMaintenanceRequest } from "../../../redux/features/maintenance/maintenanceSlice";

const fee = (p) => Number(p.platformFee) || Number(p.amount || 0) * 0.05;

/* maintenance.html */
export default function Maintenance() {
  const showToast = useToast();
  const dispatch = useDispatch();
  const { getState } = useStore();
  const managerId = getManagerId();
  const session = { role: "maintenance_manager", id: managerId };
  const payments = useSelector((state) => selectMaintenance(state, session));
  const list = useSelector((state) => selectMaintenanceRequest(state, session, "list"));
  const loading = list.status === "idle" || list.status === "loading";
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMaintenance({ dispatch, getState }, {
      session: { role: "maintenance_manager", id: managerId }, signal: controller.signal,
    }).catch(() => { /* Redux exposes the request error. */ });
    return () => controller.abort();
  }, [dispatch, getState, managerId]);

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
      const res = await createMaintenanceCharges({ dispatch, getState }, { session, month, amount });
      const block = getCurrentManager().block;
      showToast(block ? `Maintenance charges created successfully for Block ${block} owners` : "Maintenance charges created successfully for block owners.");
      return { text: res.message || "Maintenance charges sent to owners.", type: "success" };
    } catch (e) {
      return { text: e.message || "Failed to create charges", type: "error" };
    }
  };

  const run = async (fn, okMsg) => {
    try {
      const res = await fn();
      showToast(res?.message || okMsg);
    } catch (e) {
      showToast(e.message || "Something went wrong");
    }
  };

  return (
    <ManagerLayout backTo={MM_PATHS.dashboard} backLabel="Back to Dashboard">
      <PageHeader title="Maintenance Payments" subtitle="Create monthly charges and track owner maintenance payment status." />
      <MaintenanceChargeForm onSubmit={createCharges} />
      <MaintenanceStats stats={stats} onPayFee={() => run(() => settleMaintenanceFees({ dispatch, getState }, { session }), "Platform fee remitted to platform successfully.")} />
      <MaintenancePaymentsTable
        payments={payments}
        loading={loading}
        error={list.error}
        onMarkPaid={(id) => run(() => markMaintenancePaid({ dispatch, getState }, { session, id }), "Payment marked as paid.")}
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
          run(() => removeMaintenance({ dispatch, getState }, { session, id }), "Maintenance payment deleted.");
        }}
      />
    </ManagerLayout>
  );
}
