import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  X,
  Laptop,
  Smartphone,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  isPasskeySupported,
  registerPasskeyOnThisDevice,
} from "../../services/passkeyService";

const detectDefaultDeviceName = () => {
  const ua = navigator.userAgent;
  let os = "Computer";
  let browser = "Browser";

  if (/windows/i.test(ua)) os = "Windows PC";
  else if (/macintosh|mac os x/i.test(ua)) os = "Mac";
  else if (/iphone/i.test(ua)) os = "iPhone";
  else if (/ipad/i.test(ua)) os = "iPad";
  else if (/android/i.test(ua)) os = "Android Device";
  else if (/linux/i.test(ua)) os = "Linux PC";

  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return `${os} (${browser})`;
};

export default function PasskeyPromptModal({ user, onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [deviceName, setDeviceName] = useState(detectDefaultDeviceName());

  const userId = user?.id || user?.employeeId;

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await registerPasskeyOnThisDevice(deviceName);

      if (userId) {
        localStorage.setItem(`passkey_registered_${userId}`, "true");
        localStorage.setItem(
          `passkey_device_${userId}`,
          JSON.stringify({
            registeredAt: new Date().toISOString(),
            name: result?.deviceName || deviceName,
          })
        );
      }

      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error("Passkey registration failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create passkey on this device."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (userId) {
      sessionStorage.setItem(`passkey_prompt_dismissed_${userId}`, "true");
    }
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "480px",
          width: "100%",
          padding: "28px",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          position: "relative",
          animation: "scaleIn 0.25s ease-out",
        }}
      >
        {/* Dismiss Button */}
        <button
          onClick={handleSkip}
          disabled={loading}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                backgroundColor: "#ecfdf5",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={40} />
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "8px",
              }}
            >
              Passkey Enabled!
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              This device is now registered. You can now log in instantly using
              Fingerprint, Face ID, or Windows Hello with zero SMS OTP delays.
            </p>
          </div>
        ) : (
          <>
            {/* Header Badge & Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 8px 16px -4px rgba(234, 88, 12, 0.4)",
                }}
              >
                <Fingerprint size={24} />
              </div>
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#ea580c",
                    backgroundColor: "#fff7ed",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <Sparkles size={11} /> New Device Detected
                </span>
                <h3
                  style={{
                    fontSize: "19px",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "2px 0 0 0",
                  }}
                >
                  Enable Passkey on this device?
                </h3>
              </div>
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: "13.5px",
                color: "#475569",
                lineHeight: 1.5,
                margin: "0 0 16px 0",
              }}
            >
              Sign in with 1-touch using your <strong>Fingerprint</strong>,{" "}
              <strong>Face ID</strong>, or <strong>Windows Hello</strong> next
              time. Completely eliminates waiting for SMS OTPs and works
              instantly.
            </p>

            {/* Mandatory Security Notice */}
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "18px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <ShieldAlert
                size={20}
                style={{ color: "#dc2626", flexShrink: 0, marginTop: "2px" }}
              />
              <div style={{ fontSize: "12.5px", color: "#991b1b", lineHeight: 1.45 }}>
                <strong style={{ display: "block", marginBottom: "3px" }}>
                  ⚠️ Security Notice — Only Add If You Own This Device
                </strong>
                Only register a Passkey if this is your personal computer or
                assigned work smartphone that you trust and own.{" "}
                <strong>
                  NEVER register a Passkey on public, cyber cafe, or shared
                  computers.
                </strong>
              </div>
            </div>

            {/* Device Name input */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Device Label
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Work Laptop, Personal Phone"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13px",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "12.5px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                Not Now / Skip
              </button>

              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                style={{
                  flex: 1.5,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.35)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Enable Passkey</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
