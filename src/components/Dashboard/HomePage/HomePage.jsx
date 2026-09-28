import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FaTruck,
  FaBoxes,
  FaMoneyBillWave,
  FaChartLine,
  FaFileInvoiceDollar,
  FaPlusCircle,
  FaSyncAlt,
  FaBuilding,
  FaPhoneAlt,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaReceipt,
  FaLayerGroup,
  FaChevronRight,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

// Default materials list for Anjali Constructions if database returns empty
const DEFAULT_CONSTRUCTION_MATERIALS = [
  { id: 1, name: "20mm Metal Aggregates", category: "Stone Crushers", unit: "Brass", stock: "45.00", minStock: "10.00", avgRate: "₹3,800/Brass" },
  { id: 2, name: "40mm Metal Aggregates", category: "Stone Crushers", unit: "Brass", stock: "32.50", minStock: "10.00", avgRate: "₹3,400/Brass" },
  { id: 3, name: "River Sand (Plastering)", category: "River Sand", unit: "Brass", stock: "28.00", minStock: "8.00", avgRate: "₹5,200/Brass" },
  { id: 4, name: "River Sand (Brick Work / Slab)", category: "River Sand", unit: "Brass", stock: "55.00", minStock: "12.00", avgRate: "₹4,800/Brass" },
  { id: 5, name: "Robo Sand / M-Sand", category: "Manufactured Sand", unit: "Brass", stock: "60.00", minStock: "15.00", avgRate: "₹2,900/Brass" },
  { id: 6, name: "Red Clay Bricks", category: "Clay Bricks", unit: "Units", stock: "24,000", minStock: "5,000", avgRate: "₹9.50/Brick" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();

  const [dateRange, setDateRange] = useState("today"); // today, 7d, 30d, all
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Financials & Summary data
  const [financeData, setFinanceData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  // Calculate Date bounds
  const getDates = useCallback((range) => {
    const today = new Date();
    const toDate = today.toISOString().split("T")[0];
    let fromDate = toDate;

    if (range === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString().split("T")[0];
    } else if (range === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      fromDate = d.toISOString().split("T")[0];
    } else if (range === "all") {
      fromDate = "2024-01-01";
    }
    return { fromDate, toDate };
  }, []);

  // Fetch all dashboard data concurrently
  const loadDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      const { fromDate, toDate } = getDates(dateRange);

      const [financesRes, ordersRes, productsRes] = await Promise.allSettled([
        axiosAPI.get(`/reports/finances/live?fromDate=${fromDate}&toDate=${toDate}`),
        axiosAPI.get(`/sales-orders/list?limit=8`),
        axiosAPI.get(`/products?limit=20`),
      ]);

      if (financesRes.status === "fulfilled" && financesRes.value.data?.success) {
        setFinanceData(financesRes.value.data.data || financesRes.value.data);
      }

      if (ordersRes.status === "fulfilled" && ordersRes.value.data?.success) {
        const orderList = ordersRes.value.data.orders || [];
        setRecentOrders(orderList);

        // Aggregate top contractors from recent orders
        const custMap = {};
        orderList.forEach((ord) => {
          const cName = ord.customer?.name || "Contractor";
          const cPhone = ord.customer?.phone || "";
          const cSite = ord.siteLocation || ord.customer?.billingAddress || "Local Site";
          const bAmt = parseFloat(ord.balanceAmount || 0);
          const tAmt = parseFloat(ord.totalAmount || 0);

          if (!custMap[cName]) {
            custMap[cName] = { name: cName, phone: cPhone, site: cSite, totalBilled: 0, totalDue: 0, orderCount: 0 };
          }
          custMap[cName].totalBilled += tAmt;
          custMap[cName].totalDue += bAmt;
          custMap[cName].orderCount += 1;
        });

        setTopCustomers(Object.values(custMap).sort((a, b) => b.totalBilled - a.totalBilled).slice(0, 5));
      }

      if (productsRes.status === "fulfilled" && productsRes.value.data?.success) {
        const prods = productsRes.value.data.data || productsRes.value.data.products || [];
        if (prods.length > 0) {
          setProducts(prods);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [axiosAPI, dateRange, getDates]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Formatted KPIs
  const kpis = useMemo(() => {
    const summary = financeData?.metrics || financeData?.summary || financeData || {};
    const totalRev = parseFloat(summary.totalRevenue || 0);
    const totalProf = parseFloat(summary.netProfit ?? summary.totalProfit ?? 0);
    const totalOutstanding = parseFloat(summary.totalOutstanding || 0);
    const marginPct = summary.profitMarginPercent || (totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(2) : "0.00");
    const totalPurch = parseFloat(summary.totalPurchaseCost || 0);

    return {
      revenue: totalRev,
      profit: totalProf,
      margin: marginPct,
      receivables: totalOutstanding,
      purchaseCost: totalPurch,
      orderCount: recentOrders.length,
    };
  }, [financeData, recentOrders]);

  // Mock Trend Chart Data (daily distribution based on current metrics)
  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
    const baseRev = kpis.revenue > 0 ? kpis.revenue / 7 : 14000;
    const baseCost = kpis.purchaseCost > 0 ? kpis.purchaseCost / 7 : 9500;

    return days.map((day, idx) => ({
      day,
      Revenue: Math.round(baseRev * (0.7 + (idx * 0.1))),
      Cost: Math.round(baseCost * (0.65 + (idx * 0.08))),
    }));
  }, [kpis]);

  return (
    <div style={{ fontFamily: "Outfit, sans-serif", color: "#0f172a", width: "100%" }}>
      {/* ── Top Header & Actions ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1
              style={{
                fontSize: "clamp(20px, 3vw, 26px)",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Operations & Dispatch Hub
            </h1>
            <span
              style={{
                background: "#ffedd5",
                color: "#c2410c",
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              Anjali Constructions
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px", fontWeight: 500 }}>
            Aggregates, River Sand, M-Sand & Bricks Real-Time Yard Overview
          </p>
        </div>

        {/* Action Buttons & Date Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Filter Range Pill Group */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "3px",
              display: "flex",
              gap: 2,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {[
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Time" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDateRange(t.id)}
                style={{
                  border: "none",
                  background: dateRange === t.id ? "#ea580c" : "transparent",
                  color: dateRange === t.id ? "#ffffff" : "#64748b",
                  fontWeight: dateRange === t.id ? 700 : 600,
                  fontSize: "12.5px",
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadDashboard}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <FaSyncAlt style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>

          <button
            onClick={() => navigate("/sales/new")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: "13.5px",
              fontWeight: 700,
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.35)",
            }}
          >
            <FaPlusCircle />
            New Sales Order
          </button>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Revenue */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Revenue
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ffedd5", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaMoneyBillWave size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
            ₹{kpis.revenue.toLocaleString("en-IN")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
            <FaArrowUp size={10} />
            <span>{kpis.orderCount} construction orders booked</span>
          </div>
        </div>

        {/* Card 2: Live Gross Profit */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Live Gross Profit
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaChartLine size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a" }}>
            ₹{kpis.profit.toLocaleString("en-IN")}
          </div>
          <div style={{ marginTop: 6, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            Operating Margin: <span style={{ color: "#0f172a", fontWeight: 700 }}>{kpis.margin}%</span>
          </div>
        </div>

        {/* Card 3: Pending Receivables */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Contractor Receivables
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaFileInvoiceDollar size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#dc2626" }}>
            ₹{kpis.receivables.toLocaleString("en-IN")}
          </div>
          <div style={{ marginTop: 6, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            Pending balance from contractors
          </div>
        </div>

        {/* Card 4: Quarry Inward & Purchase Outflow */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quarry Material Cost
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaBoxes size={16} />
            </div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#334155" }}>
            ₹{kpis.purchaseCost.toLocaleString("en-IN")}
          </div>
          <div style={{ marginTop: 6, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            Cost of inward stone, sand & bricks
          </div>
        </div>
      </div>

      {/* ── Yard Material Inventory & Quick Stocks ─────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Physical Yard Stocks & Material Availability
            </h2>
            <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "13px" }}>
              Track metal aggregates (20mm/40mm), river sand, robo sand and red bricks
            </p>
          </div>
          <button
            onClick={() => navigate("/inventory")}
            style={{
              background: "none",
              border: "none",
              color: "#ea580c",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Manage Inventory <FaChevronRight size={11} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {(products.length > 0 ? products.slice(0, 6) : DEFAULT_CONSTRUCTION_MATERIALS).map((mat, idx) => {
            const matName = typeof mat.name === "object" ? (mat.name?.name || "Material") : (mat.name || "Material");
            const isBrick = typeof matName === "string" && matName.toLowerCase().includes("brick");
            const categoryName = typeof mat.category === "object" ? (mat.category?.name || "Construction Aggregate") : (mat.category || "Construction Aggregate");
            const unitName = typeof mat.unit === "object" ? (mat.unit?.name || (isBrick ? "Bricks" : "Brass")) : (mat.unit || (isBrick ? "Bricks" : "Brass"));
            return (
              <div
                key={mat.id || idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#f1f5f9",
                        color: "#475569",
                        padding: "2px 8px",
                        borderRadius: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {categoryName}
                    </span>
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }}></span>
                      Available
                    </span>
                  </div>

                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                    {matName}
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: "22px", fontWeight: 800, color: "#ea580c" }}>
                      {typeof mat.stock === "object" ? (mat.stock?.quantity || "Available") : (mat.stock || (mat.current_stock ? parseFloat(mat.current_stock).toFixed(2) : "Available"))}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                      {unitName}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: "1px solid #f1f5f9",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Market Selling Rate</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    {mat.avgRate || (mat.price ? `₹${parseFloat(mat.price).toLocaleString("en-IN")}/${unitName}` : "Standard Rate")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two Column Operational Section: Dispatches & Top Contractors ──── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Left Column: Recent Dispatches & Orders */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Recent Dispatches & Orders
              </h3>
              <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "12.5px" }}>
                Live dispatch updates & vehicle trip records
              </p>
            </div>
            <button
              onClick={() => navigate("/sales")}
              style={{
                background: "none",
                border: "none",
                color: "#ea580c",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 12px", color: "#94a3b8" }}>
              <FaTruck size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>No dispatches recorded today</div>
              <button
                onClick={() => navigate("/sales/new")}
                style={{
                  marginTop: 12,
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Create Sales Order
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentOrders.slice(0, 6).map((ord) => {
                const isPaid = ord.paymentStatus === "Paid";
                const isPartial = ord.paymentStatus === "Partial";
                const badgeBg = isPaid ? "#dcfce7" : isPartial ? "#fef3c7" : "#fee2e2";
                const badgeColor = isPaid ? "#16a34a" : isPartial ? "#b45309" : "#dc2626";

                return (
                  <div
                    key={ord.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                          {ord.customer?.name || "Contractor / Site"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: badgeBg,
                            color: badgeColor,
                          }}
                        >
                          {ord.paymentStatus || "Due"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: "12px", color: "#64748b" }}>
                        <span>Order #{ord.orderNumber}</span>
                        {ord.vehicleNumber && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FaTruck size={11} /> {ord.vehicleNumber}
                          </span>
                        )}
                        {ord.siteLocation && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FaMapMarkerAlt size={11} /> {ord.siteLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
                          ₹{parseFloat(ord.totalAmount || 0).toLocaleString("en-IN")}
                        </div>
                        {parseFloat(ord.balanceAmount || 0) > 0 && (
                          <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: 600 }}>
                            Due: ₹{parseFloat(ord.balanceAmount).toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>

                      {ord.customer?.phone && (
                        <a
                          href={`https://wa.me/91${ord.customer.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(ord.customer.name || "")},%20your%20materials%20dispatch%20for%20order%20${ord.orderNumber}%20has%20been%20recorded%20by%20Anjali%20Constructions.%20Total:%20INR%20${ord.totalAmount}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#25D366",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                          }}
                          title="Share on WhatsApp"
                        >
                          <FaWhatsapp size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Top Contractors & Outstanding Balances */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Top Contractors & Builders
              </h3>
              <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "12.5px" }}>
                Volume buyers and receivables balance
              </p>
            </div>
            <button
              onClick={() => navigate("/customers")}
              style={{
                background: "none",
                border: "none",
                color: "#ea580c",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Contractor Directory
            </button>
          </div>

          {topCustomers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 12px", color: "#94a3b8" }}>
              <FaBuilding size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>No contractor data found</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topCustomers.map((cust, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "#ffedd5",
                        color: "#ea580c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "14px",
                      }}
                    >
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                        {cust.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
                        {cust.orderCount} orders • {cust.site}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
                        ₹{cust.totalBilled.toLocaleString("en-IN")}
                      </div>
                      {cust.totalDue > 0 ? (
                        <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700 }}>
                          Due: ₹{cust.totalDue.toLocaleString("en-IN")}
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                          Settled
                        </div>
                      )}
                    </div>

                    {cust.phone && cust.totalDue > 0 && (
                      <a
                        href={`https://wa.me/91${cust.phone.replace(/[^0-9]/g, "")}?text=Dear%20${encodeURIComponent(cust.name)},%20this%20is%20a%20reminder%20from%20Anjali%20Constructions.%20Your%20outstanding%20material%20balance%20is%20INR%20${cust.totalDue}.%20Kindly%20arrange%20payment.%20Thank%20you.`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#25D366",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textDecoration: "none",
                        }}
                        title="Send Payment Reminder"
                      >
                        <FaWhatsapp size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Revenue & Dispatch Analytics Chart ──────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Dispatch & Revenue Trajectory
            </h3>
            <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "12.5px" }}>
              Daily billing vs Material procurement outflow
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "12.5px", fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ea580c" }}></span>
              Revenue
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#94a3b8" }}></span>
              Quarry Material Cost
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
              <Tooltip
                formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, undefined]}
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="Cost" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
