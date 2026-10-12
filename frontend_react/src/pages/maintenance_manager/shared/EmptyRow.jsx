import React from "react";

/* Single full-width table row for "Loading…", "No records", errors */
export default function EmptyRow({ colSpan = 8, text = "No records found", color = "#9CA3AF" }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: "center", padding: 24, color, fontWeight: 400 }}>
        {text}
      </td>
    </tr>
  );
}
