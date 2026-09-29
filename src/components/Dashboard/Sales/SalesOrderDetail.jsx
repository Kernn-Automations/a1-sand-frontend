import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  FileCheck,
  Download,
  Share2,
  Calendar,
  MapPin,
  User,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Plus,
  X,
  FileText,
  Printer,
  Loader2
} from 'lucide-react';
import { isAdmin } from '../../../utils/roleUtils';

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin(user);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchVehicle, setDispatchVehicle] = useState('');
  const [dispatchDriverName, setDispatchDriverName] = useState('');
  const [dispatchDriverMobile, setDispatchDriverMobile] = useState('');
  const [dispatchRemarks, setDispatchRemarks] = useState('');
  const [dispatchQuantities, setDispatchQuantities] = useState({});
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payReference, setPayReference] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Invoice Conversion State
  const [convertingInvoice, setConvertingInvoice] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(null); // 'invoice' | 'dc-<id>' | 'pay-<id>'

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Check URL queries (e.g. ?action=dispatch or ?action=payment)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'dispatch') {
      setShowDispatchModal(true);
    } else if (params.get('action') === 'payment') {
      setShowPaymentModal(true);
    }
  }, [location.search]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/sales-orders/order/${id}`, { headers });
      if (res.data?.success && res.data?.order) {
        const ord = res.data.order;
        setOrder(ord);
        setPayAmount(ord.balanceAmount || '');

        // Initialize default dispatch quantities to remaining quantities
        const defaultQtys = {};
        (ord.items || []).forEach((item) => {
          defaultQtys[item.productId] = item.remainingQuantity > 0 ? item.remainingQuantity : 0;
        });
        setDispatchQuantities(defaultQtys);
      } else {
        setErrorMsg('Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error fetching order');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispatchModal = () => {
    setDispatchError('');
    // Refresh default quantities to remaining
    if (order?.items) {
      const initial = {};
      order.items.forEach((item) => {
        initial[item.productId] = item.remainingQuantity > 0 ? item.remainingQuantity : 0;
      });
      setDispatchQuantities(initial);
    }
    setShowDispatchModal(true);
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setDispatchError('');

    if (!dispatchVehicle.trim()) {
      setDispatchError('Vehicle / Truck number is required for dispatch.');
      return;
    }

    const itemsToDispatch = [];
    for (const item of order.items || []) {
      const q = parseFloat(dispatchQuantities[item.productId]) || 0;
      if (q > 0) {
        if (q > (item.remainingQuantity || 0) + 0.001) {
          setDispatchError(
            `Quantity for ${item.product?.name || 'Item'} (${q}) cannot exceed remaining balance (${item.remainingQuantity} ${item.unit}).`
          );
          return;
        }
        itemsToDispatch.push({
          productId: item.productId,
          quantity: q,
        });
      }
    }

    if (itemsToDispatch.length === 0) {
      setDispatchError('Please enter a dispatch quantity greater than 0 for at least one material.');
      return;
    }

    try {
      setDispatching(true);
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        vehicleNumber: dispatchVehicle.trim().toUpperCase(),
        driverName: dispatchDriverName.trim(),
        driverMobile: dispatchDriverMobile.trim(),
        remarks: dispatchRemarks,
        items: itemsToDispatch,
      };

      const res = await axios.post(`${API_URL}/sales-orders/${order.id}/dispatch`, payload, { headers });

      if (res.data?.success) {
        setActionSuccess(res.data.message || 'Dispatched successfully!');
        setShowDispatchModal(false);
        setDispatchVehicle('');
        setDispatchDriverName('');
        setDispatchDriverMobile('');
        setDispatchRemarks('');
        await fetchOrderDetails();
      } else {
        setDispatchError(res.data?.message || 'Failed to dispatch materials');
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
      setDispatchError(err.response?.data?.message || err.message || 'Dispatch submission failed');
    } finally {
      setDispatching(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      setPaymentError('Please enter a valid payment amount greater than 0.');
      return;
    }

    try {
      setSubmittingPayment(true);
      const headers = { Authorization: `Bearer ${token}` };
      const formData = new FormData();
      formData.append('amount', amt);
      formData.append('paymentMode', payMode);
      formData.append('transactionReference', payReference);
      formData.append('transactionRemark', payRemarks);
      formData.append('transactionDate', new Date().toISOString());

      const res = await axios.post(`${API_URL}/sales-orders/${order.id}/payments`, formData, { headers });

      if (res.data?.success) {
        setActionSuccess('Payment recorded successfully!');
        setShowPaymentModal(false);
        setPayReference('');
        setPayRemarks('');
        await fetchOrderDetails();
      } else {
        setPaymentError(res.data?.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentError(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      setConvertingInvoice(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_URL}/sales-orders/${order.id}/convert-to-invoice`, {}, { headers });
      if (res.data?.success) {
        setActionSuccess('Tax Invoice generated successfully!');
        await fetchOrderDetails();
      } else {
        alert(res.data?.message || 'Failed to convert to invoice');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert order to invoice');
    } finally {
      setConvertingInvoice(false);
    }
  };

  const downloadBlobDocument = async (endpoint, defaultFilename, docKey) => {
    try {
      if (docKey) setDownloadingDoc(docKey);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(endpoint, {
        headers,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document: ' + (err.response?.data?.message || err.message));
    } finally {
      if (docKey) setDownloadingDoc(null);
    }
  };

  const downloadDeliveryChallan = (dc) => {
    const dcId = typeof dc === 'object' ? dc.id : dc;
    const dcNumber = typeof dc === 'object' ? dc.dcNumber : dcId;
    downloadBlobDocument(
      `${API_URL}/sales-orders/delivery-challan/${dcId}/pdf`,
      `DeliveryChallan-${dcNumber || dcId}.pdf`,
      `dc-${dcId}`
    );
  };

  const downloadPaymentReceipt = (pay) => {
    const payId = typeof pay === 'object' ? pay.id : pay;
    downloadBlobDocument(
      `${API_URL}/sales-orders/payment-receipt/${payId}/pdf`,
      `PaymentReceipt-RCP-${payId}.pdf`,
      `pay-${payId}`
    );
  };

  const downloadInvoice = () => {
    if (!order) return;
    downloadBlobDocument(
      `${API_URL}/sales-orders/order/${order.id}/invoice/pdf`,
      `TaxInvoice-${order.orderNumber}.pdf`,
      'invoice'
    );
  };

  const downloadSalesOrder = () => {
    if (!order) return;
    downloadBlobDocument(
      `${API_URL}/sales-orders/order/${order.id}/pdf`,
      `SalesOrder-${order.orderNumber}.pdf`,
      'order-copy'
    );
  };

  const shareViaWhatsApp = () => {
    if (!order) return;
    const custName = order.customer?.name || 'Customer';
    const itemsText = order.items
      ?.map((it) => `• ${it.product?.name || 'Material'}: ${it.quantity} ${it.unit} (Dispatched: ${it.dispatchedQuantity || 0} ${it.unit})`)
      .join('\n');

    const msg = `*ANJALI CONSTRUCTIONS & MATERIALS*\n*Order Details: #${order.orderNumber}*\n\n*Customer:* ${custName}\n*Site Location:* ${order.siteLocation || 'Project Site'}\n*Order Status:* ${order.orderStatus}\n*Payment Status:* ${order.paymentStatus}\n\n*Materials Ordered:*\n${itemsText}\n\n*Total Amount:* ₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}\n*Amount Paid:* ₹${parseFloat(order.paidAmount || 0).toLocaleString('en-IN')}\n*Balance Due:* ₹${parseFloat(order.balanceAmount || 0).toLocaleString('en-IN')}\n\nThank you for choosing Anjali Constructions!`;

    const phone = order.customer?.phone || order.customer?.mobile || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <Clock size={40} color="#ea580c" className="spin" style={{ marginBottom: 12 }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading sales order details...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorBox}>
          <AlertCircle size={40} color="#dc2626" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#991b1b' }}>Order Not Found</h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: 14 }}>{errorMsg || 'Unable to retrieve order details.'}</p>
          <button onClick={() => navigate('/sales')} style={styles.backButton}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to Sales
          </button>
        </div>
      </div>
    );
  }

  const isFullyPaid = order.paymentStatus === 'Fully Paid' || parseFloat(order.balanceAmount || 0) <= 0;
  const isInvoiced = !!order.invoice || order.orderStatus === 'Invoiced' || order.orderStatus === 'Closed';
  const remainingMaterialsCount = (order.items || []).filter((i) => i.remainingQuantity > 0).length;
  const isAllDispatched = remainingMaterialsCount === 0;

  return (
    <div style={styles.pageContainer}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/sales')} style={styles.backBtn} title="Back to Orders">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={styles.orderTitle}>{order.orderNumber}</h1>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: isFullyPaid ? '#dcfce7' : '#fee2e2',
                  color: isFullyPaid ? '#15803d' : '#b91c1c',
                }}
              >
                {order.paymentStatus}
              </span>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: isAllDispatched ? '#e0f2fe' : '#fef3c7',
                  color: isAllDispatched ? '#0369a1' : '#b45309',
                }}
              >
                {order.orderStatus}
              </span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaItem}>
                <Calendar size={13} style={{ marginRight: 4 }} />
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {order.warehouse?.name && (
                <span style={styles.metaItem}>• Yard: {order.warehouse.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={styles.headerActions}>
          {/* Download Order Copy */}
          <button
            onClick={downloadSalesOrder}
            disabled={downloadingDoc === 'order-copy'}
            style={{
              ...styles.actionBtnOutline,
              opacity: downloadingDoc === 'order-copy' ? 0.75 : 1,
              cursor: downloadingDoc === 'order-copy' ? 'not-allowed' : 'pointer',
            }}
            title="Download official Sales Order PDF copy with verification QR code"
          >
            {downloadingDoc === 'order-copy' ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <FileText size={16} color="#0f172a" />
            )}
            <span className="btn-label">
              {downloadingDoc === 'order-copy' ? 'Downloading...' : 'Order Copy'}
            </span>
          </button>

          <button onClick={shareViaWhatsApp} style={styles.actionBtnOutline} title="Share via WhatsApp">
            <Send size={16} color="#25d366" />
            <span className="btn-label">WhatsApp</span>
          </button>

          {/* Record Payment Button */}
          {parseFloat(order.balanceAmount || 0) > 0 && (
            <button onClick={() => setShowPaymentModal(true)} style={styles.actionBtnPay}>
              <CreditCard size={16} />
              <span>Record Payment</span>
            </button>
          )}

          {/* Dispatch Materials Button */}
          {!isAllDispatched && (
            <button onClick={handleOpenDispatchModal} style={styles.actionBtnDispatch}>
              <Truck size={16} />
              <span>Dispatch Materials</span>
            </button>
          )}

          {/* Convert to Invoice or Download Invoice */}
          {isInvoiced ? (
            <button
              onClick={downloadInvoice}
              disabled={downloadingDoc === 'invoice'}
              style={{
                ...styles.actionBtnInvoice,
                opacity: downloadingDoc === 'invoice' ? 0.75 : 1,
                cursor: downloadingDoc === 'invoice' ? 'not-allowed' : 'pointer',
              }}
            >
              {downloadingDoc === 'invoice' ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <FileCheck size={16} />
              )}
              <span>{downloadingDoc === 'invoice' ? 'Downloading...' : 'Download Tax Invoice'}</span>
            </button>
          ) : (
            <button
              onClick={handleConvertToInvoice}
              disabled={convertingInvoice}
              style={styles.actionBtnInvoice}
              title="Convert this order to official GST Tax Invoice"
            >
              <FileCheck size={16} />
              <span>{convertingInvoice ? 'Converting...' : 'Convert to Invoice'}</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div style={styles.successBanner}>
          <CheckCircle2 size={18} style={{ marginRight: 8, flexShrink: 0 }} />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} style={{ background: 'none', border: 'none', marginLeft: 'auto', cursor: 'pointer' }}>
            <X size={16} color="#15803d" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={styles.gridContainer}>
        {/* LEFT COLUMN: Customer, Drop-off Location & Summary */}
        <div style={styles.colLeft}>
          {/* Customer Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <User size={18} color="#ea580c" />
              <h3 style={styles.cardTitle}>Contractor / Customer</h3>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              {order.customer?.name || 'Valued Customer'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 14, marginBottom: 8 }}>
              <Phone size={14} color="#ea580c" />
              <a href={`tel:${order.customer?.phone || order.customer?.mobile}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                {order.customer?.phone || order.customer?.mobile || 'No contact provided'}
              </a>
            </div>
            {order.customer?.email && (
              <div style={{ fontSize: 13, color: '#64748b' }}>Email: {order.customer.email}</div>
            )}
          </div>

          {/* Elaborate Drop-Off Site Location */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <MapPin size={18} color="#ea580c" />
              <h3 style={styles.cardTitle}>Drop-off Site Location</h3>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#1e293b', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <strong>{order.siteLocation || 'Project Site'}</strong>
            </div>
            {order.cancelledRemark && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                <strong>Order Note:</strong> {order.cancelledRemark}
              </div>
            )}
          </div>

          {/* Financial Summary Card */}
          <div style={{ ...styles.card, backgroundColor: '#fff7ed', border: '1.5px solid #fed7aa' }}>
            <div style={styles.cardHeader}>
              <CreditCard size={18} color="#ea580c" />
              <h3 style={styles.cardTitle}>Payment Status & Account</h3>
            </div>
            <div style={styles.finRow}>
              <span style={styles.finLabel}>Total Order Amount:</span>
              <strong style={{ fontSize: 16, color: '#0f172a' }}>₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</strong>
            </div>
            <div style={styles.finRow}>
              <span style={styles.finLabel}>Paid Advance / Received:</span>
              <strong style={{ fontSize: 16, color: '#16a34a' }}>₹{parseFloat(order.paidAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ ...styles.finRow, borderBottom: 'none', paddingTop: 8 }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>Remaining Balance:</span>
              <strong style={{ fontSize: 18, color: parseFloat(order.balanceAmount || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                ₹{parseFloat(order.balanceAmount || 0).toLocaleString('en-IN')}
              </strong>
            </div>

            {/* Admin Profitability */}
            {userIsAdmin && order.totalPurchaseCost !== undefined && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #fed7aa', fontSize: 12, color: '#7c2d12', display: 'flex', justifyContent: 'space-between' }}>
                <span>Material Cost: ₹{parseFloat(order.totalPurchaseCost || 0).toLocaleString('en-IN')}</span>
                <span>Margin: ₹{parseFloat(order.totalProfit || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Materials Ordered, Dispatches & Payments */}
        <div style={styles.colRight}>
          {/* 1. Ordered Materials Table & Fulfillment */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Truck size={18} color="#ea580c" />
              <h3 style={styles.cardTitle}>Ordered Materials & Dispatch Progress</h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.th}>Material</th>
                    <th style={styles.th}>Rate</th>
                    <th style={styles.th}>Ordered</th>
                    <th style={styles.th}>Dispatched</th>
                    <th style={styles.th}>Remaining</th>
                    <th style={styles.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.product?.name || 'Material'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{it.product?.SKU || it.sku || ''}</div>
                      </td>
                      <td style={styles.td}>₹{parseFloat(it.unitPrice).toLocaleString('en-IN')}</td>
                      <td style={styles.td}>
                        <strong>{it.quantity}</strong> {it.unit}
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: '#0284c7', fontWeight: 700 }}>{it.dispatchedQuantity || 0}</span> {it.unit}
                      </td>
                      <td style={styles.td}>
                        {it.remainingQuantity > 0 ? (
                          <span style={{ color: '#ea580c', fontWeight: 700 }}>
                            {it.remainingQuantity} {it.unit}
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>Fully Dispatched</span>
                        )}
                      </td>
                      <td style={styles.tdRight}>
                        ₹{parseFloat(it.grandTotal || it.totalUnitPrice || it.quantity * it.unitPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Previous Dispatches (Delivery Challans) */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={styles.cardHeader}>
                <Truck size={18} color="#ea580c" />
                <h3 style={styles.cardTitle}>Previous Dispatches & Delivery Challans</h3>
              </div>
              {!isAllDispatched && (
                <button onClick={handleOpenDispatchModal} style={styles.smallActionBtn}>
                  <Plus size={14} style={{ marginRight: 4 }} /> New Dispatch
                </button>
              )}
            </div>

            {(!order.deliveryChallans || order.deliveryChallans.length === 0) ? (
              <div style={styles.emptyNotice}>
                <Clock size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                <div>No dispatches recorded yet for this order.</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Click "Dispatch Materials" above when the tipper truck is loaded at the yard.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {order.deliveryChallans.map((dc) => (
                  <div key={dc.id} style={styles.dispatchCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, color: '#ea580c', fontSize: 14 }}>{dc.dcNumber}</span>
                          <span style={styles.vehicleBadge}>
                            <Truck size={12} style={{ marginRight: 4 }} />
                            {dc.vehicleNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {new Date(dc.dispatchDate || dc.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Download Delivery Challan Button */}
                      <button
                        onClick={() => downloadDeliveryChallan(dc)}
                        disabled={downloadingDoc === `dc-${dc.id}`}
                        style={{
                          ...styles.downloadChallanBtn,
                          opacity: downloadingDoc === `dc-${dc.id}` ? 0.75 : 1,
                          cursor: downloadingDoc === `dc-${dc.id}` ? 'not-allowed' : 'pointer',
                        }}
                        title="Download official Delivery Challan PDF with ACM logo"
                      >
                        {downloadingDoc === `dc-${dc.id}` ? (
                          <Loader2 size={14} className="spin" style={{ marginRight: 6 }} />
                        ) : (
                          <Download size={14} style={{ marginRight: 6 }} />
                        )}
                        {downloadingDoc === `dc-${dc.id}` ? 'Downloading...' : 'Download Delivery Challan'}
                      </button>
                    </div>

                    {/* Driver & Truck Details */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569', marginBottom: 8, flexWrap: 'wrap' }}>
                      {dc.driverName && dc.driverName !== 'N/A' && (
                        <span><strong>Driver:</strong> {dc.driverName}</span>
                      )}
                      {dc.driverMobile && dc.driverMobile !== 'N/A' && (
                        <span><strong>Contact:</strong> {dc.driverMobile}</span>
                      )}
                      {dc.notes && <span><strong>Remarks:</strong> {dc.notes}</span>}
                    </div>

                    {/* Items Dispatched in this Challan */}
                    <div style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                        Materials Dispatched in this Load:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(dc.items || []).map((di, iIdx) => (
                          <span key={iIdx} style={styles.dispatchItemPill}>
                            <strong>{di.quantity} {di.unit}</strong> &bull; {di.productName || di.product?.name || 'Material'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Previous Payments Section */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={styles.cardHeader}>
                <CreditCard size={18} color="#ea580c" />
                <h3 style={styles.cardTitle}>Payment Receipts & History</h3>
              </div>
              {parseFloat(order.balanceAmount || 0) > 0 && (
                <button onClick={() => setShowPaymentModal(true)} style={styles.smallActionBtn}>
                  <Plus size={14} style={{ marginRight: 4 }} /> Record Payment
                </button>
              )}
            </div>

            {(!order.paymentRequests || order.paymentRequests.length === 0) ? (
              <div style={styles.emptyNotice}>
                <CreditCard size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                <div>No payments recorded yet for this sales order.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>Receipt #</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Mode</th>
                      <th style={styles.th}>Reference / UTR</th>
                      <th style={styles.th}>Remarks</th>
                      <th style={styles.thRight}>Amount Paid</th>
                      <th style={styles.thCenter}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.paymentRequests.map((pay) => (
                      <tr key={pay.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>RCP-{pay.id}</span>
                        </td>
                        <td style={styles.td}>
                          {new Date(pay.receivedDate || pay.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={styles.td}>{pay.paymentMode || 'Cash'}</td>
                        <td style={styles.td}>{pay.transactionReference || pay.transactionId || '-'}</td>
                        <td style={styles.td}>{pay.transactionRemark || pay.remarks || '-'}</td>
                        <td style={styles.tdRight}>
                          <strong style={{ color: '#16a34a' }}>
                            ₹{parseFloat(pay.amountPaid || pay.amount || 0).toLocaleString('en-IN')}
                          </strong>
                        </td>
                        <td style={styles.tdCenter}>
                          <button
                            onClick={() => downloadPaymentReceipt(pay)}
                            disabled={downloadingDoc === `pay-${pay.id}`}
                            style={{
                              ...styles.downloadReceiptBtn,
                              opacity: downloadingDoc === `pay-${pay.id}` ? 0.75 : 1,
                              cursor: downloadingDoc === `pay-${pay.id}` ? 'not-allowed' : 'pointer',
                            }}
                            title="Download official PDF Receipt"
                          >
                            {downloadingDoc === `pay-${pay.id}` ? (
                              <Loader2 size={13} className="spin" style={{ marginRight: 4 }} />
                            ) : (
                              <Download size={13} style={{ marginRight: 4 }} />
                            )}
                            {downloadingDoc === `pay-${pay.id}` ? 'Downloading...' : 'PDF Receipt'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISPATCH MODAL */}
      {showDispatchModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} color="#ea580c" />
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Dispatch Materials & Generate Delivery Challan
                </h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit}>
              {dispatchError && (
                <div style={styles.modalErrorBanner}>
                  <AlertCircle size={16} style={{ marginRight: 6, flexShrink: 0 }} />
                  <span>{dispatchError}</span>
                </div>
              )}

              {/* Truck & Driver Details */}
              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Vehicle / Tipper Truck Number *</label>
                <input
                  type="text"
                  placeholder="e.g. TS 08 UA 4567"
                  value={dispatchVehicle}
                  onChange={(e) => setDispatchVehicle(e.target.value)}
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={styles.inputLabel}>Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh"
                    value={dispatchDriverName}
                    onChange={(e) => setDispatchDriverName(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>
                <div>
                  <label style={styles.inputLabel}>Driver Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={dispatchDriverMobile}
                    onChange={(e) => setDispatchDriverMobile(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>
              </div>

              {/* Quantities to Dispatch (Capped at remaining) */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  Quantities Loaded on this Truck (Cannot exceed remaining ordered balance):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(order.items || []).map((item) => {
                    const isFinished = item.remainingQuantity <= 0;
                    return (
                      <div key={item.productId} style={styles.modalItemRow}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                            {item.product?.name || 'Material'}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Ordered: {item.quantity} {item.unit} &bull; Remaining: <strong>{item.remainingQuantity} {item.unit}</strong>
                          </div>
                        </div>

                        <div style={{ width: 140 }}>
                          {isFinished ? (
                            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
                              Fully Dispatched
                            </span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={item.remainingQuantity}
                                value={dispatchQuantities[item.productId] ?? ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setDispatchQuantities({
                                    ...dispatchQuantities,
                                    [item.productId]: val,
                                  });
                                }}
                                style={styles.qtyInput}
                              />
                              <span style={{ fontSize: 12, color: '#475569' }}>{item.unit}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={styles.inputLabel}>Dispatch Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Morning trip, loaded at Main Yard"
                  value={dispatchRemarks}
                  onChange={(e) => setDispatchRemarks(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  style={styles.modalConfirmBtn}
                >
                  {dispatching ? 'Creating Challan...' : 'Confirm & Issue Delivery Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={20} color="#16a34a" />
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Record Payment Received
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              {paymentError && (
                <div style={styles.modalErrorBanner}>
                  <AlertCircle size={16} style={{ marginRight: 6, flexShrink: 0 }} />
                  <span>{paymentError}</span>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={styles.modalInput}
                  required
                />
                <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                  Current Order Balance: ₹{parseFloat(order.balanceAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={styles.inputLabel}>Transaction Reference / UTR / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref # / Cheque No."
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={styles.inputLabel}>Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Advance paid by contractor"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  style={{ ...styles.modalConfirmBtn, backgroundColor: '#16a34a' }}
                >
                  {submittingPayment ? 'Recording...' : 'Save & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '12px 6px 60px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    width: '100%',
    overflowX: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  errorBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    textAlign: 'center',
    maxWidth: 400,
    border: '1px solid #fee2e2',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  backButton: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1.5px solid #e2e8f0',
  },
  backBtn: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#334155',
  },
  orderTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionBtnOutline: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: '#334155',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnPay: {
    backgroundColor: '#16a34a',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
  },
  actionBtnDispatch: {
    backgroundColor: '#ea580c',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
  },
  actionBtnInvoice: {
    backgroundColor: '#0f172a',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#15803d',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: 16,
    width: '100%',
    boxSizing: 'border-box',
  },
  colLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  colRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    boxSizing: 'border-box',
    width: '100%',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  finRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px dashed #fed7aa',
  },
  finLabel: {
    fontSize: 13,
    color: '#475569',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  tableHeadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1.5px solid #e2e8f0',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  thRight: {
    textAlign: 'right',
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  thCenter: {
    textAlign: 'center',
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '10px 12px',
    color: '#334155',
  },
  tdRight: {
    padding: '10px 12px',
    textAlign: 'right',
    fontWeight: 700,
    color: '#0f172a',
  },
  tdCenter: {
    padding: '10px 12px',
    textAlign: 'center',
  },
  emptyNotice: {
    textAlign: 'center',
    padding: '24px 16px',
    color: '#64748b',
    fontSize: 13,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    border: '1px dashed #cbd5e1',
  },
  smallActionBtn: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    border: '1px solid #fed7aa',
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  dispatchCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    border: '1px solid #e2e8f0',
  },
  vehicleBadge: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 6,
    border: '1px solid #fed7aa',
    display: 'inline-flex',
    alignItems: 'center',
  },
  downloadChallanBtn: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.2)',
  },
  downloadReceiptBtn: {
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  dispatchItemPill: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 6,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    maxWidth: 520,
    width: '100%',
    padding: 22,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '1px solid #e2e8f0',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: 4,
  },
  modalErrorBanner: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 4,
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  qtyInput: {
    width: 70,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1.5px solid #ea580c',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'right',
    outline: 'none',
  },
  modalCancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    flex: 2,
    padding: '12px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)',
  },
};
