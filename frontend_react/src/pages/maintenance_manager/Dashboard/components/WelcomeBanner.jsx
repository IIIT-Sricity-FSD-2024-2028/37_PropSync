import React from "react";
import PageHeader from "../../shared/PageHeader";

/* "Dashboard – Welcome back, <name>!" header (same as the SP dashboard) */
export default function WelcomeBanner({ name, block, community }) {
  return (
    <PageHeader
      title="Dashboard"
      subtitle={`Welcome back, ${name}! ${
        block ? `Here's your Block ${block} overview for ${community}.` : `Here's your overview for ${community}.`
      }`}
    />
  );
}
