import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { approveComplaint, rejectComplaint, fetchProviders } from "../../../services/managerService";
import {
  notifyComplaintApproved,
  notifyComplaintRejected,
} from "../../../redux/features/notifications/notificationsSlice";
import { createNotification } from "../../../services/notificationService";
import DeadlineModal from "./DeadlineModal";
import RejectModal from "./RejectModal";
import { useToast } from "./Toast";

/**
 * Approve / Reject flow used by Dashboard, Complaints and Complaint Details
 * (approveComplaintById / openRejectModal / submitReject in the old JS).
 *
 *   const { askApprove, askReject, modals } = useComplaintActions(reload);
 *   <button onClick={() => askApprove(id)}>Approve</button>
 *   {modals}
 */
export default function useComplaintActions(onDone) {
  const dispatch = useDispatch();
  const showToast = useToast();
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [openCount, setOpenCount] = useState(0); // new key each time → fresh modal

  const askApprove = (id) => {
    setOpenCount((n) => n + 1);
    setApproveId(id);
  };
  const askReject = (id) => {
    setOpenCount((n) => n + 1);
    setRejectId(id);
  };

  const doApprove = async (deadline) => {
    const id = approveId;
    try {
      await approveComplaint(id, deadline);

      // Notify all registered service providers that a complaint was approved and is open for estimates
      let providerIds = [9, 10];
      try {
        const allProviders = await fetchProviders();
        if (Array.isArray(allProviders) && allProviders.length > 0) {
          const ids = allProviders.map((p) => Number(p.id)).filter(Boolean);
          if (ids.length > 0) providerIds = [...new Set([...providerIds, ...ids])];
        }
      } catch {
        // Fallback to default providers [9, 10]
      }

      await Promise.allSettled(
        providerIds.map((pId) =>
          createNotification(
            {
              userId: pId,
              complaintId: Number(id),
              message: `Complaint #${id} was approved by Maintenance Manager. You may submit an estimate.`,
              type: "complaint_approved",
              recipient: "service_provider",
            },
            "maintenance_manager"
          )
        )
      );

      dispatch(notifyComplaintApproved({
        complaintId: id,
        title: `Complaint #${id}`,
        providerIds,
      }));

      showToast(`Complaint ${id} approved and moved to Approved Complaints.`);
      setApproveId(null);
      onDone?.("approved", id);
    } catch (e) {
      showToast(e.message || "Could not approve complaint.");
    }
  };

  const doReject = async (reason) => {
    const id = rejectId;
    try {
      // Backend rejectComplaint already notifies the owner directly (avoiding duplicate notifications)
      await rejectComplaint(id, reason);

      dispatch(notifyComplaintRejected({
        complaintId: id,
        title: `Complaint #${id}`,
        ownerId: 1,
        reason,
      }));

      showToast(`Complaint ${id} rejected. Reason sent to resident.`);
      setRejectId(null);
      onDone?.("rejected", id);
    } catch (e) {
      showToast(e.message || "Could not reject complaint.");
    }
  };

  const modals = (
    <>
      <DeadlineModal key={`a${openCount}`} open={approveId !== null} targetId={approveId} onClose={() => setApproveId(null)} onSubmit={doApprove} />
      <RejectModal key={`r${openCount}`} open={rejectId !== null} targetId={rejectId} onClose={() => setRejectId(null)} onSubmit={doReject} />
    </>
  );

  return { askApprove, askReject, modals };
}
