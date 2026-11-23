import test from "node:test";
import assert from "node:assert/strict";
import { validateEstimate, estimateFileError, estimateStatus, MAX_ESTIMATE_FILE_SIZE } from "../src/services/estimateWorkflow.js";

const valid = { cost: "2500", description: "Pipe repair", file: { name: "estimate.pdf", size: 1024 } };
test("acceptance requires a positive finite cost, notes and document", () => {
  for (const cost of ["", "0", "-10", "NaN", "Infinity"]) assert.ok(validateEstimate({ ...valid, cost }).cost);
  assert.ok(validateEstimate({ ...valid, description: "  " }).description);
  assert.ok(validateEstimate({ ...valid, file: null }).file);
  assert.deepEqual(validateEstimate(valid), { cost: "", description: "", file: "" });
});
test("PDF, Word and Excel uploads preserve the inclusive 5 MB limit", () => {
  for (const ext of ["pdf", "DOC", "docx", "xls", "xlsx"]) {
    assert.equal(estimateFileError({ name: `estimate.${ext}`, size: MAX_ESTIMATE_FILE_SIZE }), "");
  }
  assert.match(estimateFileError({ name: "estimate.pdf", size: MAX_ESTIMATE_FILE_SIZE + 1 }), /5 MB/);
  assert.match(estimateFileError({ name: "estimate.exe", size: 10 }), /PDF, Word, or Excel/);
});
test("candidate, selected, rejected and non-selected outcomes remain distinct", () => {
  assert.match(estimateStatus({ approved: null, selectionStatus: "candidate" }), /Awaiting Manager Selection/);
  assert.match(estimateStatus({ approved: null }), /Awaiting Manager Approval/);
  assert.match(estimateStatus({ approved: true, selectionStatus: "selected" }), /Work Can Begin/);
  assert.match(estimateStatus({ approved: false }), /Rejected/);
  assert.match(estimateStatus({ approved: null, selectionStatus: "not_selected" }), /Not Selected/);
});
