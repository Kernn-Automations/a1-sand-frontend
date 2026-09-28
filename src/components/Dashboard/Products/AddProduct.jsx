import React, { useEffect, useState, useMemo } from "react";
import styles from "./Products.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import axios from "axios";
import {
  FaCube,
  FaArrowLeft,
  FaSave,
  FaMagic,
  FaBoxes,
  FaRupeeSign,
  FaPercent,
  FaInfoCircle,
} from "react-icons/fa";
import { useLicense, LicenseCreationBanner } from "@/context/LicenseContext";

const PRESET_UNITS = [
  { value: "brass", label: "Brass (100 cft)" },
  { value: "tons", label: "Tons" },
  { value: "cft", label: "Cubic Feet (cft)" },
  { value: "loads", label: "Loads / Tippers" },
  { value: "trips", label: "Trips" },
  { value: "units", label: "Units / Pieces" },
  { value: "bags", label: "Bags" },
  { value: "kg", label: "Kilograms (kg)" },
];

function AddProduct({ navigate }) {
  const { axiosAPI } = useAuth();
  const { isCreationDisabled, disabledMessage } = useLicense();
  const VITE_API = import.meta.env.VITE_API_URL;

  const [categories, setCategories] = useState([]);
  const [taxesList, setTaxesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("loose");
  const [unit, setUnit] = useState("brass");
  const [basePrice, setBasePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");
  const [selectedTaxes, setSelectedTaxes] = useState([]);

  // Field validation errors
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    async function fetchMasterData() {
      try {
        setLoading(true);
        const [catRes, taxRes] = await Promise.all([
          axiosAPI.get("/categories/list").catch(() => ({ data: { categories: [] } })),
          axiosAPI.get("/tax").catch(() => ({ data: { taxes: [] } })),
        ]);
        setCategories(catRes.data?.categories || []);
        setTaxesList(taxRes.data?.taxes || []);
      } catch (err) {
        console.error("Failed to load master data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMasterData();
  }, []);

  // Helper to auto-generate SKU based on product name
  const handleAutoGenerateSku = () => {
    if (!name.trim()) return;
    const clean = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .map((w) => w.slice(0, 4))
      .join("-");
    setSku(`ACM-${clean}`);
    setFormErrors((prev) => ({ ...prev, sku: false }));
  };

  // Tax calculation preview
  const pricePreview = useMemo(() => {
    const base = parseFloat(basePrice) || 0;
    const taxes = taxesList.filter((t) => selectedTaxes.includes(t.id));
    const totalTaxRate = taxes.reduce((sum, t) => sum + (parseFloat(t.percentage) || 0), 0);
    const taxAmount = (base * totalTaxRate) / 100;
    const grandTotal = base + taxAmount;
    return {
      base,
      totalTaxRate,
      taxAmount,
      grandTotal,
    };
  }, [basePrice, selectedTaxes, taxesList]);

  // Validate form
  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Material name is required";
    if (!sku.trim()) errs.sku = "SKU code is required";
    if (!basePrice || parseFloat(basePrice) < 0) errs.basePrice = "Valid selling price is required";
    if (!purchasePrice || parseFloat(purchasePrice) < 0) errs.purchasePrice = "Valid cost price is required";
    if (!unit) errs.unit = "Unit of measurement is required";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit product creation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) {
      setError("Please fix the highlighted errors before saving.");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("SKU", sku.trim().toUpperCase());
      formData.append("description", description.trim());
      formData.append("categoryId", categoryId || "");
      formData.append("productType", productType);
      formData.append("unit", unit);
      formData.append("basePrice", parseFloat(basePrice) || 0);
      formData.append("purchasePrice", parseFloat(purchasePrice) || 0);
      formData.append("thresholdValue", parseFloat(thresholdValue) || 0);

      selectedTaxes.forEach((taxId) => {
        formData.append("taxIds[]", taxId);
      });

      const res = await axios.post(`${VITE_API}/products/add`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage(res.data?.message || "Material added successfully!");
      setTimeout(() => {
        navigate("/products");
      }, 1000);
    } catch (err) {
      console.error("Failed to add product:", err);
      setError(err?.response?.data?.message || "Error creating material in database");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.productsContainer}>
      {/* Top Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>
            <FaCube style={{ color: "#c2410c" }} /> Add New Construction Material
          </h1>
          <p>Register new aggregates, sands, bricks, or masonry products into the catalog.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnSecondary}
            onClick={() => navigate("/products")}
            type="button"
          >
            <FaArrowLeft /> Back to Catalog
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
            type="button"
            id="btn-save-material"
          >
            <FaSave /> {loading ? "Saving Material..." : "Save Material"}
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.25rem",
            background: "#dcfce7",
            color: "#15803d",
            borderRadius: "8px",
            fontWeight: 600,
            border: "1px solid #bbf7d0",
          }}
        >
          ✓ {successMessage} Redirecting to catalog...
        </div>
      )}

      {/* Main Form Box */}
      <LicenseCreationBanner actionName="materials & products" />
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: "1.5rem",
          maxWidth: "880px",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Section 1: Basic Information */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <FaInfoCircle style={{ color: "#0284c7" }} /> 1. Material Identity & Category
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Material Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. 20mm Metal Aggregate, Robo Sand, River Sand"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value) setFormErrors((prev) => ({ ...prev, name: false }));
                  }}
                  required
                />
                {formErrors.name && (
                  <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                    {formErrors.name}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className={styles.formLabel}>
                    SKU / Product Code <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#0284c7",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onClick={handleAutoGenerateSku}
                  >
                    <FaMagic /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. ACM-20MM, ACM-MSAND"
                  value={sku}
                  onChange={(e) => {
                    setSku(e.target.value.toUpperCase());
                    if (e.target.value) setFormErrors((prev) => ({ ...prev, sku: false }));
                  }}
                  required
                />
                {formErrors.sku && (
                  <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                    {formErrors.sku}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={styles.formSelect}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label className={styles.formLabel}>Material Description / Specifications</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                placeholder="Details on crusher source, quarry yard, gradations, or usage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Units of Measurement & Packaging */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <FaBoxes style={{ color: "#ea580c" }} /> 2. Material Units & Packaging
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Material Type</label>
                <select
                  className={styles.formSelect}
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                >
                  <option value="loose">Loose Material (Aggregates, Sand, Soil, Gravel)</option>
                  <option value="packed">Packed / Discrete Units (Cement Bags, Bricks, Blocks)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Primary Unit of Measure <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. brass, tons, cft, units"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value.toLowerCase())}
                  required
                />
                <div className={styles.unitPillGroup}>
                  {PRESET_UNITS.map((p) => (
                    <span
                      key={p.value}
                      className={`${styles.unitPill} ${unit === p.value ? styles.unitPillActive : ""}`}
                      onClick={() => setUnit(p.value)}
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Rates & Taxes */}
          <div className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <FaRupeeSign style={{ color: "#16a34a" }} /> 3. Commercial Pricing & GST Taxes
            </div>

            <div className={styles.formGrid3}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Selling Rate (&#8377; per {unit || "unit"}) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  placeholder="0.00"
                  value={basePrice}
                  onChange={(e) => {
                    setBasePrice(e.target.value);
                    if (e.target.value) setFormErrors((prev) => ({ ...prev, basePrice: false }));
                  }}
                  required
                />
                {formErrors.basePrice && (
                  <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                    {formErrors.basePrice}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Purchase / Yard Cost (&#8377; per {unit || "unit"}) <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => {
                    setPurchasePrice(e.target.value);
                    if (e.target.value) setFormErrors((prev) => ({ ...prev, purchasePrice: false }));
                  }}
                  required
                />
                {formErrors.purchasePrice && (
                  <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                    {formErrors.purchasePrice}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Low Stock Alert Threshold ({unit || "unit"})</label>
                <input
                  type="number"
                  step="0.1"
                  className={styles.formInput}
                  placeholder="e.g. 50"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                />
              </div>
            </div>

            {/* Applicable GST Taxes */}
            <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
              <label className={styles.formLabel}>
                <FaPercent style={{ verticalAlign: "-1px" }} /> Applicable Taxes & HSN Classification
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {taxesList.map((tax) => {
                  const isChecked = selectedTaxes.includes(tax.id);
                  const rateText =
                    tax.taxNature === "Exempt"
                      ? "Exempt"
                      : tax.percentage !== null && tax.percentage !== undefined
                        ? `${tax.percentage}%`
                        : "0%";
                  return (
                    <label
                      key={tax.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        background: isChecked ? "#0f172a" : "#f8fafc",
                        color: isChecked ? "#ffffff" : "#334155",
                        border: isChecked ? "1px solid #0f172a" : "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaxes((prev) => [...prev, tax.id]);
                          } else {
                            setSelectedTaxes((prev) => prev.filter((id) => id !== tax.id));
                          }
                        }}
                        style={{ display: "none" }}
                      />
                      <span>
                        {tax.name} ({rateText})
                        {tax.hsnCode && (
                          <span
                            style={{
                              marginLeft: "6px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              background: isChecked ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                              color: isChecked ? "#ffffff" : "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            HSN: {tax.hsnCode}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
              <span className={styles.formHelper} style={{ marginTop: "6px", display: "block" }}>
                HSN / SAC Code is inherited directly from the assigned Tax slab for automated billing and invoicing.
              </span>
            </div>

            {/* Price Preview Card */}
            <div className={styles.calcPreviewBox}>
              <div>
                <div className={styles.calcLabel}>Calculated Invoice Rate per {unit || "unit"}:</div>
                <div style={{ fontSize: "0.8125rem", color: "#475569", marginTop: "2px" }}>
                  Base: &#8377;{pricePreview.base.toLocaleString("en-IN")} + GST ({pricePreview.totalTaxRate}%): &#8377;{pricePreview.taxAmount.toFixed(2)}
                </div>
              </div>
              <div className={styles.calcVal}>
                &#8377;{pricePreview.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "2rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => navigate("/products")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || isCreationDisabled}
              title={isCreationDisabled ? disabledMessage : undefined}
              style={isCreationDisabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              <FaSave /> {loading ? "Saving Material..." : "Save Material to Catalog"}
            </button>
          </div>
        </form>
      </div>

      {/* Error Modal */}
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}

      {loading && <Loading />}
    </div>
  );
}

export default AddProduct;
