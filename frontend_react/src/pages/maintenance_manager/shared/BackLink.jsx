import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";

/* "← Back to …" link at the top of a page */
export default function BackLink({ to, label = "Back" }) {
  return (
    <Link className="back-link" to={to}>
      <Icon name="arrowLeft" size={18} /> {label}
    </Link>
  );
}
