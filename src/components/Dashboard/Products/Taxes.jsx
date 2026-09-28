import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import styles from "./Products.module.css";
import {
  FaPercent,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaShieldAlt,
  FaBoxes,
  FaTag,
  FaInfoCircle,
} from "react-icons/fa";

function Taxes({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNature, setFilterNature] = useState("All");
  const [filterApplicable, setFilterApplicable] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null); // null for Add, tax object for Edit
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPercentage, setFormPercentage] = useState("");
  const [formHsnCode, setFormHsnCode] = useState("");
  const [formTaxNature, setFormTaxNature] = useState("Taxable");
  const [formApplicableOn, setFormApplicableOn] = useState("Both");
  const [formStatus, setFormStatus] = useState("Active");
  const [formDescription, setFormDescription] = useState("");

  // Delete Confirmation State
  const [taxToDelete, setTaxToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.get("/tax");
      setTaxes(res.data?.taxes || []);
    } catch (err) {
      console.error("Error fetching taxes:", err);
      setError(err.response?.data?.message || "Failed to fetch taxes.");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  // Filtered Taxes
  const filteredTaxes = useMemo(() => {
    return taxes.filter((tax) => {
      // Search
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tax.name?.toLowerCase().includes(q) ||
        tax.hsnCode?.toLowerCase().includes(q) ||
        tax.description?.toLowerCase().includes(q);

      // Nature filter
      const matchesNature =
        filterNature === "All" || tax.taxNature === filterNature;

      // Applicable On filter
      const matchesApplicable =
        filterApplicable === "All" || tax.applicableOn === filterApplicable;

      // Status filter
      const matchesStatus =
        filterStatus === "All" || tax.status === filterStatus;

      return matchesSearch && matchesNature && matchesApplicable && matchesStatus;
    });
  }, [taxes, searchTerm, filterNature, filterApplicable, filterStatus]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const total = taxes.length;
    const active = taxes.filter((t) => t.status === "Active").length;
    const taxable = taxes.filter((t) => t.taxNature === "Taxable").length;
    const exempt = taxes.filter(
      (t) => t.taxNature === "Exempt" || t.taxNature === "Nil Rated"
    ).length;
    return { total, active, taxable, exempt };
  }, [taxes]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTax(null);
    setFormName("");
    setFormPercentage("");
    setFormHsnCode("");
    setFormTaxNature("Taxable");
    setFormApplicableOn("Both");
    setFormStatus("Active");
    setFormDescription("");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tax) => {
    setEditingTax(tax);
    setFormName(tax.name || "");
    setFormPercentage(
      tax.percentage !== null && tax.percentage !== undefined
        ? tax.percentage.toString()
        : ""
    );
    setFormHsnCode(tax.hsnCode || "");
    setFormTaxNature(tax.taxNature || "Taxable");
    setFormApplicableOn(tax.applicableOn || "Both");
    setFormStatus(tax.status || "Active");
    setFormDescription(tax.description || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Tax Nature change handler (auto clears or sets percentage)
  const handleTaxNatureChange = (nature) => {
    setFormTaxNature(nature);
    if (nature === "Exempt") {
      setFormPercentage("");
    } else if (nature === "Nil Rated") {
      setFormPercentage("0");
    }
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Tax slab name is required.");
      return;
    }

    if (formTaxNature === "Taxable") {
      if (
        formPercentage === "" ||
        isNaN(parseFloat(formPercentage)) ||
        parseFloat(formPercentage) < 0
      ) {
        setFormError("Please provide a valid tax percentage rate (e.g. 5, 12, 18, 28).");
        return;
      }
    }

    const payload = {
      name: formName.trim(),
      percentage:
        formTaxNature === "Exempt"
          ? null
          : formTaxNature === "Nil Rated"
            ? 0
            : parseFloat(formPercentage),
      hsnCode: formHsnCode.trim() || null,
      taxNature: formTaxNature,
      applicableOn: formApplicableOn,
      status: formStatus,
      description: formDescription.trim() || null,
    };

    try {
      setFormLoading(true);
      if (editingTax) {
        await axiosAPI.put(`/tax/${editingTax.id}`, payload);
        setSuccessMessage(`Tax slab "${payload.name}" updated successfully.`);
      } else {
        await axiosAPI.post("/tax", payload);
        setSuccessMessage(`Tax slab "${payload.name}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchTaxes();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error saving tax slab:", err);
      setFormError(
        err.response?.data?.message || "Failed to save tax slab. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Tax Status (Active <-> Inactive)
  const handleToggleStatus = async (tax) => {
    if (!isAdmin) return;
    const newStatus = tax.status === "Active" ? "Inactive" : "Active";
    try {
      await axiosAPI.put(`/tax/${tax.id}`, { status: newStatus });
      setTaxes((prev) =>
        prev.map((t) => (t.id === tax.id ? { ...t, status: newStatus } : t))
      );
      setSuccessMessage(`Tax slab marked as ${newStatus}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error toggling tax status:", err);
      setError(err.response?.data?.message || "Failed to update tax status.");
      setIsErrorModalOpen(true);
    }
  };

  // Confirm Delete
  const handleDeleteTax = async () => {
    if (!taxToDelete) return;
    try {
      setDeleteLoading(true);
      await axiosAPI.delete(`/tax/${taxToDelete.id}`);
      setTaxes((prev) => prev.filter((t) => t.id !== taxToDelete.id));
      setTaxToDelete(null);
      setSuccessMessage("Tax slab deleted successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error deleting tax:", err);
      setTaxToDelete(null);
      setError(
        err.response?.data?.message ||
          "Could not delete tax slab. Ensure no active materials are linked to this tax rate."
      );
      setIsErrorModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.productsContainer}>
      {/* Toast Notification */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderLeft: "4px solid #10b981",
          }}
        >
          <FaCheckCircle style={{ color: "#10b981" }} />
          {successMessage}
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <p style={{ margin: "0 0 6px 0", fontSize: "0.8125rem", color: "#64748b" }}>
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/products")}
            >
              Materials & Aggregates
            </span>{" "}
            &gt; <strong style={{ color: "#0f172a" }}>Taxes & HSN Master</strong>
          </p>
          <h1>
            <FaPercent style={{ color: "#0284c7" }} /> Taxes & HSN Classification
          </h1>
          <p>
            Define GST rates, HSN / SAC codes, and tax applicability across all construction materials.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnSecondary}
            onClick={() => navigate("/products")}
            id="btn-back-products"
          >
            <FaArrowLeft /> Back to Materials
          </button>
          {isAdmin && (
            <button
              className={styles.btnPrimary}
              onClick={handleOpenAddModal}
              id="btn-add-tax"
            >
              <FaPlus /> Add Tax Slab
            </button>
          )}
          <button
            className={styles.btnSecondary}
            onClick={fetchTaxes}
            title="Refresh List"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Total Tax Slabs</h3>
            <div className={styles.kpiValue}>{kpiStats.total}</div>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <FaPercent />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Active Slabs</h3>
            <div className={styles.kpiValue} style={{ color: "#16a34a" }}>
              {kpiStats.active}
            </div>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#dcfce7", color: "#16a34a" }}>
            <FaCheckCircle />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Taxable Slabs (GST)</h3>
            <div className={styles.kpiValue}>{kpiStats.taxable}</div>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#fef3c7", color: "#d97706" }}>
            <FaTag />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Exempt / Nil Rated</h3>
            <div className={styles.kpiValue}>{kpiStats.exempt}</div>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#f1f5f9", color: "#475569" }}>
            <FaShieldAlt />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchBox}>
          <FaSearch />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tax name, HSN code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={filterNature}
            onChange={(e) => setFilterNature(e.target.value)}
          >
            <option value="All">All Tax Natures</option>
            <option value="Taxable">Taxable (GST)</option>
            <option value="Exempt">Exempt</option>
            <option value="Nil Rated">Nil Rated</option>
            <option value="Non-GST">Non-GST</option>
            <option value="Reverse Charge">Reverse Charge</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterApplicable}
            onChange={(e) => setFilterApplicable(e.target.value)}
          >
            <option value="All">All Transactions</option>
            <option value="Both">Both (Sales & Purchases)</option>
            <option value="Sale">Sale Only</option>
            <option value="Purchase">Purchase Only</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Slabs</option>
            <option value="Inactive">Inactive Slabs</option>
          </select>
        </div>
      </div>

      {/* Taxes Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Loading />
          </div>
        ) : filteredTaxes.length === 0 ? (
          <div className={styles.emptyState}>
            <FaPercent style={{ fontSize: "2.5rem", color: "#94a3b8", margin: "0 auto 1rem auto" }} />
            <h3>No Tax Slabs Found</h3>
            <p>
              {searchTerm || filterNature !== "All" || filterStatus !== "All"
                ? "Try adjusting your search criteria or filters."
                : "No tax slabs configured yet. Click 'Add Tax Slab' to create standard GST rates."}
            </p>
            {isAdmin && (
              <button className={styles.btnPrimary} onClick={handleOpenAddModal}>
                <FaPlus /> Add New Tax Slab
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th style={{ width: "50px", textAlign: "center" }}>#</th>
                  <th>Tax Slab Name</th>
                  <th>HSN / SAC Code</th>
                  <th style={{ textAlign: "center" }}>Rate %</th>
                  <th>Tax Nature</th>
                  <th>Applicable On</th>
                  <th style={{ textAlign: "center" }}>Assigned Materials</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  {isAdmin && <th style={{ textAlign: "center", width: "100px" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTaxes.map((tax, idx) => {
                  const rateDisplay =
                    tax.taxNature === "Exempt"
                      ? "Exempt"
                      : tax.percentage !== null && tax.percentage !== undefined
                        ? `${tax.percentage}%`
                        : "0%";

                  return (
                    <tr key={tax.id}>
                      <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "0.9375rem" }}>
                          {tax.name}
                        </strong>
                        {tax.description && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                              marginTop: "2px",
                              maxWidth: "320px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={tax.description}
                          >
                            {tax.description}
                          </div>
                        )}
                      </td>

                      <td>
                        {tax.hsnCode ? (
                          <span className={styles.skuBadge} style={{ background: "#f8fafc", borderColor: "#cbd5e1" }}>
                            HSN: {tax.hsnCode}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>-</span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "0.9375rem",
                            color: tax.taxNature === "Exempt" ? "#64748b" : "#0f172a",
                          }}
                        >
                          {rateDisplay}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "6px",
                            background:
                              tax.taxNature === "Taxable"
                                ? "#dcfce7"
                                : tax.taxNature === "Exempt"
                                  ? "#e0f2fe"
                                  : "#fef3c7",
                            color:
                              tax.taxNature === "Taxable"
                                ? "#15803d"
                                : tax.taxNature === "Exempt"
                                  ? "#0369a1"
                                  : "#b45309",
                          }}
                        >
                          {tax.taxNature}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "#475569",
                            fontWeight: 500,
                          }}
                        >
                          {tax.applicableOn === "Both"
                            ? "Sales & Purchases"
                            : tax.applicableOn === "Sale"
                              ? "Sale Only"
                              : "Purchase Only"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#475569",
                            background: "#f1f5f9",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          <FaBoxes style={{ fontSize: "0.75rem", color: "#64748b" }} />
                          {tax.productCount || 0}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <div
                          className={styles.statusToggle}
                          style={{ justifyContent: "center" }}
                          onClick={() => handleToggleStatus(tax)}
                          title="Click to toggle status"
                        >
                          <span
                            className={`${styles.statusPill} ${
                              tax.status === "Active"
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {tax.status}
                          </span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td style={{ textAlign: "center" }}>
                          <div
                            className={styles.actionBtnGroup}
                            style={{ justifyContent: "center" }}
                          >
                            <button
                              className={styles.iconBtn}
                              onClick={() => handleOpenEditModal(tax)}
                              title="Edit Tax Slab"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={() => setTaxToDelete(tax)}
                              title="Delete Tax Slab"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Tax Slab Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !formLoading && setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaPercent style={{ color: "#0284c7", verticalAlign: "-2px", marginRight: "8px" }} />
                {editingTax ? `Edit Tax Slab: ${editingTax.name}` : "Create New Tax Slab"}
              </h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => !formLoading && setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className={styles.modalBody}>
                {formError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#b91c1c",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaTimesCircle />
                    {formError}
                  </div>
                )}

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tax Slab Name *</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. GST 5% - Aggregates, GST 18% - Cement"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      autoFocus
                    />
                    <span className={styles.formHelper}>
                      Commercial name shown on quotes, orders, and reports.
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>HSN / SAC Code</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. 2517 (Aggregates), 2505 (Natural Sand), 2523 (Cement)"
                      value={formHsnCode}
                      onChange={(e) => setFormHsnCode(e.target.value)}
                    />
                    <span className={styles.formHelper}>
                      Harmonized System Nomenclature code for GST reporting.
                    </span>
                  </div>
                </div>

                <div className={styles.formGrid2} style={{ marginTop: "1rem" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tax Nature *</label>
                    <select
                      className={styles.formSelect}
                      value={formTaxNature}
                      onChange={(e) => handleTaxNatureChange(e.target.value)}
                    >
                      <option value="Taxable">Taxable (GST)</option>
                      <option value="Exempt">Exempt</option>
                      <option value="Nil Rated">Nil Rated (0%)</option>
                      <option value="Non-GST">Non-GST</option>
                      <option value="Reverse Charge">Reverse Charge (RCM)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Tax Percentage Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className={styles.formInput}
                      placeholder="e.g. 5, 12, 18, 28"
                      value={formPercentage}
                      onChange={(e) => setFormPercentage(e.target.value)}
                      disabled={formTaxNature === "Exempt" || formTaxNature === "Nil Rated"}
                      required={formTaxNature === "Taxable"}
                    />
                    <span className={styles.formHelper}>
                      {formTaxNature === "Exempt"
                        ? "Exempted supplies have no tax rate applied."
                        : formTaxNature === "Nil Rated"
                          ? "Explicit 0% GST rate."
                          : "Combined GST percentage (CGST + SGST or IGST)."}
                    </span>
                  </div>
                </div>

                <div className={styles.formGrid2} style={{ marginTop: "1rem" }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Applicable On</label>
                    <select
                      className={styles.formSelect}
                      value={formApplicableOn}
                      onChange={(e) => setFormApplicableOn(e.target.value)}
                    >
                      <option value="Both">Both (Sales & Purchases)</option>
                      <option value="Sale">Sale Only</option>
                      <option value="Purchase">Purchase Only</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      className={styles.formSelect}
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="Active">Active (Available for materials)</option>
                      <option value="Inactive">Inactive (Hidden from new entries)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
                  <label className={styles.formLabel}>Description / Material Scope</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={2}
                    placeholder="Specify materials covered by this tax slab (e.g. 10mm, 20mm metal, GSB, WMM)..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={formLoading}
                >
                  {formLoading ? "Saving..." : editingTax ? "Update Tax Slab" : "Create Tax Slab"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taxToDelete && (
        <div
          className={styles.modalOverlay}
          onClick={() => !deleteLoading && setTaxToDelete(null)}
        >
          <div
            className={styles.modalBox}
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 style={{ color: "#b91c1c", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaTrash /> Delete Tax Slab
              </h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => !deleteLoading && setTaxToDelete(null)}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ color: "#334155", fontSize: "0.9375rem", marginBottom: "0.75rem" }}>
                Are you sure you want to permanently remove the tax slab:
              </p>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{taxToDelete.name}</div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "4px" }}>
                  HSN: {taxToDelete.hsnCode || "None"} • Rate:{" "}
                  {taxToDelete.taxNature === "Exempt" ? "Exempt" : `${taxToDelete.percentage}%`}
                </div>
              </div>

              {taxToDelete.productCount > 0 ? (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    color: "#92400e",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8125rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <FaInfoCircle style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <strong>Warning:</strong> This tax slab is assigned to{" "}
                    <strong>{taxToDelete.productCount} material(s)</strong>. The system will prevent deletion while it is in active use. You should mark it <strong>Inactive</strong> instead.
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                  This action cannot be undone. This tax slab will be removed from the catalog.
                </p>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setTaxToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ background: "#dc2626" }}
                onClick={handleDeleteTax}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Error Modal */}
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
    </div>
  );
}

export default Taxes;
