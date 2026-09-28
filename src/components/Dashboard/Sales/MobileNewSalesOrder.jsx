import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  Send,
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { isAdmin } from '../../../utils/roleUtils';

const DEFAULT_CONSTRUCTION_PRODUCTS = [
  { id: 10, name: '20mm Metal Aggregate', SKU: 'ACM-20MM', unit: 'brass', basePrice: 3200, purchasePrice: 2600 },
  { id: 11, name: '40mm Metal Aggregate', SKU: 'ACM-40MM', unit: 'brass', basePrice: 2800, purchasePrice: 2300 },
  { id: 12, name: 'River Plastering Sand', SKU: 'ACM-RS-PLAST', unit: 'brass', basePrice: 5500, purchasePrice: 4600 },
  { id: 13, name: 'River Brick Work / Slab Sand', SKU: 'ACM-RS-SLAB', unit: 'brass', basePrice: 4800, purchasePrice: 4000 },
  { id: 14, name: 'Robo Sand / M-Sand', SKU: 'ACM-MSAND', unit: 'brass', basePrice: 3000, purchasePrice: 2400 },
  { id: 15, name: 'Red Clay Brick', SKU: 'ACM-REDBRICK', unit: 'units', basePrice: 9.5, purchasePrice: 7.8 },
];

const UNIT_OPTIONS = [
  { label: 'Brass (100 CFT)', value: 'brass' },
  { label: 'CFT (Cubic Feet)', value: 'cft' },
  { label: 'Tons (MT)', value: 'ton' },
  { label: 'Tipper / Lorry Load', value: 'load' },
  { label: 'Units / Numbers (Bricks)', value: 'units' },
];

