import React, { useState, useEffect } from "react";
import styles from "./Customer.module.css";
import { useAuth } from "@/Auth";
import {
  FaUserPlus,
  FaArrowLeft,
  FaBuilding,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaFileInvoiceDollar,
  FaCheck,
  FaSave,
} from "react-icons/fa";
import { useLicense, LicenseCreationBanner } from "@/context/LicenseContext";

export default function CreateCustomer({ navigate }) {
  const { axiosAPI } = useAuth();
  const { isCreationDisabled, disabledMessage } = useLicense();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    firmName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    warehouseId: "",
    discountType: "bill_to_bill",
    isTcsApplicable: false,
    gstin: "",
    msme: "",
    plot: "",
    street: "",
    area: "",
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "",
  });

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const res = await axiosAPI.get("/warehouses");
        const list = res.data?.warehouses || res.data || [];
        setWarehouses(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, warehouseId: list[0].id }));
        }
      } catch (err) {
        console.warn("Could not fetch warehouses:", err);
      }
    }
    fetchWarehouses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name.trim()) {
      setError("Please enter the Contractor / Customer Name");
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        mobile: cleanMobile,
        phone: cleanMobile,
        whatsapp: formData.whatsapp ? formData.whatsapp.replace(/\D/g, "") : cleanMobile,
        email: formData.email.trim() || null,
        firmName: formData.firmName.trim() || formData.name.trim(),
        warehouseId: formData.warehouseId ? Number(formData.warehouseId) : undefined,
        discountType: formData.discountType,
        isTcsApplicable: formData.isTcsApplicable ? "true" : "false",
        gstin: formData.gstin.trim() || null,
        msme: formData.msme.trim() || null,
        plot: formData.plot.trim() || null,
        street: formData.street.trim() || null,
        area: formData.area.trim() || null,
        city: formData.city.trim() || "Hyderabad",
        district: formData.district.trim() || "Hyderabad",
        state: formData.state.trim() || "Telangana",
        pincode: formData.pincode.trim() || null,
      };

      // Quick contractor creation without KYC
      const res = await axiosAPI.post("/customers", payload);

      if (res.data?.success || res.status === 200 || res.status === 201) {
        setSuccessMsg("Customer / Contractor created successfully!");
        setTimeout(() => {
          navigate("/customers/customer-list");
        }, 800);
      }
    } catch (err) {
      console.error("Create customer error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create customer. Please check if mobile number already exists."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.customerContainer}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <p
            style={{
              margin: "0 0 4px 0",
              cursor: "pointer",
              color: "#64748b",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            onClick={() => navigate("/customers/customer-list")}
          >
            <FaArrowLeft size={10} /> Back to Customer List
          </p>
          <h1>
            <FaUserPlus style={{ color: "#ea580c" }} /> Add New Contractor / Customer
          </h1>
          <p>
            Quickly onboard clients, construction contractors, and builders for direct billing
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.outlineBtn}
            onClick={() => navigate("/customers/customer-list")}
          >
            Cancel
          </button>
        </div>
      </div>

      <LicenseCreationBanner actionName="contractors & customers" />

      {/* Form Card */}
      <div className={styles.formCard}>
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "18px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              color: "#15803d",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "18px",
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Contractor & Business Details */}
          <div style={{ marginBottom: "24px" }}>
            <h3 className={styles.formSectionHeader}>
              <FaBuilding style={{ color: "#ea580c" }} /> 1. Contractor & Identity
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contractor / Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ramesh Reddy"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Firm / Company Name</label>
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  placeholder="e.g. Reddy Constructions"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Primary Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="WhatsApp mobile number (optional)"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com (optional)"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Warehouse Assignment</label>
                <select
                  name="warehouseId"
                  value={formData.warehouseId}
                  onChange={handleChange}
                  className={styles.formSelect}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Commercial & Billing Terms */}
          <div style={{ marginBottom: "24px" }}>
            <h3 className={styles.formSectionHeader}>
              <FaFileInvoiceDollar style={{ color: "#0284c7" }} /> 2. Commercial Terms & GST
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Discount Structure</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className={styles.formSelect}
                >
                  <option value="bill_to_bill">Bill-to-Bill Immediate Discount</option>
                  <option value="monthly">Monthly Aggregate Discount</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>GSTIN (Optional)</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  maxLength={15}
                  placeholder="15-digit GST Number (if registered)"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>MSME Number (Optional)</label>
                <input
                  type="text"
                  name="msme"
                  value={formData.msme}
                  onChange={handleChange}
                  placeholder="Udyam / MSME Registration"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup} style={{ justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
                  <input
                    type="checkbox"
                    id="tcsCheckbox"
                    name="isTcsApplicable"
                    checked={formData.isTcsApplicable}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px", accentColor: "#ea580c", cursor: "pointer" }}
                  />
                  <label htmlFor="tcsCheckbox" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                    TCS Applicable (Tax Collected at Source)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Site & Billing Address */}
          <div style={{ marginBottom: "24px" }}>
            <h3 className={styles.formSectionHeader}>
              <FaMapMarkerAlt style={{ color: "#16a34a" }} /> 3. Project Site & Billing Address
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Plot / Door / Survey No.</label>
                <input
                  type="text"
                  name="plot"
                  value={formData.plot}
                  onChange={handleChange}
                  placeholder="Plot / Survey number"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Street / Road</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Street / Main Road"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Area / Colony / Landmark</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="Colony, site landmark"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>City / Town</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="District"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                  placeholder="6-digit PIN code"
                  className={styles.formInput}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => navigate("/customers/customer-list")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isCreationDisabled}
              title={isCreationDisabled ? disabledMessage : undefined}
              className={styles.primaryBtn}
              style={isCreationDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              <FaSave /> {loading ? "Creating Customer..." : "Save & Register Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
