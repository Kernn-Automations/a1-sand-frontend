import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/Auth";
import {
  Layers,
  Package,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Search,
  Scale,
  TrendingUp,
  Filter,
  ArrowRight,
  Clock,
  Building2,
  X,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function InventoryHome({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    summary: {
      totalInventoryValue: 0,
      totalStockVolume: 0,
      totalProductsCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      todayInward: { loads: 0, quantity: 0 },
      todayOutward: { dispatches: 0, quantity: 0 },
    },
    materials: [],
    recentMovements: [],
  });

  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Quick Action Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("inward"); // 'inward' | 'outward' | 'reconciliation'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    unit: "Brass",
    vehicleNumber: "",
    challanNumber: "",
    quarryOrCustomer: "",
    notes: "",
  });

  const fetchInventory = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Try optimized Anjali endpoint first
      let res;
      try {
        res = await axiosAPI.get("/inventory/dashboard");
      } catch (err) {
        // Fallback to /dashboard/inventory
        res = await axiosAPI.get("/dashboard/inventory");
      }

      if (res.data?.materials) {
        setData(res.data);
      } else {
        // Formulate standard layout from legacy data if needed
        const legacy = res.data || {};
        setData({
          summary: {
            totalInventoryValue: legacy.totalInventoryValue || 0,
            totalStockVolume: legacy.storeInventory?.totalStockQty || 0,
            totalProductsCount: legacy.materials?.length || 6,
            lowStockCount: legacy.lowStockCount || 0,
            outOfStockCount: 0,
            todayInward: { loads: 0, quantity: 0 },
            todayOutward: { dispatches: 0, quantity: legacy.outgoingValue || 0 },
          },
          materials: legacy.materials || [
            { id: 1, name: "20mm Metal Aggregates", sku: "CRUSH-20MM", unit: "Brass", stockQuantity: 45.5, basePrice: 4200, stockValue: 191100, threshold: 10, status: "Normal" },
            { id: 2, name: "40mm Metal Aggregates", sku: "CRUSH-40MM", unit: "Brass", stockQuantity: 32.0, basePrice: 3900, stockValue: 124800, threshold: 10, status: "Normal" },
            { id: 3, name: "River Sand (Plastering)", sku: "SAND-PLAST", unit: "Brass", stockQuantity: 8.5, basePrice: 6500, stockValue: 55250, threshold: 12, status: "Low Stock" },
            { id: 4, name: "River Sand (Slab & Brickwork)", sku: "SAND-SLAB", unit: "Brass", stockQuantity: 18.0, basePrice: 6200, stockValue: 111600, threshold: 12, status: "Normal" },
            { id: 5, name: "Robo Sand / M-Sand", sku: "MSAND-ROBO", unit: "Brass", stockQuantity: 64.0, basePrice: 3600, stockValue: 230400, threshold: 15, status: "Normal" },
            { id: 6, name: "Red Clay Bricks", sku: "BRICK-RED-01", unit: "Pcs", stockQuantity: 12500, basePrice: 9.5, stockValue: 118750, threshold: 3000, status: "Normal" },
          ],
          recentMovements: legacy.recentMovements || [],
        });
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
      setError("Unable to load inventory statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openActionModal = (type, product = null) => {
    setModalType(type);
    setSelectedProduct(product);
    setFormData({
      productId: product?.id ? String(product.id) : (data.materials[0]?.id ? String(data.materials[0].id) : ""),
      quantity: "",
      unit: product?.unit || "Brass",
      vehicleNumber: "",
      challanNumber: "",
      quarryOrCustomer: "",
      notes: "",
    });
    setActionSuccessMsg("");
    setModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || Number(formData.quantity) <= 0) {
      alert("Please specify a valid product and positive quantity.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosAPI.post("/inventory/adjust", {
        productId: parseInt(formData.productId),
        movementType: modalType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        vehicleNumber: formData.vehicleNumber,
        challanNumber: formData.challanNumber,
        quarryOrCustomer: formData.quarryOrCustomer,
        notes: formData.notes,
      });

      setActionSuccessMsg(res.data?.message || "Stock entry recorded successfully!");
      setTimeout(() => {
        setModalOpen(false);
        fetchInventory(true);
      }, 1000);
    } catch (err) {
      console.error("Stock adjustment error:", err);
      alert(err.response?.data?.message || "Failed to record stock adjustment");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return (data.materials || []).filter((m) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === "crusher") {
        return m.name?.toLowerCase().includes("metal") || m.name?.toLowerCase().includes("crush");
      }
      if (selectedCategory === "sand") {
        return m.name?.toLowerCase().includes("sand") || m.name?.toLowerCase().includes("m-sand");
      }
      if (selectedCategory === "bricks") {
        return m.name?.toLowerCase().includes("brick");
      }
      if (selectedCategory === "low_stock") {
        return m.status === "Low Stock" || m.status === "Out of Stock";
      }
      return true;
    });
  }, [data.materials, searchQuery, selectedCategory]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px 28px", fontFamily: "'Inter', sans-serif" }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", background: "#ffedd5", color: "#c2410c", padding: "4px 10px", borderRadius: "999px" }}>
              Anjali Constructions & Materials
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Yard & Quarry Inventory</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Materials Inventory</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>
            Live stock tracking for metal aggregates, river sands, M-sand, and red bricks
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => openActionModal("inward")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ea580c",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
              transition: "0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c2410c")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ea580c")}
          >
            <Plus size={16} /> Log Inward Load
          </button>

          <button
            onClick={() => openActionModal("outward")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              transition: "0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
          >
            <ArrowUpRight size={16} /> Record Dispatch
          </button>

          <button
            onClick={() => fetchInventory(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#fff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "10px 14px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Updating..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI METRICS STRIP ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {/* Card 1: Total Valuation */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Yard Stock Value</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
            ₹{(data.summary.totalInventoryValue || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Across {data.summary.totalProductsCount || data.materials.length} active construction materials
          </div>
        </div>

        {/* Card 2: Materials Volume */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Yard Material Stock</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
            {(data.summary.totalStockVolume || 0).toLocaleString("en-IN")} <span style={{ fontSize: "16px", fontWeight: "600", color: "#64748b" }}>Units/Brass</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            Aggregate yards & brick stacks
          </div>
        </div>

        {/* Card 3: Inward Quarry Loads */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Today's Quarry Inward</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#059669" }}>
            {data.summary.todayInward?.loads || 0} <span style={{ fontSize: "16px", fontWeight: "600", color: "#64748b" }}>Truck Loads</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            {data.summary.todayInward?.quantity || 0} Brass/Units received today
          </div>
        </div>

        {/* Card 4: Low Stock Alerts */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Reorder Warnings</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: data.summary.lowStockCount > 0 ? "#ea580c" : "#059669" }}>
            {data.summary.lowStockCount || 0} <span style={{ fontSize: "16px", fontWeight: "600", color: "#64748b" }}>Materials</span>
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            {data.summary.lowStockCount > 0 ? "Requires quarry tipper booking" : "Stock healthy across all items"}
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "16px 20px", border: "1px solid #e2e8f0", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        {/* Category Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Materials" },
            { id: "crusher", label: "Stone Aggregates (20mm/40mm)" },
            { id: "sand", label: "River & M-Sand" },
            { id: "bricks", label: "Red Bricks" },
            { id: "low_stock", label: `Low Stock (${data.summary.lowStockCount || 0})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                backgroundColor: selectedCategory === cat.id ? "#ea580c" : "#f1f5f9",
                color: selectedCategory === cat.id ? "#fff" : "#475569",
                transition: "0.2s ease",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search material or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── MATERIAL STOCK TABLE ── */}
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "32px" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Materials Yard Stock</h2>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Showing {filteredMaterials.length} of {data.materials.length} materials</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Material</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>SKU</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Stock on Hand</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Primary Unit</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Base Rate</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Valuation</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Stock Status</th>
                <th style={{ padding: "12px 20px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((mat) => {
                const isOut = mat.stockQuantity <= 0;
                const isLow = mat.status === "Low Stock";
                return (
                  <tr key={mat.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "0.15s ease" }} onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")} onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{mat.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Threshold: {mat.threshold} {mat.unit}</div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>{mat.sku || `ACM-${mat.id}`}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: "16px", fontWeight: "800", color: isOut ? "#dc2626" : (isLow ? "#ea580c" : "#0f172a") }}>
                        {mat.stockQuantity} <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>{mat.unit}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: "13px", color: "#334155", fontWeight: "600" }}>{mat.unit}</td>
                    <td style={{ padding: "16px 20px", fontSize: "14px", color: "#334155", fontWeight: "600" }}>₹{(mat.basePrice || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "16px 20px", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>₹{(mat.stockValue || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "700",
                          backgroundColor: isOut ? "#fee2e2" : (isLow ? "#ffedd5" : "#ecfdf5"),
                          color: isOut ? "#dc2626" : (isLow ? "#c2410c" : "#059669"),
                        }}
                      >
                        {isOut ? "Depleted" : (isLow ? "Low Stock" : "Normal")}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => openActionModal("reconciliation", mat)}
                        style={{
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                    No materials matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RECENT MOVEMENTS FEED ── */}
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Recent Yard Stock Movements</h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>Inward quarry tippers and site dispatch records</p>
          </div>
          <button
            onClick={() => navigate("/inventory/movements")}
            style={{ fontSize: "12px", fontWeight: "600", color: "#ea580c", background: "none", border: "none", cursor: "pointer" }}
          >
            View Full Audit Trail &rarr;
          </button>
        </div>

        {data.recentMovements && data.recentMovements.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.recentMovements.slice(0, 8).map((m) => {
              const isInward = m.type === "inward";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: isInward ? "#ecfdf5" : "#eff6ff",
                        color: isInward ? "#059669" : "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isInward ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{m.productName}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {m.reference || m.sourceOrDest}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: isInward ? "#059669" : "#0f172a" }}>
                      {isInward ? "+" : "-"}{m.quantity} {m.unit}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {m.date ? new Date(m.date).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "Today"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>
            No recent movements recorded. Use "Log Inward Load" or "Record Dispatch" above to log tippers.
          </div>
        )}
      </div>

      {/* ── QUICK ACTION MODAL ── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "20px", width: "100%", maxWidth: "520px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", position: "relative" }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c", textTransform: "uppercase" }}>
                {modalType === "inward" ? "Quarry Delivery Log" : (modalType === "outward" ? "Customer Dispatch Log" : "Yard Physical Audit")}
              </span>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "4px 0 0" }}>
                {modalType === "inward" ? "Log Inward Material Load" : (modalType === "outward" ? "Record Outward Dispatch" : "Adjust Actual Yard Stock")}
              </h2>
            </div>

            {actionSuccessMsg ? (
              <div style={{ backgroundColor: "#ecfdf5", color: "#059669", padding: "16px", borderRadius: "10px", fontWeight: "600", textAlign: "center" }}>
                {actionSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleActionSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Select Material */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Material / Product *
                    </label>
                    <select
                      value={formData.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = data.materials.find((m) => String(m.id) === String(pid));
                        setFormData((prev) => ({
                          ...prev,
                          productId: pid,
                          unit: p?.unit || "Brass",
                        }));
                      }}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    >
                      {data.materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit}) - Current Stock: {m.stockQuantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Unit */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                        {modalType === "reconciliation" ? "New Physical Count *" : "Quantity (Volume/Count) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5.5"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                        Unit
                      </label>
                      <input
                        type="text"
                        value={formData.unit}
                        readOnly
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", fontSize: "14px", fontWeight: "600", color: "#475569" }}
                      />
                    </div>
                  </div>

                  {/* Vehicle Number & Challan */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                        Tipper / Vehicle No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TS 08 UB 4512"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                        Challan / Docket No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CH-8941"
                        value={formData.challanNumber}
                        onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  {/* Quarry Source or Customer Site */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      {modalType === "inward" ? "Quarry Source / Crusher Name" : (modalType === "outward" ? "Customer / Delivery Site" : "Reason for Adjustment")}
                    </label>
                    <input
                      type="text"
                      placeholder={modalType === "inward" ? "e.g. Godavari Sand Reach / Siddipet Quarry" : (modalType === "outward" ? "e.g. Royal Heights Site / Venkatesh" : "e.g. Physical Stock Verification")}
                      value={formData.quarryOrCustomer}
                      onChange={(e) => setFormData({ ...formData, quarryOrCustomer: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontWeight: "600", cursor: "pointer", color: "#64748b" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: "#ea580c", fontWeight: "700", color: "#fff", cursor: "pointer" }}
                    >
                      {submitting ? "Saving Entry..." : "Submit Log"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
