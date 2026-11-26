import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import { useOwner } from '../../context/OwnerContext';
import {
  markNotificationAsRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications
} from '../../services/notificationService';
import {
  markNotificationAsRead as markNotificationAsReadAction,
  deleteNotification as deleteNotificationAction,
  markAllNotificationsAsRead as markAllNotificationsAsReadAction,
  clearAllNotifications as clearAllNotificationsAction,
  extractComplaintId,
  isComplaintRejected,
  isEstimateRejected,
} from '../../redux/features/notifications/notificationsSlice';
import OwnerLayout from './components/OwnerLayout';
import './owner.css';

export default function Alerts() {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { notifications, refreshNotifications } = useOwner();

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    document.title = 'PropSync – Alerts & Notifications';
  }, []);

  // Deduplicate notifications so a rejected complaint or estimate is not shown twice
  const uniqueNotifications = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const n of notifications || []) {
      const cId = extractComplaintId(n);
      const isRej = isComplaintRejected(n);
      const isEstRej = isEstimateRejected(n);

      const rejectKey = isRej && cId ? `reject-${cId}` : null;
      const estRejectKey = isEstRej && cId ? `est-reject-${cId}` : null;
      const key = `${cId || n.id}-${n.type || ''}-${(n.message || '').trim().toLowerCase()}`;
      if (seen.has(key) || (rejectKey && seen.has(rejectKey)) || (estRejectKey && seen.has(estRejectKey))) continue;
      seen.add(key);
      if (rejectKey) seen.add(rejectKey);
      if (estRejectKey) seen.add(estRejectKey);
      result.push(n);
    }
    return result;
  }, [notifications]);

  const unreadCount = uniqueNotifications.filter((n) => n.status === 'unread').length;

  const handleMarkAsRead = async (id) => {
    dispatch(markNotificationAsReadAction(id));
    try {
      await markNotificationAsRead(id, currentUser);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    dispatch(deleteNotificationAction(id));
    try {
      await deleteNotification(id, currentUser);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllNotificationsAsReadAction({ userId: currentUser?.id }));
    try {
      await markAllNotificationsRead(currentUser);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    dispatch(clearAllNotificationsAction({ userId: currentUser?.id }));
    try {
      await clearAllNotifications(currentUser);
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = uniqueNotifications.filter((n) => {
    if (statusFilter === 'unread' && n.status !== 'unread') return false;
    if (statusFilter === 'read' && n.status !== 'read') return false;

    if (typeFilter === 'payment') {
      const isComp = Boolean(n.complaintId) || String(n.title || '').toLowerCase().includes('complaint');
      if (isComp) return false;
      const isPay = n.type === 'payment_due' || String(n.title || '').toLowerCase().includes('payment') || String(n.message || '').toLowerCase().includes('maintenance fee') || String(n.message || '').toLowerCase().includes('maintenance cost');
      if (!isPay) return false;
    } else if (typeFilter === 'complaint') {
      const isComp = String(n.type || '').includes('complaint') || String(n.title || '').toLowerCase().includes('complaint');
      if (!isComp) return false;
    } else if (typeFilter === 'deadline') {
      const isDead = n.type === 'Deadline' || n.type === 'overdue' || String(n.title || '').toLowerCase().includes('deadline');
      if (!isDead) return false;
    }

    return true;
  });

  return (
    <OwnerLayout>
      <div className="alerts_main">
        {/* Header */}
        <div className="alerts_header">
          <div>
            <h1>Notifications</h1>
            <p>View alerts and updates related to complaints, maintenance payments, and task deadlines.</p>
          </div>
          <div className="unread-badge">{unreadCount} Unread</div>
        </div>

        {/* Filters & Actions */}
        <div className="filters">
          <div className="filter-box" style={{ padding: '4px 12px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', width: '100%', fontSize: '13.5px' }}
            >
              <option value="all">All Types</option>
              <option value="payment">Payment Updates</option>
              <option value="complaint">Complaint Updates</option>
              <option value="deadline">Deadlines</option>
            </select>
          </div>

          <div className="filter-box" style={{ padding: '4px 12px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', width: '100%', fontSize: '13.5px' }}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn green" type="button" onClick={handleMarkAllRead}>
              ✓ Mark All Read
            </button>
            <button className="btn outline" type="button" onClick={handleClearAll}>
              🗑 Clear All
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications">
          {filteredNotifications.length === 0 ? (
            <p style={{ padding: '24px', color: '#64748b' }}>No notifications found.</p>
          ) : (
            filteredNotifications.map((n) => {
              const isPayment = n.type === 'payment_due' || String(n.title || '').toLowerCase().includes('payment') || String(n.message || '').toLowerCase().includes('maintenance');
              const isDeadline = n.type === 'Deadline' || n.type === 'overdue' || String(n.title || '').toLowerCase().includes('deadline');
              const iconColor = isDeadline ? 'red' : 'green';
              const isUnread = n.status === 'unread';
              const badgeLabel = isPayment ? 'Payment' : (n.type === 'complaint_approved' ? 'Approved' : (n.type === 'complaint_submitted' ? 'New Complaint' : (n.type || 'Update')));

              return (
                <div
                  key={n.id}
                  className={`notification_card ${isUnread ? '' : 'read'}`}
                >
                  <div className={`icon ${iconColor}`}>
                    {iconColor === 'red' ? (
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
                        className="lucide lucide-clock w-5 h-5 text-[#DC2626]"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    ) : (
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
                        className="lucide lucide-bell w-5 h-5 text-[#42a443]"
                      >
                        <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                      </svg>
                    )}
                  </div>

                  <div className="notifi_content">
                    <div className="notifi_item">
                      <h3>
                        {n.title}
                        {isUnread && <span className="tag new">New</span>}
                      </h3>
                      <span className="time">{n.time || n.createdAt || 'Just now'}</span>
                    </div>

                    <span className="badge">{badgeLabel}</span>
                    <p>{n.message}</p>

                    <div className="actions">
                      {isUnread && (
                        <span
                          className="mark"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          ✓ Mark as Read
                        </span>
                      )}
                      <span
                        className="delete"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleDelete(n.id)}
                      >
                        🗑 Delete
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
