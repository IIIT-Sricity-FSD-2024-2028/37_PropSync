import React, { useState } from "react";
import { approveComplaint, rejectComplaint } from "../../../services/managerService";
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
      await rejectComplaint(id, reason);
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
