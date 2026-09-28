import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, ShieldAlert, ArrowRight, X, CreditCard } from "lucide-react";

import styles from "./LicenseBanner.module.css";

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
      <aside aria-label="Software License Alert" className={styles.banner}>
        <div className={styles.contentGroup} onClick={handleActionClick} style={{ cursor: "pointer" }}>
          <ShieldAlert size={19} color="#ffffff" className={styles.icon} />
          <div className={styles.textWrapper}>
            <span className={styles.badge}>
              [UNLICENSED]
            </span>
            <span className={styles.message}>
              {license.reason || "Subscription inactive. Activate license to create & dispatch orders."}
            </span>
          </div>
        </div>

        <div className={styles.actionGroup}>
          <button onClick={handleActionClick} className={styles.actionBtn}>
            <CreditCard size={14} color="#dc2626" />
            <span>Buy License</span>
            <ArrowRight size={13} color="#dc2626" />
          </button>
        </div>
      </aside>
    );
  }

  // Grace period or expiring soon warning
  return (
    <aside
      aria-label="Software License Notice"
      className={`${styles.warningBanner} ${isUrgent ? styles.urgent : ""}`}
    >
      <div className={styles.contentGroup} onClick={handleActionClick} style={{ cursor: "pointer" }}>
        {isUrgent ? (
          <ShieldAlert size={19} color="#dc2626" className={styles.icon} />
        ) : (
          <AlertTriangle size={19} color="#d97706" className={styles.icon} />
        )}
        <div className={styles.textWrapper}>
          <span className={styles.warningBadge}>
            {isSoftLocked
              ? "[EXPIRED]"
              : isInGrace
              ? "[GRACE PERIOD]"
              : "[NOTICE]"}
          </span>
          <span className={styles.message}>
            {license.activeReminder?.message ||
              `License expires in ${license.daysRemaining} days. Renew now to avoid lock.`}
          </span>
        </div>
      </div>

      <div className={styles.actionGroup}>
        <button
          onClick={handleActionClick}
          className={`${styles.warningBtn} ${isUrgent ? styles.urgentBtn : ""}`}
        >
          <span>Renew License</span>
          <ArrowRight size={13} />
        </button>

        {!isUrgent && (
          <button
            onClick={() => setDismissed(true)}
            className={styles.dismissBtn}
            aria-label="Dismiss banner"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}
