import React, { useEffect, useState } from "react";
import styles from "./Employees.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import {
  FaUserPlus,
  FaArrowLeft,
  FaCheckCircle,
  FaUserTie,
  FaWarehouse,
  FaPhone,
  FaEnvelope,
  FaSave,
} from "react-icons/fa";

function CreateEmployee({ navigate }) {
  const { axiosAPI } = useAuth();

  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    email: "",
    mobile: "",
    warehouseId: "",
  });

  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load available roles and warehouses on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rolesRes, whRes] = await Promise.allSettled([
          axiosAPI.get("/employees/roles"),
          axiosAPI.get("/warehouse"),
        ]);

        if (rolesRes.status === "fulfilled") {
          const loadedRoles = rolesRes.value?.data?.roles || [];
          setRoles(loadedRoles);
          // Default to first non-admin role if available
          const defaultRole = loadedRoles.find(
            (r) => !["super admin", "admin"].includes(r.name.toLowerCase())
          );
          if (defaultRole) {
            setSelectedRoles([defaultRole.id]);
          }
        }

        if (whRes.status === "fulfilled") {
          const whData = whRes.value?.data;
          setWarehouses(
            Array.isArray(whData) ? whData : whData?.warehouses || whData?.data || []
          );
        }

        // Generate default auto Employee ID
        const generatedId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
        setForm((prev) => ({ ...prev, employeeId: generatedId }));
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [axiosAPI]);

  // Load supervisors when role changes
  useEffect(() => {
    async function fetchSupervisors() {
      if (selectedRoles.length === 0) return;
      const lastRoleId = selectedRoles[0];
      try {
        const res = await axiosAPI.get(`/employees/supervisors/${lastRoleId}`);
        setSupervisors(res?.data?.supervisors || []);
      } catch (err) {
        setSupervisors([]);
      }
    }
    fetchSupervisors();
  }, [selectedRoles, axiosAPI]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const numeric = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: numeric }));
      return;
    }
    const processed = name === "name" ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: processed }));
  };

  const handleRoleSelect = (e) => {
    const rId = Number(e.target.value);
    if (rId) {
      setSelectedRoles([rId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter the employee's full name.");
      setIsErrorOpen(true);
      return;
    }
    if (!form.mobile || form.mobile.length < 10) {
      setError("Please provide a valid 10-digit mobile number.");
      setIsErrorOpen(true);
      return;
    }
    if (selectedRoles.length === 0) {
      setError("Please select a primary role for the employee.");
      setIsErrorOpen(true);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        employeeId: form.employeeId.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || null,
        roleIds: selectedRoles,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
        supervisorId: selectedSupervisor ? Number(selectedSupervisor) : null,
      };

      await axiosAPI.post("/employees/add", payload);
      setSuccessMessage(`Employee ${form.name} created successfully!`);

      setTimeout(() => {
        navigate("/employees/manage-employees");
      }, 1200);
    } catch (err) {
      console.error("Create Employee Error:", err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create employee. Please verify details."
      );
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.employeeWorkspace}>
      {/* Breadcrumb Path */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
        <span
          onClick={() => navigate("/employees")}
          style={{ cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}
        >
          Employees
        </span>
        <span>&rsaquo;</span>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>Add Employee</span>
      </div>

      {/* Main Form Container */}
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 800 }}>
              Onboard New Staff
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Add a new workforce member to Anjali Constructions & Materials
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/employees")}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "32px" }}>
          {successMessage && (
            <div
              style={{
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                padding: "14px 18px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <FaCheckCircle style={{ color: "#059669", fontSize: "18px" }} />
              <span>{successMessage}</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            {/* Full Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. RAJESH KUMAR REDDY"
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              />
            </div>

            {/* Employee ID */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Employee Code / ID *
              </label>
              <input
                type="text"
                name="employeeId"
                value={form.employeeId}
                onChange={handleFormChange}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleFormChange}
                placeholder="10-digit mobile"
                maxLength={10}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="name@company.com"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Primary Role */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Designation / Primary Role *
              </label>
              <select
                value={selectedRoles[0] || ""}
                onChange={handleRoleSelect}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
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

            {/* Base Warehouse */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Base Warehouse / Facility
              </label>
              <select
                name="warehouseId"
                value={form.warehouseId}
                onChange={handleFormChange}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">All Warehouses / Headquarters</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reporting Supervisor */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                Reporting Manager / Supervisor (Optional)
              </label>
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  backgroundColor: "#ffffff",
                }}
              >
                <option value="">None / Direct to Management</option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "32px",
              paddingTop: "20px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/employees")}
              style={{
                padding: "11px 20px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "11px 28px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
              }}
            >
              <FaSave />
              {loading ? "Saving Staff..." : "Save & Add Staff"}
            </button>
          </div>
        </form>
      </div>

      {isErrorOpen && (
        <ErrorModal
          isOpen={isErrorOpen}
          message={error}
          onClose={() => setIsErrorOpen(false)}
        />
      )}
    </div>
  );
}

export default CreateEmployee;
