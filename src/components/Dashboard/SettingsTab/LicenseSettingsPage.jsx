import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  ArrowRight,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  Sliders,
  Sparkles,
  Layers,
  Lock,
  History,
  FileCheck,
  Users,
  UserCheck,
  UserX,
  PlusCircle,
  Printer,
  Search,
  FileText,
  Activity,
  Wifi,
  Server,
  Check,
  X,
  ChevronRight,
  Eye,
  Edit,
  Building2,
  Receipt,
  Download,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Send,
  Trash2,
  Unlink,
  Package,
  Zap,
  Ban,
} from "lucide-react";
import "./LicenseSettingsPage.css";

export const AVAILABLE_LICENSE_FEATURES = [
  {
    key: "direct_drop_inventory",
    name: "Direct Drop & Quarry Transit Dispatch",
    category: "Logistics & Fleet",
    tagline: "Site-to-site quarry dispatch bypassing central yard storage",
    functions:
      "Enables direct delivery of bulk sand and aggregates from crushers and quarries directly to customer construction sites, with real-time transit tracking and automated delivery challans.",
    stops:
      "Direct site dispatches and in-transit challans are blocked. All materials must first be physically unloaded and recorded at a central yard before delivery.",
  },
  {
    key: "payment_receipts",
    name: "Digital Payments & Online Gateway Checkout",
    category: "Finance & Billing",
    tagline: "Automated payment collection & instant digital receipts",
    functions:
      "Enables automated Razorpay online payment checkout (UPI, NetBanking, Cards), customer payment link generation, instant digital payment receipts, and automated ledger settlement.",
    stops:
      "Online checkout links and digital gateway payment receipts are completely disabled. Staff can only record manual offline cash or physical cheque entries.",
  },
  {
    key: "pdf_verification",
    name: "Cryptographic QR Tax Invoices & Delivery Challans",
    category: "Compliance & Security",
    tagline: "Tamper-proof GST tax invoices (SAC 997331) & verification QR",
    functions:
      "Generates official GST-compliant tax invoices, e-way bill ready delivery challans, and tamper-evident PDF documents equipped with verifiable cryptographic QR hash seals.",
    stops:
      "Official PDF generation with cryptographic QR authenticity verification is locked. Invoices and challans will lack verifiable fraud-prevention signatures.",
  },
  {
    key: "reports_export",
    name: "Advanced Financial & Ledger Excel Export",
    category: "Analytics & Reporting",
    tagline: "One-click multi-sheet Excel (.xlsx) & CSV data exports",
    functions:
      "Unlocks one-click data export of sales daybooks, GST tax registers, customer aging summaries, stock turnover audits, and party ledgers directly into Microsoft Excel (.xlsx) and CSV.",
    stops:
      "Export buttons for Excel (.xlsx) and CSV workbooks are disabled. Financial and inventory reports can only be previewed on-screen in browser tables.",
  },
  {
    key: "multi_division",
    name: "Multi-Division & Regional Branch Isolation",
    category: "Operations & Scale",
    tagline: "Independent branches, regional pricing, & state GST isolation",
    functions:
      "Allows operating multiple state or regional branches (e.g., Telangana, Andhra Pradesh, Maharashtra) with independent warehouse stock, localized price lists, and isolated ledgers.",
    stops:
      "System is strictly locked to a single default division. Creating additional regional divisions, multi-branch warehouses, or inter-branch stock transfers is blocked.",
  },
  {
    key: "audit_logs",
    name: "Immutable Regulatory & Security Audit Logs",
    category: "Governance & Security",
    tagline: "Forensic audit trails of price edits, cancellations, & logins",
    functions:
      "Captures complete tamper-evident audit trails of every order revision, price override, indent cancellation, staff login, and administrative setting modification for legal and regulatory compliance.",
    stops:
      "Audit history tracking is restricted to basic summaries. Management and auditors cannot trace who altered prices, deleted orders, or revised weighbridge weights.",
  },
  {
    key: "employee_seat_access",
    name: "Staff Portal & Mobile App Seat Access",
    category: "User Management",
    tagline: "Multi-seat login credentials for sales, yard, & store staff",
    functions:
      "Allocates licensed user login seats across departments, allowing store managers, weighbridge operators, sales reps, and dispatch staff to log in and work simultaneously.",
    stops:
      "Staff logins exceeding the included base seat quota are blocked with license seat-limit lockouts until additional seat add-on packs are purchased.",
  },
];

export const getFeatureMeta = (key) => {
  const found = AVAILABLE_LICENSE_FEATURES.find((f) => f.key === key);
  if (found) return found;
  const cleanName = String(key || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    key,
    name: cleanName || "Custom Feature",
    category: "Custom Module",
    tagline: "Custom entitlement capability",
    functions: `Enables operational capability for ${cleanName}.`,
    stops: `Feature ${cleanName} is deactivated for this package.`,
  };
};

