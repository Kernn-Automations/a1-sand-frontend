import React, { useState } from "react";
import axios from "axios";
import { KeyRound, CheckCircle, AlertCircle, X, Eye, EyeOff } from "lucide-react";

export default function PasskeyModal({ isOpen, onClose }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const VITE_API = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("accessToken");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(pin)) {
      setError("Passkey must be exactly 4 numeric digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("Passkeys do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${VITE_API}/auth/mpin/setup`,
        { mpin: pin },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200 || res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPin("");
          setConfirmPin("");
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to set Passkey. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "#fff7ed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ea580c",
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Set Login Passkey
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                Instant login without waiting for SMS OTPs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {success ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              <CheckCircle
                size={48}
                color="#16a34a"
                style={{ margin: "0 auto 12px" }}
              />
              <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "#0f172a" }}>
                Passkey Updated!
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                You can now log in instantly using your new Passkey.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#dc2626",
                    fontSize: "13px",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  New 4-Digit Passkey
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                    }
                    placeholder="Enter 4 digits (e.g. 1234)"
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "16px",
                      letterSpacing: "4px",
                      fontWeight: 600,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 0,
                    }}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Confirm 4-Digit Passkey
                </label>
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(
                      e.target.value.replace(/[^0-9]/g, "").slice(0, 4)
                    )
                  }
                  placeholder="Re-enter 4 digits"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "16px",
                    letterSpacing: "4px",
                    fontWeight: 600,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "20px",
                  lineHeight: 1.4,
                }}
              >
                🔒 Your passkey is encrypted with bcrypt and stored securely. You can use it to sign in without receiving SMS OTPs.
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor:
                      loading || pin.length !== 4 || confirmPin.length !== 4
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      loading || pin.length !== 4 || confirmPin.length !== 4
                        ? 0.6
                        : 1,
                    boxShadow: "0 2px 6px rgba(234, 88, 12, 0.3)",
                  }}
                >
                  {loading ? "Saving..." : "Save Passkey"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
