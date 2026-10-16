import TaskActions from "./TaskActions";
import { StatusBadge } from "./FeatureStates";

function TaskRow({ task, canUpdateStatus, getPriorityColor, getStatusColor, isOverdue, onView, onEstimate, onUpdate, calendarIcon, estimateIcon, updateIcon }) {
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <tr className="clickable" onClick={() => onView(task)} tabIndex={0} onKeyDown={(event) => {
      if (event.key === "Enter") onView(task);
    }}>
      <td><span style={{ fontWeight: 600, color: "var(--foreground)" }}>{task.id}</span></td>
      <td><span className="badge badge-green" style={{ borderRadius: 999 }}>{task.issueType}</span></td>
      <td style={{ fontSize: "0.88rem", color: "var(--muted-foreground)" }}>{task.location}</td>
      <td><span className="badge" style={{ ...getPriorityColor(task.priority), borderRadius: 999 }}>{task.priority}</span></td>
      <td><div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        {calendarIcon}
        <span className={overdue ? "overdue-text" : ""} style={{ fontSize: "0.88rem" }}>{task.deadline}</span>
        {overdue && <span className="overdue-badge">Overdue</span>}
      </div></td>
      <td><StatusBadge status={task.status} style={{ ...getStatusColor(task.status), borderRadius: 999 }} /></td>
      <td><TaskActions task={task} canUpdateStatus={canUpdateStatus} estimateIcon={estimateIcon} updateIcon={updateIcon} onEstimate={onEstimate} onUpdate={onUpdate} /></td>
    </tr>
  );
}

export default function TaskList({ tasks = [], canUpdateStatus, getPriorityColor, getStatusColor, isOverdue, onView, onEstimate, onUpdate, calendarIcon, estimateIcon, updateIcon }) {
  if (!tasks.length) return null;

  return tasks.map((task) => (
    <TaskRow key={task.id} task={task} canUpdateStatus={canUpdateStatus}
      getPriorityColor={getPriorityColor} getStatusColor={getStatusColor} isOverdue={isOverdue}
      onView={onView} onEstimate={onEstimate} onUpdate={onUpdate}
      calendarIcon={calendarIcon} estimateIcon={estimateIcon} updateIcon={updateIcon} />
  ));
}
