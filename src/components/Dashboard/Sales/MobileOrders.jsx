import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Filter, 
  Truck, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileCheck, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { isAdmin } from '../../../utils/roleUtils';

export default function MobileOrders() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin(user);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adminSettings, setAdminSettings] = useState({ require_full_payment_for_invoice: true });

  // Payment modal state
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Conversion loading state
  const [convertingId, setConvertingId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchOrders = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, settingsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/sales-orders/list?limit=100`, { headers }),
        axios.get(`${API_URL}/settings/all`, { headers }),
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.orders) {
        setOrders(ordersRes.value.data.orders);
      } else if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data)) {
        setOrders(ordersRes.value.data);
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.settings) {
        setAdminSettings(settingsRes.value.data.settings);
      }
    } catch (err) {
      console.error('Error fetching sales orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Submit payment from quick modal
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalOrder || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmittingPayment(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_URL}/sales-orders/${paymentModalOrder.id}/payments`,
        {
          amount: parseFloat(paymentAmount),
          paymentMode,
          transactionReference: paymentRef,
          transactionDate: new Date(),
        },
        { headers }
      );

      if (res.data?.success) {
        setPaymentModalOrder(null);
        setPaymentAmount('');
        setPaymentRef('');
        fetchOrders();
      } else {
        alert(res.data?.message || 'Failed to record payment');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Convert to invoice
  const handleConvertToInvoice = async (order) => {
    const isRequireFull = adminSettings.require_full_payment_for_invoice !== false;
    if (isRequireFull && parseFloat(order.balanceAmount) > 0) {
      alert(`Cannot convert to invoice: Order has an outstanding balance of ₹${parseFloat(order.balanceAmount).toLocaleString('en-IN')}. Please settle all payments first.`);
      return;
    }

    const confirmMsg = `Convert Order #${order.orderNumber} to official Invoice?\nTotal: ₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setConvertingId(order.id);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_URL}/sales-orders/${order.id}/convert-to-invoice`,
        {},
        { headers }
      );

      if (res.data?.success) {
        alert('Invoice generated successfully! Order is closed.');
        fetchOrders();
      } else {
        alert(res.data?.message || 'Failed to convert to invoice');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert to invoice');
    } finally {
      setConvertingId(null);
    }
  };

  const shareOrderWhatsApp = (order) => {
    const custName = order.customer?.name || 'Customer';
    const itemsText = order.items
      ?.map((it) => `• ${it.product?.name || 'Material'}: ${it.quantity} ${it.unit} @ ₹${it.unitPrice}`)
      .join('\n') || 'Materials as per dispatch';

    const msg = `*ANJALI CONSTRUCTIONS & MATERIALS*\n*Sales Order: ${order.orderNumber}*\n\nCustomer: ${custName}\nVehicle/Truck: ${order.vehicleNumber || 'Pending'}\nSite: ${order.siteLocation || 'Direct Site'}\n\n*Materials Ordered:*\n${itemsText}\n\n*Total Amount:* ₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}\n*Paid:* ₹${parseFloat(order.paidAmount || 0).toLocaleString('en-IN')}\n*Balance Due:* ₹${parseFloat(order.balanceAmount || 0).toLocaleString('en-IN')}\n*Status:* ${order.paymentStatus}\n\nThank you!`;

    const phone = order.customer?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  // Filter & Search
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.vehicleNumber && o.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.siteLocation && o.siteLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'FULLY_PAID') return o.paymentStatus === 'Fully Paid';
    if (statusFilter === 'PARTIAL') return o.paymentStatus === 'Partially Paid';
    if (statusFilter === 'UNPAID') return o.paymentStatus === 'Unpaid';
    if (statusFilter === 'INVOICED') return o.orderStatus === 'Invoiced' || o.orderStatus === 'Closed';

    return true;
  });

  return (
    <div style={styles.container}>
      {/* Mobile Top App Bar */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Sales Orders</h1>
          <span style={styles.subTitle}>Anjali Constructions & Materials</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Orders / Quotations Tab Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px',
          }}>
            <button
              onClick={() => navigate('/sales/orders')}
              style={{
                backgroundColor: '#ffffff',
                color: '#ea580c',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              Orders
            </button>
            <button
              onClick={() => navigate('/sales/quotations')}
              style={{
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Quotations
            </button>
          </div>

          <button onClick={handleRefresh} style={styles.iconBtn} title="Refresh">
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/sales/quotations/new')}
            style={{
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            title="Create a New Quotation"
          >
            <Plus size={16} style={{ marginRight: 3 }} />
            Quote
          </button>
          <button onClick={() => navigate('/sales/new')} style={styles.createBtn}>
            <Plus size={18} style={{ marginRight: 4 }} />
            New Order
          </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div style={styles.searchSection}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" style={{ marginLeft: 12 }} />
          <input
            type="text"
            placeholder="Search by customer, vehicle #, SO #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Filter Pills */}
        <div style={styles.filterPills}>
          {[
            { label: 'All Orders', value: 'ALL' },
            { label: 'Unpaid', value: 'UNPAID' },
            { label: 'Partially Paid', value: 'PARTIAL' },
            { label: 'Fully Paid', value: 'FULLY_PAID' },
            { label: 'Invoiced', value: 'INVOICED' },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              style={{
                ...styles.pill,
                backgroundColor: statusFilter === pill.value ? '#ea580c' : '#ffffff',
                color: statusFilter === pill.value ? '#ffffff' : '#64748b',
                border: statusFilter === pill.value ? 'none' : '1px solid #e2e8f0',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Cards List */}
      <div style={styles.orderList}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <Clock size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#475569', margin: '0 0 6px 0' }}>
              No Orders Found
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px 0' }}>
              {searchTerm ? 'Try changing your search keywords' : 'Raise your first direct sales order'}
            </p>
            <button onClick={() => navigate('/sales/new')} style={styles.emptyCreateBtn}>
              + Create Direct Sales Order
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isFullyPaid = order.paymentStatus === 'Fully Paid' || parseFloat(order.balanceAmount) <= 0;
            const isInvoiced = order.orderStatus === 'Invoiced' || order.orderStatus === 'Closed';
            const canConvert = isFullyPaid || adminSettings.require_full_payment_for_invoice === false;

            return (
              <div key={order.id} style={styles.orderCard}>
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        onClick={() => navigate(`/sales/orders/${order.id}`)}
                        style={{ ...styles.orderNum, cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view order details & dispatches"
                      >
                        {order.orderNumber}
                      </span>
                      {order.vehicleNumber && (
                        <span style={styles.vehicleBadge}>
                          <Truck size={12} style={{ marginRight: 4 }} />
                          {order.vehicleNumber}
                        </span>
                      )}
                    </div>
                    <span style={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Payment Status Pill */}
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        order.paymentStatus === 'Fully Paid'
                          ? '#dcfce7'
                          : order.paymentStatus === 'Partially Paid'
                          ? '#fef3c7'
                          : '#fee2e2',
                      color:
                        order.paymentStatus === 'Fully Paid'
                          ? '#15803d'
                          : order.paymentStatus === 'Partially Paid'
                          ? '#b45309'
                          : '#b91c1c',
                    }}
                  >
                    {order.paymentStatus}
                  </span>
                </div>

                {/* Customer Info */}
                <div style={styles.customerRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
                      {order.customer?.name || 'Customer'}
                    </span>
                    {order.customer?.phone && (
                      <a
                        href={`tel:${order.customer.phone}`}
                        style={styles.callIcon}
                        title="Call Customer"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                  {order.siteLocation && (
                    <span style={styles.siteText}>
                      <MapPin size={12} style={{ marginRight: 3, flexShrink: 0 }} />
                      {order.siteLocation}
                    </span>
                  )}
                </div>

                {/* Material Line Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div style={styles.itemsPreview}>
                    {order.items.map((it, idx) => (
                      <span key={idx} style={styles.itemTag}>
                        {it.product?.name || 'Material'}: <strong>{it.quantity} {it.unit}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Financial Totals & Progress Bar */}
                <div style={styles.financialSection}>
                  <div style={styles.finGrid}>
                    <div>
                      <span style={styles.finLabel}>Total Order:</span>
                      <strong style={styles.finValTotal}>
                        ₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span style={styles.finLabel}>Paid:</span>
                      <strong style={styles.finValPaid}>
                        ₹{parseFloat(order.paidAmount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div>
                      <span style={styles.finLabel}>Balance Due:</span>
                      <strong style={styles.finValBal}>
                        ₹{parseFloat(order.balanceAmount || 0).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Payment Progress Bar */}
                  <div style={styles.progressBarBg}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((parseFloat(order.paidAmount || 0) / parseFloat(order.totalAmount)) * 100) || 0
                          )
                        )}%`,
                        backgroundColor: isFullyPaid ? '#16a34a' : '#ea580c',
                      }}
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div style={styles.actionsRow}>
                  {/* View Details & Dispatch Button */}
                  <button
                    onClick={() => navigate(`/sales/orders/${order.id}`)}
                    style={{
                      ...styles.recordPayBtn,
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                    }}
                    title="View full order details, dispatches, and delivery challans"
                  >
                    <Truck size={14} style={{ marginRight: 5, color: '#ea580c' }} />
                    View & Dispatch
                  </button>

                  {/* Record Payment Button (shown if pending balance) */}
                  {parseFloat(order.balanceAmount) > 0 && !isInvoiced && (
                    <button
                      onClick={() => {
                        setPaymentModalOrder(order);
                        setPaymentAmount(order.balanceAmount);
                      }}
                      style={styles.recordPayBtn}
                    >
                      <CreditCard size={15} style={{ marginRight: 5 }} />
                      Record Payment
                    </button>
                  )}

                  {/* Convert to Invoice Button: Visible only when fully paid (or if allowed by admin) */}
                  {!isInvoiced && canConvert && (
                    <button
                      onClick={() => handleConvertToInvoice(order)}
                      disabled={convertingId === order.id}
                      style={styles.convertInvoiceBtn}
                      title="All payments completed! Click to generate invoice & close order"
                    >
                      <FileCheck size={15} style={{ marginRight: 5 }} />
                      {convertingId === order.id ? 'Converting...' : 'Convert to Invoice'}
                    </button>
                  )}

                  {isInvoiced && (
                    <span style={styles.invoicedBadge}>
                      <CheckCircle2 size={14} style={{ marginRight: 4 }} />
                      Invoiced & Closed
                    </span>
                  )}

                  {/* WhatsApp Share Button */}
                  <button
                    onClick={() => shareOrderWhatsApp(order)}
                    style={styles.whatsappIconBtn}
                    title="Share Order via WhatsApp"
                  >
                    <Send size={15} color="#15803d" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModalOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Record Payment</h3>
              <button
                onClick={() => setPaymentModalOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalOrderInfo}>
              <span>Order: <strong>{paymentModalOrder.orderNumber}</strong></span>
              <span>Customer: <strong>{paymentModalOrder.customer?.name}</strong></span>
              <span>
                Pending Balance: <strong style={{ color: '#dc2626' }}>₹{parseFloat(paymentModalOrder.balanceAmount).toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <form onSubmit={handleRecordPayment}>
              <label style={styles.modalLabel}>Payment Amount (₹) *</label>
              <input
                type="number"
                step="any"
                min="1"
                max={paymentModalOrder.balanceAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={styles.modalInput}
                required
              />

              <label style={styles.modalLabel}>Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={styles.modalInput}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="Cheque">Cheque</option>
              </select>

              <label style={styles.modalLabel}>Reference / UTR Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 12-digit UPI reference"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                style={styles.modalInput}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  style={styles.modalSubmitBtn}
                >
                  {submittingPayment ? 'Saving...' : 'Confirm Payment'}
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
  container: {
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto',
    backgroundColor: 'transparent',
    minHeight: '100vh',
    paddingBottom: 90,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    borderRadius: '12px 12px 0 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  title: {
    fontSize: 19,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  subTitle: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: 600,
  },
  iconBtn: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 10,
    width: 38,
    height: 38,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
  createBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
  },
  searchSection: {
    padding: '14px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f1f5f9',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginBottom: 10,
  },
  searchInput: {
    width: '100%',
    padding: '11px 14px',
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: 13,
  },
  filterPills: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 4,
    scrollbarWidth: 'none',
  },
  pill: {
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  orderList: {
    padding: '18px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 16,
    alignItems: 'start',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '40px 20px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    gridColumn: '1 / -1',
  },
  emptyCreateBtn: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNum: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0f172a',
  },
  orderDate: {
    display: 'block',
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  vehicleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '2px 6px',
    borderRadius: 6,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 20,
  },
  customerRow: {
    marginBottom: 8,
  },
  callIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    color: '#0284c7',
    marginLeft: 4,
    textDecoration: 'none',
  },
  siteText: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  itemsPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  itemTag: {
    fontSize: 11,
    backgroundColor: '#f8fafc',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
  },
  financialSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: '10px 12px',
    marginBottom: 12,
    border: '1px solid #f1f5f9',
  },
  finGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  finLabel: {
    display: 'block',
    fontSize: 10,
    color: '#64748b',
    fontWeight: 600,
  },
  finValTotal: {
    fontSize: 14,
    color: '#0f172a',
  },
  finValPaid: {
    fontSize: 14,
    color: '#16a34a',
  },
  finValBal: {
    fontSize: 14,
    color: '#dc2626',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
    transition: 'width 0.3s ease',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderTop: '1px solid #f1f5f9',
    paddingTop: 10,
  },
  recordPayBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  convertInvoiceBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
  },
  invoicedBadge: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  whatsappIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 20px 30px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOrderInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  modalLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  modalCancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    flex: 2,
    padding: '10px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
