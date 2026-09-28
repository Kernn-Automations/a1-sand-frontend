import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  CreditCard,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  X,
  RefreshCw,
  ExternalLink,
  Lock,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function LicenseActivationModal({
  isOpen,
  onClose,
  license,
  onRefreshLicense,
}) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY_PRO");
  const [offlineKey, setOfflineKey] = useState("");
  const [showOfflineInput, setShowOfflineInput] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_URL}/license/plans`);
      if (res.data?.success && res.data.plans?.length > 0) {
        setPlans(res.data.plans);
        setSelectedPlan(res.data.plans[0].id);
      } else {
        // Fallback default enterprise packages if none found in DB
        setPlans([
          {
            id: "MONTHLY_PRO",
            name: "Monthly Subscription",
            billingCycle: "monthly",
            priceRupees: 10000,
            amountPaise: 1000000,
            includedSeats: 10,
            description: "Full enterprise access for sand & materials operations",
          },
          {
            id: "ANNUAL_ENTERPRISE",
            name: "Annual Enterprise Plan",
            billingCycle: "annual",
            priceRupees: 99990,
            amountPaise: 9999000,
            includedSeats: 50,
            popular: true,
            description: "Best value with 2 months free and priority SLA",
          },
        ]);
        setSelectedPlan("MONTHLY_PRO");
      }
    } catch (err) {
      console.warn("Could not fetch license plans:", err.message);
    }
  };

  if (!isOpen) return null;

  const handleBuyLicense = () => {
    onClose();
    navigate("/settings/license");
  };

  const handleApplyOfflineKey = async (e) => {
    e.preventDefault();
    if (!offlineKey.trim()) return;

    try {
      setProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${API_URL}/license/apply-offline-key`,
        { licenseKey: offlineKey.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setSuccessMessage("Offline license key successfully validated and activated!");
        if (onRefreshLicense) {
          await onRefreshLicense();
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Invalid offline license key. Please verify with Kernn Automations."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.82)",
        backdropFilter: "blur(8px)",
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          overflow: "hidden",
          animation: "modalFadeIn 0.25s ease-out",
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            padding: "22px 26px",
            color: "#ffffff",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                padding: "10px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={28} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.22)",
                  padding: "3px 8px",
                  borderRadius: "9999px",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  marginBottom: "4px",
                }}
              >
                ● NO ACTIVE LICENSE DETECTED
              </div>
              <h2
                style={{
                  margin: "0 0 2px 0",
                  fontSize: "19px",
                  fontWeight: 800,
                  letterSpacing: "-0.4px",
                }}
              >
                Activate Software License
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  opacity: 0.9,
                  lineHeight: 1.4,
                }}
              >
                Anjali Constructions &amp; Materials Enterprise Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              padding: 0,
              transition: "background 0.15s ease",
            }}
            title="Close (Keep sticky notice)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Warning summary note */}
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <Lock size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px", color: "#991b1b", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                Enterprise License Expired or Inactive
              </div>
              <div>
                Operational features like <strong>direct-drop dispatch</strong>, <strong>authenticated delivery challans</strong>, and <strong>multi-user staff logins</strong> require an active license.
              </div>
            </div>
          </div>

          {/* Plan selection grid */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "10px",
              }}
            >
              Choose a Renewal Subscription Tier:
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: plans.length > 1 ? "1fr 1fr" : "1fr",
                gap: "12px",
              }}
            >
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      border: `2px solid ${isSelected ? "#ea580c" : "#e2e8f0"}`,
                      backgroundColor: isSelected ? "#fff7ed" : "#ffffff",
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p.popular && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-10px",
                          right: "12px",
                          backgroundColor: "#ea580c",
                          color: "#ffffff",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "9.5px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Most Popular
                      </span>
                    )}

                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#ea580c",
                        margin: "6px 0 4px",
                      }}
                    >
                      ₹{p.priceRupees?.toLocaleString("en-IN")}
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                        {" "}
                        / {p.billingCycle || "month"}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.4 }}>
                      {p.includedSeats ? `${p.includedSeats} staff seats included` : p.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12.5px",
                marginBottom: "16px",
                lineHeight: 1.4,
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
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12.5px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} color="#15803d" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleBuyLicense}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
              transition: "all 0.15s ease",
            }}
          >
            <CreditCard size={18} />
            <span>Buy Software License Now</span>
            <ArrowRight size={18} />
          </button>

          {/* Offline Activation Key Accordion */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setShowOfflineInput(!showOfflineInput)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              {showOfflineInput
                ? "Hide offline activation key"
                : "Have an emergency offline license key from Kernn?"}
            </button>

            {showOfflineInput && (
              <form
                onSubmit={handleApplyOfflineKey}
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Paste activation key (e.g. ACM-LIC-...)"
                  value={offlineKey}
                  onChange={(e) => setOfflineKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "12.5px",
                    fontFamily: "monospace",
                    outline: "none",
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
                    borderRadius: "10px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: processing ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {processing ? "Validating..." : "Activate"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "14px 26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            Remind Me Later (Keep Notice)
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/settings/license");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#ea580c",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>Full Licensing Portal</span>
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
