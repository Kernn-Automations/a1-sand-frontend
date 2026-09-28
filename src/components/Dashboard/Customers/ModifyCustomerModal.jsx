import React, { useState, useEffect } from "react";
import { useAuth } from "@/Auth";
import { FaTimes, FaSave, FaUserEdit, FaPhone, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";

export default function ModifyCustomerModal({ customer, isOpen, onClose, onSuccess }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    firmName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    gstin: "",
    msme: "",
    discountType: "bill_to_bill",
    isTcsApplicable: false,
    status: "Active",
    plot: "",
    street: "",
    area: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        firmName: customer.firmName || customer.firm_name || "",
        mobile: customer.mobile || customer.phone || "",
        whatsapp: customer.whatsapp || customer.mobile || customer.phone || "",
        email: customer.email || "",
        gstin: customer.gstin || "",
        msme: customer.msme || "",
        discountType: customer.discountType || "bill_to_bill",
        isTcsApplicable: !!customer.tcs,
        status: customer.status || "Active",
        plot: customer.plot || "",
        street: customer.street || "",
        area: customer.area || "",
        city: customer.city || "",
        district: customer.district || "",
        state: customer.state || "Telangana",
        pincode: customer.pincode || "",
      });
      setError(null);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Customer / Contractor Name is required");
      return;
    }
    if (!formData.mobile.trim()) {
      setError("Mobile Number is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        firmName: formData.firmName.trim(),
        mobile: formData.mobile.trim(),
        phone: formData.mobile.trim(),
        whatsapp: formData.whatsapp.trim() || formData.mobile.trim(),
        email: formData.email.trim() || null,
        gstin: formData.gstin.trim() || null,
        msme: formData.msme.trim() || null,
        discountType: formData.discountType,
        isTcsApplicable: formData.isTcsApplicable ? "true" : "false",
        status: formData.status,
        plot: formData.plot.trim() || null,
        street: formData.street.trim() || null,
        area: formData.area.trim() || null,
        city: formData.city.trim() || null,
        district: formData.district.trim() || null,
        state: formData.state.trim() || "Telangana",
        pincode: formData.pincode.trim() || null,
      };

      await axiosAPI.put(`/customers/${customer.id}`, payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Modify customer error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to update customer");
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
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e2e8f0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "16px 20px",
            borderTopLeftRadius: "13px",
            borderTopRightRadius: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(234, 88, 12, 0.2)",
                color: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              <FaUserEdit />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                Modify Customer / Contractor
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                ID: {customer.customer_id || `ACM-C-${customer.id}`} &bull; Update contractor details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Section 1: Contractor & Business */}
          <div style={{ marginBottom: "18px" }}>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#ea580c",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaBuilding size={12} /> Basic & Contact Details
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Contractor / Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="e.g. Ramesh Reddy"
                />
              </div>

              <div>
                <label style={labelStyle}>Firm / Company Name</label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="e.g. Reddy Constructions"
                />
              </div>

              <div>
                <label style={labelStyle}>Primary Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label style={labelStyle}>WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="WhatsApp mobile"
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label style={labelStyle}>Account Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Commercial & GST */}
          <div style={{ marginBottom: "18px" }}>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#0369a1",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
              }}
            >
              Tax & Billing Terms
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>GSTIN (Optional)</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  maxLength={15}
                  style={inputStyle}
                  placeholder="15-digit GSTIN"
                />
              </div>

              <div>
                <label style={labelStyle}>Discount Type</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="bill_to_bill">Bill-to-Bill Discount</option>
                  <option value="monthly">Monthly Discount</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "24px" }}>
                <input
                  type="checkbox"
                  id="modifyTcs"
                  name="isTcsApplicable"
                  checked={formData.isTcsApplicable}
                  onChange={handleChange}
                  style={{ width: "18px", height: "18px", accentColor: "#ea580c", cursor: "pointer" }}
                />
                <label htmlFor="modifyTcs" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  TCS Applicable (Tax Collected at Source)
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Site / Billing Address */}
          <div style={{ marginBottom: "18px" }}>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaMapMarkerAlt size={12} /> Site & Billing Address
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Plot / Door No.</label>
                <input
                  type="text"
                  name="plot"
                  value={formData.plot}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Plot / House No."
                />
              </div>

              <div>
                <label style={labelStyle}>Street / Road</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Street name"
                />
              </div>

              <div>
                <label style={labelStyle}>Area / Colony</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Area / Landmark"
                />
              </div>

              <div>
                <label style={labelStyle}>City / Town</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="City"
                />
              </div>

              <div>
                <label style={labelStyle}>District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="District"
                />
              </div>

              <div>
                <label style={labelStyle}>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  style={inputStyle}
                  placeholder="6-digit PIN"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              paddingTop: "14px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#ea580c",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaSave size={13} />
              {loading ? "Saving Changes..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#334155",
  marginBottom: "4px",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  boxSizing: "border-box",
  outline: "none",
};
