export const MAX_ESTIMATE_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xlsx", "xls"];

export function estimateFileError(file) {
  if (!file) return "Please upload the estimate document before submitting.";
  const extension = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) return "Please upload a PDF, Word, or Excel document.";
  if (file.size > MAX_ESTIMATE_FILE_SIZE) return "The file must be 5 MB or smaller.";
  return "";
}

export function validateEstimate({ cost, description, file }) {
  return {
    cost: !String(cost).trim() || !Number.isFinite(Number(cost)) || Number(cost) <= 0
      ? "Please enter a valid estimated cost greater than zero." : "",
    description: !description.trim() ? "Please provide a description of work." : "",
    file: estimateFileError(file),
  };
}

export function estimateStatus(estimate) {
  if (estimate.selectionStatus === "not_selected") return "Not Selected \u2014 Another Provider Assigned";
  if (estimate.approved === true) return "Estimate Approved \u2014 Work Can Begin";
  if (estimate.approved === false) return "Estimate Rejected by Manager";
  return estimate.selectionStatus === "candidate"
    ? "Estimate Submitted \u2014 Awaiting Manager Selection"
    : "Estimate Submitted \u2014 Awaiting Manager Approval";
}
