import React, { useState, useEffect } from "react";
import axios from "axios";
import { Lock, CheckCircle, RefreshCw, ArrowRight, ExternalLink, X } from "lucide-react";
import Logo from "../navs/Logo";

export default function LicenseLockoutOverlay() {
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("ANNUAL_ENTERPRISE");
  const [processing, setProcessing] = useState(false);
  const [offlineKey, setOfflineKey] = useState("");
  const [showOfflineInput, setShowOfflineInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [checkoutSession, setCheckoutSession] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    checkLicense();
    fetchPlans();
  }, []);

  // Poll base license status (external admin unlocks etc.), but only when no checkout is in progress
  useEffect(() => {
    if (license?.isLockedOut && license?.lockoutMode === "HARD" && !checkoutSession) {
      const interval = setInterval(checkLicense, 8000);
      return () => clearInterval(interval);
    }
  }, [license?.isLockedOut, license?.lockoutMode, checkoutSession]);

  // Poll invoice status during active checkout
  useEffect(() => {
    if (!checkoutSession?.invoiceId || checkoutSession.status !== "checking") return;
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const pollRes = await axios.get(
          `${API_URL}/api/licensing/invoices/${checkoutSession.invoiceId}/status`
        );
        if (!isMounted) return;
        const remoteStatus = (pollRes.data?.status || "").toLowerCase();
        if (pollRes.data?.isPaid || remoteStatus === "paid") {
          setCheckoutSession((prev) => (prev ? { ...prev, status: "paid" } : null));
          clearInterval(interval);
          await checkLicense();
        } else if (remoteStatus === "cancelled" || remoteStatus === "failed" || remoteStatus === "expired") {
          setCheckoutSession((prev) => (prev ? { ...prev, status: remoteStatus } : null));
          clearInterval(interval);
        }
      } catch (err) {
        console.warn("[LockoutOverlay] Poll error:", err.message);
      }
    }, 2500);
    return () => { isMounted = false; clearInterval(interval); };
  }, [checkoutSession?.invoiceId, checkoutSession?.status]);

  const checkLicense = async () => {
    try {
      const res = await axios.get(`${API_URL}/license/status`);
      if (res.data?.success) setLicense(res.data.data);
    } catch (err) {
      console.warn("Could not fetch license status:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_URL}/license/plans`);
      if (res.data?.success) setPlans(res.data.plans || []);
    } catch (err) {
      console.warn("Could not fetch plans:", err.message);
    }
  };

  if (loading || !license) return null;
  if (!license.isLockedOut || license.lockoutMode !== "HARD") return null;

  const handleInitiatePayment = async () => {
    try {
      setProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");
      const plan = plans.find((p) => p.id === selectedPlan) || plans[0];
      const token = localStorage.getItem("accessToken");
      let res;
      try {
        res = await axios.post(
          `${API_URL}/api/licensing/initiate-order`,
          {
            planId: plan ? plan.id || plan.package_code : "ANNUAL_ENTERPRISE",
            billingCycle: plan?.billingCycle || plan?.billing_cycle || "annual",
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      } catch (postErr) {
        if (postErr.response?.status === 409 && postErr.response?.data?.pendingOrder) {
          const po = postErr.response.data.pendingOrder;
          if (po.paymentUrl) window.open(po.paymentUrl, "_blank");
          setCheckoutSession({
            invoiceId: po.id,
            invoiceNumber: po.invoiceNumber || po.invoice_number,
            amount: po.amount,
            planName: plan?.name || "License Subscription",
            paymentUrl: po.paymentUrl,
            status: "checking",
          });
          setProcessing(false);
          return;
        }
        throw postErr;
      }
      if (res.data?.status === "paid") {
        setSuccessMessage("License activated successfully!");
        await checkLicense();
        setProcessing(false);
        return;
      }
      if (res.data?.paymentUrl) {
        window.open(res.data.paymentUrl, "_blank");
        setCheckoutSession({
          invoiceId: res.data.invoiceId || res.data.order?.id,
          invoiceNumber: res.data.invoiceNumber || res.data.order?.invoice_number,
          amount: res.data.amount || res.data.order?.amount,
          planName: plan?.name || "Software License",
          paymentUrl: res.data.paymentUrl,
          status: "checking",
        });
      } else {
        setErrorMessage("Online payment gateway is temporarily unreachable. Please contact the administrator or apply an offline license key.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to initiate renewal.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyOfflineKey = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      setErrorMessage("");
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${API_URL}/license/apply-offline-key`,
        { licenseKey: offlineKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setSuccessMessage("Offline key validated! Refreshing license...");
        await checkLicense();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Invalid emergency offline license key.");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Checkout polling popup ───
  if (checkoutSession) {
    const isCancelledOrFailed = checkoutSession.status === "cancelled" || checkoutSession.status === "failed";
    const isPaid = checkoutSession.status === "paid";
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.96)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", maxWidth: "460px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: isPaid ? "#ecfdf5" : isCancelledOrFailed ? "#fee2e2" : "#fff7ed", border: isPaid ? "1px solid #a7f3d0" : isCancelledOrFailed ? "1px solid #fca5a5" : "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", color: isPaid ? "#10b981" : isCancelledOrFailed ? "#dc2626" : "#ea580c" }}>
              {isPaid ? <CheckCircle size={20} /> : isCancelledOrFailed ? <X size={18} /> : <RefreshCw size={18} style={{ animation: "spin 1.4s linear infinite" }} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                {isPaid ? "Payment Confirmed!" : isCancelledOrFailed ? (checkoutSession.status === "failed" ? "Payment Failed" : "Payment Cancelled") : "Awaiting Payment Confirmation"}
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>Order #{checkoutSession.invoiceNumber || checkoutSession.invoiceId}</p>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: "20px 24px" }}>
            {isPaid ? (
              <p style={{ color: "#15803d", fontWeight: 600, fontSize: "14px", margin: 0 }}>🎉 Your license has been activated! Click below to continue.</p>
            ) : isCancelledOrFailed ? (
              <>
                <p style={{ color: "#b91c1c", fontWeight: 600, fontSize: "14px", margin: "0 0 8px" }}>{checkoutSession.status === "failed" ? "Your payment could not be processed." : "The payment was cancelled."}</p>
                <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>No charges were made. You can try again by clicking Renew License.</p>
              </>
            ) : (
              <>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 14px", lineHeight: 1.6 }}>Complete your payment in the opened browser tab. Your license activates automatically once confirmed.</p>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ color: "#64748b" }}>Plan</span><strong>{checkoutSession.planName}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#64748b" }}>Amount</span><strong style={{ color: "#ea580c" }}>Rs.{Number(checkoutSession.amount || 0).toLocaleString("en-IN")}</strong></div>
                </div>
              </>
            )}
          </div>
          {/* Footer */}
          <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            {isPaid ? (
              <button onClick={() => { setCheckoutSession(null); checkLicense(); }} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Refresh & Continue</button>
            ) : isCancelledOrFailed ? (
              <button onClick={() => setCheckoutSession(null)} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Close</button>
            ) : (
              <>
                {checkoutSession.paymentUrl && (
                  <button onClick={() => window.open(checkoutSession.paymentUrl, "_blank")} style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ExternalLink size={13} /> Reopen Payment
                  </button>
                )}
                <button onClick={() => setCheckoutSession(null)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: "12px", color: "#64748b" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main lockout screen ───
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.94)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", maxWidth: "620px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        {/* Top Warning Banner */}
        <div style={{ backgroundColor: "#dc2626", padding: "16px 24px", color: "#ffffff", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, letterSpacing: "-0.01em" }}>System License Expired & Locked Out</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.9 }}>Operational and financial workflows are temporarily suspended.</p>
          </div>
        </div>
        {/* Content Body */}
        <div style={{ padding: "24px 28px" }}>
          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Logo size={36} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>Anjali Constructions & Materials</div>
                <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>Key: {license.licenseKey}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>● {license.status}</span>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Expired on {new Date(license.validUntil).toLocaleDateString()}</div>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>To protect company data integrity and ensure non-tampered financial reporting, active access requires a verified subscription. Choose a plan below to renew instantly via the <strong>Central Payments Server</strong>.</p>
          {/* Plan Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              return (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ border: `2px solid ${isSelected ? "#ea580c" : "#e2e8f0"}`, backgroundColor: isSelected ? "#fff7ed" : "#ffffff", borderRadius: "10px", padding: "14px", cursor: "pointer", position: "relative", transition: "all 0.15s ease" }}>
                  {p.popular && (<span style={{ position: "absolute", top: "-9px", right: "12px", backgroundColor: "#ea580c", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "9px", fontWeight: 800, textTransform: "uppercase" }}>Best Value</span>)}
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#ea580c", margin: "6px 0 2px" }}>Rs.{p.priceRupees?.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{p.durationMonths === 12 ? "Billed annually" : "Billed monthly"}</div>
                </div>
              );
            })}
          </div>
          {errorMessage && (<div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", marginBottom: "14px" }}>{errorMessage}</div>)}
          {successMessage && (<div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} /><span>{successMessage}</span></div>)}
          {/* Action Button */}
          <button disabled={processing} onClick={handleInitiatePayment} style={{ width: "100%", backgroundColor: "#ea580c", color: "#ffffff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "14px", fontWeight: 800, cursor: processing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)", transition: "all 0.15s ease" }}>
            {processing ? (<><RefreshCw size={18} className="animate-spin" /><span>Opening Payment Window...</span></>) : (<><span>Renew License & Restore Instant Access</span><ArrowRight size={18} /></>)}
          </button>
          {/* Emergency Offline Key */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button onClick={() => setShowOfflineInput(!showOfflineInput)} style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}>{showOfflineInput ? "Hide offline key input" : "Have an emergency offline license key?"}</button>
            {showOfflineInput && (
              <form onSubmit={handleApplyOfflineKey} style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <input type="text" placeholder="Paste signed license key token..." value={offlineKey} onChange={(e) => setOfflineKey(e.target.value)} style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontFamily: "monospace" }} required />
                <button type="submit" disabled={processing} style={{ backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Activate</button>
              </form>
            )}
          </div>
        </div>
        {/* Footer */}
        <div style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "12px 24px", fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Secured by Kernn Payment Orchestrator & Razorpay</span>
          <span>Support: support@kernn.ai</span>
        </div>
      </div>
    </div>
  );
}
