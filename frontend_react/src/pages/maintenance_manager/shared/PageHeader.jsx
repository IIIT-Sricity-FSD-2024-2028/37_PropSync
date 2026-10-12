import React from "react";

/* Page title + grey subtitle (same as the Service Provider page headers).
   `children` render on the right (e.g. a count pill or a button). */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header" style={children ? { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" } : undefined}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
