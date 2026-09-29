import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Search,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Download,
  Share2,
  Eye,
  ArrowRight,
  Sparkles,
  Calendar,
  Phone,
  User,
  Building2,
  Package,
  Layers
} from 'lucide-react';
import ConvertQuotationModal from './ConvertQuotationModal';

export default function Quotations() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [metrics, setMetrics] = useState({
    total: 0,
    sent: 0,
    approved: 0,
    converted: 0,
    draft: 0,
  });

  // Modal State for Convert to Order
  const [selectedQuoteForConvert, setSelectedQuoteForConvert] = useState(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get(`${API_URL}/quotations`, { headers, params });
      if (res.data?.success) {
        setQuotations(res.data.quotations || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, API_URL, statusFilter, searchTerm]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQuotations();
  };

  const handleOpenConvert = (quote) => {
    setSelectedQuoteForConvert(quote);
    setIsConvertModalOpen(true);
  };

  const handleDownloadPdf = async (quote) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/quotations/${quote.id}/pdf`, {
        headers,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation-${quote.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download quotation PDF. ' + (err.message || ''));
    }
  };

  const handleShareWhatsApp = (quote) => {
    const custName = quote.customerName || quote.customer?.name || 'Contractor / Client';
    const itemsText = quote.items
      ?.map((it) => `• ${it.product?.name || 'Material'}: ${it.quantity} ${it.unit} @ ₹${it.unitPrice}`)
      .join('\n') || 'Materials as per schedule';

    const validText = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '14 Days';

    const msg = `*ANJALI CONSTRUCTIONS & MATERIALS*\n*Quotation: ${quote.quotationNumber}*\n\nClient: ${custName}\nSite: ${quote.siteLocation || 'Direct Project Site'}\nValid Until: ${validText}\n\n*Quoted Materials:*\n${itemsText}\n\n*Total Estimated Amount:* ₹${parseFloat(quote.totalAmount).toLocaleString('en-IN')}\n\nThank you for choosing Anjali Constructions!`;

    const phone = quote.customerPhone || quote.customer?.mobile || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  const getStatusBadge = (quote) => {
    switch (quote.status) {
      case 'Converted':
        return (
          <span style={{ ...styles.badge, backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
            <Sparkles size={12} style={{ marginRight: 4 }} />
            Converted to SO
          </span>
        );
      case 'Approved':
        return (
          <span style={{ ...styles.badge, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            <CheckCircle2 size={12} style={{ marginRight: 4 }} />
            Approved
          </span>
        );
      case 'Sent':
        return (
          <span style={{ ...styles.badge, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            <Clock size={12} style={{ marginRight: 4 }} />
            Sent
          </span>
        );
      case 'Draft':
        return (
          <span style={{ ...styles.badge, backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
            Draft
          </span>
        );
      default:
        return (
          <span style={{ ...styles.badge, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
            {quote.status}
          </span>
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topBar}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={styles.title}>Commercial Quotations</h1>
            <span style={styles.quoteCountPill}>{metrics.total} Quotes</span>
          </div>
          <span style={styles.subTitle}>Anjali Constructions & Materials</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Navigation Pill Switcher between Orders and Quotes */}
          <div style={styles.tabSwitcher}>
            <button
              onClick={() => navigate('/sales/orders')}
              style={styles.switchTabInactive}
            >
              Sales Orders
            </button>
            <button
              onClick={() => navigate('/sales/quotations')}
              style={styles.switchTabActive}
            >
              Quotations
            </button>
          </div>

          <button onClick={handleRefresh} style={styles.iconBtn} title="Refresh">
            <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
          </button>

          <button onClick={() => navigate('/sales/quotations/new')} style={styles.createBtn}>
            <Plus size={17} style={{ marginRight: 4 }} />
            New Quote
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Total Quotes</span>
            <div style={{ ...styles.metricIconBox, backgroundColor: '#fff7ed', color: '#ea580c' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={styles.metricValue}>{metrics.total}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Pending / Sent</span>
            <div style={{ ...styles.metricIconBox, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={styles.metricValue}>{metrics.sent}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Approved by Client</span>
            <div style={{ ...styles.metricIconBox, backgroundColor: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={styles.metricValue}>{metrics.approved}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Converted to Orders</span>
            <div style={{ ...styles.metricIconBox, backgroundColor: '#f3e8ff', color: '#9333ea' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ ...styles.metricValue, color: '#7e22ce' }}>{metrics.converted}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={styles.searchSection}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" style={{ marginLeft: 12 }} />
          <input
            type="text"
            placeholder="Search by quote #, customer name, phone, site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterPills}>
          {[
            { label: 'All Quotes', value: 'ALL' },
            { label: 'Sent', value: 'Sent' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Converted', value: 'Converted' },
            { label: 'Draft', value: 'Draft' },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              style={{
                ...styles.pill,
                backgroundColor: statusFilter === pill.value ? '#ea580c' : '#ffffff',
                color: statusFilter === pill.value ? '#ffffff' : '#475569',
                borderColor: statusFilter === pill.value ? '#ea580c' : '#cbd5e1',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div style={styles.loadingBox}>
          <RefreshCw size={28} className="spin" color="#ea580c" />
          <div style={{ marginTop: 12, fontWeight: 600, color: '#64748b' }}>Loading quotations...</div>
        </div>
      ) : quotations.length === 0 ? (
        <div style={styles.emptyBox}>
          <FileText size={48} color="#cbd5e1" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '12px 0 6px 0' }}>
            No quotations found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 0 16px 0' }}>
            Create a professional commercial quotation for contractors, projects, or prospective clients.
          </p>
          <button onClick={() => navigate('/sales/quotations/new')} style={styles.createBtn}>
            <Plus size={16} style={{ marginRight: 4 }} />
            Create First Quotation
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {quotations.map((q) => {
            const isConverted = q.status === 'Converted' || !!q.salesOrderId;
            const validDate = q.validUntil ? new Date(q.validUntil) : null;
            const isExpired = validDate && validDate < new Date() && !isConverted;

            return (
              <div key={q.id} style={styles.card}>
                {/* Card Top Row */}
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        onClick={() => navigate(`/sales/quotations/${q.id}`)}
                        style={styles.quoteNumberLink}
                      >
                        {q.quotationNumber}
                      </span>
                      {getStatusBadge(q)}
                    </div>
                    <div style={styles.quoteDate}>
                      Created on{' '}
                      {new Date(q.quotationDate || q.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.totalAmount}>
                      ₹{parseFloat(q.totalAmount).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Total Estimate</div>
                  </div>
                </div>

                {/* Customer & Site Details */}
                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <User size={15} color="#64748b" style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: '#0f172a' }}>
                        {q.customerName || q.customer?.name || 'Prospective Contractor'}
                      </strong>
                      {(q.customerPhone || q.customer?.mobile) && (
                        <span style={{ color: '#64748b', marginLeft: 6, fontSize: '12px' }}>
                          ({q.customerPhone || q.customer?.mobile})
                        </span>
                      )}
                    </div>
                  </div>

                  {q.siteLocation && (
                    <div style={styles.infoRow}>
                      <Building2 size={15} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#475569', fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.siteLocation}
                      </span>
                    </div>
                  )}

                  {/* Materials Preview */}
                  <div style={styles.materialsPreview}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      <Package size={13} color="#ea580c" />
                      <span>MATERIALS SCHEDULE ({q.items?.length || 0}):</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {q.items && q.items.slice(0, 3).map((it, i) => (
                        <span key={i} style={styles.itemTag}>
                          {it.product?.name || 'Material'}: <strong>{it.quantity} {it.unit}</strong>
                        </span>
                      ))}
                      {q.items && q.items.length > 3 && (
                        <span style={styles.moreTag}>+{q.items.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Validity Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: isExpired ? '#b91c1c' : '#64748b' }}>
                      <Calendar size={13} />
                      <span>Valid till: {validDate ? validDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '14 Days'}</span>
                      {isExpired && <span style={{ fontWeight: 700, color: '#ef4444' }}>(Expired)</span>}
                    </div>

                    {isConverted && q.salesOrder && (
                      <span
                        onClick={() => navigate(`/sales/orders/${q.salesOrderId}`)}
                        style={styles.linkedOrderLink}
                      >
                        SO #{q.salesOrder.orderNumber} <ArrowRight size={12} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={styles.cardFooter}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDownloadPdf(q)}
                      style={styles.iconActionBtn}
                      title="Download PDF"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(q)}
                      style={{ ...styles.iconActionBtn, color: '#16a34a' }}
                      title="Share via WhatsApp"
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      onClick={() => navigate(`/sales/quotations/${q.id}`)}
                      style={styles.iconActionBtn}
                      title="View Quotation"
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <div>
                    {!isConverted ? (
                      <button
                        onClick={() => handleOpenConvert(q)}
                        style={styles.convertBtn}
                      >
                        <Sparkles size={14} style={{ marginRight: 4 }} />
                        Convert to SO
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/sales/orders/${q.salesOrderId}`)}
                        style={styles.viewOrderBtn}
                      >
                        View Order <ArrowRight size={13} style={{ marginLeft: 4 }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Convert to Sales Order Interactive Modal */}
      {selectedQuoteForConvert && (
        <ConvertQuotationModal
          quotation={selectedQuoteForConvert}
          isOpen={isConvertModalOpen}
          onClose={() => {
            setIsConvertModalOpen(false);
            setSelectedQuoteForConvert(null);
          }}
          onConverted={(createdOrder) => {
            fetchQuotations();
          }}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '12px 6px 80px',
    maxWidth: '1280px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    width: '100%',
    overflowX: 'hidden',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    flexWrap: 'wrap',
    gap: '12px',
    boxSizing: 'border-box',
    width: '100%',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subTitle: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 500,
  },
  quoteCountPill: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    fontSize: '12px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid #ffedd5',
  },
  tabSwitcher: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '3px',
    gap: '2px',
  },
  switchTabActive: {
    backgroundColor: '#ffffff',
    color: '#ea580c',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  switchTabInactive: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  iconBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    cursor: 'pointer',
  },
  createBtn: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '10px',
    marginBottom: '18px',
    width: '100%',
    boxSizing: 'border-box',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  },
  metricIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    marginTop: '6px',
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '18px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    fontSize: '13px',
    outline: 'none',
    color: '#0f172a',
  },
  filterPills: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  pill: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    boxSizing: 'border-box',
    width: '100%',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px',
    marginBottom: '12px',
  },
  quoteNumberLink: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#ea580c',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  quoteDate: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  totalAmount: {
    fontSize: '17px',
    fontWeight: 900,
    color: '#0f172a',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  materialsPreview: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 10px',
    marginTop: '4px',
  },
  itemTag: {
    fontSize: '11.5px',
    color: '#334155',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '2px 6px',
  },
  moreTag: {
    fontSize: '11px',
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    padding: '2px 6px',
    fontWeight: 600,
  },
  linkedOrderLink: {
    color: '#7e22ce',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconActionBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '7px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    cursor: 'pointer',
  },
  convertBtn: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '7px',
    padding: '7px 14px',
    fontSize: '12.5px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)',
  },
  viewOrderBtn: {
    backgroundColor: '#f3e8ff',
    color: '#7e22ce',
    border: '1px solid #e9d5ff',
    borderRadius: '7px',
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '50px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
};
