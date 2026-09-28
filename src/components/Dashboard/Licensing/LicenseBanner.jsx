import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, ShieldAlert, ArrowRight, X } from "lucide-react";

export default function LicenseBanner() {
  const [license, setLicense] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  useEffect(() => {
    fetchStatus();
    // Poll status every 2 minutes
    const interval = setInterval(fetchStatus, 120000);
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

  // Don't show banner if already locked out (the lockout overlay handles that)
  if (license.isLockedOut && license.lockoutMode === "HARD") return null;

  // Check if warning is active
  const hasReminder = Boolean(license.activeReminder);
  const isInGrace = Boolean(license.isInGracePeriod);
  const isSoftLocked = license.lockoutMode === "SOFT" && license.status === "EXPIRED";

  if (!hasReminder && !isInGrace && !isSoftLocked) {
    return null;
  }

  // Allow dismissing only for low-severity INFO notifications
  if (dismissed && license.activeReminder?.severity === "INFO") {
    return null;
  }

  const isUrgent = isInGrace || isSoftLocked || license.activeReminder?.severity === "URGENT";

  return (
    <div
      style={{
        backgroundColor: isUrgent ? "#fef2f2" : "#fffbeb",
        borderBottom: `2px solid ${isUrgent ? "#ef4444" : "#f59e0b"}`,
        color: isUrgent ? "#991b1b" : "#92400e",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "13px",
        fontWeight: 600,
        position: "sticky",
        top: 0,
        zIndex: 95,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        {isUrgent ? (
          <ShieldAlert size={20} color="#dc2626" style={{ flexShrink: 0 }} />
        ) : (
          <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
        )}
        <div>
          <span style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 6 }}>
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
          onClick={() => navigate("/settings/license")}
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
    </div>
  );
}
