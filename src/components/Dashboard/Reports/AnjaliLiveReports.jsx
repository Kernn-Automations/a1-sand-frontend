import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  User, 
  Truck, 
  Package, 
  Send, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  FileText,
  BarChart3,
  Layers
} from 'lucide-react';
import { isAdmin } from '../../../utils/roleUtils';

export default function AnjaliLiveReports() {
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin(user);

  const [activeTab, setActiveTab] = useState('FINANCES'); // 'FINANCES' | 'CUSTOMER_LEDGER' | 'STOCK_LEDGER'
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('THIS_MONTH'); // 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'

  // Financial Metrics State
  const [metrics, setMetrics] = useState(null);
  const [productStats, setProductStats] = useState([]);

  // Customer Ledger State
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerLedger, setCustomerLedger] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Stock Movement Ledger State
  const [stockLedger, setStockLedger] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchFinancialData();
    fetchCustomers();
  }, [dateFilter]);

  const getDateRange = (filter) => {
    const now = new Date();
    const toDate = now.toISOString().slice(0, 10);
    let fromDate = '';

    if (filter === 'TODAY') {
      fromDate = toDate;
    } else if (filter === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      fromDate = new Date(now.setDate(diff)).toISOString().slice(0, 10);
    } else if (filter === 'THIS_MONTH') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    }
    return { fromDate, toDate };
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const { fromDate, toDate } = getDateRange(dateFilter);

      const params = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get(`${API_URL}/reports/finances/live`, { headers, params });
      if (res.data?.success) {
        setMetrics(res.data.metrics);
        setProductStats(res.data.productPerformance || []);
      }
    } catch (err) {
      console.error('Error fetching financial metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/customers`, { headers });
      if (res.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchCustomerLedger = async (cId) => {
    if (!cId) return;
    try {
      setLoadingLedger(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/reports/customer-ledger/${cId}`, { headers });
      if (res.data?.success) {
        setCustomerLedger(res.data);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchStockLedger = async () => {
    try {
      setLoadingStock(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/reports/stock-ledger?limit=50`, { headers });
      if (res.data?.success) {
        setStockLedger(res.data.entries || []);
      }
    } catch (err) {
      console.error('Error fetching stock ledger:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'STOCK_LEDGER' && stockLedger.length === 0) {
      fetchStockLedger();
    }
  };

  const shareLedgerWhatsApp = () => {
    if (!customerLedger || !customerLedger.customer) return;
    const c = customerLedger.customer;
    const s = customerLedger.summary;

    let msg = `*ANJALI CONSTRUCTIONS & MATERIALS*\n*Statement of Account*\n\nCustomer: ${c.name}\nPhone: ${c.phone || 'N/A'}\n\n`;
    msg += `Total Sales Billed: ₹${parseFloat(s.totalDebit).toLocaleString('en-IN')}\n`;
    msg += `Total Payments Received: ₹${parseFloat(s.totalCredit).toLocaleString('en-IN')}\n`;
    msg += `*Outstanding Balance: ₹${parseFloat(s.closingBalance).toLocaleString('en-IN')} (${s.balanceType})*\n\n`;
    msg += `Please clear any pending dues at the earliest.\nThank you!`;

    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Live Financials & Ledger</h1>
          <span style={styles.headerSub}>Anjali Constructions & Materials</span>
        </div>
        <button onClick={fetchFinancialData} style={styles.refreshBtn} title="Refresh Live Data">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Main Tabs */}
      <div style={styles.tabBar}>
        <button
          onClick={() => handleTabSwitch('FINANCES')}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'FINANCES' ? '3px solid #ea580c' : 'none',
            color: activeTab === 'FINANCES' ? '#ea580c' : '#64748b',
          }}
        >
          <TrendingUp size={16} style={{ marginRight: 6 }} />
          Finances & P&L
        </button>

        <button
          onClick={() => handleTabSwitch('CUSTOMER_LEDGER')}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'CUSTOMER_LEDGER' ? '3px solid #ea580c' : 'none',
            color: activeTab === 'CUSTOMER_LEDGER' ? '#ea580c' : '#64748b',
          }}
        >
          <FileText size={16} style={{ marginRight: 6 }} />
          Customer Ledger
        </button>

        <button
          onClick={() => handleTabSwitch('STOCK_LEDGER')}
          style={{
            ...styles.tabBtn,
            borderBottom: activeTab === 'STOCK_LEDGER' ? '3px solid #ea580c' : 'none',
            color: activeTab === 'STOCK_LEDGER' ? '#ea580c' : '#64748b',
          }}
        >
          <Package size={16} style={{ marginRight: 6 }} />
          Stock Movement
        </button>
      </div>

      {/* TAB 1: LIVE FINANCES & P&L */}
      {activeTab === 'FINANCES' && (
        <div style={styles.contentSection}>
          {/* Time Filter Pills */}
          <div style={styles.timePills}>
            {[
              { label: 'Today', value: 'TODAY' },
              { label: 'This Week', value: 'THIS_WEEK' },
              { label: 'This Month', value: 'THIS_MONTH' },
              { label: 'All Time', value: 'ALL' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setDateFilter(p.value)}
                style={{
                  ...styles.timePill,
                  backgroundColor: dateFilter === p.value ? '#ea580c' : '#ffffff',
                  color: dateFilter === p.value ? '#ffffff' : '#64748b',
                  border: dateFilter === p.value ? 'none' : '1px solid #e2e8f0',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* KPI Cards Grid */}
          <div style={styles.kpiGrid}>
            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #ea580c' }}>
              <span style={styles.kpiLabel}>Total Revenue</span>
              <strong style={styles.kpiValue}>
                ₹{metrics ? metrics.totalRevenue.toLocaleString('en-IN') : '0'}
              </strong>
              <span style={styles.kpiSub}>{metrics?.orderCount || 0} Orders raised</span>
            </div>

            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #16a34a' }}>
              <span style={styles.kpiLabel}>Total Collected</span>
              <strong style={{ ...styles.kpiValue, color: '#16a34a' }}>
                ₹{metrics ? metrics.totalCollected.toLocaleString('en-IN') : '0'}
              </strong>
              <span style={styles.kpiSub}>Settled receipts</span>
            </div>

            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #dc2626' }}>
              <span style={styles.kpiLabel}>Outstanding Receivables</span>
              <strong style={{ ...styles.kpiValue, color: '#dc2626' }}>
                ₹{metrics ? metrics.totalOutstanding.toLocaleString('en-IN') : '0'}
              </strong>
              <span style={styles.kpiSub}>Pending balance dues</span>
            </div>

            {userIsAdmin && (
              <>
                <div style={{ ...styles.kpiCard, borderLeft: '4px solid #64748b' }}>
                  <span style={styles.kpiLabel}>Total Purchase Cost (COGS)</span>
                  <strong style={styles.kpiValue}>
                    ₹{metrics?.totalPurchaseCost ? metrics.totalPurchaseCost.toLocaleString('en-IN') : '0'}
                  </strong>
                  <span style={styles.kpiSub}>Quarry & transport cost</span>
                </div>

                <div style={{ ...styles.kpiCard, borderLeft: '4px solid #2563eb' }}>
                  <span style={styles.kpiLabel}>Net Profit & Margin</span>
                  <strong style={{ ...styles.kpiValue, color: '#2563eb' }}>
                    ₹{metrics?.netProfit ? metrics.netProfit.toLocaleString('en-IN') : '0'}
                  </strong>
                  <span style={styles.kpiSub}>
                    Margin: <strong>{metrics?.profitMarginPercent || '0'}%</strong>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Responsive 2-Column Analytics Grid */}
          <div style={styles.twoColumnGrid}>
            {/* Payment Mode Breakdown */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Collections by Payment Mode</h3>
              <div style={styles.modeList}>
                {metrics?.paymentModes?.map((m) => (
                  <div key={m.mode} style={styles.modeRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={16} color="#ea580c" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{m.mode}</span>
                    </div>
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>
                      ₹{m.amount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Performance Breakdown */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Construction Materials Sold</h3>
              <div style={styles.productList}>
                {productStats.map((p) => (
                  <div key={p.productId} style={styles.productRowCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>{p.name}</strong>
                      <span style={styles.qtyBadge}>
                        {p.totalQuantity} {p.unit}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                      <span>Revenue: <strong>₹{p.totalRevenue.toLocaleString('en-IN')}</strong></span>
                      {userIsAdmin && p.totalProfit !== undefined && (
                        <span style={{ color: p.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                          Profit: ₹{p.totalProfit.toLocaleString('en-IN')} ({p.marginPercent}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER FINANCIAL LEDGER */}
      {activeTab === 'CUSTOMER_LEDGER' && (
        <div style={styles.contentSection}>
          <div style={styles.card}>
            <label style={styles.label}>Select Customer / Contractor</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={styles.textInput}
              />
              <select
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  fetchCustomerLedger(e.target.value);
                }}
                style={styles.selectInput}
              >
                <option value="">-- Choose Customer ({customers.filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).length}) --</option>
                {customers
                  .filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {loadingLedger ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              Loading ledger statement...
            </div>
          ) : customerLedger ? (
            <div>
              {/* Customer Statement Summary Card */}
              <div style={styles.statementSummary}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>
                      {customerLedger.customer?.name}
                    </h3>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      Phone: <strong>{customerLedger.customer?.phone || 'N/A'}</strong>
                    </span>
                  </div>
                  <button onClick={shareLedgerWhatsApp} style={styles.shareStmtBtn}>
                    <Send size={15} style={{ marginRight: 6 }} />
                    Share Statement on WhatsApp
                  </button>
                </div>

                <div style={styles.stmtGrid}>
                  <div>
                    <span style={styles.stmtLabel}>Total Sales Billed</span>
                    <strong style={styles.stmtVal}>
                      ₹{customerLedger.summary?.totalDebit ? Number(customerLedger.summary.totalDebit).toLocaleString('en-IN') : '0'}
                    </strong>
                  </div>
                  <div>
                    <span style={styles.stmtLabel}>Total Payments Received</span>
                    <strong style={{ ...styles.stmtVal, color: '#16a34a' }}>
                      ₹{customerLedger.summary?.totalCredit ? Number(customerLedger.summary.totalCredit).toLocaleString('en-IN') : '0'}
                    </strong>
                  </div>
                  <div>
                    <span style={styles.stmtLabel}>Closing Balance Due</span>
                    <strong style={{ ...styles.stmtVal, color: '#dc2626' }}>
                      ₹{customerLedger.summary?.closingBalance ? Number(customerLedger.summary.closingBalance).toLocaleString('en-IN') : '0'} ({customerLedger.summary?.balanceType || 'Dr'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Transactions Table for wide screen + cards for mobile */}
              {customerLedger.entries?.length === 0 ? (
                <div style={styles.emptyPrompt}>
                  <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
                    No transactions recorded yet for this customer.
                  </p>
                </div>
              ) : (
                <div style={styles.tableResponsiveWrapper}>
                  <table style={styles.dataTable}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Particulars</th>
                        <th style={styles.th}>Voucher #</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Debit (+)</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Credit (-)</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerLedger.entries?.map((e, idx) => (
                        <tr key={e.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={styles.td}>
                            {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ ...styles.td, fontWeight: 600, color: '#0f172a' }}>
                            {e.particulars}
                          </td>
                          <td style={{ ...styles.td, color: '#64748b', fontSize: 12 }}>
                            {e.vchNo}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                            {parseFloat(e.debit) > 0 ? `₹${parseFloat(e.debit).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {parseFloat(e.credit) > 0 ? `₹${parseFloat(e.credit).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{parseFloat(e.balance).toLocaleString('en-IN')} <span style={{ fontSize: 11, color: '#64748b' }}>({e.balanceType})</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyPrompt}>
              <User size={44} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                Please select a customer or contractor to view their ledger statement.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENT LEDGER */}
      {activeTab === 'STOCK_LEDGER' && (
        <div style={styles.contentSection}>
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={styles.cardTitle}>Yard Stock Movement Ledger</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                  Real-time audit log of material dispatches and quarry inward loads.
                </p>
              </div>
              <button onClick={fetchStockLedger} style={styles.refreshBtn} title="Refresh Stock Movement">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {loadingStock ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              Loading stock movements...
            </div>
          ) : stockLedger.length === 0 ? (
            <div style={styles.emptyPrompt}>
              <Package size={44} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                No stock movements logged yet.
              </p>
            </div>
          ) : (
            <div style={styles.tableResponsiveWrapper}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Material</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Quantity</th>
                    <th style={styles.th}>Yard / Warehouse</th>
                    <th style={styles.th}>Vehicle #</th>
                    <th style={styles.th}>Remarks</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLedger.map((s, idx) => (
                    <tr key={s.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={styles.td}>
                        {s.changeType === 'in' ? (
                          <span style={styles.inwardBadge}>
                            <ArrowDownLeft size={12} style={{ marginRight: 2 }} /> INWARD
                          </span>
                        ) : (
                          <span style={styles.outwardBadge}>
                            <ArrowUpRight size={12} style={{ marginRight: 2 }} /> DISPATCH
                          </span>
                        )}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#0f172a' }}>
                        {s.product?.name || 'Material'}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: s.changeType === 'in' ? '#16a34a' : '#ea580c' }}>
                        {s.quantity} {s.unit}
                      </td>
                      <td style={{ ...styles.td, fontSize: 13, color: '#475569' }}>
                        {s.warehouse?.name || 'Central Yard'}
                      </td>
                      <td style={{ ...styles.td, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {s.vehicleNumber || '-'}
                      </td>
                      <td style={{ ...styles.td, fontSize: 12, color: '#64748b' }}>
                        {s.remarks || '-'}
                      </td>
                      <td style={{ ...styles.td, fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                        {new Date(s.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  headerSub: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: 600,
  },
  refreshBtn: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 10,
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 8px',
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  contentSection: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  timePills: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 4,
  },
  timePill: {
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 16,
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: '14px 16px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9',
  },
  kpiLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiValue: {
    display: 'block',
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: 4,
  },
  kpiSub: {
    display: 'block',
    fontSize: 11,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#1e293b',
    margin: 0,
    marginBottom: 14,
  },
  modeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  modeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  productRowCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: '12px 14px',
    border: '1px solid #f1f5f9',
  },
  qtyBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '3px 8px',
    borderRadius: 6,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  selectInput: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  statementSummary: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: '18px 20px',
    border: '1.5px solid #fed7aa',
    marginBottom: 16,
  },
  shareStmtBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    backgroundColor: '#25d366',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
  },
  stmtGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid #fed7aa',
    textAlign: 'center',
  },
  stmtLabel: {
    display: 'block',
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
    marginBottom: 3,
  },
  stmtVal: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
  },
  emptyPrompt: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '40px 20px',
    textAlign: 'center',
    border: '1px solid #f1f5f9',
  },
  tableResponsiveWrapper: {
    overflowX: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 640,
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: 12,
    color: '#64748b',
    fontWeight: 700,
    backgroundColor: '#f8fafc',
    borderBottom: '1.5px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    fontSize: 13,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
  },
  inwardBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '2px 7px',
    borderRadius: 5,
    display: 'inline-flex',
    alignItems: 'center',
  },
  outwardBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '2px 7px',
    borderRadius: 5,
    display: 'inline-flex',
    alignItems: 'center',
  },
};
