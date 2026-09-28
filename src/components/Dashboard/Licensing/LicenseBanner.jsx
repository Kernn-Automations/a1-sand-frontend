import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, ShieldAlert, ArrowRight, X, CreditCard } from "lucide-react";

export default function LicenseBanner({ onOpenModal }) {
  const [license, setLicense] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchStatus();
    // Poll status every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/license/status`);
      if (res.data?.success) {
        setLicense(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch license status:", err.message);
    }
  };

  if (!license) return null;

  // Check critical license states
  const isNoActiveLicense =
    !license.isValid ||
    license.status === "UNLICENSED" ||
    license.status === "EXPIRED" ||
    license.status === "LOCKED_OUT" ||
    license.status === "TAMPERED_LOCKED";

  const hasReminder = Boolean(license.activeReminder);
  const isInGrace = Boolean(license.isInGracePeriod);
  const isSoftLocked = license.lockoutMode === "SOFT" && license.status === "EXPIRED";

  // If valid with no warning/grace period, do not display
  if (!isNoActiveLicense && !hasReminder && !isInGrace && !isSoftLocked) {
    return null;
  }

  // Allow dismissing ONLY for low-severity INFO reminders when license is still valid
  if (dismissed && !isNoActiveLicense && !isInGrace && license.activeReminder?.severity === "INFO") {
    return null;
  }

  const isUrgent = isNoActiveLicense || isInGrace || isSoftLocked || license.activeReminder?.severity === "URGENT";

  const handleActionClick = () => {
    if (onOpenModal) {
      onOpenModal();
    } else {
      navigate("/settings/license");
    }
  };

  // Red theme for expired / unlicensed state
  if (isNoActiveLicense) {
    return (
      <aside
        aria-label="Software License Alert"
        style={{
          background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
          color: "#ffffff",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          fontSize: "13px",
          fontWeight: 600,
          position: "sticky",
          top: 0,
          zIndex: 110,
          boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          <ShieldAlert size={20} color="#ffffff" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.22)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 800,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginRight: 8,
                display: "inline-block",
              }}
            >
              [NO ACTIVE LICENSE]
            </span>
            <span style={{ opacity: 0.95 }}>
              {license.reason ||
                "Your software license is expired or not activated. Purchase or activate an enterprise license to prevent operational disruptions."}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <button
            onClick={handleActionClick}
            style={{
              backgroundColor: "#ffffff",
              color: "#dc2626",
              border: "none",
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "12.5px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <CreditCard size={15} color="#dc2626" />
            <span>Buy Software License</span>
            <ArrowRight size={14} color="#dc2626" />
          </button>
        </div>
      </aside>
    );
  }

  // Grace period or expiring soon warning
  return (
    <aside
      aria-label="Software License Notice"
      style={{
        backgroundColor: isUrgent ? "#fef2f2" : "#fffbeb",
        borderBottom: `2px solid ${isUrgent ? "#ef4444" : "#f59e0b"}`,
        color: isUrgent ? "#991b1b" : "#92400e",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "13px",
        fontWeight: 600,
        position: "sticky",
        top: 0,
        zIndex: 110,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        {isUrgent ? (
          <ShieldAlert size={20} color="#dc2626" style={{ flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginRight: 6,
            }}
          >
            {isSoftLocked
              ? "[READ-ONLY MODE: LICENSE EXPIRED]"
              : isInGrace
              ? "[GRACE PERIOD ACTIVE]"
              : "[LICENSE NOTICE]"}
          </span>
          <span>
            {license.activeReminder?.message ||
              `System license expires in ${license.daysRemaining} days. Renew now to prevent workflow interruption.`}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <button
          onClick={handleActionClick}
          style={{
            backgroundColor: isUrgent ? "#dc2626" : "#d97706",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.15s ease",
          }}
        >
          <span>Renew License</span>
          <ArrowRight size={14} />
        </button>

        {!isUrgent && (
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: "none",
              border: "none",
              color: "#92400e",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
