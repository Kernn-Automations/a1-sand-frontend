import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import { FaTimes, FaSave, FaUserTie, FaPhone, FaEnvelope, FaWarehouse, FaCheckCircle } from "react-icons/fa";

export default function ModifyEmployeeModal({ employee, isOpen, onClose, onSuccess }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    mobile: "",
    email: "",
    roleIds: [],
    warehouseId: "",
    status: "Active",
  });

  // Load roles and warehouses once on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const [rolesRes, warehousesRes] = await Promise.allSettled([
          axiosAPI.get("/employees/roles"),
          axiosAPI.get("/warehouse"),
        ]);
        if (rolesRes.status === "fulfilled") {
          setRoles(rolesRes.value?.data?.roles || []);
        }
        if (warehousesRes.status === "fulfilled") {
          const whData = warehousesRes.value?.data;
          setWarehouses(Array.isArray(whData) ? whData : whData?.warehouses || whData?.data || []);
        }
      } catch (e) {
        console.error("Error loading options for employee modal:", e);
      }
    }
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, axiosAPI]);

  useEffect(() => {
    if (employee) {
      const existingRoleIds = employee.roles?.map((r) => r.id) || [];
      setFormData({
        name: employee.name || "",
        employeeId: employee.employeeId || "",
        mobile: employee.mobile || "",
        email: employee.email || "",
        roleIds: existingRoleIds,
        warehouseId: employee.warehouseId || employee.warehouse?.id || "",
        status: employee.status || "Active",
      });
      setError(null);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    const val = name === "name" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleRoleChange = (e) => {
    const selectedId = Number(e.target.value);
    if (selectedId) {
      setFormData((prev) => ({
        ...prev,
        roleIds: [selectedId],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Employee name is required.");
      return;
    }
    if (!formData.mobile || formData.mobile.length < 10) {
      setError("Valid 10-digit mobile number is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || null,
        roleIds: formData.roleIds,
        warehouseId: formData.warehouseId ? Number(formData.warehouseId) : null,
        status: formData.status,
      };

      await axiosAPI.put(`/employees/${employee.id}`, payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Modify Employee Error:", err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update employee details."
      );
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
          maxWidth: "580px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaUserTie style={{ color: "#38bdf8", fontSize: "18px" }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                Modify Staff Profile
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                {employee.employeeId} &bull; {employee.name}
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
              fontSize: "18px",
              padding: "4px",
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: "20px 24px" }}>
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Full Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Employee ID */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Employee Code / ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Mobile */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength={10}
                required
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="optional"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Primary Role */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Designation / Role
              </label>
              <select
                value={formData.roleIds[0] || ""}
                onChange={handleRoleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Warehouse */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Assigned Warehouse
              </label>
              <select
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">None / Unassigned</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                Operational Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 16px",
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
              type="submit"
              disabled={loading}
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaSave />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
