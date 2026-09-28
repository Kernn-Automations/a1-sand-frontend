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
import styles from "./LicenseActivationModal.module.css";

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Top Header Banner */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <ShieldAlert size={24} color="#ffffff" />
            </div>
            <div>
              <div className={styles.badge}>
                ● NO ACTIVE LICENSE
              </div>
              <h2 className={styles.title}>
                Activate Software License
              </h2>
              <p className={styles.subtitle}>
                Anjali Constructions &amp; Materials Enterprise Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={styles.closeBtn}
            title="Close (Keep notice)"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Warning summary note */}
          <div className={styles.noticeBox}>
            <Lock size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                Enterprise License Inactive
              </div>
              <div>
                Order creation, dispatch challans, and staff logins require an active subscription license.
              </div>
            </div>
          </div>

          {/* Plan selection grid */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Choose a Renewal Subscription Tier:
            </label>

            <div className={styles.plansGrid}>
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""}`}
                  >
                    {p.popular && (
                      <span className={styles.popularBadge}>
                        Most Popular
                      </span>
                    )}

                    <div className={styles.planName}>{p.name}</div>
                    <div className={styles.planPrice}>
                      ₹{p.priceRupees?.toLocaleString("en-IN")}
                      <span className={styles.planBilling}>
                        {" "}
                        / {p.billingCycle || "month"}
                      </span>
                    </div>
                    <div className={styles.planDesc}>
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
                fontSize: "12px",
                marginBottom: "14px",
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
                fontSize: "12px",
                marginBottom: "14px",
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
          <button onClick={handleBuyLicense} className={styles.buyBtn}>
            <CreditCard size={17} />
            <span>Buy Software License Now</span>
            <ArrowRight size={17} />
          </button>

          {/* Offline Activation Key Accordion */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setShowOfflineInput(!showOfflineInput)}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "12px",
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
                  marginTop: "10px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Paste key (e.g. ACM-LIC-...)"
                  value={offlineKey}
                  onChange={(e) => setOfflineKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    outline: "none",
                    minWidth: 0,
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
                    borderRadius: "8px",
                    padding: "9px 14px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: processing ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {processing ? "..." : "Activate"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.footerBtn}>
            Remind Me Later
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/settings/license");
            }}
            className={styles.footerLinkBtn}
          >
            <span>Full Licensing Portal</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
