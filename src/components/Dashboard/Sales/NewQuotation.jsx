import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  MapPin,
  User,
  Phone,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  Send,
  Sparkles
} from 'lucide-react';
import { isAdmin } from '../../../utils/roleUtils';
import { useLicense, LicenseCreationBanner } from '@/context/LicenseContext';

const UNIT_OPTIONS = [
  { label: 'Brass (100 CFT)', value: 'brass' },
  { label: 'CFT (Cubic Feet)', value: 'cft' },
  { label: 'Tons (MT)', value: 'ton' },
  { label: 'Tipper / Lorry Load', value: 'load' },
  { label: 'Units / Numbers (Bricks)', value: 'units' },
];

export default function NewQuotation() {
  const navigate = useNavigate();
  const { isCreationDisabled, disabledMessage } = useLicense();
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin(user);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Customer Mode: Existing vs New Prospective
  const [isProspective, setIsProspective] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Depot & Validity
  const [warehouseId, setWarehouseId] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  // Site Drop-off Details
  const [siteName, setSiteName] = useState('');
  const [plot, setPlot] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('100% payment on delivery / mutually agreed billing cycle. Unloading charges at client scope.');

  // Items
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [custRes, whRes, prodRes] = await Promise.allSettled([
          axios.get(`${API_URL}/customers`, { headers }),
          axios.get(`${API_URL}/warehouse`, { headers }),
          axios.get(`${API_URL}/products`, { headers }),
        ]);

        if (custRes.status === 'fulfilled' && custRes.value.data?.customers) {
          setCustomers(custRes.value.data.customers);
        }
        if (whRes.status === 'fulfilled' && whRes.value.data?.warehouses) {
          setWarehouses(whRes.value.data.warehouses);
          if (whRes.value.data.warehouses.length > 0) {
            setWarehouseId(whRes.value.data.warehouses[0].id);
          }
        }
        if (prodRes.status === 'fulfilled' && prodRes.value.data?.products) {
          const fetched = prodRes.value.data.products;
          setProductsList(fetched || []);
          if (fetched && fetched.length > 0) {
            setItems([
              {
                productId: fetched[0].id,
                name: fetched[0].name,
                unit: fetched[0].unit || 'brass',
                quantity: 1,
                unitPrice: parseFloat(fetched[0].basePrice || fetched[0].price || 0),
                purchasePrice: parseFloat(fetched[0].purchasePrice || 0),
              },
            ]);
          } else {
            setItems([]);
          }
        } else {
          setProductsList([]);
          setItems([]);
        }
      } catch (err) {
        console.warn('Initial data load note:', err.message);
      }
    };
    fetchInitialData();
  }, [API_URL, token]);

  const handleProductSelect = (index, prodId) => {
    const p = productsList.find((x) => x.id === parseInt(prodId, 10));
    if (!p) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: p.id,
      name: p.name,
      unit: p.unit || 'brass',
      unitPrice: parseFloat(p.basePrice || p.price || 0),
      purchasePrice: parseFloat(p.purchasePrice || 0),
    };
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    if (productsList.length === 0) return;
    const p = productsList[0];
    setItems([
      ...items,
      {
        productId: p.id,
        name: p.name,
        unit: p.unit || 'brass',
        quantity: 1,
        unitPrice: parseFloat(p.basePrice || p.price || 0),
        purchasePrice: parseFloat(p.purchasePrice || 0),
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let costTotal = 0;
    items.forEach((it) => {
      const q = parseFloat(it.quantity) || 0;
      const u = parseFloat(it.unitPrice) || 0;
      const c = parseFloat(it.purchasePrice) || 0;
      subtotal += q * u;
      costTotal += q * c;
    });
    const margin = subtotal - costTotal;
    return { subtotal, costTotal, margin };
  };

  const totals = calculateTotals();

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isProspective && !customerId) {
      setErrorMsg('Please select a customer or switch to Add Prospective Client.');
      return;
    }

    if (isProspective && (!customerName || !customerPhone)) {
      setErrorMsg('Please enter customer/contractor name and phone number.');
      return;
    }

    if (productsList.length === 0 || items.length === 0) {
      setErrorMsg('No products available. Please add products to the catalog before creating a quotation.');
      return;
    }

    try {
      setSubmitting(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Build drop-off
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

      const siteLocationStr = parts.length > 0 ? parts.join(', ') : 'Direct Site Delivery';

      const payload = {
        customerId: !isProspective ? customerId : null,
        customerName: isProspective ? customerName : undefined,
        customerPhone: isProspective ? customerPhone : undefined,
        warehouseId: warehouseId || 1,
        validUntil,
        siteLocation: siteLocationStr,
        dropOffDetails: dropOff,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: parseFloat(it.quantity) || 1,
          unit: it.unit || 'brass',
          unitPrice: parseFloat(it.unitPrice) || 0,
          purchasePrice: parseFloat(it.purchasePrice) || 0,
        })),
        notes,
      };

      const res = await axios.post(`${API_URL}/quotations`, payload, { headers });

      if (res.data?.success) {
        navigate(`/sales/quotations/${res.data.quotation.id}`);
      } else {
        setErrorMsg(res.data?.message || 'Failed to create quotation');
      }
    } catch (err) {
      console.error('Error submitting quotation:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred while creating the quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topBar}>
        <button onClick={() => navigate('/sales/quotations')} style={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>Back to Quotations</span>
        </button>
        <div>
          <h1 style={styles.title}>New Commercial Quotation</h1>
          <span style={styles.subTitle}>Anjali Constructions & Materials</span>
        </div>
      </div>

      <LicenseCreationBanner actionName="commercial quotations" />

      {errorMsg && (
        <div style={styles.errorBanner}>
          <AlertCircle size={18} color="#b91c1c" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitQuotation}>
        {/* Section 1: Client Selection */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>
              <User size={18} color="#ea580c" />
              <span>Contractor / Client Selection</span>
            </div>

            {/* Toggle Prospective vs Existing */}
            <div style={styles.toggleWrapper}>
              <button
                type="button"
                onClick={() => setIsProspective(false)}
                style={!isProspective ? styles.toggleActive : styles.toggleInactive}
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setIsProspective(true)}
                style={isProspective ? styles.toggleActive : styles.toggleInactive}
              >
                + Prospective Client
              </button>
            </div>
          </div>

          {!isProspective ? (
            <div style={{ marginTop: 12 }}>
              <label style={styles.label}>Select Registered Customer / Contractor</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={styles.select}
                required={!isProspective}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.mobile ? `(${c.mobile})` : ''} {c.firmName ? `- ${c.firmName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12, marginTop: 12 }}>
              <div>
                <label style={styles.label}>
                  Client / Contractor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mega Infra / Suresh Reddy"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={styles.input}
                  required={isProspective}
                />
              </div>

              <div>
                <label style={styles.label}>
                  Phone / Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={styles.input}
                  required={isProspective}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Depot & Validity */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <Calendar size={18} color="#ea580c" />
            <span>Depot & Quotation Validity</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 14, marginTop: 12 }}>
            <div>
              <label style={styles.label}>Dispatch Warehouse Depot</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                style={styles.select}
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

            <div>
              <label style={styles.label}>Quote Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Proposed Site Location (Optional during quote) */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <MapPin size={18} color="#ea580c" />
            <span>Proposed Delivery / Site Location</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 10, marginTop: 12 }}>
            <div>
              <label style={styles.label}>Site / Project Name</label>
              <input
                type="text"
                placeholder="e.g. Prestige High Fields"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Plot / Survey No.</label>
              <input
                type="text"
                placeholder="e.g. Sy No 142/B"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Street / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Main Outer Road"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Area / Colony</label>
              <input
                type="text"
                placeholder="e.g. Financial District"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>City</label>
              <input
                type="text"
                placeholder="e.g. Hyderabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Pincode</label>
              <input
                type="text"
                placeholder="e.g. 500032"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Materials Schedule */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={styles.cardTitle}>
              <Package size={18} color="#ea580c" />
              <span>Quoted Construction Materials</span>
            </div>

            {productsList.length > 0 && (
              <button type="button" onClick={addItem} style={styles.addItemBtn}>
                <Plus size={15} style={{ marginRight: 4 }} />
                Add Material
              </button>
            )}
          </div>

          {productsList.length === 0 ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: '#fff7ed',
              borderRadius: '10px',
              border: '1px dashed #fdba74',
              margin: '12px 0'
            }}>
              <Package size={36} color="#ea580c" style={{ margin: '0 auto 8px', display: 'block' }} />
              <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#9a3412' }}>
                No Products Found in Catalog
              </p>
              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#c2410c' }}>
                You have not added any products/materials yet. Please add materials in the Product Master before creating a quotation.
              </p>
              <button
                type="button"
                onClick={() => navigate('/products/add')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Add Product to Catalog
              </button>
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              {items.map((it, idx) => {
                const itemTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);
                const itemCost = (parseFloat(it.quantity) || 0) * (parseFloat(it.purchasePrice) || 0);
                const itemMargin = itemTotal - itemCost;

                return (
                  <div key={idx} style={styles.mobileItemCard}>
                    <div style={styles.mobileItemHeader}>
                      <span style={styles.itemBadge}>Material #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          style={styles.trashBtn}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      )}
                    </div>

                    <label style={styles.label}>Material Name</label>
                    <select
                      value={it.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      style={styles.select}
                    >
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.SKU ? `(${p.SKU})` : ''}
                        </option>
                      ))}
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                      <div>
                        <label style={styles.label}>Unit</label>
                        <select
                          value={it.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          style={styles.select}
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={styles.label}>Quantity</label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: userIsAdmin ? '1fr 1fr' : '1fr', gap: 10, marginTop: 8 }}>
                      <div>
                        <label style={styles.label}>Offered Rate (₹/{it.unit}) *</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          style={{ ...styles.input, fontWeight: 700, color: '#0f172a' }}
                        />
                      </div>

                      {userIsAdmin && (
                        <div>
                          <label style={styles.label}>Cost (₹/{it.unit})</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={it.purchasePrice}
                            onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                            style={{ ...styles.input, color: '#64748b' }}
                          />
                        </div>
                      )}
                    </div>

                    <div style={styles.mobileItemSummary}>
                      <span>Item Total: <strong>₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                      {userIsAdmin && (
                        <span style={{ color: itemMargin >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          Est Margin: ₹{itemMargin.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px' }}>Material</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', width: '130px' }}>Unit</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', width: '100px' }}>Quantity</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', width: '130px' }}>Offered Rate (₹)</th>
                    {userIsAdmin && (
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', width: '110px' }}>Cost (₹)</th>
                    )}
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', width: '130px' }}>Item Total</th>
                    <th style={{ padding: '10px 12px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const itemTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={it.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            style={styles.tableSelect}
                          >
                            {productsList.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.SKU ? `(${p.SKU})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={it.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            style={styles.tableSelect}
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            style={styles.qtyInput}
                          />
                        </td>

                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            style={styles.rateInput}
                          />
                        </td>

                        {userIsAdmin && (
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={it.purchasePrice}
                              onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                              style={{ ...styles.rateInput, color: '#64748b' }}
                            />
                          </td>
                        )}

                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={styles.trashBtn}
                            disabled={items.length <= 1}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 5: Commercial Terms & Notes */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <FileText size={18} color="#ea580c" />
            <span>Commercial Terms & Notes</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify payment terms, validity restrictions, unloading scope, or delivery conditions..."
              style={styles.textarea}
            />
          </div>
        </div>

        {/* Summary & Submit Box */}
        <div style={{
          ...styles.summaryBar,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          padding: isMobile ? '16px 14px' : '16px 22px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Quotation Estimate</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
              ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {userIsAdmin && (
              <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 700 }}>
                Est. Profit Margin: ₹{totals.margin.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
              opacity: (submitting || isCreationDisabled || productsList.length === 0 || items.length === 0) ? 0.6 : 1,
              cursor: (submitting || isCreationDisabled || productsList.length === 0 || items.length === 0) ? 'not-allowed' : 'pointer',
            }}
            disabled={submitting || isCreationDisabled || productsList.length === 0 || items.length === 0}
            title={isCreationDisabled ? disabledMessage : undefined}
          >
            {submitting ? (
              <span>Saving Quotation...</span>
            ) : productsList.length === 0 ? (
              <span>No Products Available in Catalog</span>
            ) : (
              <>
                <Send size={18} />
                <span>Create & Send Quotation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '12px 6px 80px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    width: '100%',
    overflowX: 'hidden',
  },
  topBar: {
    marginBottom: '20px',
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
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subTitle: {
    fontSize: '12px',
    color: '#ea580c',
    fontWeight: 700,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#b91c1c',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    boxSizing: 'border-box',
    width: '100%',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  toggleWrapper: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '3px',
    gap: '2px',
  },
  toggleActive: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toggleInactive: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: 'none',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  addItemBtn: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12.5px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  tableWrapper: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    width: '100%',
    boxSizing: 'border-box',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableSelect: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12.5px',
    backgroundColor: '#ffffff',
  },
  qtyInput: {
    width: '70px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'center',
  },
  rateInput: {
    width: '100px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'right',
  },
  trashBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 4,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box',
    width: '100%',
  },
  mobileItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  itemBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  mobileItemSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px dashed #cbd5e1',
    fontSize: '12.5px',
    flexWrap: 'wrap',
    gap: '6px',
  },
  summaryBar: {
    backgroundColor: '#ffffff',
    border: '1.5px solid #fed7aa',
    borderRadius: '14px',
    padding: '16px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.08)',
    flexWrap: 'wrap',
    gap: '14px',
    boxSizing: 'border-box',
    width: '100%',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14.5px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
  },
};
