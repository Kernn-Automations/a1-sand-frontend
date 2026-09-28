import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import styles from "./Products.module.css";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaBoxes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaPercent,
  FaCube,
} from "react-icons/fa";

function ProductHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Confidential purchase prices visibility toggle
  const [showPurchasePrices, setShowPurchasePrices] = useState({});

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem("currentDivisionId");

      let endpoint = "/products/list?showAll=true";
      if (currentDivisionId && currentDivisionId !== "1") {
        endpoint += `&divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        endpoint += `&showAllDivisions=true`;
      }

      const [prodRes, catRes] = await Promise.all([
        axiosAPI.get(endpoint),
        axiosAPI.get("/categories/list").catch(() => ({ data: { categories: [] } })),
      ]);

      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError(err?.response?.data?.message || "Failed to load product catalog");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  // Quick stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "Active").length;
    const loose = products.filter((p) => p.productType === "loose").length;
    const lowStock = products.filter(
      (p) => p.thresholdValue && Number(p.thresholdValue) > 0
    ).length;

    return { total, active, loose, lowStock };
  }, [products]);

  // Client-side filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = (p.name || "").toLowerCase().includes(query);
        const matchSku = (p.SKU || "").toLowerCase().includes(query);
        const matchDesc = (p.description || "").toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchDesc) return false;
      }

      // Category
      if (selectedCategory !== "all") {
        if (String(p.category?.id) !== String(selectedCategory)) return false;
      }

      // Status
      if (selectedStatus !== "all") {
        if (p.status !== selectedStatus) return false;
      }

      // Product Type
      if (selectedType !== "all") {
        if (p.productType !== selectedType) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedType]);

  // Toggle active / inactive status
  const handleToggleStatus = async (productId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
    );

    try {
      await axiosAPI.put(`/products/${productId}/status`, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle product status:", err);
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: currentStatus } : p))
      );
      setError("Failed to update product status");
      setIsErrorModalOpen(true);
    }
  };

  // Toggle single product purchase price
  const togglePurchasePrice = (productId) => {
    setShowPurchasePrices((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Confirm soft delete / deactivation
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await axiosAPI.delete(`/products/delete/${productToDelete.id}`);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productToDelete.id ? { ...p, status: "Inactive" } : p
        )
      );
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deactivating product:", err);
      setError(err?.response?.data?.message || "Failed to de-activate product");
      setIsErrorModalOpen(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.productsContainer}>
      {/* Top Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>
            <FaCube style={{ color: "#c2410c" }} /> Products & Materials Catalog
          </h1>
          <p>
            Manage construction aggregates, sand, masonry materials, rates, and tax specifications.
          </p>
        </div>

        <div className={styles.headerActions}>
          {isAdmin && (
            <button
              className={styles.btnPrimary}
              onClick={() => navigate("/products/add")}
              id="btn-add-product"
            >
              <FaPlus /> Add New Material
            </button>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => navigate("/products/taxes")}
            id="btn-taxes"
          >
            <FaPercent /> Taxes Master
          </button>
          <button
            className={styles.btnSecondary}
            onClick={fetchProductsAndCategories}
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
            <h3>Total Products</h3>
            <p className={styles.kpiValue}>{stats.total}</p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <FaBoxes />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Active Materials</h3>
            <p className={styles.kpiValue}>{stats.active}</p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#dcfce7", color: "#16a34a" }}>
            <FaCheckCircle />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Loose Aggregates</h3>
            <p className={styles.kpiValue}>{stats.loose}</p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#ffedd5", color: "#ea580c" }}>
            <FaCube />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Threshold Alerts</h3>
            <p className={styles.kpiValue}>{stats.lowStock}</p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#fee2e2", color: "#dc2626" }}>
            <FaExclamationTriangle />
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchBox}>
          <i>
            <FaSearch />
          </i>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by material name, SKU code, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="loose">Loose (Aggregates / Sand)</option>
            <option value="packed">Packed Goods</option>
          </select>

          <select
            className={styles.filterSelect}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Catalog Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Loading />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <i>
              <FaCube />
            </i>
            <h3>No materials found</h3>
            <p>
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "No products match your active search filters. Try clearing filters."
                : "No products currently available in the catalog. Add your first material to get started."}
            </p>
            {isAdmin && (
              <button
                className={styles.btnPrimary}
                onClick={() => navigate("/products/add")}
              >
                <FaPlus /> Add New Material
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th style={{ width: "5%", textAlign: "center" }}>#</th>
                  <th style={{ width: "12%" }}>SKU Code</th>
                  <th style={{ width: "26%" }}>Material Description</th>
                  <th style={{ width: "12%" }}>Category</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Unit</th>
                  <th style={{ width: "12%", textAlign: "right" }}>Selling Rate</th>
                  {isAdmin && <th style={{ width: "12%", textAlign: "right" }}>Cost Price</th>}
                  <th style={{ width: "10%", textAlign: "center" }}>Status</th>
                  <th style={{ width: "11%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => (
                  <tr key={product.id}>
                    <td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td>
                      <span className={styles.skuBadge}>{product.SKU}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: "0.9375rem" }}>
                        {product.name}
                      </strong>
                      {(() => {
                        const hsn =
                          product.taxes?.find((t) => t.hsnCode)?.hsnCode ||
                          product.taxes?.[0]?.hsnCode ||
                          product.hsnCode;
                        return hsn ? (
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                            HSN: <span style={{ fontWeight: 600, color: "#475569" }}>{hsn}</span>
                          </div>
                        ) : null;
                      })()}
                      {product.description && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            marginTop: "2px",
                            maxWidth: "280px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={product.description}
                        >
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {product.category?.name || "General Material"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={styles.unitBadge}>{product.unit || "brass"}</span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      &#8377;{Number(product.basePrice || 0).toLocaleString("en-IN")}
                      {product.taxes && product.taxes.length > 0 && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          +{product.taxes.map((t) => `${t.percentage}%`).join(", ")} GST
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: "right", color: "#475569" }}>
                        <span style={{ fontWeight: 600 }}>
                          {showPurchasePrices[product.id]
                            ? `₹${Number(product.purchasePrice || 0).toLocaleString("en-IN")}`
                            : "••••••"}
                        </span>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: "6px",
                            color: "#94a3b8",
                            verticalAlign: "middle",
                          }}
                          onClick={() => togglePurchasePrice(product.id)}
                          title={showPurchasePrices[product.id] ? "Hide Cost" : "Show Cost"}
                        >
                          {showPurchasePrices[product.id] ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </td>
                    )}
                    <td style={{ textAlign: "center" }}>
                      <div
                        className={styles.statusToggle}
                        style={{ justifyContent: "center" }}
                        onClick={() => handleToggleStatus(product.id, product.status)}
                        title="Click to toggle status"
                      >
                        <span
                          className={`${styles.statusPill} ${
                            product.status === "Active"
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className={styles.actionBtnGroup} style={{ justifyContent: "center" }}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => navigate(`/products/modify?edit=${product.id}`)}
                          title="Edit Material"
                        >
                          <FaEdit />
                        </button>
                        {isAdmin && (
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => setProductToDelete(product)}
                            title="Deactivate / Delete"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete / Deactivate Confirmation Modal */}
      {productToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: "480px" }}>
            <div className={styles.modalHeader}>
              <h2 style={{ color: "#dc2626" }}>Deactivate Material</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setProductToDelete(null)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: "0.9375rem", color: "#334155", margin: 0 }}>
                Are you sure you want to de-activate{" "}
                <strong>{productToDelete.name}</strong> ({productToDelete.SKU})?
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: "8px" }}>
                This material will be marked as Inactive and won't appear in sales order dropdowns. You can re-enable it at any time.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                style={{ background: "#dc2626" }}
                onClick={handleDeleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? "Deactivating..." : "Deactivate Material"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
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

export default ProductHome;
