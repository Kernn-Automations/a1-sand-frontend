import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  Trash2,
  Plus,
  ShieldAlert,
  Laptop,
  Smartphone,
  KeyRound,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import {
  fetchUserPasskeys,
  deleteUserPasskey,
  registerPasskeyOnThisDevice,
  isPasskeySupported,
} from "../../services/passkeyService";

export default function PasskeyManagerModal({ isOpen, onClose, user }) {
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");

  const loadPasskeys = async () => {
    try {
      setLoading(true);
      setError("");
      const list = await fetchUserPasskeys();
      setPasskeys(list);
    } catch (err) {
      console.error("Error loading passkeys:", err);
      setError("Failed to load registered passkeys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPasskeys();
      setShowAddForm(false);
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  const handleAddNewPasskey = async () => {
    try {
      setActionLoading(true);
      setError("");
      setSuccessMsg("");

      await registerPasskeyOnThisDevice(newDeviceName || "Trusted Device");
      setSuccessMsg("Passkey registered successfully for this device!");
      setShowAddForm(false);
      setNewDeviceName("");
      await loadPasskeys();
    } catch (err) {
      console.error("Error registering passkey:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to register passkey."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to remove the passkey for "${name}"? You will not be able to log in with this device without OTP.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteUserPasskey(id);
      setSuccessMsg(`Passkey for "${name}" has been revoked.`);
      await loadPasskeys();
    } catch (err) {
      console.error("Error deleting passkey:", err);
      setError("Failed to delete passkey.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: "540px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          position: "relative",
          animation: "scaleIn 0.2s ease-out",
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Fingerprint size={22} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Passkey Authenticators
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                FIDO2 Biometrics & Hardware Security Keys
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fee2e2",
                borderRadius: "8px",
                color: "#b91c1c",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #d1fae5",
                borderRadius: "8px",
                color: "#065f46",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mandatory Security Warning */}
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "18px",
              display: "flex",
              gap: "10px",
            }}
          >
            <ShieldAlert
              size={18}
              style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ fontSize: "12px", color: "#92400e", lineHeight: 1.45 }}>
              <strong>Trust & Device Ownership Warning:</strong> Add a Passkey
              ONLY on personal computers or dedicated phones that you own and
              trust. Anyone with screen lock access to this device will have
              access to your account.
            </div>
          </div>

          {showAddForm ? (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1.5px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: "8px",
                }}
              >
                Register This Device
              </h4>
              <p
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  marginBottom: "12px",
                }}
              >
                Your browser will prompt for Fingerprint, Face ID, or Windows
                Hello.
              </p>
              <input
                type="text"
                placeholder="Device label (e.g. Dell XPS, Work MacBook)"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  marginBottom: "12px",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#fff",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewPasskey}
                  disabled={actionLoading}
                  style={{
                    flex: 1.5,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#ea580c",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Fingerprint size={16} />
                  )}
                  <span>Touch Authenticator</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px dashed #ea580c",
                  backgroundColor: "#fff7ed",
                  color: "#ea580c",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <Plus size={16} />
                <span>Add This Device as a Passkey</span>
              </button>
            </div>
          )}

          {/* List of Registered Devices */}
          <h4
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "16px 0 10px 0",
            }}
          >
            Registered Devices ({passkeys.length})
          </h4>

          {loading ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} />
              <p style={{ fontSize: "13px", marginTop: "8px" }}>Loading passkeys...</p>
            </div>
          ) : passkeys.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 16px",
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              No passkeys registered yet. Click &quot;Add This Device&quot; to set up
              instant biometric login.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {passkeys.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "#e0f2fe",
                        color: "#0284c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {p.deviceName || "Trusted Authenticator"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "11.5px",
                          color: "#64748b",
                          marginTop: "2px",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <Calendar size={12} />
                          Added {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                        {p.lastUsedAt && (
                          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <Clock size={12} />
                            Used {new Date(p.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(p.id, p.deviceName)}
                    disabled={actionLoading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      padding: "6px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                    title="Revoke passkey"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            borderBottomLeftRadius: "20px",
            borderBottomRightRadius: "20px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
