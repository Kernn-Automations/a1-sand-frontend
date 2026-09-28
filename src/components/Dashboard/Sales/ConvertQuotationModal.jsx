import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  User,
  Phone,
  CreditCard,
  ArrowRight,
  Package,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function ConvertQuotationModal({ quotation, isOpen, onClose, onConverted }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  // Editable / Missing fields state
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  // Structured Drop-off Site Location
  const [siteName, setSiteName] = useState('');
  const [plot, setPlot] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('');
  const [generalSiteLocation, setGeneralSiteLocation] = useState('');

  // Items
  const [items, setItems] = useState([]);

  // Advance Payment
  const [hasAdvancePayment, setHasAdvancePayment] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (quotation) {
      setCustomerId(quotation.customerId || '');
      setCustomerName(quotation.customerName || quotation.customer?.name || '');
      setCustomerPhone(quotation.customerPhone || quotation.customer?.mobile || '');
      setWarehouseId(quotation.warehouseId || 1);
      setRemarks(`Converted from Quotation #${quotation.quotationNumber}`);

      // Drop-off fields
      const drop = quotation.dropOffDetails || {};
      setSiteName(drop.siteName || '');
      setPlot(drop.plot || '');
      setStreet(drop.street || '');
      setArea(drop.area || '');
      setCity(drop.city || 'Hyderabad');
      setPincode(drop.pincode || '');
      setGeneralSiteLocation(quotation.siteLocation || '');

      // Line items
      if (quotation.items && Array.isArray(quotation.items)) {
        setItems(
          quotation.items.map((it) => ({
            productId: it.productId,
            name: it.product?.name || 'Material',
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || 'brass',
            unitPrice: parseFloat(it.unitPrice) || 0,
            purchasePrice: parseFloat(it.purchasePrice) || 0,
          }))
        );
      }
    }
  }, [quotation]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API_URL}/warehouse`, { headers });
        if (res.data?.warehouses) {
          setWarehouses(res.data.warehouses);
        }
      } catch (err) {
        console.warn('Could not fetch warehouses:', err.message);
      }
    };
    if (isOpen) {
      fetchWarehouses();
    }
  }, [isOpen]);

  if (!isOpen || !quotation) return null;

  // Check what is missing
  const isMissingCustomer = !customerId && !customerPhone;
  const isMissingSite = !siteName && !street && !area && !generalSiteLocation;

  const handleItemQtyChange = (index, newQty) => {
    const updated = [...items];
    updated[index].quantity = Math.max(0.1, parseFloat(newQty) || 0);
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((acc, it) => acc + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerId && !customerPhone) {
      setErrorMsg('Customer phone number is required to register and generate a Sales Order.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Quotation must contain at least one material item.');
      return;
    }

    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Build structured site location string
      const dropOff = {
        siteName,
        plot,
        street,
        area,
        city,
        pincode,
      };

      const parts = [
        siteName ? `Site: ${siteName}` : null,
        plot ? `Plot/Sy: ${plot}` : null,
        street,
        area,
        city,
        pincode ? `Pin: ${pincode}` : null,
      ].filter(Boolean);

      const resolvedSiteLocation = parts.length > 0 ? parts.join(', ') : (generalSiteLocation || 'Direct Site Delivery');

      const payload = {
        customerId: customerId || null,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        warehouseId: warehouseId || 1,
        siteLocation: resolvedSiteLocation,
        dropOffDetails: dropOff,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: parseFloat(it.quantity) || 1,
          unit: it.unit || 'brass',
          unitPrice: parseFloat(it.unitPrice) || 0,
          purchasePrice: parseFloat(it.purchasePrice) || 0,
        })),
        initialPayment: hasAdvancePayment && parseFloat(advanceAmount) > 0
          ? {
              amount: parseFloat(advanceAmount),
              paymentMode,
              transactionReference: paymentReference || null,
              transactionDate: new Date(),
            }
          : null,
        remarks,
      };

      const res = await axios.post(`${API_URL}/quotations/${quotation.id}/convert`, payload, { headers });

      if (res.data?.success) {
        setSuccessOrder(res.data.order);
        if (onConverted) onConverted(res.data.order, res.data.quotation);
      } else {
        setErrorMsg(res.data?.message || 'Failed to convert quotation.');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred during conversion.');
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = calculateTotal();
  const advance = hasAdvancePayment ? parseFloat(advanceAmount) || 0 : 0;
  const balance = Math.max(0, grandTotal - advance);

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.dialog}>
        
        {/* Modal Header */}
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={modalStyles.iconBadge}>
              <Sparkles size={20} color="#ea580c" />
            </div>
            <div>
              <h2 style={modalStyles.title}>Convert Quotation to Sales Order</h2>
              <div style={modalStyles.subTitle}>
                Quote Ref: <span style={{ color: '#ea580c', fontWeight: 700 }}>{quotation.quotationNumber}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn} disabled={loading}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={modalStyles.body}>
          {successOrder ? (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={modalStyles.successCircle}>
                <CheckCircle2 size={48} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '14px 0 6px 0' }}>
                Sales Order Created Successfully!
              </h3>
              <div style={{ fontSize: '15px', color: '#475569', marginBottom: '20px' }}>
                Order Number: <strong style={{ color: '#ea580c' }}>{successOrder.orderNumber}</strong>
              </div>

              <div style={modalStyles.successSummaryBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <strong style={{ color: '#0f172a' }}>{successOrder.customer?.name || customerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Total Order Value:</span>
                  <strong style={{ color: '#0f172a' }}>₹{parseFloat(successOrder.totalAmount).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Advance Paid:</span>
                  <strong style={{ color: '#16a34a' }}>₹{parseFloat(successOrder.paidAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Balance Due:</span>
                  <strong style={{ color: '#ea580c' }}>₹{parseFloat(successOrder.balanceAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/sales/orders/${successOrder.id}`);
                  }}
                  style={modalStyles.primaryActionBtn}
                >
                  View Sales Order <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/sales/orders');
                  }}
                  style={modalStyles.secondaryActionBtn}
                >
                  All Orders List
                </button>
              </div>
            </div>
          ) : (
            /* Conversion Form */
            <form onSubmit={handleConvertSubmit}>
              {/* Alert for Missing details */}
              {(isMissingCustomer || isMissingSite) && (
                <div style={modalStyles.alertBanner}>
                  <AlertCircle size={20} color="#c2410c" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '13px' }}>
                      Additional Details Needed for Official Sales Order
                    </div>
                    <div style={{ fontSize: '12px', color: '#c2410c', marginTop: 2 }}>
                      {isMissingCustomer && '• Customer contact number is required to register client account.\n'}
                      {isMissingSite && '• Delivery site drop-off location is required for dispatches.'}
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={modalStyles.errorBanner}>
                  <AlertCircle size={18} color="#b91c1c" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Section 1: Customer & Depot */}
              <div style={modalStyles.section}>
                <div style={modalStyles.sectionTitle}>
                  <User size={16} color="#ea580c" />
                  <span>Customer & Depot Assignment</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={modalStyles.label}>
                      Customer / Contractor Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name / Company Name"
                      style={modalStyles.input}
                      required
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>
                      Phone / Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      style={{
                        ...modalStyles.input,
                        borderColor: isMissingCustomer ? '#f97316' : '#cbd5e1',
                        backgroundColor: isMissingCustomer ? '#fffaf5' : '#ffffff',
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Dispatch Warehouse Depot</label>
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      style={modalStyles.select}
                    >
                      {warehouses.length > 0 ? (
                        warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>
                            {wh.name} {wh.city ? `(${wh.city})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="1">Central Depot - Main Yard</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Elaborate Drop-Off Site Location */}
              <div style={modalStyles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={modalStyles.sectionTitle}>
                    <MapPin size={16} color="#ea580c" />
                    <span>Drop-Off / Project Site Location</span>
                  </div>
                  {isMissingSite && (
                    <span style={modalStyles.requiredPill}>Required for Dispatches</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={modalStyles.label}>Site / Project Name</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="e.g. Aparna Lakeview / Site A"
                      style={modalStyles.input}
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Plot / Survey No.</label>
                    <input
                      type="text"
                      value={plot}
                      onChange={(e) => setPlot(e.target.value)}
                      placeholder="e.g. Plot #45, Sy No 120"
                      style={modalStyles.input}
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Street / Landmark</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Near Water Tank, Main Rd"
                      style={modalStyles.input}
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Area / Colony</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Gachibowli / Kokapet"
                      style={modalStyles.input}
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      style={modalStyles.input}
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 500032"
                      style={modalStyles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Material Line Items Verification */}
              <div style={modalStyles.section}>
                <div style={modalStyles.sectionTitle}>
                  <Package size={16} color="#ea580c" />
                  <span>Materials & Quantities to Order</span>
                </div>

                <div style={modalStyles.tableWrapper}>
                  <table style={modalStyles.table}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11.5px' }}>Material</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11.5px', width: '130px' }}>Quantity</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11.5px', width: '110px' }}>Rate (₹)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11.5px', width: '120px' }}>Item Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '12.5px' }}>{it.name}</div>
                            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{it.unit}</span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={it.quantity}
                                onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                                style={modalStyles.qtyInput}
                              />
                              <span style={{ fontSize: '11px', color: '#64748b' }}>{it.unit}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                            ₹{parseFloat(it.unitPrice).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Advance Payment (Optional) */}
              <div style={modalStyles.section}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={modalStyles.sectionTitle}>
                    <CreditCard size={16} color="#ea580c" />
                    <span>Record Advance Payment (Optional)</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12.5px' }}>
                    <input
                      type="checkbox"
                      checked={hasAdvancePayment}
                      onChange={(e) => setHasAdvancePayment(e.target.checked)}
                      style={{ accentColor: '#ea580c' }}
                    />
                    <span style={{ fontWeight: 600, color: '#334155' }}>Payment Received Now</span>
                  </label>
                </div>

                {hasAdvancePayment && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 10 }}>
                    <div>
                      <label style={modalStyles.label}>Advance Amount (₹)</label>
                      <input
                        type="number"
                        min="1"
                        max={grandTotal}
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        style={modalStyles.input}
                      />
                    </div>

                    <div>
                      <label style={modalStyles.label}>Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        style={modalStyles.select}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label style={modalStyles.label}>Reference / UTR #</label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Txn ID / Cheque #"
                        style={modalStyles.input}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary & Balance Calculation */}
              <div style={modalStyles.summaryBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
                  <span style={{ color: '#475569' }}>Total Order Value:</span>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>₹{grandTotal.toLocaleString('en-IN')}</strong>
                </div>
                {hasAdvancePayment && advance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: 4 }}>
                    <span style={{ color: '#16a34a' }}>Advance Recorded:</span>
                    <strong style={{ color: '#16a34a' }}>- ₹{advance.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Balance Due on Delivery:</span>
                  <strong style={{ fontWeight: 900, color: '#ea580c', fontSize: '16px' }}>₹{balance.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={modalStyles.footer}>
                <button
                  type="button"
                  onClick={onClose}
                  style={modalStyles.cancelBtn}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={modalStyles.confirmBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <span>Converting to Sales Order...</span>
                  ) : (
                    <>
                      <span>Confirm & Create Sales Order</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  dialog: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'modalSlideUp 0.2s ease-out',
  },
  header: {
    padding: '18px 22px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  subTitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  body: {
    padding: '20px 22px',
    overflowY: 'auto',
    flex: 1,
  },
  alertBanner: {
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#b91c1c',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fdfdfd',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  requiredPill: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#c2410c',
    backgroundColor: '#ffedd5',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  label: {
    display: 'block',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  qtyInput: {
    width: '70px',
    padding: '5px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'center',
    outline: 'none',
  },
  tableWrapper: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    marginTop: 6,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: 18,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    borderTop: '1px solid #f1f5f9',
    paddingTop: 16,
  },
  cancelBtn: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '9px 18px',
    fontWeight: 600,
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
  },
  confirmBtn: {
    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 20px',
    fontWeight: 700,
    fontSize: '13.5px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  successSummaryBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 18px',
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'left',
    fontSize: '13px',
  },
  primaryActionBtn: {
    background: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: '13.5px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  secondaryActionBtn: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '10px 18px',
    fontWeight: 600,
    fontSize: '13.5px',
    cursor: 'pointer',
  },
};
