import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOwner } from '../../context/OwnerContext';
import { getOwnerPayments, getOwnerPaymentsSummary, submitTransactionId } from '../../services/ownerService';
import { createNotification } from '../../services/notificationService';
import OwnerLayout from './components/OwnerLayout';
import './owner.css';

export default function PaymentHistory() {
  const { currentUser } = useAuth();
  const { ownerProfile, refreshNotifications } = useOwner();

  const [summary, setSummary] = useState({ totalPaid: 0, pendingCount: 0, monthlyPaid: 0 });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controlled Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [transactionIdInput, setTransactionIdInput] = useState('');
  const [txnError, setTxnError] = useState('');
  const [submittingTxn, setSubmittingTxn] = useState(false);

  useEffect(() => {
    document.title = 'PropSync – Payment History';
  }, []);

  const loadPaymentData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const ownerId = currentUser.id || 1;
      const [sumData, payData] = await Promise.all([
        getOwnerPaymentsSummary(ownerId, currentUser),
        getOwnerPayments(ownerId, currentUser)
      ]);
      setSummary(sumData);
      setPayments(payData);
    } catch (err) {
      console.warn('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  // Derived progress overview
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalAmount = totalPaid + totalPending;
  const collectedPct = totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(1) : '0.0';

  // Filtered payments derived from state
  const term = searchTerm.toLowerCase().trim();
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !term ||
      String(p.transactionId || '').toLowerCase().includes(term) ||
      String(p.month || '').toLowerCase().includes(term);

    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = p.status === 'pending';
    } else if (statusFilter === 'payment_submitted') {
      matchesStatus = p.status === 'payment_submitted';
    } else if (statusFilter === 'paid') {
      matchesStatus = p.status === 'paid';
    }
    return matchesSearch && matchesStatus;
  });

  const handleOpenConfirm = (p) => {
    setActivePayment(p);
    setConfirmModalOpen(true);
  };

  const handleProceedToScan = () => {
    setConfirmModalOpen(false);
    setTransactionIdInput('');
    setTxnError('');
    setScanModalOpen(true);
  };

  const handleSubmitTransactionProof = async () => {
    if (!activePayment) return;
    const cleanId = transactionIdInput.trim();
    if (!cleanId) {
      setTxnError('Please enter a valid Transaction ID.');
      return;
    }

    setSubmittingTxn(true);
    setTxnError('');

    try {
      await submitTransactionId(activePayment.id, cleanId, currentUser);

      // Notify Maintenance Manager
      const managerId = activePayment.managerId || 5;
      const unit = userUnit || 'A-101';
      try {
        await createNotification({
          userId: Number(managerId),
          message: `Owner of Unit ${unit} submitted payment proof (${cleanId}) for ${activePayment.month} (₹${Number(activePayment.amount || 0).toLocaleString('en-IN')}).`,
          type: 'custom',
          recipient: 'maintenance_manager'
        }, currentUser);
      } catch (notifErr) {
        console.warn('Could not notify manager of transaction proof:', notifErr);
      }

      // Refresh owner notifications context
      if (refreshNotifications) refreshNotifications();

      setScanModalOpen(false);
      alert('Transaction submitted successfully! Waiting for Maintenance Manager approval.');
      loadPaymentData();
    } catch (err) {
      setTxnError(err.message || 'Error submitting transaction.');
    } finally {
      setSubmittingTxn(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const userUnit = ownerProfile?.unit || currentUser?.propertyUnit || 'A-101';

  return (
    <OwnerLayout>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
          Maintenance Payment History :
        </h1>
        <p className="subtitle" style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
          Track your monthly maintenance payments
        </p>

        {/* 3 KPI Summary Cards */}
        <div className="summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div className="summary_card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>Total Paid</p>
              <h2 id="totalPaid" style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                ₹{Number(summary.totalPaid || 0).toLocaleString('en-IN')}
              </h2>
            </div>
          </div>

          <div className="summary_card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>Pending</p>
              <h2 id="pendingCount" style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                {summary.pendingCount || 0}
              </h2>
            </div>
          </div>

          <div className="summary_card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>Monthly Paid</p>
              <h2 id="monthlyPaid" style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                ₹{Number(summary.monthlyPaid || 0).toLocaleString('en-IN')}
              </h2>
            </div>
          </div>
        </div>

        {/* Payment Progress Overview Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
            Payment Progress Overview
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
            <span>Collected (<span id="collectedPctText">{collectedPct}%</span>)</span>
            <div>
              <span style={{ color: '#16a34a', marginRight: '12px' }} id="paidAmountProgressText">
                ₹{totalPaid.toLocaleString('en-IN')} Paid
              </span>
              <span style={{ color: '#d97706' }} id="pendingAmountProgressText">
                ₹{totalPending.toLocaleString('en-IN')} Pending
              </span>
            </div>
          </div>
          <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', width: '100%' }}>
            <div
              id="paymentProgressFill"
              style={{
                height: '100%',
                width: `${collectedPct}%`,
                background: '#16a34a',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              id="ownerSearchInput"
              placeholder="Search by Transaction ID or Month..."
              style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', boxSizing: 'border-box', background: '#ffffff' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ width: '160px' }}>
            <select
              id="ownerStatusFilter"
              style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', background: '#ffffff' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ height: '40px', padding: '0 16px', borderRadius: '8px', fontSize: '13px' }}
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Payments Table Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>PROPERTY / FLAT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>MONTH</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>AMOUNT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>PAID ON</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>TRANSACTION ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody id="ownerPaymentRows">
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '14px' }}>
                      No maintenance payment records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isPaid = p.status === 'paid';
                    const isSubmitted = p.status === 'payment_submitted';
                    const hasTxn = Boolean(p.transactionId && p.transactionId.trim());
                    const unitDisplay = p.ownerUnit ? `Unit ${p.ownerUnit}` : `Unit ${userUnit}`;
                    const paidOnDisplay = p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-';

                    let statusNode = null;
                    if (isPaid) {
                      statusNode = (
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                          Paid
                        </span>
                      );
                    } else if (isSubmitted) {
                      statusNode = (
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                          Payment Submitted / Awaiting Confirmation
                        </span>
                      );
                    } else {
                      statusNode = (
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
                          Pending
                        </span>
                      );
                    }

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{unitDisplay}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{p.month}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b' }}>
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>{statusNode}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{paidOnDisplay}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: isSubmitted || isPaid ? 600 : 400, color: '#1e293b', fontSize: '13px' }}>
                          {p.transactionId || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {p.status === 'pending' && !hasTxn ? (
                            <button
                              type="button"
                              className="btn btn-green"
                              style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#ffffff', border: 'none' }}
                              onClick={() => handleOpenConfirm(p)}
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span style={{ color: isPaid ? '#16a34a' : '#64748b', fontSize: '13px', fontWeight: isPaid ? 600 : 400 }}>
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: CONFIRM PAYMENT */}
      {confirmModalOpen && activePayment && (
        <div
          id="confirmPaymentModal"
          className="owner-modal-overlay"
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>Confirm Payment</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>
              You are paying maintenance for <span id="confirmModalMonth" style={{ fontWeight: 600, color: '#1e293b' }}>{activePayment.month}</span>
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>Payable Amount</div>
              <div id="confirmModalAmount" style={{ fontSize: '36px', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>
                ₹{Number(activePayment.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-green"
              style={{ width: '100%', height: '46px', fontSize: '15px', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', cursor: 'pointer' }}
              onClick={handleProceedToScan}
            >
              Proceed to Pay →
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: SCAN TO PAY */}
      {scanModalOpen && activePayment && (
        <div
          id="scanToPayModal"
          className="owner-modal-overlay"
          style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setScanModalOpen(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textAlign: 'center' }}>Scan to Pay</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px', textAlign: 'center' }}>Scan with any UPI app</p>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'inline-block', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <svg width="200" height="200" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="220" height="220" fill="#ffffff" />
                  <rect x="10" y="10" width="56" height="56" fill="#000000" />
                  <rect x="18" y="18" width="40" height="40" fill="#ffffff" />
                  <rect x="26" y="26" width="24" height="24" fill="#000000" />
                  <rect x="154" y="10" width="56" height="56" fill="#000000" />
                  <rect x="162" y="18" width="40" height="40" fill="#ffffff" />
                  <rect x="170" y="26" width="24" height="24" fill="#000000" />
                  <rect x="10" y="154" width="56" height="56" fill="#000000" />
                  <rect x="18" y="162" width="40" height="40" fill="#ffffff" />
                  <rect x="26" y="170" width="24" height="24" fill="#000000" />
                  <rect x="138" y="138" width="40" height="40" fill="#000000" />
                  <rect x="146" y="146" width="24" height="24" fill="#ffffff" />
                  <rect x="154" y="154" width="8" height="8" fill="#000000" />
                  <rect x="74" y="58" width="8" height="8" fill="#000000" />
                  <rect x="90" y="58" width="8" height="8" fill="#000000" />
                  <rect x="106" y="58" width="8" height="8" fill="#000000" />
                  <rect x="122" y="58" width="8" height="8" fill="#000000" />
                  <rect x="138" y="58" width="8" height="8" fill="#000000" />
                  <rect x="58" y="74" width="8" height="8" fill="#000000" />
                  <rect x="58" y="90" width="8" height="8" fill="#000000" />
                  <rect x="58" y="106" width="8" height="8" fill="#000000" />
                  <rect x="58" y="122" width="8" height="8" fill="#000000" />
                  <rect x="58" y="138" width="8" height="8" fill="#000000" />
                  <rect x="74" y="10" width="16" height="8" fill="#000000" />
                  <rect x="106" y="10" width="8" height="8" fill="#000000" />
                  <rect x="130" y="10" width="16" height="8" fill="#000000" />
                  <rect x="82" y="18" width="8" height="8" fill="#000000" />
                  <rect x="98" y="18" width="16" height="8" fill="#000000" />
                  <rect x="122" y="18" width="8" height="8" fill="#000000" />
                  <rect x="138" y="18" width="8" height="8" fill="#000000" />
                  <rect x="74" y="74" width="8" height="8" fill="#000000" />
                  <rect x="90" y="74" width="16" height="8" fill="#000000" />
                  <rect x="114" y="74" width="8" height="8" fill="#000000" />
                  <rect x="130" y="74" width="16" height="8" fill="#000000" />
                  <rect x="154" y="74" width="8" height="8" fill="#000000" />
                  <rect x="170" y="74" width="16" height="8" fill="#000000" />
                  <rect x="194" y="74" width="16" height="8" fill="#000000" />
                  <rect x="82" y="186" width="8" height="8" fill="#000000" />
                  <rect x="98" y="186" width="16" height="8" fill="#000000" />
                  <rect x="130" y="186" width="8" height="8" fill="#000000" />
                  <rect x="154" y="186" width="8" height="8" fill="#000000" />
                  <rect x="178" y="186" width="16" height="8" fill="#000000" />
                  <rect x="74" y="194" width="16" height="8" fill="#000000" />
                  <rect x="106" y="194" width="8" height="8" fill="#000000" />
                  <rect x="122" y="194" width="16" height="8" fill="#000000" />
                  <rect x="146" y="194" width="8" height="8" fill="#000000" />
                  <rect x="170" y="194" width="16" height="8" fill="#000000" />
                  <rect x="194" y="194" width="8" height="8" fill="#000000" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                <span>GPay</span> · <span>PhonePe</span> · <span>Paytm</span> · <span>BHIM UPI</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Enter Transaction ID
              </label>
              <input
                type="text"
                id="ownerTxnIdInput"
                placeholder="e.g. UPI123456789"
                style={{ width: '100%', height: '44px', padding: '0 14px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                value={transactionIdInput}
                onChange={(e) => {
                  setTransactionIdInput(e.target.value);
                  setTxnError('');
                }}
              />
              {txnError && (
                <p id="ownerTxnError" style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>
                  {txnError}
                </p>
              )}
            </div>

            <button
              type="button"
              id="submitTxnBtn"
              className="btn btn-green"
              style={{ width: '100%', height: '46px', fontSize: '15px', fontWeight: 700, borderRadius: '10px', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', cursor: submittingTxn ? 'not-allowed' : 'pointer' }}
              disabled={submittingTxn}
              onClick={handleSubmitTransactionProof}
            >
              {submittingTxn ? 'Submitting...' : 'Submit Transaction'}
            </button>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}