export default function MobileNewSalesOrder() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin(user);

  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [productsList, setProductsList] = useState(DEFAULT_CONSTRUCTION_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

  const [warehouseId, setWarehouseId] = useState('');
  
  // Elaborate Drop-Off Site Location States
  const [siteName, setSiteName] = useState('');
  const [plot, setPlot] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('');
  const [remarks, setRemarks] = useState('');

  // Line items state
  const [items, setItems] = useState([
    {
      productId: 10,
      name: '20mm Metal Aggregate',
      unit: 'brass',
      quantity: 1,
      unitPrice: 3200,
      purchasePrice: 2600,
    },
  ]);

  // Initial payment state
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
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
        if (fetched.length > 0) {
          setProductsList(fetched);
        }
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (index, prodId) => {
    const selected = productsList.find((p) => String(p.id) === String(prodId));
    if (!selected) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: selected.id,
      name: selected.name,
      unit: selected.unit || 'brass',
      unitPrice: selected.basePrice || 0,
      purchasePrice: selected.purchasePrice || 0,
    };
    setItems(updated);
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const addItem = () => {
    const firstProd = productsList[0] || DEFAULT_CONSTRUCTION_PRODUCTS[0];
    setItems([
      ...items,
      {
        productId: firstProd.id,
        name: firstProd.name,
        unit: firstProd.unit || 'brass',
        quantity: 1,
        unitPrice: firstProd.basePrice || 0,
        purchasePrice: firstProd.purchasePrice || 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculateTotals = () => {
    let totalSale = 0;
    let totalCost = 0;

    items.forEach((it) => {
      const q = parseFloat(it.quantity) || 0;
      const sp = parseFloat(it.unitPrice) || 0;
      const pp = parseFloat(it.purchasePrice) || 0;

      totalSale += q * sp;
      totalCost += q * pp;
    });

    const profit = totalSale - totalCost;
    const margin = totalSale > 0 ? ((profit / totalSale) * 100).toFixed(1) : 0;

    return {
      totalSale: Math.round(totalSale),
      totalCost: Math.round(totalCost),
      profit: Math.round(profit),
      margin,
    };
  };

  const totals = calculateTotals();

  const getFormattedSite = () => {
    const parts = [
      siteName,
      plot ? `Plot/Sy: ${plot}` : null,
      street,
      area,
      city,
      pincode ? `Pin: ${pincode}` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Project Site Location';
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerPhone) {
      alert('Please enter customer name and phone number');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${API_URL}/customers`,
        {
          name: newCustomerName,
          mobile: newCustomerPhone,
          phone: newCustomerPhone,
          billingAddress: getFormattedSite(),
        },
        { headers }
      );
      const created = res.data?.customer || res.data;
      if (created && created.id) {
        created.mobile = created.mobile || newCustomerPhone;
        created.phone = created.phone || created.mobile || newCustomerPhone;
        setCustomers([created, ...customers]);
        setCustomerId(created.id);
        setIsAddingNewCustomer(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerId && !isAddingNewCustomer) {
      setErrorMsg('Please select or add a customer / contractor');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Please add at least one construction material');
      return;
    }

    try {
      setSubmitting(true);
      const headers = { Authorization: `Bearer ${token}` };

      let selectedCustId = customerId;
      const formattedSite = getFormattedSite();

      if (isAddingNewCustomer && (!selectedCustId || selectedCustId === '')) {
        try {
          const custRes = await axios.post(
            `${API_URL}/customers`,
            {
              name: newCustomerName,
              mobile: newCustomerPhone,
              phone: newCustomerPhone,
              billingAddress: formattedSite,
            },
            { headers }
          );
          selectedCustId = custRes.data?.customer?.id || custRes.data?.id;
        } catch (cErr) {
          console.warn('Customer pre-creation note (backend will auto-resolve):', cErr.message);
        }
      }

      const payload = {
        customerId: selectedCustId || null,
        customerName: isAddingNewCustomer ? newCustomerName : undefined,
        customerPhone: isAddingNewCustomer ? newCustomerPhone : undefined,
        warehouseId: warehouseId || 1,
        siteLocation: formattedSite,
        dropOffDetails: {
          siteName,
          plot,
          street,
          area,
          city,
          pincode,
        },
        remarks,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: parseFloat(it.quantity) || 1,
          unit: it.unit || 'brass',
          unitPrice: parseFloat(it.unitPrice) || 0,
          purchasePrice: parseFloat(it.purchasePrice) || 0,
        })),
        initialPayment: hasInitialPayment && paymentAmount > 0
          ? {
              amount: parseFloat(paymentAmount),
              paymentMode,
              transactionReference: paymentReference,
              transactionDate: new Date(),
            }
          : null,
      };

      const res = await axios.post(`${API_URL}/sales-orders/direct`, payload, { headers });

      if (res.data?.success) {
        setSuccessOrder(res.data.order);
      } else {
        setErrorMsg(res.data?.message || 'Failed to create sales order');
      }
    } catch (err) {
      console.error('Error submitting sales order:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred while creating the order');
    } finally {
      setSubmitting(false);
    }
  };

  const shareViaWhatsApp = (order) => {
    if (!order) return;
    const custName = order.customer?.name || 'Customer';
    const itemsText = order.items
      ?.map((it) => `• ${it.product?.name || 'Material'}: ${it.quantity} ${it.unit} @ ₹${it.unitPrice}`)
      .join('\n');

    const msg = `*ANJALI CONSTRUCTIONS & MATERIALS*\n*Sales Order: ${order.orderNumber}*\n\nCustomer: ${custName}\nVehicle/Truck: ${order.vehicleNumber || 'To be dispatched'}\nDelivery Site: ${order.siteLocation || 'Direct Site'}\n\n*Materials Ordered:*\n${itemsText}\n\n*Total Amount:* ₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}\n*Paid Advance:* ₹${parseFloat(order.paidAmount || 0).toLocaleString('en-IN')}\n*Balance Due:* ₹${parseFloat(order.balanceAmount || 0).toLocaleString('en-IN')}\n*Payment Status:* ${order.paymentStatus}\n\nThank you for your business!`;

    const phone = order.customer?.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  };

  if (successOrder) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successCard}>
          <CheckCircle size={60} color="#16a34a" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#15803d', margin: '0 0 8px 0' }}>
            Order Created Successfully!
          </h2>
          <p style={{ color: '#475569', fontSize: 14, margin: '0 0 20px 0' }}>
            Order #{successOrder.orderNumber} has been confirmed.
          </p>

          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Customer:</span>
              <strong>{successOrder.customer?.name}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Total Payable:</span>
              <strong style={{ color: '#ea580c' }}>₹{parseFloat(successOrder.totalAmount).toLocaleString('en-IN')}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Paid Amount:</span>
              <strong style={{ color: '#16a34a' }}>₹{parseFloat(successOrder.paidAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Remaining Balance:</span>
              <strong style={{ color: '#dc2626' }}>₹{parseFloat(successOrder.balanceAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, width: '100%' }}>
            <button
              onClick={() => navigate(`/sales/orders/${successOrder.id}?action=dispatch`)}
              style={{
                ...styles.viewOrderBtn,
                backgroundColor: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                margin: 0,
              }}
            >
              <Truck size={18} />
              Dispatch Materials (Generate Challan)
            </button>

            <button
              onClick={() => navigate(`/sales/orders/${successOrder.id}`)}
              style={{ ...styles.viewOrderBtn, margin: 0 }}
            >
              View Order Details & History
            </button>

            <button
              onClick={() => shareViaWhatsApp(successOrder)}
              style={{ ...styles.whatsappBtn, margin: 0 }}
            >
              <Send size={18} style={{ marginRight: 8 }} />
              Share Order on WhatsApp
            </button>

            <button
              onClick={() => {
                setSuccessOrder(null);
                setItems([
                  {
                    productId: 10,
                    name: '20mm Metal Aggregate',
                    unit: 'brass',
                    quantity: 1,
                    unitPrice: 3200,
                    purchasePrice: 2600,
                  },
                ]);
                setHasInitialPayment(false);
                setPaymentAmount('');
                setSiteName('');
                setPlot('');
                setStreet('');
                setArea('');
                setPincode('');
              }}
              style={{ ...styles.newOrderBtn, margin: 0 }}
            >
              + Create Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Top Header */}
      <div style={styles.headerBar}>
        <button onClick={() => navigate('/sales')} style={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={styles.headerTitle}>Direct Sales Order</h1>
          <span style={styles.headerSub}>Anjali Constructions & Materials</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} style={styles.formContainer}>
        {errorMsg && (
          <div style={styles.errorBanner}>
            <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={styles.formGrid}>
          {/* LEFT COLUMN: Customer & Drop-off Location Details */}
          <div style={styles.columnLeft}>
            {/* 1. Customer Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <User size={18} color="#ea580c" />
                <h3 style={styles.cardTitle}>Customer Details</h3>
              </div>

              {!isAddingNewCustomer ? (
                <div>
                  <label style={styles.label}>Select Existing Customer</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.mobile || c.phone || 'No contact'})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(true)}
                    style={styles.linkButton}
                  >
                    + Add New Customer / Contractor
                  </button>
                </div>
              ) : (
                <div>
                  <label style={styles.label}>Customer / Contractor Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Reddy (Builder)"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    style={styles.textInput}
                    required
                  />

                  <label style={styles.label}>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    style={styles.textInput}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(false)}
                    style={styles.cancelLink}
                  >
                    Cancel & Select Existing Customer
                  </button>
                </div>
              )}
            </div>

            {/* 2. Elaborate Drop-Off Site Location */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <MapPin size={18} color="#ea580c" />
                <h3 style={styles.cardTitle}>Drop-off Site Location</h3>
              </div>

              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#9a3412', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={16} color="#ea580c" />
                <span>Truck & driver details are entered when dispatching loads.</span>
              </div>

              <label style={styles.label}>Site / Project Name *</label>
              <input
                type="text"
                placeholder="e.g. Sunrise Heights / Villa Construction"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                style={styles.textInput}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={styles.label}>Plot / Survey No.</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 42 / Sy 128"
                    value={plot}
                    onChange={(e) => setPlot(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
                <div>
                  <label style={styles.label}>Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 500084"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <label style={styles.label}>Street / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Beside Water Tank, Pillar 125, Ring Road"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                style={styles.textInput}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={styles.label}>Area / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g. Gachibowli"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
                <div>
                  <label style={styles.label}>City / Mandal</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <label style={styles.label}>Order Remarks / Instructions</label>
              <input
                type="text"
                placeholder="e.g. Deliver between 8 AM - 12 PM"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={styles.textInput}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Materials, Totals, Initial Payment, Submit */}
          <div style={styles.columnRight}>
            {/* 3. Materials / Products Line Items */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <MapPin size={18} color="#ea580c" />
            <h3 style={styles.cardTitle}>Construction Materials</h3>
          </div>

          {items.map((item, idx) => {
            const lineSubtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
            const lineCost = (parseFloat(item.quantity) || 0) * (parseFloat(item.purchasePrice) || 0);
            const lineMargin = lineSubtotal - lineCost;

            return (
              <div key={idx} style={styles.itemRowCard}>
                <div style={styles.itemRowHeader}>
                  <span style={styles.itemBadge}>Material #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  )}
                </div>

                <label style={styles.label}>Material Name</label>
                <select
                  value={item.productId}
                  onChange={(e) => handleProductChange(idx, e.target.value)}
                  style={styles.selectInput}
                >
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={styles.label}>Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      style={styles.selectInput}
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
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      style={styles.textInput}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: userIsAdmin ? '1fr 1fr' : '1fr', gap: 10 }}>
                  <div>
                    <label style={styles.label}>Sale Price (₹/{item.unit}) *</label>
                    <input
                      type="number"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      style={{ ...styles.textInput, fontWeight: 700, color: '#0f172a' }}
                      required
                    />
                  </div>

                  {userIsAdmin && (
                    <div>
                      <label style={styles.label}>
                        Purchase Cost (₹/{item.unit}) <span style={styles.adminTag}>Admin</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={item.purchasePrice}
                        onChange={(e) => handleItemChange(idx, 'purchasePrice', e.target.value)}
                        style={{ ...styles.textInput, backgroundColor: '#f8fafc', color: '#64748b' }}
                      />
                    </div>
                  )}
                </div>

                <div style={styles.lineItemSummary}>
                  <span>Item Subtotal: <strong>₹{lineSubtotal.toLocaleString('en-IN')}</strong></span>
                  {userIsAdmin && (
                    <span style={{ color: lineMargin >= 0 ? '#16a34a' : '#dc2626' }}>
                      Margin: ₹{lineMargin.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addItem}
            style={styles.addMaterialBtn}
          >
            <Plus size={18} style={{ marginRight: 6 }} />
            + Add Another Material
          </button>
        </div>

        {/* 4. Live Financial Overview Card */}
        <div style={styles.totalsCard}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 12px 0', color: '#0f172a' }}>
            Order Financial Overview
          </h3>

          <div style={styles.totalRow}>
            <span>Customer Payable:</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>
              ₹{totals.totalSale.toLocaleString('en-IN')}
            </span>
          </div>

          {userIsAdmin && (
            <>
              <div style={styles.totalRowSecondary}>
                <span>Total Purchase Cost:</span>
                <strong>₹{totals.totalCost.toLocaleString('en-IN')}</strong>
              </div>
              <div style={styles.totalRowSecondary}>
                <span>Estimated Profit:</span>
                <strong style={{ color: totals.profit >= 0 ? '#16a34a' : '#dc2626' }}>
                  ₹{totals.profit.toLocaleString('en-IN')} ({totals.margin}%)
                </strong>
              </div>
            </>
          )}
        </div>

        {/* 5. Initial Payment / Advance Section */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#ea580c" />
              <h3 style={styles.cardTitle}>Advance / Initial Payment</h3>
            </div>
            <input
              type="checkbox"
              checked={hasInitialPayment}
              onChange={(e) => setHasInitialPayment(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#ea580c' }}
            />
          </div>

          {hasInitialPayment && (
            <div style={{ marginTop: 14 }}>
              <label style={styles.label}>Advance Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount paid"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={styles.textInput}
              />

              <label style={styles.label}>Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={styles.selectInput}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="Cheque">Cheque</option>
              </select>

              <label style={styles.label}>UTR / Transaction Reference (Optional)</label>
              <input
                type="text"
                placeholder="e.g. UPI Ref # or Cheque #"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                style={styles.textInput}
              />
            </div>
          )}
        </div>

            {/* Submit Button */}
            <div style={{ padding: '0 0 80px 0' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.submitBtn,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Generating Sales Order...' : `Create Sales Order • ₹${totals.totalSale.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  pageContainer: {
    width: '100%',
    maxWidth: 1300,
    margin: '0 auto',
    backgroundColor: 'transparent',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    borderRadius: '12px 12px 0 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  formContainer: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: 20,
    alignItems: 'start',
  },
  columnLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  columnRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    marginRight: 14,
    padding: 6,
    cursor: 'pointer',
    color: '#334155',
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

  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #fecaca',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 6,
    marginTop: 10,
  },
  adminTag: {
    fontSize: 10,
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '2px 6px',
    borderRadius: 4,
    marginLeft: 6,
  },
  textInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  selectInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1.5px solid #cbd5e1',
    fontSize: 14,
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#ea580c',
    fontSize: 13,
    fontWeight: 700,
    padding: '10px 0 0 0',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cancelLink: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  itemRowCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: 12,
  },
  itemRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
    padding: '3px 8px',
    borderRadius: 6,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  lineItemSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px dashed #cbd5e1',
    fontSize: 12,
  },
  addMaterialBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#fff7ed',
    color: '#ea580c',
    border: '1.5px dashed #ea580c',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  totalsCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    padding: '18px',
    border: '1.5px solid #fed7aa',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    paddingBottom: 8,
    borderBottom: '1px solid #fed7aa',
  },
  totalRowSecondary: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
  },
  successContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: '30px 24px',
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    textAlign: 'left',
    margin: '16px 0 24px 0',
    border: '1px solid #e2e8f0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 14,
  },
  whatsappBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#25d366',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
  },
  viewOrderBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 10,
  },
  newOrderBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
