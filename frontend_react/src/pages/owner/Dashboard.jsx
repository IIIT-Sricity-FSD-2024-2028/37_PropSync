import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOwner } from '../../context/OwnerContext';
import OwnerLayout from './components/OwnerLayout';
import './owner.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { complaints, notifications, payments, ownerProfile, refreshComplaints, refreshNotifications, refreshPayments } = useOwner();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    document.title = 'PropSync';
  }, []);

  // 15s polling for complaints, notifications, and payments
  useEffect(() => {
    const interval = setInterval(() => {
      refreshComplaints();
      refreshNotifications();
      if (refreshPayments) refreshPayments();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshComplaints, refreshNotifications, refreshPayments]);

  const normalizeStatus = (status) => {
    return String(status || 'pending').toLowerCase().replace(/_/g, ' ');
  };

  const displayStatus = (status) => {
    const normalized = normalizeStatus(status);
    const map = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      assigned: 'Assigned',
      'estimating cost': 'Estimating Cost',
      'in progress': 'In Progress',
      completed: 'Completed',
      billed: 'Billed',
      paid: 'Paid',
      closed: 'Closed',
      'payment pending': 'Payment Pending',
      resolved: 'Resolved',
    };
    return map[normalized] || status || 'Pending';
  };

  // Stats calculation
  const totalCount = complaints.length;
  const approvedCount = complaints.filter((c) =>
    ['approved', 'assigned', 'estimating cost', 'in progress', 'completed', 'billed', 'paid', 'closed', 'payment pending', 'resolved'].includes(normalizeStatus(c.status))
  ).length;
  const inProgressCount = complaints.filter((c) =>
    ['assigned', 'estimating cost', 'in progress', 'completed', 'billed'].includes(normalizeStatus(c.status))
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ['paid', 'closed', 'payment pending', 'resolved'].includes(normalizeStatus(c.status))
  ).length;

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const norm = normalizeStatus(c.status);
    const selected = statusFilter.toLowerCase();
    const matchesStatus =
      selected === 'all status' ||
      selected === '' ||
      norm === selected;
    return matchesSearch && matchesStatus;
  });

  const formatPaymentMonth = (monthStr) => {
    if (!monthStr) return 'Maintenance';
    const parts = String(monthStr).split('-');
    if (parts.length === 2) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${monthNames[mIdx]} (${monthStr})`;
      }
    }
    return monthStr;
  };

  const recentPayments = [...(payments || [])]
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 3);

  const paymentNotifs = (notifications || []).filter(n =>
    n.type === 'payment_due' ||
    String(n.title || '').toLowerCase().includes('payment') ||
    String(n.message || '').toLowerCase().includes('maintenance')
  ).slice(0, 3);

  const recentNotifications = notifications.slice(0, 3);
  const unreadNotifCount = recentNotifications.filter((n) => n.status === 'unread').length;

  return (
    <OwnerLayout>
      <div className="container">
        <h1>Welcome Back, {ownerProfile?.name || currentUser?.name || 'Property Owner'}!</h1>
        <p className="sub">
          {ownerProfile?.unit || currentUser?.propertyUnit || 'A-101'} | {ownerProfile?.community || currentUser?.communityName || 'Green Valley Society'}
        </p>

        {/* ===== STATS ===== */}
        <div className="cards-container">
          <div className="cards">
            <div className="card-text">
              <p>Your Complaints</p>
              <h2>{totalCount}</h2>
            </div>
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-clipboard-list w-6 h-6"
              >
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <path d="M12 11h4"></path>
                <path d="M12 16h4"></path>
                <path d="M8 11h.01"></path>
                <path d="M8 16h.01"></path>
              </svg>
            </div>
          </div>

          <div className="cards">
            <div className="card-text">
              <p>Complaints Approved</p>
              <h2>{approvedCount}</h2>
            </div>
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-file-text w-6 h-6"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                <path d="M10 9H8"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
              </svg>
            </div>
          </div>

          <div className="cards">
            <div className="card-text">
              <p>In Progress</p>
              <h2>{inProgressCount}</h2>
            </div>
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-trending-up w-6 h-6"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
          </div>

          <div className="cards">
            <div className="card-text">
              <p>Resolved</p>
              <h2>{resolvedCount}</h2>
            </div>
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-circle-check-big w-6 h-6"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* ===== MID SECTION ===== */}
        <div className="mid">
          {/* Notifications : 3/4 width */}
          <div className="box box-large">
            <div className="box-header">
              <h3>
                Notifications <span className="badge">{unreadNotifCount}</span>
              </h3>
              <Link to="/owner/alerts" className="view-all">View All →</Link>
            </div>

            {recentNotifications.length > 0 ? (
              recentNotifications.map((n) => (
                <div key={n.id} className="item">
                  <div className={`icon ${n.status === 'unread' ? 'yellow' : 'green'}`}>
                    {n.status === 'unread' ? '!' : '✓'}
                  </div>
                  <div>
                    <p className="title">{n.title || 'Notification'}</p>
                    <p className="desc">{n.message || 'You have a new update.'}</p>
                    <span className="time">{n.time || n.createdAt || 'Just now'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="desc" style={{ padding: '16px' }}>No notifications yet.</p>
            )}
          </div>

          {/* Payment History : 1/4 width */}
          <div className="box box-small">
            <div className="box-header">
              <h3>Payment History</h3>
              <Link to="/owner/payment-history" className="view-all">View All →</Link>
            </div>

            {recentPayments.length > 0 ? (
              recentPayments.map((p) => {
                const isPaid = p.status === 'paid';
                const isSubmitted = p.status === 'payment_submitted';

                let iconClass = 'yellow';
                let iconChar = '!';
                let desc = `Monthly Maintenance cost pending (₹${Number(p.amount || 0).toLocaleString('en-IN')})`;

                if (isPaid) {
                  iconClass = 'green';
                  iconChar = '✓';
                  desc = `Successfully paid monthly maintenance cost (₹${Number(p.amount || 0).toLocaleString('en-IN')}).`;
                } else if (isSubmitted) {
                  iconClass = 'yellow';
                  iconChar = '!';
                  desc = `Payment submitted for approval (₹${Number(p.amount || 0).toLocaleString('en-IN')}).`;
                }

                return (
                  <div key={p.id} className="item">
                    <div className={`icon ${iconClass}`}>{iconChar}</div>
                    <div>
                      <p className="title">{formatPaymentMonth(p.month)}</p>
                      <p className="desc">{desc}</p>
                    </div>
                  </div>
                );
              })
            ) : paymentNotifs.length > 0 ? (
              paymentNotifs.map((n) => {
                const isPaidNotif = String(n.message || '').toLowerCase().includes('paid');
                return (
                  <div key={n.id} className="item">
                    <div className={`icon ${isPaidNotif ? 'green' : 'yellow'}`}>
                      {isPaidNotif ? '✓' : '!'}
                    </div>
                    <div>
                      <p className="title">{n.title || 'Payment Update'}</p>
                      <p className="desc">{n.message}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="desc" style={{ padding: '16px' }}>No payment history records.</p>
            )}
          </div>
        </div>

        {/* ===== COMPLAINTS ===== */}
        <div className="complaints-container">
          <div className="complaints-header">
            <h2>Community Complaints</h2>
            <button
              className="new-complaint-btn"
              onClick={() => navigate('/owner/new-complaint')}
            >
              + New Complaint
            </button>
          </div>

          <div className="complaints-controls">
            <input
              type="text"
              placeholder="Search complaints..."
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Approved</option>
              <option>Estimating Cost</option>
              <option>Resolved</option>
            </select>
          </div>

          <div className="complaint-cards-list">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((c) => {
                const norm = normalizeStatus(c.status);
                let statusClass = 'pending';
                if (norm === 'approved') statusClass = 'approved';
                else if (norm === 'rejected') statusClass = 'rejected';
                else if (norm === 'estimating cost' || norm === 'in progress') statusClass = 'estimating';
                else if (norm === 'assigned') statusClass = 'assigned';
                else if (['completed', 'billed', 'paid', 'closed', 'resolved'].includes(norm)) statusClass = 'resolved';

                return (
                  <div
                    key={c.id}
                    className="complaint-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/owner/complaints/${c.id}`)}
                  >
                    {c.image && (
                      <img
                        className="complaint-thumb"
                        src={c.image.startsWith('http') ? c.image : `http://localhost:3000${c.image.startsWith('/') ? '' : '/'}${c.image}`}
                        alt={c.title}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="card-left">
                      <h3>{c.title}</h3>
                      <p className="description">{c.caption || c.description}</p>
                      <div className="tag-row">
                        <span className="tag green">Id: C-{c.id}</span>
                        <span className="tag blue">Category: {c.category}</span>
                      </div>
                    </div>
                    <div className={`status ${statusClass}`}>
                      {displayStatus(c.status)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ padding: '24px', color: '#6b7280' }}>No complaints found.</p>
            )}
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
