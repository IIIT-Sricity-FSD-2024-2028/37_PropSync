export default function TaskActions({ task, canUpdateStatus, estimateIcon, updateIcon, onEstimate, onUpdate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={(event) => event.stopPropagation()}>
      {!task.estimateSubmitted && <button type="button" title="Submit Estimate" aria-label={`Submit estimate for task ${task.id}`} onClick={(event) => onEstimate(event, task)} style={{ padding: 7, background: "none", border: 0, cursor: "pointer", color: "#16A34A" }}>{estimateIcon}</button>}
      {canUpdateStatus(task) && <button type="button" title="Update Status" aria-label={`Update status for task ${task.id}`} onClick={(event) => onUpdate(event, task)} style={{ padding: 7, background: "none", border: 0, cursor: "pointer", color: "#D97706" }}>{updateIcon}</button>}
    </div>
  );
}
