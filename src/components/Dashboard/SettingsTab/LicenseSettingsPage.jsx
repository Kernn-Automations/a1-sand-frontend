import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Users,
  FileText,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Search,
  Plus,
  Server,
  Zap,
  Check,
  X,
  ExternalLink,
  Printer,
  ChevronRight,
  Sparkles,
  Lock,
  Link2,
  Unlink,
  Sliders,
} from "lucide-react";
import "./LicenseSettingsPage.css";

export default function LicenseSettingsPage() {
  const token = localStorage.getItem("accessToken");
  const storedUserRaw = localStorage.getItem("user");
  const user = JSON.parse(storedUserRaw || "{}");

  // Check if current user is Super Admin
  const checkIsSuperAdmin = (u) => {
    if (!u) return false;
    const rolesList = [];
    if (Array.isArray(u.roles)) {
      u.roles.forEach((r) => {
        if (typeof r === "string") rolesList.push(r.toLowerCase().trim());
        else if (r && r.name) rolesList.push(String(r.name).toLowerCase().trim());
        else if (r && r.role) rolesList.push(String(r.role).toLowerCase().trim());
      });
    }
    if (u.role) rolesList.push(String(u.role).toLowerCase().trim());
    return rolesList.some(
      (r) => r === "super admin" || r === "super_admin" || r === "superadmin"
    );
  };

  const isSuperAdminUser = checkIsSuperAdmin(user);

  // Mode: "company" for standard license management, "superadmin" for super admin controls
  const [currentMode, setCurrentMode] = useState("company");

  // Company tabs: "plans", "seats", "invoices"
  const [companyTab, setCompanyTab] = useState("plans");

  // Super Admin tabs: "connection", "packages", "manual"
  const [superAdminTab, setSuperAdminTab] = useState("connection");

  // State
  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState(null);
  const [plans, setPlans] = useState([]);
  const [employeeSeats, setEmployeeSeats] = useState({ total: 50, assigned: 0, available: 50 });
  const [employeesList, setEmployeesList] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [taxInvoices, setTaxInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Actions state
  const [offlineKey, setOfflineKey] = useState("");
  const [processingOfflineKey, setProcessingOfflineKey] = useState(false);
  const [processingSeatAction, setProcessingSeatAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Super Admin state
  const [allPackages, setAllPackages] = useState([]);
  const [handshakeStatus, setHandshakeStatus] = useState(null);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [connectingHandshake, setConnectingHandshake] = useState(false);
  const [disconnectingHandshake, setDisconnectingHandshake] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [manualConfigForm, setManualConfigForm] = useState({
    apiKey: "",
    webhookSecret: "",
    callbackUrl: "",
    orchestratorUrl: "",
  });
  const [savingManualConfig, setSavingManualConfig] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [packageFormData, setPackageFormData] = useState({
    package_code: "",
    name: "",
    description: "",
    billing_cycle: "annual",
    price_rupees: 10000,
    included_seats: 50,
  });
  const [manualLicenseForm, setManualLicenseForm] = useState({
    planId: "MONTHLY_PRO",
    durationMonths: 1,
    notes: "",
  });
  const [issuingManualLicense, setIssuingManualLicense] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadAllLicenseData();
  }, []);

  // Auto-dismiss status message after 5 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const loadAllLicenseData = async () => {
    try {
      setLoading(true);

      const [statusRes, plansRes, seatsRes, invoicesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/license/status`, { headers: authHeaders }),
        axios.get(`${API_URL}/license/plans`, { headers: authHeaders }),
        axios.get(`${API_URL}/license/employees`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/licensing/invoices`, { headers: authHeaders }),
      ]);

      if (statusRes.status === "fulfilled" && statusRes.value.data?.success) {
        const d = statusRes.value.data.data;
        setLicense(d);
        if (d.seats) setEmployeeSeats(d.seats);
      }

      if (plansRes.status === "fulfilled" && plansRes.value.data?.success) {
        setPlans(plansRes.value.data.plans || []);
      }

      if (seatsRes.status === "fulfilled" && seatsRes.value.data?.success) {
        setEmployeeSeats(seatsRes.value.data.seats || { total: 50, assigned: 0, available: 50 });
        setEmployeesList(seatsRes.value.data.employees || []);
      }

      if (invoicesRes.status === "fulfilled" && invoicesRes.value.data?.success) {
        setTaxInvoices(invoicesRes.value.data.invoices || []);
      }

      if (isSuperAdminUser) {
        loadSuperAdminData();
      }
    } catch (err) {
      console.error("Error loading license data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdminData = async () => {
    try {
      const [packagesRes, handshakeRes] = await Promise.allSettled([
        axios.get(`${API_URL}/license/packages`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/licensing/handshake/status`, { headers: authHeaders }),
      ]);

      if (packagesRes.status === "fulfilled" && packagesRes.value.data?.success) {
        setAllPackages(packagesRes.value.data.packages || []);
      }
      if (handshakeRes.status === "fulfilled" && handshakeRes.value.data?.success) {
        setHandshakeStatus(handshakeRes.value.data);
      }
    } catch (e) {
      console.error("Error loading super admin data:", e);
    }
  };

  // Initiate Online Order Checkout
  const handleCheckout = async (planId, billingCycle = "monthly") => {
    try {
      setStatusMessage({ type: "info", text: "Connecting to payment gateway..." });
      const res = await axios.post(
        `${API_URL}/api/licensing/initiate-order`,
        { planId, billingCycle },
        { headers: authHeaders }
      );

      if (res.data?.status === "paid") {
        setStatusMessage({ type: "success", text: "License activated successfully!" });
        await loadAllLicenseData();
        return;
      }

      if (res.data?.paymentUrl) {
        window.open(res.data.paymentUrl, "_blank");
        setStatusMessage({
          type: "success",
          text: "Payment window opened. Complete payment to activate your license.",
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to initiate payment checkout.",
      });
    }
  };

  // Apply Emergency Offline Key
  const handleApplyOfflineKey = async (e) => {
    e.preventDefault();
    if (!offlineKey.trim()) return;

    try {
      setProcessingOfflineKey(true);
      const res = await axios.post(
        `${API_URL}/license/apply-offline-key`,
        { licenseKey: offlineKey.trim() },
        { headers: authHeaders }
      );

      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "Offline license key verified and activated successfully!" });
        setOfflineKey("");
        await loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Invalid offline license key.",
      });
    } finally {
      setProcessingOfflineKey(false);
    }
  };

  // Assign Seat to Employee
  const handleAssignSeat = async (employeeId) => {
    try {
      setProcessingSeatAction(employeeId);
      const res = await axios.post(
        `${API_URL}/license/employees/assign`,
        { employeeId },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "Staff seat assigned successfully." });
        await loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Could not assign seat.",
      });
    } finally {
      setProcessingSeatAction(null);
    }
  };

  // Revoke Seat from Employee
  const handleRevokeSeat = async (employeeId) => {
    try {
      setProcessingSeatAction(employeeId);
      const res = await axios.post(
        `${API_URL}/license/employees/revoke`,
        { employeeId },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "Staff seat removed." });
        await loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Could not revoke seat.",
      });
    } finally {
      setProcessingSeatAction(null);
    }
  };

  // Super Admin: Connect Server (Initiate Handshake)
  const handleConnectHandshake = async () => {
    try {
      setConnectingHandshake(true);
      const res = await axios.post(
        `${API_URL}/api/licensing/handshake/initiate`,
        { forceOnboard: true },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: res.data.message || "Central Payment Server connected successfully!" });
        await loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Server connection failed.",
      });
      await loadSuperAdminData();
    } finally {
      setConnectingHandshake(false);
    }
  };

  // Super Admin: Disconnect Server
  const handleDisconnectHandshake = async () => {
    if (!window.confirm("Are you sure you want to disconnect from the Central Payment Server? Payment processing will be paused until reconnected.")) {
      return;
    }
    try {
      setDisconnectingHandshake(true);
      const res = await axios.post(
        `${API_URL}/api/licensing/handshake/disconnect`,
        {},
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: res.data.message || "Payment server disconnected successfully." });
        await loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Disconnect failed.",
      });
    } finally {
      setDisconnectingHandshake(false);
    }
  };

  // Super Admin: Refresh Connection (Keep Handshake Alive)
  const handleRefreshHandshake = async () => {
    try {
      setTestingHandshake(true);
      const res = await axios.post(
        `${API_URL}/api/licensing/handshake/initiate`,
        {},
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: res.data.message || "Handshake verified and connection kept alive!" });
        await loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Connection refresh check failed.",
      });
      await loadSuperAdminData();
    } finally {
      setTestingHandshake(false);
    }
  };

  // Super Admin: Open Manual Config Modal
  const handleOpenConfigModal = () => {
    setManualConfigForm({
      apiKey: "",
      webhookSecret: "",
      callbackUrl: handshakeStatus?.callbackUrl || `${API_URL}/licensing/payment-success`,
      orchestratorUrl: handshakeStatus?.orchestratorUrl || "https://payments.kernn.ai",
    });
    setShowConfigModal(true);
  };

  // Super Admin: Save Manual Configuration
  const handleSaveManualConfig = async (e) => {
    e.preventDefault();
    if (!manualConfigForm.apiKey.trim()) {
      setStatusMessage({ type: "error", text: "API Key cannot be empty." });
      return;
    }
    try {
      setSavingManualConfig(true);
      const res = await axios.post(
        `${API_URL}/api/licensing/handshake/credentials`,
        manualConfigForm,
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: res.data.message || "Credentials updated and verified!" });
        setShowConfigModal(false);
        await loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Failed to verify and save credentials.",
      });
    } finally {
      setSavingManualConfig(false);
    }
  };

  // Super Admin: Test Handshake (Legacy alias)
  const handleTestHandshake = handleRefreshHandshake;

  // Super Admin: Toggle Package
  const handleTogglePackage = async (pkgId) => {
    try {
      const res = await axios.patch(
        `${API_URL}/license/packages/${pkgId}/toggle`,
        {},
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "Package status updated." });
        loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Could not update package." });
    }
  };

  // Super Admin: Create Package
  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/license/packages`, packageFormData, {
        headers: authHeaders,
      });
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "New package created successfully." });
        setShowAddPackageModal(false);
        setPackageFormData({
          package_code: "",
          name: "",
          description: "",
          billing_cycle: "annual",
          price_rupees: 10000,
          included_seats: 50,
        });
        loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: err.response?.data?.error || "Failed to create package." });
    }
  };

  // Super Admin: Manual / Zero-cost Activation
  const handleManualActivation = async (e) => {
    e.preventDefault();
    try {
      setIssuingManualLicense(true);
      const res = await axios.post(
        `${API_URL}/api/licensing/zero-invoice`,
        manualLicenseForm,
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "License activated directly for organization!" });
        await loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Manual activation failed.",
      });
    } finally {
      setIssuingManualLicense(false);
    }
  };

  // License Status Helper
  const isNoActiveLicense =
    !license?.isValid ||
    license?.status === "UNLICENSED" ||
    license?.status === "EXPIRED" ||
    license?.status === "LOCKED_OUT" ||
    license?.status === "TAMPERED_LOCKED";

  const isInGrace = Boolean(license?.isInGracePeriod);

  // Filter employees
  const filteredEmployees = employeesList.filter((emp) => {
    const q = employeeSearch.toLowerCase();
    return (
      (emp.name || "").toLowerCase().includes(q) ||
      (emp.employeeCode || "").toLowerCase().includes(q) ||
      (emp.role || "").toLowerCase().includes(q) ||
      (emp.mobile || "").includes(q)
    );
  });

  return (
    <div className="lic-container">
      {/* Top Header */}
      <div className="lic-header">
        <div className="lic-header-left">
          <div className="lic-header-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="lic-header-title">License &amp; Subscriptions</h1>
            <p className="lic-header-subtitle">
              Manage software license, staff login seats, and GST tax billing
            </p>
          </div>
        </div>

        {/* Clean Mode Switcher for Super Admins */}
        {isSuperAdminUser && (
          <div className="lic-mode-toggle">
            <button
              type="button"
              className={`lic-mode-btn ${currentMode === "company" ? "active" : ""}`}
              onClick={() => setCurrentMode("company")}
            >
              <span>Company License</span>
            </button>
            <button
              type="button"
              className={`lic-mode-btn ${currentMode === "superadmin" ? "active" : ""}`}
              onClick={() => setCurrentMode("superadmin")}
            >
              <span>Super Admin Controls</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Status Message Banner */}
      {statusMessage.text && (
        <div className={`lic-alert-banner ${statusMessage.type}`}>
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage({ type: "", text: "" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: COMPANY LICENSE (ADMIN & SUPER ADMIN)
          ========================================================================= */}
      {currentMode === "company" && (
        <>
          {/* Hero Overview Card */}
          <div className={`lic-hero-card ${isNoActiveLicense ? "expired" : "active-sub"}`}>
            <div className="lic-hero-top">
              <div className="lic-hero-status">
                <span
                  className={`lic-status-pill ${
                    isNoActiveLicense ? "expired" : isInGrace ? "grace" : "active"
                  }`}
                >
                  ●{" "}
                  {isNoActiveLicense
                    ? "NO ACTIVE LICENSE"
                    : isInGrace
                    ? "GRACE PERIOD"
                    : "ACTIVE SUBSCRIPTION"}
                </span>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                  License Key:{" "}
                  <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>
                    {license?.licenseKey || "ACM-LIC-UNCONFIGURED"}
                  </strong>
                </span>
              </div>

              {/* Single Hero Action Button */}
              <button
                type="button"
                className="lic-btn-primary"
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => setCompanyTab("plans")}
              >
                <CreditCard size={16} />
                <span>{isNoActiveLicense ? "Buy Software License" : "Renew / Upgrade Plan"}</span>
              </button>
            </div>

            {/* 3 Clear Stat Metrics */}
            <div className="lic-hero-metrics">
              <div className="lic-metric-item">
                <div className="lic-metric-label">Current Plan</div>
                <div className="lic-metric-value">
                  {license?.planName || "No Active Plan"}
                </div>
                <div className="lic-metric-sub">
                  {isNoActiveLicense ? "Subscription expired or not activated" : "Unlimited site transactions"}
                </div>
              </div>

              <div className="lic-metric-item">
                <div className="lic-metric-label">Validity</div>
                <div className="lic-metric-value">
                  {license?.validUntil
                    ? new Date(license.validUntil).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Inactive"}
                </div>
                <div className="lic-metric-sub">
                  {isNoActiveLicense
                    ? "Please renew to avoid lockout"
                    : `${license?.daysRemaining || 0} days remaining`}
                </div>
              </div>

              <div className="lic-metric-item">
                <div className="lic-metric-label">Staff User Seats</div>
                <div className="lic-metric-value">
                  {employeeSeats.assigned} / {employeeSeats.total}
                </div>
                <div className="lic-metric-sub">
                  {employeeSeats.available} seats currently available
                </div>
              </div>
            </div>
          </div>

          {/* Simple Tab Navigation */}
          <div className="lic-tabs-bar">
            <button
              type="button"
              className={`lic-tab-btn ${companyTab === "plans" ? "active" : ""}`}
              onClick={() => setCompanyTab("plans")}
            >
              <CreditCard size={17} />
              <span>Subscription Plans</span>
            </button>

            <button
              type="button"
              className={`lic-tab-btn ${companyTab === "seats" ? "active" : ""}`}
              onClick={() => setCompanyTab("seats")}
            >
              <Users size={17} />
              <span>Staff Seats ({employeeSeats.assigned}/{employeeSeats.total})</span>
            </button>

            <button
              type="button"
              className={`lic-tab-btn ${companyTab === "invoices" ? "active" : ""}`}
              onClick={() => setCompanyTab("invoices")}
            >
              <FileText size={17} />
              <span>Tax Invoices</span>
            </button>
          </div>

          {/* TAB 1: PLANS & PRICING */}
          {companyTab === "plans" && (
            <div>
              <div className="lic-plans-grid">
                {plans.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className={`lic-plan-card ${p.popular ? "popular" : ""}`}
                    >
                      {p.popular && <span className="lic-popular-badge">Best Value</span>}
                      <div>
                        <h3 className="lic-plan-name">{p.name}</h3>
                        <div className="lic-plan-price">
                          ₹{p.priceRupees?.toLocaleString("en-IN")}
                          <span> / {p.billingCycle || "month"}</span>
                        </div>
                        <ul className="lic-plan-features">
                          <li>
                            <Check size={16} color="#16a34a" />
                            <span>{p.includedSeats || 50} Included User Seats</span>
                          </li>
                          <li>
                            <Check size={16} color="#16a34a" />
                            <span>Direct Site &amp; Quarry Transit Dispatch</span>
                          </li>
                          <li>
                            <Check size={16} color="#16a34a" />
                            <span>QR Cryptographic Delivery Challans</span>
                          </li>
                          <li>
                            <Check size={16} color="#16a34a" />
                            <span>Live Weighbridge &amp; Stock Sync</span>
                          </li>
                          <li>
                            <Check size={16} color="#16a34a" />
                            <span>GST Tax Invoices &amp; Reports Export</span>
                          </li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        className="lic-btn-primary"
                        onClick={() => handleCheckout(p.id, p.billingCycle)}
                      >
                        <span>Select &amp; Pay</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Clean Offline Key Box */}
              <div className="lic-offline-box">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <KeyRound size={20} color="#ea580c" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>
                      Have an Emergency Offline License Key?
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      If you received an offline key directly from Kernn Automations, activate it here.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleApplyOfflineKey} className="lic-offline-form">
                  <input
                    type="text"
                    className="lic-input"
                    placeholder="Paste activation key (e.g. ACM-LIC-...)"
                    value={offlineKey}
                    onChange={(e) => setOfflineKey(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={processingOfflineKey}
                    className="lic-btn-outline"
                    style={{ padding: "10px 20px" }}
                  >
                    {processingOfflineKey ? "Validating..." : "Activate Key"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: STAFF SEATS */}
          {companyTab === "seats" && (
            <div className="lic-table-card">
              <div className="lic-table-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                    Employee License Seat Allocations
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Employees require an assigned license seat to log in to the web portal or mobile app.
                  </p>
                </div>

                <div className="lic-search-box">
                  <Search size={16} color="#94a3b8" />
                  <input
                    type="text"
                    className="lic-search-input"
                    placeholder="Search employee..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="lic-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Division</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Seat Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isLicensed = emp.hasLicense;
                        const isActionBusy = processingSeatAction === emp.id;

                        return (
                          <tr key={emp.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{emp.name}</div>
                              <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                {emp.employeeCode} {emp.mobile ? `• ${emp.mobile}` : ""}
                              </div>
                            </td>
                            <td>{emp.role || "Staff"}</td>
                            <td>{emp.division || "General"}</td>
                            <td>
                              {isLicensed ? (
                                <span
                                  style={{
                                    backgroundColor: "#ecfdf5",
                                    color: "#047857",
                                    padding: "3px 8px",
                                    borderRadius: "9999px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  ● Active Seat
                                </span>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: "#f1f5f9",
                                    color: "#64748b",
                                    padding: "3px 8px",
                                    borderRadius: "9999px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  No Seat
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {isLicensed ? (
                                <button
                                  type="button"
                                  disabled={isActionBusy}
                                  className="lic-btn-danger-outline"
                                  onClick={() => handleRevokeSeat(emp.id)}
                                >
                                  {isActionBusy ? "Removing..." : "Remove Seat"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isActionBusy || employeeSeats.available <= 0}
                                  className="lic-btn-outline"
                                  style={{ borderColor: "#ea580c", color: "#ea580c" }}
                                  onClick={() => handleAssignSeat(emp.id)}
                                >
                                  {isActionBusy ? "Assigning..." : "Assign Seat"}
                                </button>
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
          )}

          {/* TAB 3: INVOICES & BILLING */}
          {companyTab === "invoices" && (
            <div className="lic-table-card">
              <div className="lic-table-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                    Paid GST Tax Invoices
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Corporate tax records and payment receipts for software subscriptions.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="lic-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Plan Description</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                          No past billing invoices found.
                        </td>
                      </tr>
                    ) : (
                      taxInvoices.map((inv) => (
                        <tr key={inv.id || inv.invoiceNumber}>
                          <td style={{ fontWeight: 700, fontFamily: "monospace" }}>
                            {inv.invoiceNumber}
                          </td>
                          <td>
                            {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td>{inv.description || "Anjali ERP Software License"}</td>
                          <td style={{ fontWeight: 700 }}>
                            ₹{Number(inv.totalAmount || inv.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor: "#ecfdf5",
                                color: "#047857",
                                padding: "3px 8px",
                                borderRadius: "9999px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              ● PAID
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="lic-btn-outline"
                              onClick={() => setSelectedInvoice(inv)}
                            >
                              <FileText size={14} />
                              <span>View Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          VIEW 2: SUPER ADMIN CONTROLS (SUPER ADMIN ONLY)
          ========================================================================= */}
      {currentMode === "superadmin" && isSuperAdminUser && (
        <>
          {/* Super Admin Navigation Tabs */}
          <div className="lic-tabs-bar">
            <button
              type="button"
              className={`lic-tab-btn ${superAdminTab === "connection" ? "active" : ""}`}
              onClick={() => setSuperAdminTab("connection")}
            >
              <Server size={17} />
              <span>Platform Connection</span>
            </button>

            <button
              type="button"
              className={`lic-tab-btn ${superAdminTab === "packages" ? "active" : ""}`}
              onClick={() => setSuperAdminTab("packages")}
            >
              <Zap size={17} />
              <span>Subscription Packages</span>
            </button>

            <button
              type="button"
              className={`lic-tab-btn ${superAdminTab === "manual" ? "active" : ""}`}
              onClick={() => setSuperAdminTab("manual")}
            >
              <KeyRound size={17} />
              <span>Manual License Issuance</span>
            </button>
          </div>

          {/* SUPER ADMIN TAB 1: CONNECTION */}
          {superAdminTab === "connection" && (() => {
            const isHandshakeConnected =
              handshakeStatus?.status === "ACTIVE" &&
              handshakeStatus?.onboardingStatus === "completed";

            return (
              <div className="lic-hero-card" style={{ borderLeft: "4px solid #ea580c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: 800 }}>
                      Central Payment Server Connection
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      Validates automated communication, webhook security seals, and live renewal triggers.
                    </p>
                  </div>

                  {/* Handshake Action Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {/* Connect Button: Enabled if NOT connected, Disabled if already connected */}
                    <button
                      type="button"
                      disabled={isHandshakeConnected || connectingHandshake}
                      className={isHandshakeConnected ? "lic-btn-secondary" : "lic-btn-primary"}
                      style={{
                        padding: "7px 14px",
                        fontSize: "13px",
                        opacity: isHandshakeConnected ? 0.6 : 1,
                        cursor: isHandshakeConnected ? "not-allowed" : "pointer",
                        width: "auto",
                      }}
                      onClick={handleConnectHandshake}
                      title={isHandshakeConnected ? "Server is already connected & secured" : "Initiate handshake & connect"}
                    >
                      <Link2 size={15} className={connectingHandshake ? "animate-spin" : ""} />
                      <span>{connectingHandshake ? "Connecting..." : isHandshakeConnected ? "Connected" : "Connect Server"}</span>
                    </button>

                    {/* Disconnect Button: Enabled if connected, Disabled if not connected */}
                    <button
                      type="button"
                      disabled={!isHandshakeConnected || disconnectingHandshake}
                      className="lic-btn-outline"
                      style={{
                        padding: "7px 14px",
                        fontSize: "13px",
                        borderColor: isHandshakeConnected ? "#fca5a5" : "#e2e8f0",
                        color: isHandshakeConnected ? "#dc2626" : "#94a3b8",
                        opacity: !isHandshakeConnected ? 0.5 : 1,
                        cursor: !isHandshakeConnected ? "not-allowed" : "pointer",
                      }}
                      onClick={handleDisconnectHandshake}
                      title={!isHandshakeConnected ? "Server is already disconnected" : "Disconnect handshake & clear credentials"}
                    >
                      <Unlink size={15} className={disconnectingHandshake ? "animate-spin" : ""} />
                      <span>{disconnectingHandshake ? "Disconnecting..." : "Disconnect"}</span>
                    </button>

                    {/* Refresh / Keep Handshake Alive */}
                    <button
                      type="button"
                      disabled={testingHandshake}
                      className="lic-btn-outline"
                      style={{ padding: "7px 14px", fontSize: "13px" }}
                      onClick={handleRefreshHandshake}
                      title="Ping payment server and keep connection heartbeat alive"
                    >
                      <RefreshCw size={15} className={testingHandshake ? "animate-spin" : ""} />
                      <span>{testingHandshake ? "Testing..." : "Keep Alive / Refresh"}</span>
                    </button>

                    {/* Manual Configuration Modal Trigger */}
                    <button
                      type="button"
                      className="lic-btn-outline"
                      style={{ padding: "7px 14px", fontSize: "13px" }}
                      onClick={handleOpenConfigModal}
                      title="Configure gateway URL, API keys, and callback settings manually"
                    >
                      <Sliders size={15} />
                      <span>Configure</span>
                    </button>
                  </div>
                </div>

              {/* Live Connection Metrics */}
              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px" }}>
                <div className="lic-metric-item">
                  <div className="lic-metric-label">Status</div>
                  <div
                    className="lic-metric-value"
                    style={{
                      color:
                        handshakeStatus?.status === "ACTIVE" && handshakeStatus?.onboardingStatus === "completed"
                          ? "#16a34a"
                          : handshakeStatus?.onboardingStatus === "challenge_issued"
                          ? "#ea580c"
                          : "#dc2626",
                    }}
                  >
                    {handshakeStatus?.status === "ACTIVE" && handshakeStatus?.onboardingStatus === "completed"
                      ? "● Connected & Secured"
                      : handshakeStatus?.onboardingStatus === "challenge_issued"
                      ? "● Verification Pending"
                      : "● Disconnected"}
                  </div>
                  <div className="lic-metric-sub">
                    Target: {handshakeStatus?.orchestratorUrl || "https://payments.kernn.ai"}
                  </div>
                </div>

                <div className="lic-metric-item">
                  <div className="lic-metric-label">Domain Ownership</div>
                  <div
                    className="lic-metric-value"
                    style={{
                      color: handshakeStatus?.domainVerified ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {handshakeStatus?.domainVerified ? "Verified (SSL Active)" : "Unverified"}
                  </div>
                  <div className="lic-metric-sub" title={handshakeStatus?.domain}>
                    Domain: {handshakeStatus?.domain || "a1-sand-h6a6hpdwbhb7cja9.southindia-01.azurewebsites.net"}
                  </div>
                </div>

                <div className="lic-metric-item">
                  <div className="lic-metric-label">Payment Organization ID</div>
                  <div className="lic-metric-value" style={{ fontSize: "13px", fontFamily: "monospace", color: "#0f172a" }}>
                    {handshakeStatus?.paymentOrganizationId || "Not Registered"}
                  </div>
                  <div className="lic-metric-sub">
                    Tenant Ref: {handshakeStatus?.organizationId || "anjali_constructions_01"}
                  </div>
                </div>

                <div className="lic-metric-item">
                  <div className="lic-metric-label">Gateway Credentials</div>
                  <div className="lic-metric-value" style={{ fontSize: "13px", fontFamily: "monospace", color: "#0f172a" }}>
                    {handshakeStatus?.activeApiKeyPreview || "Not configured"}
                  </div>
                  <div className="lic-metric-sub">
                    {handshakeStatus?.webhookSecretConfigured ? "Webhook Seal: HMAC-SHA256 Active" : "Webhook Seal: Not Set"}
                  </div>
                </div>
              </div>

              {/* Server Webhook & Challenge Endpoints info */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                  color: "#475569",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div>
                  <strong>Live Webhook Callback:</strong>{" "}
                  <code style={{ color: "#ea580c", wordBreak: "break-all" }}>
                    {handshakeStatus?.callbackUrl || "https://a1-sand-h6a6hpdwbhb7cja9.southindia-01.azurewebsites.net/licensing/payment-success"}
                  </code>
                </div>
                <div>
                  <strong>Verification Challenge Endpoint:</strong>{" "}
                  <code style={{ color: "#0284c7" }}>/.well-known/kernn-verification</code>
                </div>
                {handshakeStatus?.lastHandshakeAt && (
                  <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                    Last Verified: {new Date(handshakeStatus.lastHandshakeAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

          {/* SUPER ADMIN TAB 2: PACKAGES */}
          {superAdminTab === "packages" && (
            <div className="lic-table-card">
              <div className="lic-table-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
                    Platform License Packages
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Define the subscription packages available for purchase in the portal.
                  </p>
                </div>

                <button
                  type="button"
                  className="lic-btn-primary"
                  style={{ width: "auto", padding: "8px 16px" }}
                  onClick={() => setShowAddPackageModal(true)}
                >
                  <Plus size={16} />
                  <span>Add Package</span>
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="lic-table">
                  <thead>
                    <tr>
                      <th>Package Code</th>
                      <th>Plan Name</th>
                      <th>Billing Cycle</th>
                      <th>Price (₹)</th>
                      <th>Included Seats</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPackages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {pkg.package_code}
                        </td>
                        <td style={{ fontWeight: 700 }}>{pkg.name}</td>
                        <td style={{ textTransform: "capitalize" }}>{pkg.billing_cycle}</td>
                        <td style={{ fontWeight: 700 }}>
                          ₹{Number(pkg.price_rupees).toLocaleString("en-IN")}
                        </td>
                        <td>{pkg.included_seats} seats</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: pkg.is_active ? "#ecfdf5" : "#f1f5f9",
                              color: pkg.is_active ? "#047857" : "#64748b",
                              padding: "3px 8px",
                              borderRadius: "9999px",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            ● {pkg.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="lic-btn-outline"
                            onClick={() => handleTogglePackage(pkg.id)}
                          >
                            {pkg.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPER ADMIN TAB 3: MANUAL LICENSE ISSUANCE */}
          {superAdminTab === "manual" && (
            <div className="lic-hero-card">
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700 }}>
                Direct / Manual License Issuance
              </h3>
              <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b" }}>
                For on-premises deployment, wire-settlement B2B contracts, or emergency development.
              </p>

              <form onSubmit={handleManualActivation} style={{ maxWidth: "480px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Select Plan Tier:
                  </label>
                  <select
                    className="lic-input"
                    value={manualLicenseForm.planId}
                    onChange={(e) =>
                      setManualLicenseForm({ ...manualLicenseForm, planId: e.target.value })
                    }
                  >
                    <option value="MONTHLY_PRO">Monthly Professional (₹10,000)</option>
                    <option value="ANNUAL_ENTERPRISE">Annual Enterprise (₹99,990)</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Duration (Months):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="lic-input"
                    value={manualLicenseForm.durationMonths}
                    onChange={(e) =>
                      setManualLicenseForm({
                        ...manualLicenseForm,
                        durationMonths: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Reference / Approval Notes:
                  </label>
                  <input
                    type="text"
                    className="lic-input"
                    placeholder="e.g. Wire Transfer Ref #12345"
                    value={manualLicenseForm.notes}
                    onChange={(e) =>
                      setManualLicenseForm({ ...manualLicenseForm, notes: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={issuingManualLicense}
                  className="lic-btn-primary"
                >
                  {issuingManualLicense ? "Activating License..." : "Issue & Activate License"}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODAL 1: VIEW TAX INVOICE MODAL
          ========================================================================= */}
      {selectedInvoice && (
        <div className="lic-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="lic-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lic-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Tax Invoice {selectedInvoice.invoiceNumber}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  GST SAC Code: 997331 (Software Subscription)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="lic-modal-body" style={{ fontSize: "13px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #e2e8f0",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <strong>Supplier:</strong>
                  <div>Kernn Automations Private Limited</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    GSTIN: 36AAFCK1234A1ZP • Hyderabad, TS
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Customer:</strong>
                  <div>Anjali Constructions and Materials</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    GSTIN: 37AAACA0000A1Z5 • Visakhapatnam, AP
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Description:</span>
                  <strong>{selectedInvoice.description || "Anjali ERP Cloud Subscription"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Taxable Value:</span>
                  <span>₹{Number(selectedInvoice.taxableAmount || (selectedInvoice.totalAmount / 1.18).toFixed(2)).toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>CGST (9%) + SGST (9%):</span>
                  <span>₹{Number(selectedInvoice.totalTax || (selectedInvoice.totalAmount - selectedInvoice.totalAmount / 1.18).toFixed(2)).toLocaleString("en-IN")}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1.5px solid #0f172a",
                    fontWeight: 800,
                    fontSize: "15px",
                    color: "#ea580c",
                  }}
                >
                  <span>Total Paid:</span>
                  <span>₹{Number(selectedInvoice.totalAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="lic-modal-footer">
              <button
                type="button"
                className="lic-btn-outline"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                className="lic-btn-primary"
                style={{ width: "auto" }}
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADD PACKAGE MODAL (SUPER ADMIN ONLY)
          ========================================================================= */}
      {showAddPackageModal && (
        <div className="lic-modal-overlay" onClick={() => setShowAddPackageModal(false)}>
          <div className="lic-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lic-modal-header">
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                Create New License Package
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPackageModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePackage}>
              <div className="lic-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Package Code:
                  </label>
                  <input
                    type="text"
                    className="lic-input"
                    placeholder="e.g. QUARTERLY_PRO"
                    value={packageFormData.package_code}
                    onChange={(e) =>
                      setPackageFormData({ ...packageFormData, package_code: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Package Name:
                  </label>
                  <input
                    type="text"
                    className="lic-input"
                    placeholder="e.g. Quarterly Growth Plan"
                    value={packageFormData.name}
                    onChange={(e) =>
                      setPackageFormData({ ...packageFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                      Billing Cycle:
                    </label>
                    <select
                      className="lic-input"
                      value={packageFormData.billing_cycle}
                      onChange={(e) =>
                        setPackageFormData({ ...packageFormData, billing_cycle: e.target.value })
                      }
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                      Price (₹):
                    </label>
                    <input
                      type="number"
                      className="lic-input"
                      value={packageFormData.price_rupees}
                      onChange={(e) =>
                        setPackageFormData({ ...packageFormData, price_rupees: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Included Staff Seats:
                  </label>
                  <input
                    type="number"
                    className="lic-input"
                    value={packageFormData.included_seats}
                    onChange={(e) =>
                      setPackageFormData({ ...packageFormData, included_seats: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="lic-modal-footer">
                <button
                  type="button"
                  className="lic-btn-outline"
                  onClick={() => setShowAddPackageModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="lic-btn-primary" style={{ width: "auto" }}>
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CONFIGURE CREDENTIALS MODAL (SUPER ADMIN ONLY)
          ========================================================================= */}
      {showConfigModal && (
        <div className="lic-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="lic-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <div className="lic-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Manual Gateway Configuration
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Configure Central Payment Server URLs and credentials manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualConfig}>
              <div className="lic-modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Central Payment Orchestrator URL:
                  </label>
                  <input
                    type="url"
                    className="lic-input"
                    placeholder="https://payments.kernn.ai"
                    value={manualConfigForm.orchestratorUrl}
                    onChange={(e) =>
                      setManualConfigForm({ ...manualConfigForm, orchestratorUrl: e.target.value })
                    }
                    required
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Target host where orders are created and checkout sessions run.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Organization API Key:
                  </label>
                  <input
                    type="password"
                    className="lic-input"
                    placeholder="Enter API key issued by Central Payment Server"
                    value={manualConfigForm.apiKey}
                    onChange={(e) =>
                      setManualConfigForm({ ...manualConfigForm, apiKey: e.target.value })
                    }
                    required
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Secret key used in <code>x-api-key</code> headers for authenticated order creation.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    HMAC Webhook Secret:
                  </label>
                  <input
                    type="password"
                    className="lic-input"
                    placeholder="Enter HMAC-SHA256 signature secret"
                    value={manualConfigForm.webhookSecret}
                    onChange={(e) =>
                      setManualConfigForm({ ...manualConfigForm, webhookSecret: e.target.value })
                    }
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Used to verify cryptographically signed callbacks from the payment server.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "4px" }}>
                    Server Callback URL:
                  </label>
                  <input
                    type="url"
                    className="lic-input"
                    placeholder="https://.../licensing/payment-success"
                    value={manualConfigForm.callbackUrl}
                    onChange={(e) =>
                      setManualConfigForm({ ...manualConfigForm, callbackUrl: e.target.value })
                    }
                  />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Endpoint where Central Payment Server delivers payment success webhooks.
                  </span>
                </div>
              </div>

              <div className="lic-modal-footer">
                <button
                  type="button"
                  className="lic-btn-outline"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManualConfig}
                  className="lic-btn-primary"
                  style={{ width: "auto" }}
                >
                  {savingManualConfig ? "Verifying & Saving..." : "Save & Verify Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
