import React from "react";
import Icon from "../../shared/Icon";

/* Filters bar: search + priority (same look as the SP "Assigned Tasks" filters) */
export default function ComplaintFilters({ search, onSearch, priority, onPriority }) {
  return (
    <div className="filter-card">
      <div className="filter-row" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="filter-field">
          <Icon name="search" size={16} className="filter-field-icon" />
          <input className="filter-input" type="text" placeholder="Search by Complaint ID or issue" value={search} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <div className="filter-field">
          <Icon name="filter" size={16} className="filter-field-icon" />
          <select className="filter-input" value={priority} onChange={(e) => onPriority(e.target.value)}>
            <option value="">All Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
