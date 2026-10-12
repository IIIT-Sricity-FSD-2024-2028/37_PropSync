import React from "react";
import Icon from "../../shared/Icon";

/* "Service Provider Documents" – latest estimate document + bill attachments */
export default function ProviderDocumentsCard({ estimate, bills }) {
  const files = [
    ...(estimate?.documentUrl ? [{ url: estimate.documentUrl, name: `Estimate: ${estimate.documentName || "Estimate document"}` }] : []),
    ...bills.flatMap((bill) =>
      (bill.attachmentUrls || []).map((url, i) => ({ url, name: `Bill attachment: ${(bill.attachmentNames || [])[i] || `File ${i + 1}`}` }))
    ),
  ];
  return (
    <section className="card">
      <p className="detail-label"><span className="detail-label-bar" /> Service Provider Documents</p>
      {files.length === 0 ? (
        <p className="muted">No service-provider documents have been submitted for this complaint yet.</p>
      ) : (
        files.map((f) => (
          <a key={f.url} className="file-row" href={f.url} target="_blank" rel="noopener noreferrer">
            <Icon name="paperclip" size={16} /> {f.name}
          </a>
        ))
      )}
    </section>
  );
}