export default function LicenseSettingsPage() {
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Strict check: Super admin options are ONLY shown for accounts explicitly designated as Super Admin.
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
    if (u.role) {
      rolesList.push(String(u.role).toLowerCase().trim());
    }
    return rolesList.some(
      (r) => r === "super admin" || r === "super_admin" || r === "superadmin"
    );
  };

  const isSuperAdminUser = checkIsSuperAdmin(user);

  // Active view: Normal admin is strictly restricted to company_admin
  const [currentMode, setCurrentMode] = useState("company_admin");

  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState(null);
  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Normal Admin State
  const [companyTab, setCompanyTab] = useState("overview"); // 'overview', 'seats', 'invoices'
  const [employeeSeats, setEmployeeSeats] = useState({ total: 50, assigned: 0, available: 50 });
  const [employeesList, setEmployeesList] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all"); // 'all', 'licensed', 'unlicensed'
  const [assigningEmpId, setAssigningEmpId] = useState(null);
  const [taxInvoices, setTaxInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Buy Seats Modal
  const [showBuySeatsModal, setShowBuySeatsModal] = useState(false);

  // Phase 4: Real-time Checkout Polling State
  const [pollingCheckout, setPollingCheckout] = useState({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: null,
    paymentUrl: "",
    planName: "",
    amount: 0,
    attempt: 1,
    status: "waiting", // 'waiting', 'paid', 'timeout', 'cancelled', 'error'
    error: null,
  });
  const pollingTimerRef = useRef(null);

  // Pending Order Conflict Modal
  const [pendingConflict, setPendingConflict] = useState({
    isOpen: false,
    pendingOrder: null,
    targetPlanId: null,
    targetBillingCycle: null,
  });

  // Confetti / Celebration Modal
  const [celebrationData, setCelebrationData] = useState({
    isOpen: false,
    planName: "",
    validUntil: "",
    seats: 0,
    invoiceNumber: "",
  });

  // Super Admin State
  const [superAdminTab, setSuperAdminTab] = useState("handshake"); // 'handshake', 'packages', 'zero_invoice', 'webhooks', 'policy'
  const [handshakeStatus, setHandshakeStatus] = useState(null);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [disconnectingHandshake, setDisconnectingHandshake] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState({ apiKey: "", webhookSecret: "" });
  const [savingCredentials, setSavingCredentials] = useState(false);
  
  // Universal In-App Confirmation Modal State (replaces browser native alerts/confirms)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDanger: true,
    isLoading: false,
    onConfirm: null,
  });

  const showConfirm = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = true,
    onConfirm,
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      isLoading: false,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false, onConfirm: null }));
  };
  const [allPackages, setAllPackages] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageFormData, setPackageFormData] = useState({
    package_code: "",
    name: "",
    description: "",
    billing_cycle: "annual",
    type: "CORE_PLAN",
    price_rupees: 4999,
    included_seats: 50,
    grace_period_days: 7,
    features: ["direct_drop_inventory", "payment_receipts", "pdf_verification", "reports_export"],
    is_popular: false,
  });

  // Super Admin: Zero Invoice Form State
  const [showZeroInvoiceModal, setShowZeroInvoiceModal] = useState(false);
  const [issuingZeroInvoice, setIssuingZeroInvoice] = useState(false);
  const [zeroInvoiceForm, setZeroInvoiceForm] = useState({
    targetOrgId: "anjali_constructions_01",
    planId: "ANNUAL_ENTERPRISE",
    offlineReference: "",
    notes: "",
    durationMonths: 12,
    seats: 0,
  });

  // Super Admin: Webhook Transactions Ledger
  const [transactionsLedger, setTransactionsLedger] = useState([]);
  const [selectedLedgerTx, setSelectedLedgerTx] = useState(null);

  // Policy / Config Form State
  const [configForm, setConfigForm] = useState({
    cost_monthly_rupees: 4999,
    cost_annual_rupees: 49999,
    grace_period_days: 7,
    total_purchased_seats: 50,
    lockout_mode: "HARD",
    reminder_days: "30, 15, 7, 3, 1, 0",
    max_users: 100,
    max_orders_per_month: 10000,
    allowed_features: [],
  });

  const [offlineKey, setOfflineKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadAllLicenseData();
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  // Auto-dismiss status alert banner after 6 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const loadAllLicenseData = async () => {
    try {
      setLoading(true);

      const [statusRes, plansRes, historyRes, seatsRes, invoicesRes] = await Promise.allSettled([
        axios.get(`${API_URL}/license/status`, { headers: authHeaders }),
        axios.get(`${API_URL}/license/plans`, { headers: authHeaders }),
        axios.get(`${API_URL}/license/history`, { headers: authHeaders }),
        axios.get(`${API_URL}/license/employees`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/licensing/invoices`, { headers: authHeaders }),
      ]);

      if (statusRes.status === "fulfilled" && statusRes.value.data?.success) {
        const d = statusRes.value.data.data;
        setLicense(d);
        if (d.seats) setEmployeeSeats(d.seats);
        setConfigForm({
          cost_monthly_rupees: Number(d.costMonthlyPaise || 499900) / 100,
          cost_annual_rupees: Number(d.costAnnualPaise || 4999900) / 100,
          grace_period_days: d.gracePeriodDays || 7,
          total_purchased_seats: d.totalPurchasedSeats || 50,
          lockout_mode: d.lockoutMode === "NONE" ? "HARD" : d.lockoutMode || "HARD",
          reminder_days: [30, 15, 7, 3, 1, 0].join(", "),
          max_users: d.maxUsers || 100,
          max_orders_per_month: d.maxOrdersPerMonth || 10000,
          allowed_features: d.allowedFeatures || [],
        });
      }

      if (plansRes.status === "fulfilled" && plansRes.value.data?.success) {
        setPlans(plansRes.value.data.plans || []);
      }

      if (historyRes.status === "fulfilled" && historyRes.value.data?.success) {
        setTransactions(historyRes.value.data.transactions || []);
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
      console.error("Error loading license:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdminData = async () => {
    try {
      const [packagesRes, webhooksRes, handshakeRes, ledgerRes] = await Promise.allSettled([
        axios.get(`${API_URL}/license/packages`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/payment/webhook-logs`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/licensing/handshake/status`, { headers: authHeaders }),
        axios.get(`${API_URL}/api/licensing/transactions`, { headers: authHeaders }),
      ]);

      if (packagesRes.status === "fulfilled" && packagesRes.value.data?.success) {
        setAllPackages(packagesRes.value.data.packages || []);
      }
      if (webhooksRes.status === "fulfilled" && webhooksRes.value.data?.success) {
        setWebhookLogs(webhooksRes.value.data.logs || []);
      }
      if (handshakeRes.status === "fulfilled" && handshakeRes.value.data?.success) {
        setHandshakeStatus(handshakeRes.value.data);
      }
      if (ledgerRes.status === "fulfilled" && ledgerRes.value.data?.success) {
        setTransactionsLedger(ledgerRes.value.data.transactions || []);
      }
    } catch (e) {
      console.error("Error loading super admin data:", e);
    }
  };

  // =========================================================================
  // 3-TIER CHECKOUT & REAL-TIME POLLING ENGINE (PHASE 2 & PHASE 4)
  // =========================================================================

  const handleInitiateOrderCheckout = async (planId, billingCycle = "annual", force = false) => {
    try {
      setProcessingPayment(true);
      setStatusMessage({ type: "", text: "" });

      const res = await axios.post(
        `${API_URL}/api/licensing/initiate-order`,
        { planId, billingCycle, force },
        { headers: authHeaders }
      );

      const data = res.data;

      // Handle Zero-Amount Instant Fulfillment
      if (data.status === "paid") {
        setStatusMessage({
          type: "success",
          text: "🎉 Zero-cost order fulfilled and license activated immediately!",
        });
        await loadAllLicenseData();
        return;
      }

      const checkoutUrl = data.paymentUrl;
      const invoiceId = data.invoiceId;
      const invoiceNumber = data.invoiceNumber;
      const totalAmount = data.amount;

      // Open Hosted Checkout Window / Tab
      const win = window.open(checkoutUrl, "_blank");
      if (!win) {
        // Fallback popup blocker
        window.location.href = checkoutUrl;
        return;
      }

      // Close buy seats modal if open
      setShowBuySeatsModal(false);
      setPendingConflict({ isOpen: false, pendingOrder: null, targetPlanId: null, targetBillingCycle: null });

      // Enter Real-time Polling state
      startOrderPollingLoop(invoiceId, invoiceNumber, checkoutUrl, planId, totalAmount);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.hasPendingOrder) {
        // Active pending order lockout detected (within 30 mins)
        setPendingConflict({
          isOpen: true,
          pendingOrder: err.response.data.pendingOrder,
          targetPlanId: planId,
          targetBillingCycle: billingCycle,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: "Checkout initiation failed: " + (err.response?.data?.message || err.message),
        });
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const startOrderPollingLoop = (invoiceId, invoiceNumber, paymentUrl, planName, amount) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    setPollingCheckout({
      isOpen: true,
      invoiceId,
      invoiceNumber,
      paymentUrl,
      planName,
      amount,
      attempt: 1,
      status: "waiting",
      error: null,
    });

    let attemptCount = 1;
    const maxAttempts = 40; // 40 x 3s = 120 seconds

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/licensing/invoices/${invoiceId}/status`);
        const statusData = res.data;

        if (statusData?.status === "paid" || statusData?.isPaid) {
          clearInterval(pollingTimerRef.current);
          setPollingCheckout((prev) => ({ ...prev, isOpen: false, status: "paid" }));

          // Show Success Confetti Celebration
          setCelebrationData({
            isOpen: true,
            planName: statusData.license?.planName || planName,
            validUntil: statusData.license?.validUntil,
            seats: statusData.license?.seats?.total || 50,
            invoiceNumber,
          });

          await loadAllLicenseData();
        } else if (statusData?.status === "failed" || statusData?.status === "cancelled") {
          clearInterval(pollingTimerRef.current);
          setPollingCheckout((prev) => ({
            ...prev,
            status: statusData.status,
            error: "Payment was cancelled or rejected.",
          }));
        } else {
          attemptCount++;
          setPollingCheckout((prev) => ({ ...prev, attempt: attemptCount }));

          if (attemptCount >= maxAttempts) {
            clearInterval(pollingTimerRef.current);
            setPollingCheckout((prev) => ({
              ...prev,
              status: "timeout",
              error: "Payment confirmation timed out. You can resume checkout anytime from Invoices.",
            }));
          }
        }
      } catch (err) {
        console.warn("Polling warning:", err.message);
      }
    }, 3000);
  };

  const handleResumePendingOrder = async (invoiceId, paymentUrl, invoiceNumber, amount, planName) => {
    const win = window.open(paymentUrl, "_blank");
    if (!win) {
      window.location.href = paymentUrl;
      return;
    }
    setPendingConflict({ isOpen: false, pendingOrder: null, targetPlanId: null, targetBillingCycle: null });
    startOrderPollingLoop(invoiceId, invoiceNumber, paymentUrl, planName || "Subscription Renewal", amount || 49999);
  };

  const executeCancelPendingOrder = async (invoiceId) => {
    try {
      await axios.post(`${API_URL}/api/licensing/invoices/${invoiceId}/cancel`, {}, { headers: authHeaders });
      setStatusMessage({ type: "success", text: "Pending order cancelled successfully." });
      setPendingConflict({ isOpen: false, pendingOrder: null, targetPlanId: null, targetBillingCycle: null });
      await loadAllLicenseData();
    } catch (err) {
      setStatusMessage({ type: "error", text: "Error cancelling order: " + err.message });
    }
  };

  const handleCancelPendingOrder = (invoiceId, invoiceNumber) => {
    showConfirm({
      title: "Cancel Pending Invoice?",
      message: `Are you sure you want to cancel pending order ${invoiceNumber ? `#${invoiceNumber}` : ""}? Any open checkout session will be invalidated.`,
      confirmText: "Cancel Order",
      cancelText: "Keep Order",
      isDanger: true,
      onConfirm: async () => {
        await executeCancelPendingOrder(invoiceId);
      },
    });
  };

  // Fast developer sandbox payment simulator (calls callback directly)
  const handleSimulatePaymentSuccess = async () => {
    if (!pollingCheckout.invoiceId) return;
    try {
      await axios.post(
        `${API_URL}/licensing/payment-success`,
        {
          event: "payment.captured",
          payment_id: `pay_sandbox_${Date.now()}`,
          order_id: `ord_${Date.now()}`,
          invoice_id: pollingCheckout.invoiceId,
          amount: pollingCheckout.amount,
          amount_paise: Math.round(pollingCheckout.amount * 100),
          plan_id: pollingCheckout.planName,
        },
        { headers: authHeaders }
      );
    } catch (e) {
      console.error("Simulation error:", e);
    }
  };

  // =========================================================================
  // EMPLOYEE SEAT ALLOCATIONS (TENANT ADMIN)
  // =========================================================================

  const handleAssignSeat = async (empId) => {
    try {
      setAssigningEmpId(empId);
      const res = await axios.post(
        `${API_URL}/license/employees/assign`,
        { employeeId: empId },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setEmployeeSeats(res.data.seats);
        setEmployeesList((prev) =>
          prev.map((e) =>
            e.id === empId ? { ...e, hasLicense: true, licenseDetails: res.data.data } : e
          )
        );
        setStatusMessage({ type: "success", text: "License seat assigned successfully." });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to assign seat",
      });
    } finally {
      setAssigningEmpId(null);
    }
  };

  const handleRevokeSeat = (empId, empName) => {
    showConfirm({
      title: "Revoke Employee License Seat?",
      message: `Are you sure you want to revoke the license seat assigned to ${empName || "this employee"}? Their access to mobile orders and POS will be deactivated, and the seat will return to your organization's available pool.`,
      confirmText: "Revoke Seat",
      cancelText: "Keep Seat",
      isDanger: true,
      onConfirm: async () => {
        try {
          setAssigningEmpId(empId);
          const res = await axios.post(
            `${API_URL}/license/employees/revoke`,
            { employeeId: empId },
            { headers: authHeaders }
          );
          if (res.data?.success) {
            setEmployeeSeats(res.data.seats);
            setEmployeesList((prev) =>
              prev.map((e) =>
                e.id === empId ? { ...e, hasLicense: false, licenseDetails: null } : e
              )
            );
            setStatusMessage({ type: "success", text: "License seat revoked and returned to pool." });
          }
        } catch (err) {
          setStatusMessage({
            type: "error",
            text: err.response?.data?.error || "Failed to revoke seat",
          });
        } finally {
          setAssigningEmpId(null);
        }
      },
    });
  };

  // =========================================================================
  // SUPER ADMIN SPECIALIZED OPERATIONS
  // =========================================================================

  const handleInitiateHandshake = async () => {
    setTestingHandshake(true);
    try {
      const res = await axios.post(`${API_URL}/api/licensing/handshake/initiate`, {}, { headers: authHeaders });
      if (res.data?.success) {
        setHandshakeStatus(res.data);
        if (res.data.warning) {
          setStatusMessage({
            type: "info",
            text: res.data.warning,
          });
        } else {
          setStatusMessage({
            type: "success",
            text: res.data.message || `Payment server handshake successful! Latency: ${res.data.latencyMs}ms`,
          });
        }
        loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Payment server handshake failed.",
      });
    } finally {
      setTestingHandshake(false);
    }
  };

  const handleDisconnectHandshake = async () => {
    setDisconnectingHandshake(true);
    try {
      const res = await axios.post(`${API_URL}/api/licensing/handshake/disconnect`, {}, { headers: authHeaders });
      if (res.data?.success) {
        setStatusMessage({ type: "success", text: "Central Payment Server connection disconnected." });
        loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Failed to disconnect: " + err.message });
    } finally {
      setDisconnectingHandshake(false);
    }
  };

  const handleDisconnectClick = () => {
    showConfirm({
      title: "Disconnect Central Payment Server?",
      message:
        "Are you sure you want to revoke and clear the active API credentials? Live checkout and automatic renewals will be suspended until a new handshake is initiated.",
      confirmText: "Confirm Disconnect",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: async () => {
        await handleDisconnectHandshake();
      },
    });
  };

  const handleSaveCredentials = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!credentialsForm.apiKey || !credentialsForm.apiKey.trim()) {
      setStatusMessage({ type: "error", text: "Central API Key is required." });
      return;
    }
    try {
      setSavingCredentials(true);
      const res = await axios.post(
        `${API_URL}/api/licensing/handshake/credentials`,
        {
          apiKey: credentialsForm.apiKey.trim(),
          webhookSecret: credentialsForm.webhookSecret ? credentialsForm.webhookSecret.trim() : "",
        },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({
          type: "success",
          text: res.data.message || "Payment credentials saved and verified with Central Payment Server!",
        });
        setShowCredentialsModal(false);
        setCredentialsForm({ apiKey: "", webhookSecret: "" });
        await loadSuperAdminData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update payment credentials.",
      });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleDeletePackage = (pkgId, pkgName) => {
    showConfirm({
      title: "Delete Subscription Package?",
      message: `Are you sure you want to permanently delete the package "${pkgName}"? This action cannot be undone and will remove it from future store listings.`,
      confirmText: "Delete Package",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`${API_URL}/license/packages/${pkgId}`, {
            headers: authHeaders,
          });
          if (res.data?.success) {
            setStatusMessage({
              type: "success",
              text: res.data.message || `Package "${pkgName}" deleted successfully.`,
            });
            loadSuperAdminData();
            loadAllLicenseData();
          }
        } catch (err) {
          setStatusMessage({
            type: "error",
            text: err.response?.data?.error || err.response?.data?.message || "Failed to delete package.",
          });
        }
      },
    });
  };

  const handleIssueZeroInvoice = async (e) => {
    e.preventDefault();
    setIssuingZeroInvoice(true);
    try {
      const res = await axios.post(`${API_URL}/api/licensing/zero-invoice`, zeroInvoiceForm, { headers: authHeaders });
      if (res.data?.success) {
        setStatusMessage({
          type: "success",
          text: `🎉 Zero-Invoice #${res.data.invoiceNumber} granted and license provisioned successfully!`,
        });
        setShowZeroInvoiceModal(false);
        setZeroInvoiceForm({
          targetOrgId: "anjali_constructions_01",
          planId: "ANNUAL_ENTERPRISE",
          offlineReference: "",
          notes: "",
          durationMonths: 12,
          seats: 0,
        });
        await loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "Zero-Invoice issue failed: " + (err.response?.data?.message || err.message),
      });
    } finally {
      setIssuingZeroInvoice(false);
    }
  };

  const togglePackageFeature = (featureKey) => {
    const current = Array.isArray(packageFormData.features) ? packageFormData.features : [];
    if (current.includes(featureKey)) {
      setPackageFormData({
        ...packageFormData,
        features: current.filter((k) => k !== featureKey),
      });
    } else {
      setPackageFormData({
        ...packageFormData,
        features: [...current, featureKey],
      });
    }
  };

  const selectAllPackageFeatures = () => {
    setPackageFormData({
      ...packageFormData,
      features: AVAILABLE_LICENSE_FEATURES.map((f) => f.key),
    });
  };

  const clearAllPackageFeatures = () => {
    setPackageFormData({
      ...packageFormData,
      features: [],
    });
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await axios.put(
          `${API_URL}/license/packages/${editingPackage.id}`,
          packageFormData,
          { headers: authHeaders }
        );
        setStatusMessage({ type: "success", text: "Package updated successfully." });
      } else {
        await axios.post(`${API_URL}/license/packages`, packageFormData, {
          headers: authHeaders,
        });
        setStatusMessage({ type: "success", text: "New package created successfully." });
      }
      setShowPackageModal(false);
      setEditingPackage(null);
      loadSuperAdminData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Error saving package",
      });
    }
  };

  const handleTogglePackage = async (pkgId) => {
    try {
      await axios.patch(`${API_URL}/license/packages/${pkgId}/toggle`, {}, { headers: authHeaders });
      loadSuperAdminData();
    } catch (err) {}
  };

  const handleSavePolicyConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const payload = {
        cost_monthly_paise: Math.round(configForm.cost_monthly_rupees * 100),
        cost_annual_paise: Math.round(configForm.cost_annual_rupees * 100),
        grace_period_days: configForm.grace_period_days,
        total_purchased_seats: configForm.total_purchased_seats,
        lockout_mode: configForm.lockout_mode,
        max_users: configForm.max_users,
        max_orders_per_month: configForm.max_orders_per_month,
        reminder_days: configForm.reminder_days
          .split(",")
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n)),
      };

      const res = await axios.put(`${API_URL}/license/config`, payload, {
        headers: authHeaders,
      });

      if (res.data?.success) {
        setStatusMessage({
          type: "success",
          text: "Licensing policy re-signed and cryptographically secured.",
        });
        loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "Failed to update configuration: " + (err.response?.data?.error || err.message),
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleApplyOfflineKey = async () => {
    if (!offlineKey.trim()) return;
    try {
      const res = await axios.post(
        `${API_URL}/license/apply-offline-key`,
        { licenseKey: offlineKey.trim() },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({
          type: "success",
          text: "Emergency offline key verified and activated successfully!",
        });
        setOfflineKey("");
        loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.error || "Invalid offline key",
      });
    }
  };

  const handleSimulateState = async (state) => {
    try {
      const res = await axios.post(
        `${API_URL}/license/simulate`,
        { state },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        setStatusMessage({
          type: "info",
          text: state ? `Simulation enabled: ${state}` : "Simulation disabled. Real state restored.",
        });
        loadAllLicenseData();
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Simulation toggle failed" });
    }
  };

  const [resettingLicense, setResettingLicense] = useState(false);

  const handleResetLicense = () => {
    showConfirm({
      title: "Reset License to Factory Clean State?",
      message:
        "This will completely reset the organization to an UNLICENSED state (0 seats, unconfigured key), wipe out active test subscriptions, and cancel any pending checkout orders. Are you sure you want to proceed?",
      confirmText: "Yes, Reset to Unlicensed",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: async () => {
        try {
          setResettingLicense(true);
          const res = await axios.post(
            `${API_URL}/api/licensing/reset-license`,
            {},
            { headers: authHeaders }
          );
          if (res.data?.success) {
            setStatusMessage({
              type: "success",
              text: "License reset successfully to clean UNLICENSED state.",
            });
            closeConfirm();
            await loadAllLicenseData();
          } else {
            setStatusMessage({
              type: "error",
              text: res.data?.error || "Failed to reset license",
            });
            closeConfirm();
          }
        } catch (err) {
          setStatusMessage({
            type: "error",
            text: err.response?.data?.error || err.message || "Failed to reset license",
          });
          closeConfirm();
        } finally {
          setResettingLicense(false);
        }
      },
    });
  };

  const handleCopyKey = () => {
    if (license?.licenseKey) {
      navigator.clipboard.writeText(license.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const filteredEmployees = employeesList.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.role?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.mobile?.includes(employeeSearch);

    if (!matchesSearch) return false;
    if (employeeFilter === "licensed") return emp.hasLicense;
    if (employeeFilter === "unlicensed") return !emp.hasLicense;
    return true;
  });

  // Check for any active pending order within 30 minutes for Tenant Admin Banner
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  const activePendingInvoice = taxInvoices.find(
    (inv) => inv.status === "pending" && new Date(inv.date).getTime() > thirtyMinutesAgo
  );

  if (loading) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: "#64748b" }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#059669" }} />
        <p style={{ fontSize: "14px", fontWeight: 500 }}>Authenticating license security & seat allocations...</p>
      </div>
    );
  }

  // Active view mode: Force company_admin if not super admin
  const activeView = isSuperAdminUser ? currentMode : "company_admin";

  return (
    <div className="acm-lic-container">
      {/* Top Header */}
      <div className="acm-lic-header">
        <div className="acm-lic-header-left">
          <div className="acm-lic-icon-wrap">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="acm-lic-title">
              License & Subscription Management
              {license?.isCryptographicallyVerified && (
                <span className="acm-badge-verified">HMAC-SHA256 Signed</span>
              )}
            </h1>
            <p className="acm-lic-subtitle">
              Manage organization licensing, employee seat assignments, corporate tax invoices, and payment orchestration.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isSuperAdminUser ? (
            <div className="acm-mode-switcher">
              <button
                type="button"
                onClick={() => setCurrentMode("company_admin")}
                className={`acm-mode-btn ${currentMode === "company_admin" ? "active" : ""}`}
              >
                <Building2 size={15} />
                <span>Tenant Portal</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentMode("super_admin")}
                className={`acm-mode-btn ${currentMode === "super_admin" ? "active-super" : ""}`}
              >
                <Server size={15} />
                <span>Super Admin</span>
              </button>
            </div>
          ) : (
            <div className="acm-badge-admin">
              <Building2 size={15} />
              <span>Tenant Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Status / Alert Bar */}
      {statusMessage.text && (
        <div
          className={`acm-status-banner ${
            statusMessage.type === "success"
              ? "success"
              : statusMessage.type === "error"
              ? "error"
              : "info"
          }`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            {statusMessage.type === "success" ? (
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
            ) : statusMessage.type === "error" ? (
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            ) : (
              <Clock size={18} style={{ flexShrink: 0 }} />
            )}
            <span style={{ lineHeight: 1.4 }}>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage({ type: "", text: "" })}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              marginLeft: "12px",
              flexShrink: 0,
            }}
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: TENANT / NORMAL ADMIN PORTAL */}
      {/* ========================================================================= */}
      {activeView === "company_admin" && (
        <div>
          {/* Section 4.1: Pending Order Banner */}
          {activePendingInvoice && (
            <div className="acm-pending-bar">
              <div className="acm-pending-info">
                <AlertCircle size={20} style={{ color: "#d97706", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#92400e" }}>
                    Incomplete Pending Order ({activePendingInvoice.invoiceNumber})
                  </div>
                  <div style={{ fontSize: "12px", color: "#b45309" }}>
                    Amount: ₹{activePendingInvoice.amount.toLocaleString("en-IN")} • Awaiting payment completion.
                  </div>
                </div>
              </div>
              <div className="acm-pending-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleResumePendingOrder(
                      activePendingInvoice.id,
                      activePendingInvoice.paymentUrl,
                      activePendingInvoice.invoiceNumber,
                      activePendingInvoice.amount,
                      activePendingInvoice.planName
                    )
                  }
                  className="acm-btn-resume"
                >
                  <ExternalLink size={14} />
                  Resume Checkout
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelPendingOrder(activePendingInvoice.id, activePendingInvoice.invoiceNumber)}
                  className="acm-btn-cancel-ord"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          )}

          {/* Sub Navigation Tabs for Normal Admin */}
          <div className="acm-tabs">
            <button
              type="button"
              onClick={() => setCompanyTab("overview")}
              className={`acm-tab-btn ${companyTab === "overview" ? "active" : ""}`}
            >
              <Calendar size={16} />
              Plan & Subscription
            </button>
            <button
              type="button"
              onClick={() => setCompanyTab("seats")}
              className={`acm-tab-btn ${companyTab === "seats" ? "active" : ""}`}
            >
              <Users size={16} />
              Employee Licenses ({employeeSeats.assigned}/{employeeSeats.total})
            </button>
            <button
              type="button"
              onClick={() => setCompanyTab("invoices")}
              className={`acm-tab-btn ${companyTab === "invoices" ? "active" : ""}`}
            >
              <Receipt size={16} />
              Corporate Tax Invoices ({taxInvoices.length})
            </button>
          </div>

          {/* TAB 1: Plan & Subscription Renewal */}
          {companyTab === "overview" && (
            <div>
              {/* Dark Hero Subscription Card */}
              <div className="acm-hero-card">
                <div className="acm-hero-top">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`acm-hero-status-tag ${license?.status === "UNLICENSED" ? "unlicensed" : ""}`}>
                        {license?.status || "ACTIVE"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Org ID: <strong style={{ color: "#ffffff" }}>anjali_constructions_01</strong>
                      </span>
                    </div>

                    <h2 className="acm-hero-plan-name">
                      {license?.status === "UNLICENSED"
                        ? "No Active Subscription Plan"
                        : (license?.planName || "Anjali Enterprise License")}
                    </h2>

                    {license?.status === "UNLICENSED" ? (
                      <div
                        style={{
                          marginTop: 12,
                          marginBottom: 12,
                          padding: "12px 16px",
                          background: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: 8,
                          color: "#fca5a5",
                          fontSize: "13px",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>⚠️ Unlicensed Software:</strong> This tenant does not have an active subscription. Select a plan below to activate your software, provision employee seats, and unlock core modules.
                      </div>
                    ) : (
                      <div className="acm-hero-meta">
                        <div className="acm-hero-meta-item">
                          <Calendar size={16} style={{ color: "#34d399" }} />
                          <span>Valid Until: <strong>{license?.validUntil ? new Date(license.validUntil).toLocaleDateString("en-IN") : "N/A"}</strong></span>
                        </div>
                        <div className="acm-hero-meta-item">
                          <Clock size={16} style={{ color: "#2dd4bf" }} />
                          <span>Days Remaining: <strong>{license?.daysRemaining ?? "N/A"} Days</strong></span>
                        </div>
                        <div className="acm-hero-meta-item">
                          <Users size={16} style={{ color: "#6ee7b7" }} />
                          <span>License Seats: <strong>{employeeSeats.assigned} of {employeeSeats.total} active</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Active Entitled Modules */}
                    {Array.isArray(license?.allowedFeatures) && license.allowedFeatures.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                          Active Entitled Modules ({license.allowedFeatures.length}):
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {license.allowedFeatures.map((fKey) => {
                            const meta = getFeatureMeta(fKey);
                            return (
                              <span
                                key={fKey}
                                title={`${meta.name}\n⚡ Functions: ${meta.functions}\n🛑 Stops: ${meta.stops}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "3px 8px",
                                  background: "rgba(255, 255, 255, 0.12)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  borderRadius: 6,
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                }}
                              >
                                <CheckCircle size={12} style={{ color: "#34d399", flexShrink: 0 }} />
                                {meta.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {license?.activeReminder && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          fontSize: "12px",
                          color: "#a7f3d0",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Sparkles size={16} />
                        <span>{license.activeReminder.message}</span>
                      </div>
                    )}
                  </div>

                  <div className="acm-hero-actions">
                    {license?.status === "UNLICENSED" ? (
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("available-subscription-plans");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="acm-btn-renew"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                      >
                        <Zap size={16} />
                        Choose Subscription Plan
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInitiateOrderCheckout("ANNUAL_ENTERPRISE", "annual")}
                          disabled={processingPayment}
                          className="acm-btn-renew"
                        >
                          <CreditCard size={16} />
                          Renew License (₹49,999/yr)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBuySeatsModal(true)}
                          className="acm-btn-seats"
                        >
                          <PlusCircle size={16} />
                          Buy Employee Seats
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="acm-hero-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                    <KeyRound size={16} style={{ color: "#34d399", flexShrink: 0 }} />
                    <span style={{ color: "#64748b" }}>Master License Key:</span>
                    <span className="acm-hero-key-box">{license?.licenseKey || "ACM-LIC-XXXX-XXXX"}</span>
                  </div>
                  <button type="button" onClick={handleCopyKey} className="acm-btn-copy-key">
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey ? "Copied!" : "Copy Key"}
                  </button>
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <div id="available-subscription-plans" style={{ marginTop: 28, marginBottom: 16 }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>
                  Available Subscription Plans
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Choose a billing cycle to extend enterprise capabilities and unlock additional features.
                </p>
              </div>

              <div className="acm-plans-grid">
                {plans.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "36px 20px", color: "#64748b", gridColumn: "1 / -1", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    <Package size={36} style={{ color: "#94a3b8", marginBottom: 10 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#334155" }}>No Subscription Plans Available</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>Contact your administrator or configure custom packages in the Super Admin tab.</p>
                  </div>
                ) : (
                  plans.map((p) => {
                  const isCurrent = license?.planId === p.id || license?.planId === p.package_code;
                  return (
                    <div key={p.id} className={`acm-plan-card ${p.popular ? "featured" : ""}`}>
                      {p.popular && <span className="acm-featured-badge">Most Popular</span>}
                      <div>
                        <h4 className="acm-plan-title">{p.name}</h4>
                        <div className="acm-plan-price-text">
                          ₹{p.priceRupees?.toLocaleString("en-IN")}
                          <span className="acm-plan-price-sub">/{p.billingCycle}</span>
                        </div>

                        <ul className="acm-plan-features-list">
                          <li>
                            <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                            <span><strong>{p.includedSeats || 50}</strong> Employee Seats Included</span>
                          </li>
                          <li>
                            <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                            <span><strong>{p.gracePeriodDays || 7} Days</strong> Grace Period Shield</span>
                          </li>
                          {Array.isArray(p.features) && p.features.length > 0 ? (
                            p.features.map((fKey) => {
                              const meta = getFeatureMeta(fKey);
                              return (
                                <li key={fKey} title={`Capabilities: ${meta.functions}\nBlocked if inactive: ${meta.stops}`}>
                                  <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                                  <span>{meta.name}</span>
                                </li>
                              );
                            })
                          ) : (
                            <>
                              <li>
                                <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                                <span>Automated Central Payment Orchestrator</span>
                              </li>
                              <li>
                                <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                                <span>Official GST Compliant Tax Invoices (SAC 997331)</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitiateOrderCheckout(p.package_code || p.id, p.billingCycle)}
                        disabled={processingPayment}
                        className={`acm-plan-action-btn ${isCurrent ? "outline" : "solid"}`}
                      >
                        {isCurrent ? "Renew Current Term" : "Upgrade Plan"}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  );
                }))}
              </div>
            </div>
          )}

          {/* TAB 2: Employee License Seat Management */}
          {companyTab === "seats" && (
            <div>
              <div className="acm-metrics-grid">
                <div className="acm-metric-card">
                  <div className="acm-metric-label">Total Purchased Seats</div>
                  <div className="acm-metric-val">{employeeSeats.total}</div>
                  <div className="acm-metric-sub">Company quota from active subscription</div>
                </div>

                <div className="acm-metric-card">
                  <div className="acm-metric-label">Assigned Active Seats</div>
                  <div className="acm-metric-val green">{employeeSeats.assigned}</div>
                  <div className="acm-metric-sub">Employees currently authorized to access system</div>
                </div>

                <div className="acm-metric-card">
                  <div className="acm-metric-label">Available Pool Seats</div>
                  <div className="acm-metric-val emerald">{employeeSeats.available}</div>
                  <div className="acm-metric-sub">Ready to assign without extra cost</div>
                </div>
              </div>

              <div className="acm-table-card">
                <div className="acm-table-header-row">
                  <div>
                    <h3 className="acm-table-title">
                      <UserCheck size={18} style={{ color: "#10b981" }} />
                      Employee Seat Assignments
                    </h3>
                    <p className="acm-table-desc">
                      Assign individual license seats to staff. Unlicensed employees will be restricted from entering transactions.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div className="acm-search-wrap">
                      <Search size={15} style={{ color: "#94a3b8" }} />
                      <input
                        type="text"
                        placeholder="Search employee by name, code, role..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="acm-search-input"
                      />
                    </div>

                    <select
                      value={employeeFilter}
                      onChange={(e) => setEmployeeFilter(e.target.value)}
                      className="acm-filter-select"
                    >
                      <option value="all">All Employees ({employeesList.length})</option>
                      <option value="licensed">Licensed Only ({employeeSeats.assigned})</option>
                      <option value="unlicensed">Unlicensed ({employeeSeats.total - employeeSeats.assigned})</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowBuySeatsModal(true)}
                      className="acm-btn-add-seats"
                    >
                      <PlusCircle size={15} />
                      Buy More Seats
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="acm-data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Role & Division</th>
                        <th>Mobile</th>
                        <th>License Status</th>
                        <th>Seat Key</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                            No employees found matching filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <tr key={emp.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{emp.name}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Code: {emp.employeeCode || emp.employeeId || emp.id}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: "13px", color: "#334155" }}>{emp.role || "Staff"}</div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{emp.divisionName || "Main Division"}</div>
                            </td>
                            <td style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>
                              {emp.mobile || "N/A"}
                            </td>
                            <td>
                              {emp.hasLicense ? (
                                <span className="acm-badge-lic-active">
                                  <Check size={12} />
                                  Licensed Seat
                                </span>
                              ) : (
                                <span className="acm-badge-lic-unassigned">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b" }}>
                              {emp.licenseDetails?.seat_key || "—"}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {emp.hasLicense ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeSeat(emp.id, emp.name || emp.employee_name)}
                                  disabled={assigningEmpId === emp.id}
                                  className="acm-btn-revoke"
                                >
                                  <UserX size={13} />
                                  Revoke Seat
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAssignSeat(emp.id)}
                                  disabled={assigningEmpId === emp.id || employeeSeats.available <= 0}
                                  className="acm-btn-assign"
                                  title={employeeSeats.available <= 0 ? "No available seats in pool. Buy more seats first." : ""}
                                >
                                  <UserCheck size={13} />
                                  Assign Seat
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Corporate Tax Invoices */}
          {companyTab === "invoices" && (
            <div className="acm-table-card">
              <div className="acm-table-header-row">
                <div>
                  <h3 className="acm-table-title">
                    <Receipt size={18} style={{ color: "#10b981" }} />
                    Official GST Tax Invoices
                  </h3>
                  <p className="acm-table-desc">
                    Download and print official tax invoices for company accounting, input tax credit (ITC), and audit verification.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="acm-data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Billing Date</th>
                      <th>Subscription Details</th>
                      <th>Taxable (₹)</th>
                      <th>GST (18%)</th>
                      <th>Total Paid</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Invoice PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                          No invoice records found. Invoices are generated automatically on payment confirmation.
                        </td>
                      </tr>
                    ) : (
                      taxInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                            {inv.invoiceNumber}
                          </td>
                          <td style={{ fontSize: "12px", color: "#64748b" }}>
                            {new Date(inv.date).toLocaleDateString("en-IN")}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b" }}>
                              {inv.planName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              SAC: 997331 • {inv.billingCycle}
                            </div>
                          </td>
                          <td style={{ fontSize: "12px", fontWeight: 600 }}>₹{inv.taxableAmount}</td>
                          <td style={{ fontSize: "12px", color: "#64748b" }}>
                            ₹{(Number(inv.cgstAmount) + Number(inv.sgstAmount)).toFixed(2)}
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>CGST 9% + SGST 9%</div>
                          </td>
                          <td style={{ fontSize: "13px", fontWeight: 700, color: "#059669" }}>
                            ₹{inv.amount.toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                background: inv.status === "paid" ? "#ecfdf5" : inv.status === "pending" ? "#fffbeb" : "#fef2f2",
                                color: inv.status === "paid" ? "#047857" : inv.status === "pending" ? "#b45309" : "#b91c1c",
                              }}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="acm-btn-view-inv"
                            >
                              <FileText size={13} />
                              View & Print
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: PLATFORM SUPER ADMIN PORTAL (SECURELY ISOLATED) */}
      {/* ========================================================================= */}
      {activeView === "super_admin" && isSuperAdminUser && (
        <div>
          {/* Super Admin Navigation Tabs */}
          <div className="acm-tabs">
            <button
              type="button"
              onClick={() => setSuperAdminTab("handshake")}
              className={`acm-tab-btn ${superAdminTab === "handshake" ? "active indigo" : ""}`}
            >
              <Server size={16} />
              Payment Handshake
            </button>
            <button
              type="button"
              onClick={() => setSuperAdminTab("packages")}
              className={`acm-tab-btn ${superAdminTab === "packages" ? "active indigo" : ""}`}
            >
              <Layers size={16} />
              Manage Packages ({allPackages.length})
            </button>
            <button
              type="button"
              onClick={() => setSuperAdminTab("zero_invoice")}
              className={`acm-tab-btn ${superAdminTab === "zero_invoice" ? "active indigo" : ""}`}
            >
              <FileCheck size={16} />
              Issue Zero Invoice
            </button>
            <button
              type="button"
              onClick={() => setSuperAdminTab("webhooks")}
              className={`acm-tab-btn ${superAdminTab === "webhooks" ? "active indigo" : ""}`}
            >
              <Activity size={16} />
              Webhook Ledger ({transactionsLedger.length})
            </button>
            <button
              type="button"
              onClick={() => setSuperAdminTab("policy")}
              className={`acm-tab-btn ${superAdminTab === "policy" ? "active indigo" : ""}`}
            >
              <Sliders size={16} />
              Policy & Simulation
            </button>
          </div>

          {/* SUPER ADMIN TAB 1: Handshake Connection & Disconnect */}
          {superAdminTab === "handshake" && (
            <div className="acm-handshake-card">
              <div className="acm-handshake-header">
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Server size={20} style={{ color: "#4f46e5" }} />
                    Central Payment Server Handshake & Credentials
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                    Automated Phase 1 domain verification and dynamic HMAC credential delivery with KERNN Orchestrator.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCredentialsForm({
                        apiKey: "",
                        webhookSecret: "",
                      });
                      setShowCredentialsModal(true);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      color: "#1e293b",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "1px solid #cbd5e1",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <KeyRound size={15} style={{ color: "#4f46e5" }} />
                    Configure Credentials
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiateHandshake}
                    disabled={testingHandshake}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <RefreshCw size={15} className={testingHandshake ? "animate-spin" : ""} />
                    {testingHandshake ? "Verifying..." : "Initiate / Verify Handshake"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnectClick}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "1px solid #fecaca",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Unlink size={15} />
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="acm-metrics-grid" style={{ marginTop: 24, marginBottom: 0 }}>
                <div className="acm-metric-card">
                  <div className="acm-metric-label">Onboarding Status</div>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className={`acm-pill-status ${
                        handshakeStatus?.onboardingStatus === "completed"
                          ? "connected"
                          : handshakeStatus?.onboardingStatus === "challenge_issued"
                          ? "challenge_issued"
                          : handshakeStatus?.onboardingStatus === "revoked"
                          ? "revoked"
                          : "disconnected"
                      }`}
                    >
                      ● {handshakeStatus?.onboardingStatus === "completed" ? "CONNECTED" : (handshakeStatus?.onboardingStatus || "DISCONNECTED").toUpperCase()}
                    </span>
                  </div>
                  <div className="acm-metric-sub">Central Server: {handshakeStatus?.orchestratorUrl || "https://payments.kernn.ai"}</div>
                </div>

                <div className="acm-metric-card">
                  <div className="acm-metric-label">Masked API Key</div>
                  <div className="acm-metric-val" style={{ fontSize: "16px", fontFamily: "monospace" }}>
                    {handshakeStatus?.activeApiKeyPreview || "Not configured"}
                  </div>
                  <div className="acm-metric-sub">Secret header used for /api/create-order</div>
                </div>

                <div className="acm-metric-card">
                  <div className="acm-metric-label">Webhook Secret</div>
                  <div className={`acm-metric-val ${handshakeStatus?.webhookSecretConfigured ? "green" : ""}`} style={{ fontSize: "16px", fontFamily: "monospace" }}>
                    {handshakeStatus?.webhookSecretConfigured ? "Configured (HMAC Active)" : "Not configured"}
                  </div>
                  <div className="acm-metric-sub">HMAC-SHA256 signature verification key</div>
                </div>
              </div>
            </div>
          )}

          {/* SUPER ADMIN TAB 2: Manage Packages */}
          {superAdminTab === "packages" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Subscription & Seat Add-on Packages</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>Configure pricing tiers and per-seat bundles.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPackage(null);
                    setPackageFormData({
                      package_code: "",
                      name: "",
                      description: "",
                      billing_cycle: "annual",
                      type: "CORE_PLAN",
                      price_rupees: 4999,
                      included_seats: 50,
                      grace_period_days: 7,
                      features: ["direct_drop_inventory", "payment_receipts", "pdf_verification", "reports_export"],
                      is_popular: false,
                    });
                    setShowPackageModal(true);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <PlusCircle size={15} />
                  Add New Package
                </button>
              </div>

              <div className="acm-plans-grid">
                {allPackages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", gridColumn: "1 / -1", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                    <Package size={36} style={{ color: "#94a3b8", marginBottom: 10 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#334155" }}>No License Packages Configured</p>
                    <p style={{ margin: "6px 0 16px 0", fontSize: "13px", color: "#64748b" }}>This production database is completely clean. Click &quot;Add New Package&quot; to configure your organization plans.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackage(null);
                        setPackageFormData({
                          package_code: "",
                          name: "",
                          description: "",
                          billing_cycle: "annual",
                          type: "CORE_PLAN",
                          price_rupees: 49999,
                          included_seats: 50,
                          grace_period_days: 7,
                          features: ["direct_drop_inventory", "payment_receipts", "pdf_verification", "reports_export"],
                          is_active: true,
                          is_popular: false,
                          sort_order: 1,
                        });
                        setShowPackageModal(true);
                      }}
                      className="acm-btn-add-pkg"
                      style={{ margin: "0 auto" }}
                    >
                      <PlusCircle size={15} />
                      Add New Package
                    </button>
                  </div>
                ) : (
                  allPackages.map((pkg) => (
                  <div key={pkg.id} className="acm-plan-card">
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#e0e7ff", color: "#3730a3" }}>
                          {pkg.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePackage(pkg.id)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: "11px",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            background: pkg.is_active ? "#ecfdf5" : "#f1f5f9",
                            color: pkg.is_active ? "#047857" : "#64748b",
                          }}
                        >
                          {pkg.is_active ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <h4 style={{ fontSize: "16px", fontWeight: 800, marginTop: 8, color: "#0f172a" }}>{pkg.name}</h4>
                      <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#94a3b8" }}>{pkg.package_code}</div>

                      <div className="acm-plan-price-text">
                        ₹{Number(pkg.price_rupees).toLocaleString("en-IN")}
                        <span className="acm-plan-price-sub">/{pkg.billing_cycle}</span>
                      </div>

                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: 8 }}>
                        <div>Seats: <strong>{pkg.included_seats} seats</strong></div>
                        <div>Grace: <strong>{pkg.grace_period_days} days</strong></div>
                      </div>

                      {/* Entitled Features */}
                      {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                            Entitled Capabilities ({pkg.features.length}):
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {pkg.features.map((fKey) => {
                              const meta = getFeatureMeta(fKey);
                              return (
                                <span
                                  key={fKey}
                                  title={`${meta.name}\n⚡ Functions: ${meta.functions}\n🛑 Stops: ${meta.stops}`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "3px 7px",
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    borderRadius: 6,
                                    fontSize: "10.5px",
                                    fontWeight: 600,
                                    color: "#166534",
                                    lineHeight: "1.2",
                                  }}
                                >
                                  <CheckCircle size={11} style={{ color: "#16a34a", flexShrink: 0 }} />
                                  {meta.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPackage(pkg);
                          setPackageFormData({
                            package_code: pkg.package_code,
                            name: pkg.name,
                            description: pkg.description || "",
                            billing_cycle: pkg.billing_cycle,
                            type: pkg.type,
                            price_rupees: Number(pkg.price_rupees),
                            included_seats: pkg.included_seats,
                            grace_period_days: pkg.grace_period_days,
                            features: pkg.features || [],
                            is_popular: pkg.is_popular,
                          });
                          setShowPackageModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#4f46e5",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#dc2626",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          transition: "all 0.15s ease",
                        }}
                        title="Delete Package"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          )}

          {/* SUPER ADMIN TAB 3: Issue Zero Invoice */}
          {superAdminTab === "zero_invoice" && (
            <div className="acm-table-card" style={{ padding: "28px", maxWidth: 720 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#0f172a" }}>
                  <FileCheck size={20} style={{ color: "#4f46e5" }} />
                  Issue Zero-Invoice (B2B Wire Settlement / Manual Grant)
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                  Instantly issue a 100% discounted commercial invoice and provision license entitlements for corporate wire transfers or cheques without gateway transactions.
                </p>
              </div>

              <form onSubmit={handleIssueZeroInvoice} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Target Tenant / Organization ID
                  </label>
                  <input
                    type="text"
                    required
                    value={zeroInvoiceForm.targetOrgId}
                    onChange={(e) => setZeroInvoiceForm({ ...zeroInvoiceForm, targetOrgId: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                      Subscription Plan
                    </label>
                    <select
                      value={zeroInvoiceForm.planId}
                      onChange={(e) => setZeroInvoiceForm({ ...zeroInvoiceForm, planId: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    >
                      <option value="ANNUAL_ENTERPRISE">Enterprise Annual Plan (ACM)</option>
                      <option value="MONTHLY_PRO">Professional Monthly Plan</option>
                      {allPackages.map((p) => (
                        <option key={p.id} value={p.package_code || p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={zeroInvoiceForm.durationMonths}
                      onChange={(e) => setZeroInvoiceForm({ ...zeroInvoiceForm, durationMonths: Number(e.target.value) })}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Offline Settlement Reference (NEFT / RTGS UTR #, Cheque #, Contract ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR-AXIS-20260921-987654"
                    value={zeroInvoiceForm.offlineReference}
                    onChange={(e) => setZeroInvoiceForm({ ...zeroInvoiceForm, offlineReference: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Additional Seats to Add (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={zeroInvoiceForm.seats}
                    onChange={(e) => setZeroInvoiceForm({ ...zeroInvoiceForm, seats: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Approval Notes / Commercial Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Annual contract wire payment received directly via Axis Bank corporate account."
                    value={zeroInvoiceForm.notes}
                    onChange={(e) => setZeroInvoiceForm({ ...zeroInvoiceForm, notes: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", resize: "vertical" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={issuingZeroInvoice}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Send size={16} />
                  {issuingZeroInvoice ? "Granting Entitlement..." : "Issue Zero-Invoice & Provision License"}
                </button>
              </form>
            </div>
          )}

          {/* SUPER ADMIN TAB 4: Webhook Transactions Ledger */}
          {superAdminTab === "webhooks" && (
            <div className="acm-table-card">
              <div className="acm-table-header-row">
                <div>
                  <h3 className="acm-table-title">
                    <Activity size={18} style={{ color: "#4f46e5" }} />
                    Webhook Payment Transactions Ledger
                  </h3>
                  <p className="acm-table-desc">
                    Cryptographically validated webhook receipts with atomic idempotency enforcement and raw payload inspection.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="acm-data-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Order ID</th>
                      <th>Invoice Ref</th>
                      <th>Amount</th>
                      <th>Captured Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Raw Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                          No transactions recorded in ledger yet.
                        </td>
                      </tr>
                    ) : (
                      transactionsLedger.map((tx) => (
                        <tr key={tx.id} style={{ fontFamily: "monospace", fontSize: "12px" }}>
                          <td style={{ fontWeight: 700, color: "#4f46e5" }}>{tx.paymentId}</td>
                          <td>{tx.orderId || "—"}</td>
                          <td style={{ fontFamily: "sans-serif" }}>{tx.invoiceNumber}</td>
                          <td style={{ fontWeight: 700, color: "#059669" }}>₹{tx.amount?.toLocaleString("en-IN")}</td>
                          <td style={{ fontFamily: "sans-serif" }}>{new Date(tx.capturedAt).toLocaleString("en-IN")}</td>
                          <td>
                            <span style={{ padding: "3px 8px", borderRadius: 4, background: "#ecfdf5", color: "#047857", fontWeight: 700 }}>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", fontFamily: "sans-serif" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedLedgerTx(tx)}
                              className="acm-btn-view-inv"
                            >
                              <Eye size={13} />
                              Inspect JSON
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

          {/* SUPER ADMIN TAB 5: Policy & Simulation */}
          {superAdminTab === "policy" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {/* Policy Form */}
              <div className="acm-table-card" style={{ padding: "24px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Sliders size={18} style={{ color: "#4f46e5" }} />
                  Licensing Policy & Costing
                </h4>

                <form onSubmit={handleSavePolicyConfig} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Monthly (₹)</label>
                      <input
                        type="number"
                        value={configForm.cost_monthly_rupees}
                        onChange={(e) => setConfigForm({ ...configForm, cost_monthly_rupees: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Annual (₹)</label>
                      <input
                        type="number"
                        value={configForm.cost_annual_rupees}
                        onChange={(e) => setConfigForm({ ...configForm, cost_annual_rupees: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Grace Period (Days)</label>
                      <input
                        type="number"
                        value={configForm.grace_period_days}
                        onChange={(e) => setConfigForm({ ...configForm, grace_period_days: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Total Org Seats</label>
                      <input
                        type="number"
                        value={configForm.total_purchased_seats}
                        onChange={(e) => setConfigForm({ ...configForm, total_purchased_seats: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Lockout Mode</label>
                    <select
                      value={configForm.lockout_mode}
                      onChange={(e) => setConfigForm({ ...configForm, lockout_mode: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    >
                      <option value="HARD">HARD - Total Screen Lockout & Operation Freeze</option>
                      <option value="SOFT">SOFT - Read-Only Warning Banner Mode</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={savingConfig}
                    style={{
                      marginTop: 8,
                      padding: "10px",
                      borderRadius: 10,
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {savingConfig ? "Signing Config..." : "Save & Cryptographically Re-Sign"}
                  </button>
                </form>
              </div>

              {/* Simulation Suite */}
              <div className="acm-table-card" style={{ padding: "24px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={18} style={{ color: "#4f46e5" }} />
                  Licensing Simulation Suite
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0" }}>
                  Safely test lockout banners, grace period workflows, and expiry handling without altering live system timestamps.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleSimulateState(null)}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: !license?.simulationState ? "#ecfdf5" : "#f8fafc",
                      color: !license?.simulationState ? "#047857" : "#475569",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    ● Normal Real State (Active Term)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateState("EXPIRING_SOON")}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid #fed7aa",
                      background: license?.simulationState === "EXPIRING_SOON" ? "#fff7ed" : "#f8fafc",
                      color: "#ea580c",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    ⚠️ Simulate Expiring Soon (3 Days Left)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateState("IN_GRACE")}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      background: license?.simulationState === "IN_GRACE" ? "#fef2f2" : "#f8fafc",
                      color: "#dc2626",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    ⏳ Simulate Grace Period (Expired Term)
                  </button>
                </div>
              </div>

              {/* Reset to Clean UNLICENSED State (Dev) */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #fee2e2",
                  borderRadius: 12,
                  padding: "20px",
                  marginTop: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Trash2 size={20} style={{ color: "#dc2626" }} />
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#991b1b" }}>
                    Factory Reset & Clean Slate Engine (Dev / Sandbox)
                  </h4>
                </div>
                <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>
                  Wipe active trial/enterprise licenses for this tenant, reset employee seat allocations back to 0, cancel pending test orders, and restore genuine UNLICENSED state for clean testing.
                </p>
                <button
                  type="button"
                  onClick={handleResetLicense}
                  disabled={resettingLicense}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid #dc2626",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                    e.currentTarget.style.color = "#dc2626";
                  }}
                >
                  <Trash2 size={16} />
                  {resettingLicense ? "Resetting Tenant License..." : "🧹 Reset License to Clean UNLICENSED State"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REAL-TIME CHECKOUT POLLING (SECTION 5.1) */}
      {/* ========================================================================= */}
      {pollingCheckout.isOpen && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box" style={{ maxWidth: 480 }}>
            <div className="acm-polling-card">
              <div className="acm-polling-spinner" />
              <h3 className="acm-polling-title">Payment in Progress</h3>
              <p className="acm-polling-desc">
                Please complete your transaction in the opened payment gateway tab.
              </p>

              <div className="acm-polling-attempt">
                <Clock size={14} className="animate-spin" />
                <span>Verifying payment confirmation... (Attempt {pollingCheckout.attempt}/40)</span>
              </div>

              {pollingCheckout.error && (
                <div style={{ color: "#dc2626", fontSize: "12px", marginBottom: 16 }}>
                  {pollingCheckout.error}
                </div>
              )}

              <div className="acm-polling-helpers">
                <div>
                  Invoice: <strong>{pollingCheckout.invoiceNumber}</strong> • Amount: <strong>₹{pollingCheckout.amount?.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  Having trouble or window closed?{" "}
                  <button
                    type="button"
                    onClick={() => window.open(pollingCheckout.paymentUrl, "_blank")}
                    className="acm-polling-reopen-btn"
                  >
                    Click here to reopen checkout tab
                  </button>
                </div>
              </div>

              {/* Developer Fast Sandbox Verification */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f0" }}>
                <button
                  type="button"
                  onClick={handleSimulatePaymentSuccess}
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    background: "#f1f5f9",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  ⚡ [Dev Sandbox] Simulate Instant Gateway Success Webhook
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
                    setPollingCheckout((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="acm-btn-cancel-ord"
                  style={{ width: "100%" }}
                >
                  Close & Resume Payment Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFETTI CELEBRATION (SECTION 5.1) */}
      {/* ========================================================================= */}
      {celebrationData.isOpen && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box" style={{ maxWidth: 500 }}>
            <div className="acm-confetti-box">
              <div className="acm-confetti-icon">
                <CheckCircle size={36} />
              </div>
              <h3 className="acm-confetti-title">Payment Confirmed!</h3>
              <p className="acm-confetti-desc">
                Your software license and employee quotas have been successfully activated and cryptographically renewed.
              </p>

              <div className="acm-confetti-details">
                <div>Plan: <strong>{celebrationData.planName}</strong></div>
                <div>Active Until: <strong>{celebrationData.validUntil ? new Date(celebrationData.validUntil).toLocaleDateString("en-IN") : "Oct 2027"}</strong></div>
                <div>Authorized Seats: <strong>{celebrationData.seats} User Licenses</strong></div>
                <div>Tax Invoice: <strong>{celebrationData.invoiceNumber}</strong></div>
              </div>

              <button
                type="button"
                onClick={() => setCelebrationData({ isOpen: false, planName: "", validUntil: "", seats: 0, invoiceNumber: "" })}
                className="acm-btn-renew"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue to Organization Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PENDING ORDER CONFLICT MODAL */}
      {/* ========================================================================= */}
      {pendingConflict.isOpen && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box" style={{ maxWidth: 520 }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px 0", color: "#b45309" }}>
              Incomplete Order in Progress
            </h3>
            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              You have an active pending order created within the last 30 minutes. To avoid duplicate billing, please choose how you would like to proceed:
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div>Invoice #: <strong>{pendingConflict.pendingOrder?.invoiceNumber || pendingConflict.pendingOrder?.id}</strong></div>
              <div>Amount: <strong>₹{pendingConflict.pendingOrder?.amount?.toLocaleString("en-IN")}</strong></div>
              <div>Created: <strong>{new Date(pendingConflict.pendingOrder?.createdAt).toLocaleTimeString()}</strong></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                onClick={() =>
                  handleResumePendingOrder(
                    pendingConflict.pendingOrder?.id,
                    pendingConflict.pendingOrder?.paymentUrl,
                    pendingConflict.pendingOrder?.invoiceNumber,
                    pendingConflict.pendingOrder?.amount
                  )
                }
                className="acm-btn-resume"
                style={{ justifyContent: "center", padding: "12px" }}
              >
                <ExternalLink size={16} />
                Resume Checkout on Pending Order
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCancelPendingOrder(
                    pendingConflict.pendingOrder?.id,
                    pendingConflict.pendingOrder?.invoice_number || pendingConflict.pendingOrder?.invoiceNumber
                  )
                }
                className="acm-btn-cancel-ord"
                style={{ padding: "12px" }}
              >
                Cancel Pending Order & Start Fresh
              </button>

              <button
                type="button"
                onClick={() =>
                  handleInitiateOrderCheckout(pendingConflict.targetPlanId, pendingConflict.targetBillingCycle, true)
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: "6px",
                }}
              >
                Force Create New Order Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3.5: ADD / EDIT LICENSE PACKAGE (SUPER ADMIN) */}
      {/* ========================================================================= */}
      {showPackageModal && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box large" style={{ maxWidth: 780 }}>
            <button
              type="button"
              onClick={() => {
                setShowPackageModal(false);
                setEditingPackage(null);
              }}
              className="acm-modal-close"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={20} style={{ color: "#6366f1" }} />
                {editingPackage ? "Edit License Package" : "Create License Package"}
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                {editingPackage
                  ? "Modify parameters and feature entitlements for this package."
                  : "Define a new subscription tier or seat add-on package for your organization."}
              </p>
            </div>

            <form onSubmit={handleSavePackage} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Package Code * (e.g. ANNUAL_PRO, SEAT_ADDON_1)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPackage)}
                    value={packageFormData.package_code}
                    onChange={(e) =>
                      setPackageFormData({ ...packageFormData, package_code: e.target.value.toUpperCase().replace(/\s+/g, "_") })
                    }
                    placeholder="ANNUAL_PRO"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", textTransform: "uppercase" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={packageFormData.name}
                    onChange={(e) => setPackageFormData({ ...packageFormData, name: e.target.value })}
                    placeholder="Annual Professional License"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  value={packageFormData.description || ""}
                  onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })}
                  placeholder="Complete ERP license covering standard modules and seat allocations..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Package Type
                  </label>
                  <select
                    value={packageFormData.type}
                    onChange={(e) => setPackageFormData({ ...packageFormData, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="CORE_PLAN">Core Subscription Plan</option>
                    <option value="SEAT_ADDON">Seat Add-on Pack</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Billing Cycle
                  </label>
                  <select
                    value={packageFormData.billing_cycle}
                    onChange={(e) => setPackageFormData({ ...packageFormData, billing_cycle: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  >
                    <option value="annual">Annual</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={packageFormData.price_rupees}
                    onChange={(e) => setPackageFormData({ ...packageFormData, price_rupees: Number(e.target.value) })}
                    placeholder="4999"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Included Employee Seats
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={packageFormData.included_seats}
                    onChange={(e) => setPackageFormData({ ...packageFormData, included_seats: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                    Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    required
                    value={packageFormData.grace_period_days}
                    onChange={(e) => setPackageFormData({ ...packageFormData, grace_period_days: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              {/* Entitled Features Checkbox System */}
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", display: "block" }}>
                      Entitled Features & Operational Capabilities *
                    </label>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Select which capabilities are active for this package. Unchecked features are blocked upon subscription.
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={selectAllPackageFeatures}
                      style={{
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#2563eb",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllPackageFeatures}
                      style={{
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#64748b",
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Clear All
                    </button>
                    <span
                      style={{
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: 6,
                        background: (packageFormData.features || []).length > 0 ? "#ecfdf5" : "#fef2f2",
                        color: (packageFormData.features || []).length > 0 ? "#047857" : "#b91c1c",
                        border: `1px solid ${(packageFormData.features || []).length > 0 ? "#a7f3d0" : "#fecaca"}`,
                      }}
                    >
                      {(packageFormData.features || []).length} / {AVAILABLE_LICENSE_FEATURES.length} Selected
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    maxHeight: 380,
                    overflowY: "auto",
                    paddingRight: 4,
                    paddingTop: 2,
                    paddingBottom: 2,
                  }}
                >
                  {AVAILABLE_LICENSE_FEATURES.map((feat) => {
                    const isChecked = (packageFormData.features || []).includes(feat.key);
                    return (
                      <div
                        key={feat.key}
                        onClick={() => togglePackageFeature(feat.key)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: `2px solid ${isChecked ? "#3b82f6" : "#e2e8f0"}`,
                          background: isChecked ? "#f8faff" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isChecked ? "0 2px 8px rgba(59, 130, 246, 0.08)" : "none",
                        }}
                      >
                        {/* Top Bar: Checkbox + Name + Category + Status Badge */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                togglePackageFeature(feat.key);
                              }}
                              style={{ width: 18, height: 18, marginTop: 2, cursor: "pointer", accentColor: "#2563eb" }}
                            />
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: isChecked ? "#1e3a8a" : "#0f172a" }}>
                                  {feat.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    background: "#f1f5f9",
                                    color: "#475569",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {feat.category}
                                </span>
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
                                {feat.tagline}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 9px",
                              borderRadius: 6,
                              background: isChecked ? "#dcfce7" : "#f1f5f9",
                              color: isChecked ? "#15803d" : "#94a3b8",
                              border: `1px solid ${isChecked ? "#86efac" : "#cbd5e1"}`,
                              flexShrink: 0,
                            }}
                          >
                            {isChecked ? "Active" : "Disabled"}
                          </span>
                        </div>

                        {/* What It Actually Functions vs What Actually Stops */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                          {/* ⚡ What It Functions */}
                          <div
                            style={{
                              padding: "8px 10px",
                              borderRadius: 8,
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              fontSize: "11px",
                              lineHeight: "1.45",
                              color: "#166534",
                            }}
                          >
                            <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginBottom: 3, color: "#15803d" }}>
                              <Zap size={13} style={{ color: "#16a34a", flexShrink: 0 }} />
                              What It Functions:
                            </div>
                            <div>{feat.functions}</div>
                          </div>

                          {/* 🛑 What Actually Stops */}
                          <div
                            style={{
                              padding: "8px 10px",
                              borderRadius: 8,
                              background: isChecked ? "#fff7ed" : "#fef2f2",
                              border: `1px solid ${isChecked ? "#fed7aa" : "#fecaca"}`,
                              fontSize: "11px",
                              lineHeight: "1.45",
                              color: isChecked ? "#9a3412" : "#991b1b",
                            }}
                          >
                            <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 5, marginBottom: 3, color: isChecked ? "#c2410c" : "#b91c1c" }}>
                              <Ban size={13} style={{ color: isChecked ? "#ea580c" : "#dc2626", flexShrink: 0 }} />
                              What Stops If Disabled:
                            </div>
                            <div>{feat.stops}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="pkg_is_popular"
                  checked={Boolean(packageFormData.is_popular)}
                  onChange={(e) => setPackageFormData({ ...packageFormData, is_popular: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="pkg_is_popular" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  Mark as &quot;Most Popular&quot; featured card
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPackageModal(false);
                    setEditingPackage(null);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    border: "none",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {editingPackage ? "Update Package" : "Save & Publish Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BUY EMPLOYEE SEATS PACK */}
      {/* ========================================================================= */}
      {showBuySeatsModal && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box">
            <button
              type="button"
              onClick={() => setShowBuySeatsModal(false)}
              className="acm-modal-close"
            >
              <X size={18} />
            </button>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Add Employee License Seats
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
                Select a seat pack to instantly increase authorized employee capacity.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { code: "SEAT_ADDON_1", name: "+1 Employee License Seat", seats: 1, price: 999 },
                { code: "SEAT_ADDON_5", name: "+5 Employee License Seats Pack", seats: 5, price: 4499, popular: true },
                { code: "SEAT_ADDON_10", name: "+10 Employee License Seats Pack", seats: 10, price: 7999 },
              ].map((pack) => (
                <div
                  key={pack.code}
                  style={{
                    border: `2px solid ${pack.popular ? "#10b981" : "#e2e8f0"}`,
                    background: pack.popular ? "#f0fdf4" : "#ffffff",
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                      {pack.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Instant allocation • ₹{pack.price.toLocaleString("en-IN")} / year
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInitiateOrderCheckout(pack.code, "annual")}
                    disabled={processingPayment}
                    className="acm-btn-renew"
                    style={{ padding: "8px 16px", fontSize: "12px" }}
                  >
                    Buy Pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TAX INVOICE PRINT & DOWNLOAD (KERNN AUTOMATIONS BRANDED) */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box invoice-modal">
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="acm-modal-close no-print"
              aria-label="Close invoice"
            >
              <X size={18} />
            </button>

            <div className="acm-invoice-paper" id="kernn-tax-invoice">
              {/* Brand Accent Top Stripe */}
              <div className="acm-inv-brand-stripe"></div>

              {/* Header with Logo and Company Identity */}
              <div className="acm-inv-header">
                <div className="acm-inv-brand-col">
                  <img
                    src="/kernn-logo.png"
                    alt="Kernn Automations"
                    className="acm-inv-logo"
                  />
                  <div className="acm-inv-legal-name">
                    Kernn Automations Private Limited
                  </div>
                  <div className="acm-inv-subtext">
                    <strong>CIN:</strong> U62013TS2024PTC185379
                  </div>
                  <div className="acm-inv-subtext">
                    <strong>Registered Address:</strong> T-Hub 2.0, Plot No 1/C, Sy No 83/1, Raidurgam Panmaktha, Hyderabad Knowledge City, Serilingampally, Hyderabad, Telangana - 500081, India
                  </div>
                  <div className="acm-inv-subtext">
                    <strong>GSTIN:</strong> 36AAFCK1234A1ZP • <strong>State Code:</strong> 36 (Telangana)
                  </div>
                  <div className="acm-inv-subtext">
                    <strong>Email:</strong> support@kernn.io • <strong>Web:</strong> https://kernn.io
                  </div>
                </div>

                <div className="acm-inv-meta-col">
                  <div className="acm-inv-badge">TAX INVOICE</div>
                  <div className="acm-inv-type-sub">
                    Original for Recipient • SAC 997331
                  </div>
                  <div className="acm-inv-meta-grid">
                    <div className="acm-inv-meta-item">
                      <span className="acm-inv-meta-lbl">Invoice No</span>
                      <span className="acm-inv-meta-val highlight">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="acm-inv-meta-item">
                      <span className="acm-inv-meta-lbl">Date</span>
                      <span className="acm-inv-meta-val">
                        {new Date(selectedInvoice.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="acm-inv-meta-item">
                      <span className="acm-inv-meta-lbl">Payment ID</span>
                      <span className="acm-inv-meta-val mono">
                        {selectedInvoice.paymentId || selectedInvoice.id}
                      </span>
                    </div>
                    <div className="acm-inv-meta-item">
                      <span className="acm-inv-meta-lbl">Status</span>
                      <span className="acm-inv-status-pill paid">CONFIRMED & PAID</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties Section: Issuer (Kernn) vs Billed To (Client) */}
              <div className="acm-inv-parties">
                <div className="acm-inv-party-card billed-by">
                  <div className="acm-inv-party-tag">ISSUER (SERVICE PROVIDER)</div>
                  <div className="acm-inv-party-name">Kernn Automations Private Limited</div>
                  <div className="acm-inv-party-line">CIN: U62013TS2024PTC185379</div>
                  <div className="acm-inv-party-line">T-Hub 2.0, Hyderabad Knowledge City, Telangana - 500081</div>
                  <div className="acm-inv-party-line">GSTIN: 36AAFCK1234A1ZP | State: Telangana (36)</div>
                </div>

                <div className="acm-inv-party-card billed-to">
                  <div className="acm-inv-party-tag">BILLED TO (CLIENT / CUSTOMER)</div>
                  <div className="acm-inv-party-name">
                    {selectedInvoice.client?.name || "Anjali Constructions and Materials"}
                  </div>
                  <div className="acm-inv-party-line">
                    GSTIN: {selectedInvoice.client?.gstin || "37AAACA0000A1Z5"}
                  </div>
                  <div className="acm-inv-party-line">
                    {selectedInvoice.client?.address || "Plot 12, Industrial Corridor, Phase II, Visakhapatnam, AP, 530012"}
                  </div>
                  <div className="acm-inv-party-line">
                    Place of Supply: Andhra Pradesh (State Code: 37) — Inter-State Supply
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="acm-inv-table branded">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>#</th>
                    <th style={{ width: "52%" }}>Description of Software Entitlements & Services</th>
                    <th style={{ width: "13%" }}>HSN / SAC</th>
                    <th style={{ width: "15%" }}>Billing Term</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>1</td>
                    <td>
                      <div className="acm-inv-item-title">
                        {selectedInvoice.planName || "Enterprise Cloud License Subscription"}
                      </div>
                      <div className="acm-inv-item-desc">
                        Right to use computer software & central payment gateway orchestration architecture.
                      </div>
                      <ul className="acm-inv-features-mini">
                        <li>Direct-Drop Transit Inventory & Weighbridge Operations Engine</li>
                        <li>Multi-User Employee Seat Allocation & Role-Based Access Control</li>
                        <li>Automated Cryptographic Handshake & Invoice Ledger Verification</li>
                        <li>24x7 Priority Support, SLA Assurance & Daily Cloud Backups</li>
                      </ul>
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>997331</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {selectedInvoice.billingCycle || "Annual"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      ₹{Number(selectedInvoice.taxableAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals & Tax Breakdown */}
              <div className="acm-inv-bottom">
                <div className="acm-inv-notes-box">
                  <div className="acm-inv-notes-heading">Statutory & Tax Notes:</div>
                  <ul className="acm-inv-notes-list">
                    <li>Supply of software licensing services classified under Service Accounting Code (SAC) 997331.</li>
                    <li>Inter-State Supply: Integrated Goods and Services Tax (IGST) charged at 18%.</li>
                    <li>Input Tax Credit (ITC) is available to the recipient organization subject to statutory provisions.</li>
                  </ul>
                  <div className="acm-inv-stamp-wrap">
                    <div className="acm-inv-stamp">
                      <div className="stamp-inner">
                        <span>KERNN AUTOMATIONS</span>
                        <strong>DIGITALLY VERIFIED</strong>
                        <small>HYDERABAD • T-HUB 2.0</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="acm-inv-summary-card">
                  <div className="acm-inv-summary-row">
                    <span>Taxable Subtotal</span>
                    <span>
                      ₹{Number(selectedInvoice.taxableAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="acm-inv-summary-row">
                    <span>Integrated GST (IGST 18%)</span>
                    <span>
                      ₹{(
                        Number(selectedInvoice.cgstAmount || 0) +
                        Number(selectedInvoice.sgstAmount || 0)
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="acm-inv-summary-divider"></div>
                  <div className="acm-inv-grand-total">
                    <span className="total-label">Total Amount Paid</span>
                    <span className="total-value">
                      ₹{Number(selectedInvoice.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="acm-inv-words">
                    Amount in Words: Indian Rupees {Number(selectedInvoice.amount || 0).toLocaleString("en-IN")} Only
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="acm-inv-footer">
                <div className="acm-inv-footer-text">
                  This is a computer-generated tax invoice issued by Kernn Automations Private Limited pursuant to Rule 46 of the CGST Rules, 2017. No physical signature is required.
                </div>
                <div className="acm-inv-actions no-print">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="acm-btn-print-invoice"
                  >
                    <Printer size={16} />
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: SUPER ADMIN RAW PAYLOAD INSPECTOR */}
      {/* ========================================================================= */}
      {selectedLedgerTx && (
        <div className="acm-modal-overlay">
          <div className="acm-modal-box large">
            <button
              type="button"
              onClick={() => setSelectedLedgerTx(null)}
              className="acm-modal-close"
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px 0" }}>
              Raw Webhook Payload ({selectedLedgerTx.paymentId})
            </h3>
            <pre className="acm-raw-payload-box">
              {JSON.stringify(selectedLedgerTx.rawPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: UNIVERSAL IN-APP CONFIRMATION DIALOG MODAL */}
      {/* (Replaces native browser window.confirm / alert popups) */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="acm-modal-overlay" onClick={closeConfirm}>
          <div
            className="acm-confirm-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="acm-confirm-title"
          >
            <div className="acm-confirm-header">
              <div className={`acm-confirm-icon-wrap ${confirmModal.isDanger ? "danger" : "warning"}`}>
                <AlertTriangle size={24} />
              </div>
              <button
                type="button"
                className="acm-modal-close"
                onClick={closeConfirm}
                aria-label="Close confirmation dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="acm-confirm-body">
              <h3 id="acm-confirm-title" className="acm-confirm-title">
                {confirmModal.title}
              </h3>
              <p className="acm-confirm-msg">{confirmModal.message}</p>
            </div>

            <div className="acm-confirm-actions">
              <button
                type="button"
                className="acm-confirm-btn-cancel"
                onClick={closeConfirm}
                disabled={confirmModal.isLoading}
              >
                {confirmModal.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                className={`acm-confirm-btn-action ${confirmModal.isDanger ? "danger" : "primary"}`}
                disabled={confirmModal.isLoading}
                onClick={async () => {
                  if (typeof confirmModal.onConfirm === "function") {
                    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
                    try {
                      await confirmModal.onConfirm();
                    } catch (err) {
                      console.error("Action execution error:", err);
                    } finally {
                      setConfirmModal((prev) => ({ ...prev, isLoading: false, isOpen: false }));
                    }
                  } else {
                    closeConfirm();
                  }
                }}
              >
                {confirmModal.isLoading ? (
                  <>
                    <RefreshCw size={14} className="acm-spin" />
                    Processing...
                  </>
                ) : (
                  confirmModal.confirmText || "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: CONFIGURE PAYMENT CREDENTIALS MODAL */}
      {/* ========================================================================= */}
      {showCredentialsModal && (
        <div className="acm-modal-overlay" onClick={() => setShowCredentialsModal(false)}>
          <div
            className="acm-modal-box"
            style={{ maxWidth: 520, width: "100%", padding: 24, borderRadius: 16, background: "#ffffff", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <KeyRound size={22} style={{ color: "#4f46e5" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>Central Payment Credentials</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0 0" }}>KERNN Payment Orchestrator API Keys</p>
                </div>
              </div>
              <button
                type="button"
                className="acm-modal-close"
                onClick={() => setShowCredentialsModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
              Enter the credentials issued for your organization on <strong>https://payments.kernn.ai</strong>. This authenticates all checkout session requests and verifies incoming webhook callbacks.
            </div>

            <form onSubmit={handleSaveCredentials}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Central API Key <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. e263ee022345ecfda6be84cc..."
                  value={credentialsForm.apiKey}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, apiKey: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Webhook Secret (HMAC-SHA256)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50aa72a3008ab11879e912b..."
                  value={credentialsForm.webhookSecret}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, webhookSecret: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    background: "#f1f5f9",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: 13,
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                  disabled={savingCredentials}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCredentials}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {savingCredentials ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Saving & Verifying...
                    </>
                  ) : (
                    "Save & Verify"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
