import AvailableComplaintCard from "./AvailableComplaintCard";

export default function ComplaintList({ complaints = [], imageUrl, priorityClass, locationIcon, calendarIcon, onView }) {
  if (!complaints.length) return null;

  return complaints.map((complaint) => (
    <AvailableComplaintCard
      key={complaint.id}
      complaint={complaint}
      imageUrl={imageUrl(complaint.photo)}
      priorityClass={priorityClass(complaint.priority || "Low")}
      locationIcon={locationIcon}
      calendarIcon={calendarIcon}
      onView={onView}
    />
  ));
}
