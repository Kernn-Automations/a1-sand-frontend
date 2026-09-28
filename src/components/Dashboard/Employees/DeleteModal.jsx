import React, { useState } from "react";
import { useAuth } from "@/Auth";
import { FaTrashAlt, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Loading from "@/components/Loading";

export default function DeleteModal({ employee, changeTrigger, onClose }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!employee) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const id = employee.id || employee.employeeId;
      await axiosAPI.delete(`/employees/${id}`);
      if (changeTrigger) changeTrigger();
      if (onClose) onClose();
    } catch (err) {
      console.error("Delete employee error:", err);
      setError(err?.response?.data?.message || "Failed to deactivate employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            margin: "0 auto 16px auto",
          }}
        >
          <FaExclamationTriangle />
        </div>

        <h3 style={{ margin: "0 0 8px 0", fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
          Deactivate Staff Member?
        </h3>
        <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b" }}>
          Are you sure you want to deactivate{" "}
          <strong style={{ color: "#0f172a" }}>{employee.name}</strong> ({employee.employeeId || employee.id})?
          Their status will be set to Inactive.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#475569",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <FaTrashAlt />
            {loading ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}
