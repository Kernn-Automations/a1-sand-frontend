import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaLock, FaExclamationTriangle } from "react-icons/fa";

const LicenseContext = createContext(null);

export const LicenseProvider = ({ children }) => {
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const fetchLicenseStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/license/status`);
      if (res.data?.success) {
        setLicenseStatus(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.warn("Could not fetch license status:", err?.message);
    } finally {
      setLoading(false);
    }
    return null;
  }, [API_URL]);

  useEffect(() => {
    fetchLicenseStatus();

    // Check periodically every 60 seconds
    const interval = setInterval(fetchLicenseStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchLicenseStatus]);

  const isSubscribed = Boolean(
    licenseStatus &&
    licenseStatus.isValid &&
    licenseStatus.status === "ACTIVE"
  );

  const isCreationDisabled = !isSubscribed;

  const disabledMessage =
    "Creation Disabled: Software license is not active or subscription has expired. Please buy or activate a license package to create records.";

  const value = {
    licenseStatus,
    loading,
    isSubscribed,
    isCreationDisabled,
    disabledMessage,
    refreshLicense: fetchLicenseStatus,
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      licenseStatus: null,
      loading: false,
      isSubscribed: false,
      isCreationDisabled: true,
      disabledMessage:
        "Creation Disabled: Software license is not active or subscription has expired. Please buy or activate a license package to create records.",
      refreshLicense: () => {},
    };
  }
  return context;
};

/**
 * Reusable banner component to display on any creation page/modal when license is inactive
 */
export const LicenseCreationBanner = ({ actionName = "record" }) => {
  const { isCreationDisabled } = useLicense();
  const navigate = useNavigate();

  if (!isCreationDisabled) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        padding: "12px 18px",
        background: "#fef2f2",
        border: "1.5px solid #f87171",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 2px 4px rgba(220, 38, 38, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dc2626",
            flexShrink: 0,
          }}
        >
          <FaLock size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#991b1b" }}>
            Creation Disabled: No Active Software License
          </div>
          <div style={{ fontSize: "12.5px", color: "#b91c1c", marginTop: "2px" }}>
            Creating {actionName} is currently disabled. Subscribing or activating a license is required to create new records.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/settings/license")}
        style={{
          padding: "8px 18px",
          background: "#dc2626",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "12.5px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
      >
        Buy Software License
      </button>
    </div>
  );
};

export default LicenseContext;
