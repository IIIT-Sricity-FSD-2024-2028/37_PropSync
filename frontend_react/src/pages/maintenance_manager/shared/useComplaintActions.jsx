import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateComplaintStatus } from "../../../redux/features/complaints/complaintsSlice";
import { createNotification } from "../../../redux/features/notifications/notificationsSlice";
import { getManagerViewer, useServiceProviders } from "./useManagerData";
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
  const { providers } = useServiceProviders(); // from the Redux users slice

  const askApprove = (id) => {
    setOpenCount((n) => n + 1);
    setApproveId(id);
  };
  const askReject = (id) => {
    setOpenCount((n) => n + 1);
    setRejectId(id);
  };

  // UPDATE: backend first; the complaints slice stores the updated complaint
  const doApprove = async (deadline) => {
    const id = approveId;
    const viewer = getManagerViewer();
    try {
      await dispatch(
        updateComplaintStatus({
          viewer,
          id,
          body: { status: "approved", deadline },
        }),
      ).unwrap();

      // Notify all registered service providers that the complaint is open for estimates
      const providerIds = [
        ...new Set([
          9,
          10,
          ...providers.map((p) => Number(p.id)).filter(Boolean),
        ]),
      ];
      await Promise.allSettled(
        providerIds.map((pId) =>
          dispatch(
            createNotification({
              data: {
                userId: pId,
                complaintId: Number(id),
                message: `Complaint #${id} was approved by Maintenance Manager. You may submit an estimate.`,
                type: "complaint_approved",
                recipient: "service_provider",
              },
              sender: viewer,
            }),
          ).unwrap(),
        ),
      );

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
      // The backend notifies the owner when a complaint is rejected
      await dispatch(
        updateComplaintStatus({
          viewer: getManagerViewer(),
          id,
          body: { status: "rejected", rejectionReason: reason },
        }),
      ).unwrap();

      showToast(`Complaint ${id} rejected. Reason sent to resident.`);
      setRejectId(null);
      onDone?.("rejected", id);
    } catch (e) {
      showToast(e.message || "Could not reject complaint.");
    }
  };

  const modals = (
    <>
      <DeadlineModal
        key={`a${openCount}`}
        open={approveId !== null}
        targetId={approveId}
        onClose={() => setApproveId(null)}
        onSubmit={doApprove}
      />
      <RejectModal
        key={`r${openCount}`}
        open={rejectId !== null}
        targetId={rejectId}
        onClose={() => setRejectId(null)}
        onSubmit={doReject}
      />
    </>
  );

  return { askApprove, askReject, modals };
}
