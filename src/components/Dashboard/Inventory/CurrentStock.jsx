import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/Auth";
import {
  Layers,
  Search,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function CurrentStock({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchStock = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fetch from fast inventory endpoint
      let res;
      try {
        res = await axiosAPI.get("/inventory/current-stock");
      } catch {
        res = await axiosAPI.get("/inventory/dashboard");
      }

      const items = res.data?.inventory || res.data?.materials || [];
      if (Array.isArray(items) && items.length > 0) {
        setMaterials(
          items.map((i) => ({
            id: i.id || i.productId,
            name: i.product?.name || i.name || "Material",
            sku: i.product?.SKU || i.sku || "ACM-MAT",
            unit: i.primaryUnit || i.product?.unit || i.unit || "Brass",
            stockQuantity: Number(i.stockQuantity || 0),
            basePrice: Number(i.product?.basePrice || i.basePrice || 0),
            stockValue: Number(i.stockValue || (i.stockQuantity * (i.product?.basePrice || i.basePrice || 0))),
            threshold: Number(i.product?.thresholdValue || i.threshold || 10),
            status:
              i.stockQuantity <= 0
                ? "Depleted"
                : i.stockQuantity <= (i.product?.thresholdValue || i.threshold || 10)
                ? "Low Stock"
                : "Normal",
          }))
        );
      } else {
        // Fallback default Anjali materials list
        setMaterials([
          { id: 1, name: "20mm Metal Aggregates", sku: "CRUSH-20MM", unit: "Brass", stockQuantity: 45.5, basePrice: 4200, stockValue: 191100, threshold: 10, status: "Normal" },
          { id: 2, name: "40mm Metal Aggregates", sku: "CRUSH-40MM", unit: "Brass", stockQuantity: 32.0, basePrice: 3900, stockValue: 124800, threshold: 10, status: "Normal" },
          { id: 3, name: "River Sand (Plastering)", sku: "SAND-PLAST", unit: "Brass", stockQuantity: 8.5, basePrice: 6500, stockValue: 55250, threshold: 12, status: "Low Stock" },
          { id: 4, name: "River Sand (Slab & Brickwork)", sku: "SAND-SLAB", unit: "Brass", stockQuantity: 18.0, basePrice: 6200, stockValue: 111600, threshold: 12, status: "Normal" },
          { id: 5, name: "Robo Sand / M-Sand", sku: "MSAND-ROBO", unit: "Brass", stockQuantity: 64.0, basePrice: 3600, stockValue: 230400, threshold: 15, status: "Normal" },
          { id: 6, name: "Red Clay Bricks", sku: "BRICK-RED-01", unit: "Pcs", stockQuantity: 12500, basePrice: 9.5, stockValue: 118750, threshold: 3000, status: "Normal" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching current stock:", err);
      setError("Failed to load live yard stock data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.sku.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (statusFilter === "low") return m.status === "Low Stock";
      if (statusFilter === "depleted") return m.status === "Depleted";
      if (statusFilter === "normal") return m.status === "Normal";
      return true;
    });
  }, [materials, search, statusFilter]);

  const totalValue = filtered.reduce((s, m) => s + m.stockValue, 0);

  const exportCSV = () => {
    const headers = ["Material Name", "SKU", "Stock on Hand", "Unit", "Base Price (INR)", "Valuation (INR)", "Status"];
    const rows = filtered.map((m) => [
      `"${m.name}"`,
      `"${m.sku}"`,
      m.stockQuantity,
      `"${m.unit}"`,
      m.basePrice,
      m.stockValue,
      `"${m.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Anjali_Materials_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px 28px", fontFamily: "'Inter', sans-serif" }}>
      {/* ── TOP NAV ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/inventory")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "#fff",
              border: "1px solid #cbd5e1",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Current Stock on Hand</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>Live inventory quantities and asset valuations</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={exportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 15px",
              borderRadius: "8px",
              backgroundColor: "#fff",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              color: "#334155",
            }}
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button
            onClick={() => fetchStock(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              borderRadius: "8px",
              backgroundColor: "#ea580c",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── SUMMARY MINI-CARD ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", flex: "1 1 200px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Total Filtered Valuation</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            ₹{totalValue.toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", flex: "1 1 200px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Materials Listed</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {filtered.length} Items
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ backgroundColor: "#fff", padding: "14px 18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Items" },
            { id: "normal", label: "Normal Stock" },
            { id: "low", label: "Low Stock Alert" },
            { id: "depleted", label: "Depleted" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                backgroundColor: statusFilter === s.id ? "#0f172a" : "#f1f5f9",
                color: statusFilter === s.id ? "#fff" : "#475569",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Filter by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Material</th>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>SKU</th>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Current Stock</th>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Primary Unit</th>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Base Price</th>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Stock Valuation</th>
                <th style={{ padding: "12px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isOut = m.status === "Depleted";
                const isLow = m.status === "Low Stock";
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{m.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Reorder Threshold: {m.threshold} {m.unit}</div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>{m.sku}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: isOut ? "#dc2626" : (isLow ? "#ea580c" : "#0f172a") }}>
                        {m.stockQuantity}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>{m.unit}</td>
                    <td style={{ padding: "14px 18px", fontSize: "13px", color: "#475569" }}>₹{m.basePrice.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 18px", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>₹{m.stockValue.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: isOut ? "#fee2e2" : (isLow ? "#ffedd5" : "#ecfdf5"),
                          color: isOut ? "#dc2626" : (isLow ? "#c2410c" : "#059669"),
                        }}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No materials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
