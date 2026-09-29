import React, { useState, useEffect } from "react";
import axios from "axios";
import { Lock, ShieldAlert, CheckCircle, RefreshCw, KeyRound, ArrowRight, ExternalLink } from "lucide-react";
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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    checkLicense();
    fetchPlans();
  }, []);

  // Only poll if currently locked out in HARD mode to detect external unlocks
  useEffect(() => {
    if (license?.isLockedOut && license?.lockoutMode === "HARD") {
      const interval = setInterval(checkLicense, 6000);
      return () => clearInterval(interval);
    }
  }, [license?.isLockedOut, license?.lockoutMode]);

  const checkLicense = async () => {
    try {
      const res = await axios.get(`${API_URL}/license/status`);
      if (res.data?.success) {
        setLicense(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch license status:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_URL}/license/plans`);
      if (res.data?.success) {
        setPlans(res.data.plans || []);
      }
    } catch (err) {
      console.warn("Could not fetch plans:", err.message);
    }
  };

  // Only render if locked out in HARD mode
  if (loading || !license) return null;
  if (!license.isLockedOut || license.lockoutMode !== "HARD") return null;

  const handleInitiatePayment = async () => {
    try {
      setProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const plan = plans.find((p) => p.id === selectedPlan) || plans[0];
      const res = await axios.post(`${API_URL}/api/checkout/initiate`, {
        planId: plan ? plan.id : "ANNUAL_ENTERPRISE",
        billingCycle: plan?.billingCycle || "annual",
      });

      if (res.data?.success) {
        const { checkoutParams, razorpayOrderId, internalOrderId } = res.data;

        // Check if Razorpay script is available in window
        if (window.Razorpay && checkoutParams) {
          const rzp = new window.Razorpay({
            key: checkoutParams.key,
            amount: checkoutParams.amount,
            currency: checkoutParams.currency || "INR",
            name: checkoutParams.name || "Anjali Constructions and Materials",
            description: checkoutParams.description,
            order_id: razorpayOrderId,
            handler: async function (response) {
              setProcessing(true);
              setSuccessMessage("Payment received on gateway! Verifying webhook confirmation...");
              // Poll for backend webhook confirmation
              let attempts = 0;
              const pollInterval = setInterval(async () => {
                attempts += 1;
                await checkLicense();
                if (attempts >= 10) {
                  clearInterval(pollInterval);
                  setProcessing(false);
                }
              }, 2000);
            },
            prefill: {
              name: "Anjali Constructions Administrator",
              email: "admin@anjaliconstructions.com",
            },
            theme: {
              color: "#ea580c",
            },
          });
          rzp.open();
        } else if (res.data?.checkoutUrl || res.data?.paymentUrl) {
          // Redirect to central checkout page
          window.location.href = res.data.checkoutUrl || res.data.paymentUrl;
        } else {
          setErrorMessage("Online payment gateway is temporarily unreachable. Please contact the administrator or apply an offline license key.");
          setProcessing(false);
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to initiate renewal.");
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(12px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          maxWidth: "620px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Top Warning Banner */}
        <div
          style={{
            backgroundColor: "#dc2626",
            padding: "16px 24px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              padding: "10px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={28} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, letterSpacing: "-0.01em" }}>
              System License Expired & Locked Out
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.9 }}>
              Operational and financial workflows are temporarily suspended.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Org & License Info */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Logo size={36} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
                  Anjali Constructions & Materials
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                  Key: {license.licenseKey}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                ● {license.status}
              </span>
              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>
                Expired on {new Date(license.validUntil).toLocaleDateString()}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
            To protect company data integrity and ensure non-tampered financial reporting, active access requires
            a verified subscription. Choose a plan below to renew instantly via the <strong>Central Payments Server</strong>.
          </p>

          {/* Plan Selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {plans.map((p) => {
              const isSelected = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    border: `2px solid ${isSelected ? "#ea580c" : "#e2e8f0"}`,
                    backgroundColor: isSelected ? "#fff7ed" : "#ffffff",
                    borderRadius: "10px",
                    padding: "14px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p.popular && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-9px",
                        right: "12px",
                        backgroundColor: "#ea580c",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "9px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      Best Value
                    </span>
                  )}
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#ea580c", margin: "6px 0 2px" }}>
                    ₹{p.priceRupees?.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {p.durationMonths === 12 ? "Billed annually" : "Billed monthly"}
                  </div>
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                marginBottom: "14px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            disabled={processing}
            onClick={handleInitiatePayment}
            style={{
              width: "100%",
              backgroundColor: "#ea580c",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: processing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
              transition: "all 0.15s ease",
            }}
          >
            {processing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>Renew License & Restore Instant Access</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Emergency Offline Key Section */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              onClick={() => setShowOfflineInput(!showOfflineInput)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {showOfflineInput ? "Hide offline key input" : "Have an emergency offline license key?"}
            </button>

            {showOfflineInput && (
              <form onSubmit={handleApplyOfflineKey} style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Paste signed license key token..."
                  value={offlineKey}
                  onChange={(e) => setOfflineKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Activate
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "12px 24px",
            fontSize: "11px",
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Secured by Kernn Payment Orchestrator & Razorpay</span>
          <span>Support: support@kernn.ai</span>
        </div>
      </div>
    </div>
  );
}
