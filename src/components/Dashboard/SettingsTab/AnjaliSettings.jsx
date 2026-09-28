import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Settings, 
  Shield, 
  CreditCard, 
  Percent, 
  Building, 
  Save, 
  CheckCircle, 
  Lock,
  FileCheck,
  Landmark,
  FileText,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  KeyRound
} from 'lucide-react';
import { isAdmin, isSuperAdmin } from '../../../utils/roleUtils';
import acmLogo from '../../../images/acm-logo.png';

export default function AnjaliSettings() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = isAdmin(user);
  const userIsSuperAdmin = isSuperAdmin(user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Operational settings
  const [requireFullPayment, setRequireFullPayment] = useState(true);
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState('0');
  const [smsServiceEnabled, setSmsServiceEnabled] = useState(true);
  const [togglingSms, setTogglingSms] = useState(false);

  // Organization Legal Details
  const [org, setOrg] = useState({
    legalName: 'Anjali Constructions and Materials',
    tradeName: 'Anjali Constructions',
    gstin: '',
    pan: '',
    cin: '',
    registeredAddress: 'Sy. No. 120/A, Quarry Road, Main Yard',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    contactPhone: '+91 98765 43210',
    contactEmail: 'contact@anjaliconstructions.com',
    bankName: 'State Bank of India',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    termsAndConditions: '1. Weight and measurement taken at our weighbridge/loading yard is final.\n2. Payment strictly due as per agreed terms.\n3. Goods once dispatched and accepted at site cannot be returned.',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [generalRes, orgRes] = await Promise.allSettled([
        axios.get(`${API_URL}/settings/all`, { headers }),
        axios.get(`${API_URL}/settings/organization`, { headers }),
      ]);

      if (generalRes.status === 'fulfilled' && generalRes.value.data?.success) {
        const s = generalRes.value.data.settings || {};
        if (s.require_full_payment_for_invoice !== undefined) {
          setRequireFullPayment(s.require_full_payment_for_invoice);
        }
        if (s.enable_tax !== undefined) {
          setEnableTax(s.enable_tax);
        }
        if (s.default_tax_rate !== undefined) {
          setTaxRate(String(s.default_tax_rate));
        }
        if (s.smsServiceEnabled !== undefined) {
          setSmsServiceEnabled(s.smsServiceEnabled === true || s.smsServiceEnabled === 'true');
        }
      }

      if (orgRes.status === 'fulfilled' && orgRes.value.data?.success && orgRes.value.data.data) {
        setOrg((prev) => ({ ...prev, ...orgRes.value.data.data }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (field, val) => {
    setOrg((prev) => ({ ...prev, [field]: val }));
  };

  const handleToggleSms = async () => {
    if (!userIsSuperAdmin) {
      alert('Only Super Admin can modify SMS Gateway settings.');
      return;
    }

    try {
      setTogglingSms(true);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(
        `${API_URL}/auth/sms`,
        { enabled: !smsServiceEnabled },
        { headers }
      );
      if (res.data?.success || res.status === 200) {
        setSmsServiceEnabled(res.data.smsServiceEnabled);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle SMS service');
    } finally {
      setTogglingSms(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!userIsAdmin) {
      alert('Only administrators can modify system settings.');
      return;
    }

    try {
      setSaving(true);
      setSavedSuccess(false);
      const headers = { Authorization: `Bearer ${token}` };

      // Save both general controls and organization legal details
      const generalPayload = {
        require_full_payment_for_invoice: requireFullPayment,
        enable_tax: enableTax,
        default_tax_rate: parseFloat(taxRate) || 0,
        company_name: org.legalName,
        company_phone: org.contactPhone,
        company_address: org.registeredAddress,
      };

      if (userIsSuperAdmin) {
        generalPayload.smsServiceEnabled = smsServiceEnabled;
      }

      await Promise.all([
        axios.put(`${API_URL}/settings/all`, generalPayload, { headers }),
        axios.put(`${API_URL}/settings/organization`, org, { headers }),
      ]);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
        <p>Loading Organization Settings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={24} color="#ea580c" />
          </div>
          <div>
            <h1 style={styles.title}>Company & Document Settings</h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              Official brand identity, legal credentials, and document printing declarations
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div style={styles.successBanner}>
          <CheckCircle size={20} style={{ marginRight: 10, flexShrink: 0 }} />
          <span>Organization legal details and settings updated successfully! All future invoices and delivery challans will reflect these changes.</span>
        </div>
      )}

      {/* License & Gateway Quick Card */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: 14,
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
          boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: 'rgba(234, 88, 12, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={22} color="#ea580c" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>
              Dynamic System Licensing & Central Payments Gateway
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 2 }}>
              Configure subscription pricing, grace periods, lockout enforcement policies, and automated Razorpay renewals.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/settings/license')}
          style={{
            backgroundColor: '#ea580c',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
          }}
        >
          <span>Manage License</span>
          <span style={{ fontSize: 16 }}>&rarr;</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} style={styles.form}>
        {/* 1. Official Brand Identity & Logo Preview */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Building size={20} color="#ea580c" />
            <h3 style={styles.cardTitle}>Official Company Brand & Logo</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '8px 0' }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 14,
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                padding: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={acmLogo}
                alt="Official Anjali Constructions Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  acm-logo.png
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 20 }}>
                  Active Official Document Logo
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                This high-resolution logo is embedded directly into printed Invoices, Delivery Challans, Weighbridge Slips, and official PDF statements.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Organization Legal & Registration Credentials */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FileCheck size={20} color="#ea580c" />
            <h3 style={styles.cardTitle}>Legal Credentials & Tax Registration</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
            These legal details appear on printouts and tax receipts for official and statutory compliance.
          </p>

          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Company Legal Name</label>
              <input
                type="text"
                value={org.legalName}
                onChange={(e) => handleOrgChange('legalName', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="Anjali Constructions and Materials"
                required
              />
            </div>

            <div>
              <label style={styles.label}>Trade / Display Name</label>
              <input
                type="text"
                value={org.tradeName}
                onChange={(e) => handleOrgChange('tradeName', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="Anjali Constructions"
              />
            </div>

            <div>
              <label style={styles.label}>GSTIN (GST Identification Number)</label>
              <input
                type="text"
                value={org.gstin}
                onChange={(e) => handleOrgChange('gstin', e.target.value.toUpperCase())}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="e.g. 36AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label style={styles.label}>PAN Number</label>
              <input
                type="text"
                value={org.pan}
                onChange={(e) => handleOrgChange('pan', e.target.value.toUpperCase())}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="e.g. AAAAA0000A"
              />
            </div>

            <div>
              <label style={styles.label}>CIN / Registration No. (Optional)</label>
              <input
                type="text"
                value={org.cin}
                onChange={(e) => handleOrgChange('cin', e.target.value.toUpperCase())}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="Corporate Identity / Enterprise No."
              />
            </div>

            <div>
              <label style={styles.label}>Official Contact Phone</label>
              <input
                type="text"
                value={org.contactPhone}
                onChange={(e) => handleOrgChange('contactPhone', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={styles.label}>Official Billing Email</label>
            <input
              type="email"
              value={org.contactEmail}
              onChange={(e) => handleOrgChange('contactEmail', e.target.value)}
              disabled={!userIsAdmin}
              style={styles.input}
              placeholder="billing@anjaliconstructions.com"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={styles.label}>Registered Office & Quarry Yard Address</label>
            <textarea
              value={org.registeredAddress}
              onChange={(e) => handleOrgChange('registeredAddress', e.target.value)}
              disabled={!userIsAdmin}
              rows={2}
              style={styles.textarea}
              placeholder="Survey No, Quarry Main Road, Near Weighbridge"
            />
          </div>

          <div style={styles.grid3}>
            <div>
              <label style={styles.label}>City / District</label>
              <input
                type="text"
                value={org.city}
                onChange={(e) => handleOrgChange('city', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="City"
              />
            </div>
            <div>
              <label style={styles.label}>State</label>
              <input
                type="text"
                value={org.state}
                onChange={(e) => handleOrgChange('state', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="State"
              />
            </div>
            <div>
              <label style={styles.label}>Pincode</label>
              <input
                type="text"
                value={org.pincode}
                onChange={(e) => handleOrgChange('pincode', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="500001"
              />
            </div>
          </div>
        </div>

        {/* 3. Bank Payment Wire Details */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Landmark size={20} color="#ea580c" />
            <h3 style={styles.cardTitle}>Bank Payment Details (Printed on Invoices)</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
            Instructs contractors and builders where to wire NEFT, RTGS, and IMPS payments.
          </p>

          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Bank Name</label>
              <input
                type="text"
                value={org.bankName}
                onChange={(e) => handleOrgChange('bankName', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="e.g. State Bank of India"
              />
            </div>

            <div>
              <label style={styles.label}>Bank Account Number</label>
              <input
                type="text"
                value={org.bankAccountNo}
                onChange={(e) => handleOrgChange('bankAccountNo', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="e.g. 123456789012"
              />
            </div>

            <div>
              <label style={styles.label}>IFSC Code</label>
              <input
                type="text"
                value={org.bankIfsc}
                onChange={(e) => handleOrgChange('bankIfsc', e.target.value.toUpperCase())}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="e.g. SBIN0001234"
              />
            </div>

            <div>
              <label style={styles.label}>Branch Name</label>
              <input
                type="text"
                value={org.bankBranch}
                onChange={(e) => handleOrgChange('bankBranch', e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
                placeholder="e.g. Industrial Area Branch"
              />
            </div>
          </div>
        </div>

        {/* 4. Terms & Conditions and Legal Declarations */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FileText size={20} color="#ea580c" />
            <h3 style={styles.cardTitle}>Document Terms & Conditions</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 10px 0' }}>
            These legal disclaimers appear at the foot of every printed Tax Invoice, Quotation, and Delivery Challan.
          </p>

          <textarea
            value={org.termsAndConditions}
            onChange={(e) => handleOrgChange('termsAndConditions', e.target.value)}
            disabled={!userIsAdmin}
            rows={4}
            style={styles.textarea}
            placeholder="1. Weight and measurement taken at our weighbridge/yard is final..."
          />
        </div>

        {/* 5. Invoicing & Operational Controls */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <CreditCard size={20} color="#ea580c" />
            <h3 style={styles.cardTitle}>Invoicing & Operational Rules</h3>
          </div>

          <div style={styles.toggleRow}>
            <div>
              <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                Require Full Payment Before Invoice Conversion
              </strong>
              <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0 0' }}>
                When enabled, sales orders cannot be closed and converted to a final invoice until the contractor balance is ₹0.
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireFullPayment}
              onChange={(e) => setRequireFullPayment(e.target.checked)}
              disabled={!userIsAdmin}
              style={styles.toggleCheckbox}
            />
          </div>

          <div style={{ ...styles.toggleRow, borderTop: '1px solid #f1f5f9', marginTop: 10, paddingTop: 10 }}>
            <div>
              <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                Enable GST / Tax Levying
              </strong>
              <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0 0' }}>
                Toggle when charging applicable GST on materials dispatches.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enableTax}
              onChange={(e) => setEnableTax(e.target.checked)}
              disabled={!userIsAdmin}
              style={styles.toggleCheckbox}
            />
          </div>

          {enableTax && (
            <div style={{ marginTop: 14 }}>
              <label style={styles.label}>Default GST Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!userIsAdmin}
                style={styles.input}
              />
            </div>
          )}
        </div>

        {/* 6. SMS Gateway & Passkey Authentication Controls (Super Admin Only) */}
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={20} color="#ea580c" />
              <h3 style={styles.cardTitle}>SMS Gateway & Passkey Authentication</h3>
            </div>
            {userIsSuperAdmin ? (
              <span style={{ fontSize: 11, fontWeight: 800, background: '#ffedd5', color: '#c2410c', padding: '3px 10px', borderRadius: 20 }}>
                Super Admin Exclusive Control
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} /> Managed by Super Admin
              </span>
            )}
          </div>

          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Control MSG91 SMS OTP dispatch for logins and notifications. Disabling SMS cuts recurring SMS OTP costs by 100%. Employees can instantly log in using their 4-digit Passkey.
          </p>

          <div style={{
            background: smsServiceEnabled ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${smsServiceEnabled ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            borderRadius: 12,
            padding: '16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: smsServiceEnabled ? '#15803d' : '#b91c1c'
                }}>
                  {smsServiceEnabled ? '🟢 SMS Service is ENABLED' : '🛑 SMS Service is DISABLED (Passkey Only)'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: 520, lineHeight: 1.4 }}>
                {smsServiceEnabled
                  ? 'MSG91 gateway sends SMS OTPs for every user login attempt.'
                  : 'SMS OTP dispatch is suppressed to save telecom fees. Regular employees log in with their secure Passkey. Super Admin automatically bypasses this restriction and continues receiving SMS.'}
              </p>
            </div>

            {userIsSuperAdmin ? (
              <button
                type="button"
                onClick={handleToggleSms}
                disabled={togglingSms}
                style={{
                  backgroundColor: smsServiceEnabled ? '#ef4444' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: togglingSms ? 'not-allowed' : 'pointer',
                  opacity: togglingSms ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <MessageSquare size={16} />
                <span>{togglingSms ? 'Updating...' : smsServiceEnabled ? 'Disable SMS Service' : 'Enable SMS Service'}</span>
              </button>
            ) : (
              <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                Contact Super Admin to modify SMS settings.
              </div>
            )}
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: '12px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <KeyRound size={18} color="#ea580c" style={{ flexShrink: 0 }} />
            <div>
              <strong>Super Admin SMS Bypass:</strong> Super Admin logins are exempted from the SMS block. If Super Admin requests a login OTP, the SMS is dispatched even when the service is globally disabled.
            </div>
          </div>
        </div>

        {/* Save Button */}
        {userIsAdmin && (
          <div style={{ padding: '12px 0 60px 0' }}>
            <button
              type="submit"
              disabled={saving}
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
            >
              <Save size={18} style={{ marginRight: 8 }} />
              {saving ? 'Saving Legal Details...' : 'Save Organization Details'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 920,
    margin: '0 auto',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '24px 20px',
    fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '14px 18px',
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #bbf7d0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  toggleCheckbox: {
    width: 22,
    height: 22,
    accentColor: '#ea580c',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    fontSize: 13.5,
    boxSizing: 'border-box',
    outline: 'none',
    color: '#0f172a',
    fontWeight: 500,
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid #cbd5e1',
    fontSize: 13.5,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#0f172a',
    lineHeight: 1.5,
  },
  saveBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(234, 88, 12, 0.35)',
    transition: 'background-color 0.15s ease',
  },
};
