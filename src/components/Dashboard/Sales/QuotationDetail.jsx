import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Download,
  Share2,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  MapPin,
  User,
  Phone,
  Package,
  Calendar,
  ExternalLink,
  ArrowRight,
  FileText
} from 'lucide-react';
import ConvertQuotationModal from './ConvertQuotationModal';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/quotations/${id}`, { headers });
      if (res.data?.success) {
        setQuotation(res.data.quotation);
      } else {
        setErrorMsg(res.data?.message || 'Failed to load quotation');
      }
    } catch (err) {
      console.error('Error fetching quotation:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error loading quotation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_URL}/quotations/${quotation.id}/pdf`, {
        headers,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download PDF: ' + err.message);
    }
  };

  const handleShareWhatsApp = () => {
    if (!quotation) return;
    const custName = quotation.customerName || quotation.customer?.name || 'Contractor / Client';
    const itemsText = quotation.items
      ?.map((it) => `• ${it.product?.name || 'Material'}: ${it.quantity} ${it.unit} @ ₹${it.unitPrice}`)
      .join('\n') || 'Materials as per quotation schedule';

    const validText = quotation.validUntil
      ? new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '14 Days';

    const msg = `*ANJALI CONSTRUCTIONS & MATERIALS*\n*Quotation: ${quotation.quotationNumber}*\n\nClient: ${custName}\nSite: ${quotation.siteLocation || 'Direct Project Site'}\nValid Until: ${validText}\n\n*Quoted Materials:*\n${itemsText}\n\n*Total Estimated Amount:* ₹${parseFloat(quotation.totalAmount).toLocaleString('en-IN')}\n\nThank you for choosing Anjali Constructions!`;

    const phone = quotation.customerPhone || quotation.customer?.mobile || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, color: '#64748b' }}>Loading quotation details...</div>
      </div>
    );
  }

  if (errorMsg || !quotation) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
        <h3 style={{ color: '#0f172a', margin: '0 0 8px 0' }}>Quotation Not Found</h3>
        <p style={{ color: '#64748b', fontSize: '13px' }}>{errorMsg || 'The requested quotation could not be located.'}</p>
        <button onClick={() => navigate('/sales/quotations')} style={detailStyles.backBtn}>
          Back to Quotations List
        </button>
      </div>
    );
  }

  const isConverted = quotation.status === 'Converted' || !!quotation.salesOrderId;
  const validDate = quotation.validUntil ? new Date(quotation.validUntil) : null;
  const isExpired = validDate && validDate < new Date() && !isConverted;

  return (
    <div style={detailStyles.container}>
      {/* Top Header & Actions */}
      <div style={detailStyles.topBar}>
        <div>
          <button onClick={() => navigate('/sales/quotations')} style={detailStyles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Quotations</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <h1 style={detailStyles.title}>{quotation.quotationNumber}</h1>
            <span style={{
              ...detailStyles.statusBadge,
              backgroundColor: isConverted ? '#f3e8ff' : '#eff6ff',
              color: isConverted ? '#7e22ce' : '#1d4ed8',
              border: `1px solid ${isConverted ? '#e9d5ff' : '#bfdbfe'}`,
            }}>
              {isConverted ? 'Converted to SO' : quotation.status}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadPdf} style={detailStyles.secondaryBtn}>
            <Download size={16} />
            <span>Download PDF</span>
          </button>

          <button onClick={handleShareWhatsApp} style={detailStyles.whatsappBtn}>
            <Share2 size={16} />
            <span>WhatsApp</span>
          </button>

          {!isConverted ? (
            <button onClick={() => setIsConvertModalOpen(true)} style={detailStyles.convertBtn}>
              <Sparkles size={16} />
              <span>Convert to Sales Order</span>
            </button>
          ) : (
            <button
              onClick={() => navigate(`/sales/orders/${quotation.salesOrderId}`)}
              style={detailStyles.viewOrderBtn}
            >
              <span>View Sales Order</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Conversion Banner if Converted */}
      {isConverted && quotation.salesOrder && (
        <div style={detailStyles.convertedBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={detailStyles.purpleIconBox}>
              <Sparkles size={18} color="#7e22ce" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#581c87', fontSize: '13.5px' }}>
                Quotation converted to Sales Order #{quotation.salesOrder.orderNumber}
              </div>
              <div style={{ fontSize: '12px', color: '#7e22ce', marginTop: 2 }}>
                Converted on {quotation.convertedAt ? new Date(quotation.convertedAt).toLocaleString('en-IN') : 'Recent'}. Order status: <strong>{quotation.salesOrder.orderStatus}</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/sales/orders/${quotation.salesOrderId}`)}
            style={detailStyles.bannerLinkBtn}
          >
            Open Order <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* Main Quotation Document Card */}
      <div style={detailStyles.documentCard}>
        {/* Document Header */}
        <div style={detailStyles.docHeader}>
          <div>
            <div style={detailStyles.brandTitle}>Anjali Constructions & Materials</div>
            <div style={detailStyles.docSubtitle}>Commercial Quotation / Material Estimate</div>
            <div style={detailStyles.companyMeta}>
              Sy. No. 120/A, Quarry Road, Main Yard, Hyderabad - 500001<br />
              Direct Sales & Supply Hotline: <strong>+91 98765 43210</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={detailStyles.quoteBadge}>QUOTATION</div>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#475569' }}>
              <div>Quote #: <strong style={{ color: '#0f172a' }}>{quotation.quotationNumber}</strong></div>
              <div>Date: <strong>{new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString('en-IN')}</strong></div>
              <div>Valid Until: <strong style={{ color: isExpired ? '#ef4444' : '#ea580c' }}>
                {validDate ? validDate.toLocaleDateString('en-IN') : '14 Days'}
              </strong></div>
            </div>
          </div>
        </div>

        {/* Client & Delivery Info Grid */}
        <div style={detailStyles.infoGrid}>
          <div style={detailStyles.infoBox}>
            <div style={detailStyles.infoBoxTitle}>Client / Contractor Information</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              {quotation.customerName || quotation.customer?.name || 'Contractor / Client'}
            </div>
            {(quotation.customerPhone || quotation.customer?.mobile) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: '#334155' }}>
                <Phone size={14} color="#64748b" />
                <span>{quotation.customerPhone || quotation.customer?.mobile}</span>
              </div>
            )}
            {quotation.customer?.firmName && quotation.customer.firmName !== quotation.customer.name && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                M/s {quotation.customer.firmName}
              </div>
            )}
          </div>

          <div style={detailStyles.infoBox}>
            <div style={detailStyles.infoBoxTitle}>Proposed Delivery / Site Location</div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              {quotation.siteLocation || 'Project Site Delivery'}
            </div>
            {quotation.warehouse && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Source Depot: <strong>{quotation.warehouse.name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Materials Table */}
        <div style={detailStyles.tableWrapper}>
          <table style={detailStyles.table}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                <th style={{ padding: '10px 14px', textAlign: 'center', width: '50px', fontSize: '12px' }}>#</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px' }}>Material / Product</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', width: '130px', fontSize: '12px' }}>Quantity</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', width: '140px', fontSize: '12px' }}>Rate (₹)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', width: '150px', fontSize: '12px' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items && quotation.items.map((it, idx) => (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                      {it.product?.name || 'Material Item'}
                    </div>
                    {it.product?.SKU && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {it.product.SKU}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {it.quantity} <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>{it.unit}</span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                    ₹{parseFloat(it.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                    ₹{parseFloat(it.grandTotal || it.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={detailStyles.totalsSection}>
          <div style={detailStyles.totalsBox}>
            <div style={detailStyles.totalRow}>
              <span style={{ color: '#64748b' }}>Subtotal:</span>
              <strong>₹{parseFloat(quotation.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={detailStyles.grandTotalRow}>
              <span>Grand Total:</span>
              <span style={{ color: '#ea580c', fontSize: '18px' }}>
                ₹{parseFloat(quotation.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div style={detailStyles.termsSection}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
            Commercial Notes & Validity:
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
            {quotation.notes || 'Rates quoted are subject to standard truck measurement at weighbridge and valid until the stated date. Site unloading access is in contractor scope.'}
          </p>
        </div>
      </div>

      {/* Convert to Sales Order Modal */}
      <ConvertQuotationModal
        quotation={quotation}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onConverted={(createdOrder, updatedQuote) => {
          fetchQuotation();
        }}
      />
    </div>
  );
}

const detailStyles = {
  container: {
    padding: '16px 20px 80px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  statusBadge: {
    fontSize: '11.5px',
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: '6px',
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  whatsappBtn: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#15803d',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  convertBtn: {
    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '13.5px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
  },
  viewOrderBtn: {
    backgroundColor: '#f3e8ff',
    color: '#7e22ce',
    border: '1px solid #e9d5ff',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  convertedBanner: {
    backgroundColor: '#faf5ff',
    border: '1.5px solid #d8b4fe',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  purpleIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#f3e8ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLinkBtn: {
    backgroundColor: '#7e22ce',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '12.5px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
  },
  documentCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px 28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  docHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2.5px solid #ea580c',
    paddingBottom: '16px',
    marginBottom: '18px',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  docSubtitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#ea580c',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginTop: '2px',
  },
  companyMeta: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '6px',
    lineHeight: 1.4,
  },
  quoteBadge: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
    fontWeight: 800,
    fontSize: '13px',
    padding: '4px 12px',
    borderRadius: '6px',
    display: 'inline-block',
    border: '1px solid #ffedd5',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
    marginBottom: '20px',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px 16px',
  },
  infoBoxTitle: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '4px',
  },
  tableWrapper: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '18px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  totalsSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  totalsBox: {
    width: '300px',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '10px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
  },
  grandTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 900,
    fontSize: '15px',
    borderTop: '2px solid #0f172a',
    paddingTop: '8px',
    marginTop: '6px',
  },
  termsSection: {
    backgroundColor: '#fdfdfd',
    border: '1px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '14px 18px',
  },
};
