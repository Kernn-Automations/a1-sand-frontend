import { useAuth } from "../../../Auth"; // Corrected import path
import React, { useState, useEffect, useCallback, useRef } from "react"; // Added useRef
import { useNavigate } from "react-router-dom";
import storeService from "../../../services/storeService";
import Loading from "../../Loading";
import ErrorModal from "../../ErrorModal";
import styles from "./StoreReports.module.css";
import commonStyles from "./Reports.module.css";
import {
  FaStore,
  FaMoneyBillWave,
  FaBoxOpen,
  FaChartLine,
  FaCalendarAlt,
  FaChartPie,
} from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import { exportToExcel, exportToPDF } from "./EmployeeReports/PDFndXLSCode";
import {
  exportStoreComparisonToExcel,
  exportStoreComparisonToPDF,
} from "./StoreComparisonExport";
import xls from "@/images/xls-png.png";
import pdf from "@/images/pdf-png.png";

export default function StoreReports() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth(); // Get axiosAPI

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [storeTypeFilter, setStoreTypeFilter] = useState("all"); // 'all', 'franchise', 'own'

  // Navigation Confirmation Modal
  const [showNavModal, setShowNavModal] = useState(false);
  const [selectedStoreForNav, setSelectedStoreForNav] = useState(null);
  {
    /* Add this state at the top of your component */
  }
  const [unitModal, setUnitModal] = useState({
    show: false,
    bags: "bags",
    date: "",
    storeName: "",
  });

  // Comparison State
  const [showComparison, setShowComparison] = useState(false);

  // --- NEW Store Comparison Report State ---
  const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);
  const [reportType, setReportType] = useState("comparison"); // 'summary', 'leaderboard', 'trend', 'comparison'
  const [activeReportType, setActiveReportType] = useState("comparison"); // The type currently being displayed

  const [availableStoresForComparison, setAvailableStoresForComparison] =
    useState([]);
  const [selectedComparisonStoreIds, setSelectedComparisonStoreIds] = useState(
    [],
  );
  const [comparisonReportData, setComparisonReportData] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [selectedNames, setSelectedNames] = useState([]);

  // Selection States for Export
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAllRows, setSelectAllRows] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");

  // Fetch available stores for comparison dropdown
  useEffect(() => {
    async function fetchComparisonStores() {
      try {
        const res = await axiosAPI.get("/reports/store-comparison/stores");
        const storesData = res.data.stores || res.data.data || [];
        setAvailableStoresForComparison(storesData);
      } catch (e) {
        console.error("Failed to fetch comparison stores list", e);
      }
    }
    fetchComparisonStores();
  }, [axiosAPI]);

  // Fetch Stores Data
  const fetchStoresData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosAPI.get("/stores/reports/store-list-summary");
      const storesList = res.data.data || res.data || [];

      setStores(storesList);
      setFilteredStores(storesList);
    } catch (err) {
      console.error("Failed to fetch store reports data", err);
      setError("Failed to fetch store reports data.");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  // Filtering Logic
  useEffect(() => {
    let result = stores;
    if (storeTypeFilter !== "all") {
      result = result.filter(
        (store) =>
          (store.storeType || "").toLowerCase() ===
          storeTypeFilter.toLowerCase(),
      );
    }
    setFilteredStores(result);
  }, [storeTypeFilter, stores]);

  const [comparisonData, setComparisonData] = useState([]);

  // Handlers
  const handleStoreClick = (store) => {
    setSelectedStoreForNav(store);
    setShowNavModal(true);
  };

  const confirmNavigation = () => {
    if (selectedStoreForNav) {
      // Build logic to switch context if needed, then navigate
      // Storing selected store in localStorage is a common pattern here to "switch" context
      localStorage.setItem(
        "selectedStore",
        JSON.stringify(selectedStoreForNav),
      );
      localStorage.setItem("currentStoreId", selectedStoreForNav.storeId);

      navigate(`/store/dashboard/${selectedStoreForNav.storeId}`); // Or just /store/dashboard if context handles it
    }
    setShowNavModal(false);
  };

  // fetch comparison report
  const fetchComparisonReport = async () => {
    if (selectedComparisonStoreIds.length === 0) {
      setError("Please select at least one store to compare");
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setComparisonLoading(true);
      setComparisonReportData(null);
      const ids = selectedComparisonStoreIds.join(",");
      // API Parameters: fromDate, toDate, storeIds, reportType
      // Default: reportType=summary if not specified (we have state for it)
      const query = `/reports/store-comparison?storeIds=${ids}&fromDate=${from}&toDate=${to}&reportType=${reportType}`;
      console.log("Fetching Comparison Report:", query);

      const res = await axiosAPI.get(query);
      console.log(res);
      const data = res.data;
      setComparisonReportData(data);
      setActiveReportType(reportType); // Update the active type only after successful fetch

      // Determine columns based on response or selected IDs
      // If API returns list of stores with data, we can map names from there or use availableStoresForComparison
      // Employee Report uses data.ids array. Let's assume similar structure or map from store list.
      // If data.ids exists, use it. Else map selected IDs to names.
      if (data.ids) {
        setSelectedNames(data.ids.map((x) => x.name || x.storeName || x.label));
      } else {
        // Fallback: Map selected IDs to names from availableStores
        const names = selectedComparisonStoreIds.map((id) => {
          const store = availableStoresForComparison.find((s) => s.id === id);
          return store ? store.name : `Store ${id}`;
        });
        setSelectedNames(names);
      }
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || "Error fetching comparison report");
      setIsErrorModalOpen(true);
    } finally {
      setComparisonLoading(false);
    }
  };

  const toggleStoreSelect = (id) => {
    if (selectedComparisonStoreIds.includes(id)) {
      setSelectedComparisonStoreIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedComparisonStoreIds((prev) => [...prev, id]);
    }
  };

  const toggleSelectAllStores = () => {
    if (
      selectedComparisonStoreIds.length === availableStoresForComparison.length
    ) {
      // Deselect all
      setSelectedComparisonStoreIds([]);
    } else {
      // Select all
      setSelectedComparisonStoreIds(
        availableStoresForComparison.map((s) => s.id),
      );
    }
  };

  const toggleRowSelection = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows((prev) => prev.filter((i) => i !== index));
    } else {
      setSelectedRows((prev) => [...prev, index]);
    }
  };

  const toggleAllRowsSelection = () => {
    if (!comparisonReportData?.rows) return;

    if (selectAllRows) {
      setSelectedRows([]);
    } else {
      setSelectedRows(comparisonReportData.rows.map((_, idx) => idx));
    }
    setSelectAllRows(!selectAllRows);
  };

  const toggleColumnSelection = (storeId) => {
    if (selectedColumns.includes(storeId)) {
      setSelectedColumns((prev) => prev.filter((id) => id !== storeId));
    } else {
      setSelectedColumns((prev) => [...prev, storeId]);
    }
  };

  const exportSelectedData = (format) => {
    if (!comparisonReportData) return;

    // Filter data based on selections
    let dataToExport = { ...comparisonReportData };

    if (selectedRows.length > 0) {
      dataToExport.rows = dataToExport.rows.filter((_, idx) =>
        selectedRows.includes(idx),
      );
    }

    if (selectedColumns.length > 0 && reportType === "comparison") {
      // Filter columns for comparison report
      dataToExport.stores = dataToExport.stores.filter((s) =>
        selectedColumns.includes(s.id),
      );
    }

    if (format === "excel") {
      if (activeReportType === "comparison") {
        exportStoreComparisonToExcel(selectedNames, dataToExport);
      } else {
        exportToExcel(selectedNames, dataToExport);
      }
    } else {
      if (activeReportType === "comparison") {
        exportStoreComparisonToPDF(selectedNames, dataToExport);
      } else {
        exportToPDF(selectedNames, dataToExport);
      }
    }
  };

  const clearSelections = () => {
    setSelectedRows([]);
    setSelectedColumns([]);
    setSelectAllRows(false);
  };

  // Calculations
  const totalStores = stores.length;
  const franchiseStores = stores.filter(
    (s) => (s.storeType || "").toLowerCase() === "franchise",
  ).length;
  const ownStores = stores.filter(
    (s) => (s.storeType || "").toLowerCase() === "own",
  ).length; // Assuming 'own' is the type value

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .table-hover tbody tr:hover {
          background-color: rgba(102, 126, 234, 0.05);
          transition: all 0.2s ease;
        }

        .form-check-input:checked {
          background-color: #667eea;
          border-color: #667eea;
        }

        .dropdown-menu.show {
          animation: slideDown 0.2s ease-out;
        }

        .badge {
          font-weight: 500;
          padding: 0.35em 0.65em;
        }

        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
        }
      `}</style>
      <div
        className="container-fluid p-4"
        style={{ overflowX: "hidden", minWidth: 0 }}
      >
        {/* Header */}
        <h2
          className="mb-4"
          style={{
            fontFamily: "Poppins",
            fontWeight: 700,
            color: "var(--primary-color)",
          }}
        >
          Store Reports
        </h2>

        {/* Summary Cards */}
        <div className="row mb-4">
          {/* Total Stores */}
          <div className="col-md-3 mb-3">
            <div
              className="card shadow-sm p-3 h-100"
              style={{ cursor: "pointer", borderLeft: "5px solid #0d6efd" }}
              onClick={() => setStoreTypeFilter("all")}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Stores</h6>
                  <h3 className="mb-0 fw-bold">{totalStores}</h3>
                </div>
                <FaStore size={28} className="text-primary opacity-50" />
              </div>
            </div>
          </div>

          {/* Franchise Stores */}
          <div className="col-md-3 mb-3">
            <div
              className="card shadow-sm p-3 h-100"
              style={{
                cursor: "pointer",
                borderLeft: "5px solid #198754",
                backgroundColor:
                  storeTypeFilter === "franchise" ? "#f0fff4" : "white",
              }}
              onClick={() => setStoreTypeFilter("franchise")}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Franchise Stores</h6>
                  <h3 className="mb-0 fw-bold">{franchiseStores}</h3>
                </div>
                <FaStore size={28} className="text-success opacity-50" />
              </div>
            </div>
          </div>

          {/* Own Stores */}
          <div className="col-md-3 mb-3">
            <div
              className="card shadow-sm p-3 h-100"
              style={{
                cursor: "pointer",
                borderLeft: "5px solid #fd7e14",
                backgroundColor:
                  storeTypeFilter === "own" ? "#fff4e6" : "white",
              }}
              onClick={() => setStoreTypeFilter("own")}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Own Stores</h6>
                  <h3 className="mb-0 fw-bold">{ownStores}</h3>
                </div>
                <FaStore size={28} className="text-warning opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4
            className="fw-bold d-flex align-items-center gap-2"
            style={{ fontSize: "18px" }}
          >
            <FaStore className="text-primary" />
            Store List
          </h4>
          <div>
            <button
              className={`btn ${showComparison ? "btn-primary" : "btn-outline-primary"} shadow-sm`}
              onClick={() => {
                setShowComparison(!showComparison);
                if (!showComparison) {
                  clearSelections();
                  setComparisonReportData(null);
                }
              }}
              style={{
                transition: "all 0.3s ease",
              }}
            >
              <FaChartLine className="me-2" />
              {showComparison ? "Hide Comparison" : "Store Wise Comparison"}
            </button>
          </div>
        </div>

        {/* Store Wise Comparison Section (Collapsible with Animation) */}
        {showComparison && (
          <div
            className="card shadow-sm mb-4"
            style={{
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              animation: "slideDown 0.3s ease-out",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <div className="card-header bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <FaChartLine className="text-primary" />
                  Store Comparison Dashboard
                </h5>
                <span className="badge bg-primary">Advanced Analytics</span>
              </div>
            </div>
            <div
              className="card-body p-4"
              style={{ minWidth: 0, overflow: "hidden" }}
            >
              {/* Filters */}
              {/* Filters Section V2 (Premium Glassmorphism) */}
              <div
                className="card border-0 mb-5 overflow-hidden"
                style={{
                  borderRadius: "24px",
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.45) !important",
                  boxShadow:
                    "0 8px 32px rgba(31, 38, 135, 0.07), 0 1px 1px rgba(255, 255, 255, 0.2) inset",
                }}
              >
                <div className="card-body p-4 position-relative">
                  {/* Subtle Background Glows */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-20%",
                      right: "-10%",
                      width: "150px",
                      height: "150px",
                      background: "rgba(102, 126, 234, 0.05)",
                      filter: "blur(50px)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  ></div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-20%",
                      left: "-10%",
                      width: "150px",
                      height: "150px",
                      background: "rgba(118, 75, 162, 0.05)",
                      filter: "blur(50px)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  ></div>

                  <div className="row g-4 align-items-end position-relative">
                    {/* From Date */}
                    <div className="col-md-3">
                      <div className="d-flex align-items-center gap-2 mb-2 px-1">
                        <div
                          style={{
                            padding: "4px",
                            background: "rgba(102, 126, 234, 0.1)",
                            borderRadius: "6px",
                          }}
                        >
                          <FaCalendarAlt className="text-primary" size={11} />
                        </div>
                        <span
                          className="small fw-bold text-uppercase tracking-wider text-muted opacity-75"
                          style={{ fontSize: "10px" }}
                        >
                          From Date
                        </span>
                      </div>
                      <input
                        type="date"
                        className="form-control border-0 shadow-none transition-all"
                        style={{
                          borderRadius: "12px",
                          padding: "0.75rem 1rem",
                          background: "rgba(255, 255, 255, 0.5)",
                          boxShadow:
                            "inset 0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(255,255,255,0.8)",
                          fontSize: "14px",
                          color: "#1e293b",
                          fontWeight: "500",
                        }}
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        max={to}
                      />
                    </div>

                    {/* To Date */}
                    <div className="col-md-3">
                      <div className="d-flex align-items-center gap-2 mb-2 px-1">
                        <div
                          style={{
                            padding: "4px",
                            background: "rgba(102, 126, 234, 0.1)",
                            borderRadius: "6px",
                          }}
                        >
                          <FaCalendarAlt className="text-primary" size={11} />
                        </div>
                        <span
                          className="small fw-bold text-uppercase tracking-wider text-muted opacity-75"
                          style={{ fontSize: "10px" }}
                        >
                          To Date
                        </span>
                      </div>
                      <input
                        type="date"
                        className="form-control border-0 shadow-none transition-all"
                        style={{
                          borderRadius: "12px",
                          padding: "0.75rem 1rem",
                          background: "rgba(255, 255, 255, 0.5)",
                          boxShadow:
                            "inset 0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(255,255,255,0.8)",
                          fontSize: "14px",
                          color: "#1e293b",
                          fontWeight: "500",
                        }}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        min={from}
                        max={today}
                      />
                    </div>

                    {/* Report Type */}
                    <div className="col-md-3">
                      <div className="d-flex align-items-center gap-2 mb-2 px-1">
                        <div
                          style={{
                            padding: "4px",
                            background: "rgba(118, 75, 162, 0.1)",
                            borderRadius: "6px",
                          }}
                        >
                          <FaChartPie
                            className="text-primary"
                            size={11}
                            style={{ color: "#764ba2 !important" }}
                          />
                        </div>
                        <span
                          className="small fw-bold text-uppercase tracking-wider text-muted opacity-75"
                          style={{ fontSize: "10px" }}
                        >
                          Report Layout
                        </span>
                      </div>
                      <select
                        className="form-select border-0 shadow-none transition-all"
                        style={{
                          borderRadius: "12px",
                          padding: "0.75rem 1rem",
                          background: "rgba(255, 255, 255, 0.5)",
                          boxShadow:
                            "inset 0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(255,255,255,0.8)",
                          fontSize: "14px",
                          color: "#1e293b",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                        value={reportType}
                        onChange={(e) => {
                          setReportType(e.target.value);
                          clearSelections();
                        }}
                      >
                        <option value="comparison">
                          📅 Day-wise Comparison
                        </option>
                        <option value="summary">📈 Summary Analytics</option>
                      </select>
                    </div>

                    {/* Physical-style Segmented Toggle */}
                    <div className="col-md-3">
                      <div className="d-flex align-items-center gap-2 mb-2 px-1">
                        <span
                          className="small fw-bold text-uppercase tracking-wider text-muted opacity-75"
                          style={{ fontSize: "10px" }}
                        >
                          Quick Presets
                        </span>
                      </div>
                      <div
                        className="d-flex p-1.5 rounded-4"
                        style={{
                          background: "rgba(241, 245, 249, 0.8)",
                          border: "1px solid rgba(226, 232, 240, 0.8)",
                          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
                          padding: "6px",
                        }}
                      >
                        {[
                          { label: "7D", days: 7 },
                          { label: "30D", days: 30 },
                          { label: "90D", days: 90 },
                        ].map((preset) => {
                          const isActive =
                            Math.ceil(
                              (new Date(to) - new Date(from)) /
                                (1000 * 60 * 60 * 24),
                            ) === preset.days;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              className={`btn btn-sm flex-grow-1 border-0 transition-all ${isActive ? "bg-white shadow-sm text-primary fw-bold" : "text-muted"}`}
                              style={{
                                borderRadius: "10px",
                                fontSize: "12px",
                                padding: "10px 4px",
                                background: isActive ? "#fff" : "transparent",
                                boxShadow: isActive
                                  ? "0 2px 8px rgba(0,0,0,0.08)"
                                  : "none",
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                              onClick={() => {
                                const pastDate = new Date(
                                  Date.now() -
                                    preset.days * 24 * 60 * 60 * 1000,
                                )
                                  .toISOString()
                                  .slice(0, 10);
                                setFrom(pastDate);
                                setTo(today);
                              }}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Floating Range Plate */}
                  <div className="mt-4 mb-1 d-flex justify-content-center">
                    <div
                      className="px-5 py-2.5 rounded-pill d-flex align-items-center gap-4 transition-all hover-scale"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="bg-white rounded-circle"
                          style={{
                            width: 8,
                            height: 8,
                            boxShadow: "0 0 8px rgba(255,255,255,0.8)",
                          }}
                        ></div>
                        <span
                          className="text-white-50 fw-medium"
                          style={{ fontSize: "12px", letterSpacing: "0.5px" }}
                        >
                          REPORTING PERIOD
                        </span>
                      </div>
                      <div
                        style={{
                          width: "1px",
                          height: "18px",
                          background: "rgba(255, 255, 255, 0.2)",
                        }}
                      ></div>
                      <span
                        className="fw-bold text-white text-uppercase"
                        style={{ fontSize: "13px", letterSpacing: "1px" }}
                      >
                        {Math.ceil(
                          (new Date(to) - new Date(from)) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        DAYS ANALYSIS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Selection */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 d-flex align-items-center gap-2">
                  <FaStore className="text-primary" />
                  Select Stores to Compare
                  {selectedComparisonStoreIds.length > 0 && (
                    <span className="badge bg-primary">
                      {selectedComparisonStoreIds.length} selected
                    </span>
                  )}
                </h6>
                <div className="d-flex gap-2">
                  <div
                    className="input-group input-group-sm"
                    style={{ width: "250px" }}
                  >
                    <span className="input-group-text bg-white">
                      <i className="fas fa-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search stores..."
                      value={storeSearchQuery}
                      onChange={(e) => setStoreSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={toggleSelectAllStores}
                  >
                    {selectedComparisonStoreIds.length ===
                    availableStoresForComparison.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>
              <div
                className="row g-3 mb-4 p-3 border rounded bg-white shadow-sm"
                style={{
                  maxHeight: "350px",
                  overflowY: "auto",
                  border: "1px solid #e0e6ed !important",
                }}
              >
                {availableStoresForComparison.length > 0 ? (
                  availableStoresForComparison
                    .filter(
                      (store) =>
                        store.name
                          .toLowerCase()
                          .includes(storeSearchQuery.toLowerCase()) ||
                        store.storeCode
                          ?.toLowerCase()
                          .includes(storeSearchQuery.toLowerCase()),
                    )
                    .map((store) => {
                      const isSelected = selectedComparisonStoreIds.includes(
                        store.id,
                      );
                      return (
                        <div key={store.id} className="col-md-4 col-sm-6">
                          <div
                            className={`p-3 rounded-3 border h-100 d-flex align-items-center gap-3`}
                            style={{
                              cursor: "pointer",
                              transition:
                                "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                              backgroundColor: isSelected ? "#f0f7ff" : "#fff",
                              borderColor: isSelected ? "#0d6efd" : "#e0e6ed",
                              boxShadow: isSelected
                                ? "0 4px 12px rgba(13, 110, 253, 0.12)"
                                : "0 2px 4px rgba(0,0,0,0.02)",
                              position: "relative",
                            }}
                            onClick={() => toggleStoreSelect(store.id)}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#0d6efd80";
                                e.currentTarget.style.backgroundColor =
                                  "#f8fbff";
                                e.currentTarget.style.transform =
                                  "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                  "0 6px 15px rgba(0,0,0,0.06)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = "#e0e6ed";
                                e.currentTarget.style.backgroundColor = "#fff";
                                e.currentTarget.style.transform =
                                  "translateY(0)";
                                e.currentTarget.style.boxShadow =
                                  "0 2px 4px rgba(0,0,0,0.02)";
                              }
                            }}
                          >
                            {/* Checkbox Icon */}
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                border: `2px solid ${isSelected ? "#0d6efd" : "#d1d5db"}`,
                                backgroundColor: isSelected
                                  ? "#0d6efd"
                                  : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s",
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && (
                                <i
                                  className="fas fa-check text-white"
                                  style={{ fontSize: 10 }}
                                ></i>
                              )}
                            </div>

                            {/* Store Icon/Avatar */}
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: isSelected
                                  ? "#0d6efd15"
                                  : "#f8f9fa",
                                color: isSelected ? "#0d6efd" : "#6c757d",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                flexShrink: 0,
                              }}
                            >
                              <FaStore />
                            </div>

                            <div className="flex-grow-1 min-width-0">
                              <div
                                className="fw-bold text-truncate"
                                style={{
                                  fontSize: "13.5px",
                                  color: isSelected ? "#084298" : "#1e293b",
                                }}
                              >
                                {store.name}
                              </div>
                              <div
                                className="text-muted"
                                style={{
                                  fontSize: "11px",
                                  fontFamily: "JetBrains Mono, monospace",
                                  opacity: 0.8,
                                }}
                              >
                                {store.storeCode}
                              </div>

                              {/* Target Progress */}
                              {store.target ? (
                                <div
                                  className="mt-2"
                                  style={{ fontSize: "10px" }}
                                >
                                  {/* Amount */}
                                  <div className="d-flex align-items-center gap-1 mb-1">
                                    <span
                                      className="text-muted"
                                      style={{ width: "28px", flexShrink: 0 }}
                                    >
                                      Amt
                                    </span>
                                    <div
                                      className="progress flex-grow-1"
                                      style={{
                                        height: "4px",
                                        background: "#e9ecef",
                                      }}
                                    >
                                      <div
                                        className="progress-bar bg-warning"
                                        style={{
                                          width: `${Math.min(store.target.amount?.percentage || 0, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className="fw-bold"
                                      style={{
                                        color: "#856404",
                                        width: "30px",
                                        textAlign: "right",
                                      }}
                                    >
                                      {Number(
                                        store.target.amount?.percentage || 0,
                                      ).toFixed(0)}
                                      %
                                    </span>
                                  </div>
                                  {/* Bags */}
                                  <div className="d-flex align-items-center gap-1">
                                    <span
                                      className="text-muted"
                                      style={{ width: "28px", flexShrink: 0 }}
                                    >
                                      Bags
                                    </span>
                                    <div
                                      className="progress flex-grow-1"
                                      style={{
                                        height: "4px",
                                        background: "#e9ecef",
                                      }}
                                    >
                                      <div
                                        className="progress-bar bg-info"
                                        style={{
                                          width: `${Math.min(store.target.bags?.percentage || 0, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className="fw-bold"
                                      style={{
                                        color: "#055160",
                                        width: "30px",
                                        textAlign: "right",
                                      }}
                                    >
                                      {Number(
                                        store.target.bags?.percentage || 0,
                                      ).toFixed(0)}
                                      %
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="mt-1"
                                  style={{ fontSize: "10px", color: "#adb5bd" }}
                                >
                                  No active target
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="col-12 text-muted text-center py-5">
                    <FaStore size={48} className="mb-3 opacity-25" />
                    <p className="mb-0 fw-medium">
                      Gathering available stores...
                    </p>
                  </div>
                )}

                {availableStoresForComparison.length > 0 &&
                  availableStoresForComparison.filter(
                    (store) =>
                      store.name
                        .toLowerCase()
                        .includes(storeSearchQuery.toLowerCase()) ||
                      store.storeCode
                        ?.toLowerCase()
                        .includes(storeSearchQuery.toLowerCase()),
                  ).length === 0 && (
                    <div className="col-12 text-muted text-center py-4">
                      <p className="mb-0">
                        No stores found matching "{storeSearchQuery}"
                      </p>
                    </div>
                  )}
              </div>

              <div className="text-center mb-4">
                <button
                  className="btn btn-lg btn-primary px-5 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    transition: "all 0.3s ease",
                  }}
                  onClick={fetchComparisonReport}
                  disabled={
                    comparisonLoading || selectedComparisonStoreIds.length === 0
                  }
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  {comparisonLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FaChartLine className="me-2" />
                      Compare Stores
                    </>
                  )}
                </button>

                {selectedComparisonStoreIds.length === 0 && (
                  <div className="mt-2">
                    <small className="text-danger">
                      <i className="fas fa-info-circle me-1"></i>
                      Please select at least one store to compare
                    </small>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {comparisonLoading && (
                <div className="mt-4">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex flex-column align-items-center justify-content-center py-5">
                        <div
                          className="spinner-border text-primary mb-3"
                          style={{ width: "3rem", height: "3rem" }}
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <h5 className="text-muted">
                          Generating your report...
                        </h5>
                        <p className="text-muted small">
                          This may take a few moments
                        </p>

                        {/* Skeleton loader */}
                        <div className="w-100 mt-4">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="mb-2 d-flex gap-2"
                              style={{
                                animation: "pulse 1.5s ease-in-out infinite",
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  height: "40px",
                                  backgroundColor: "#e0e0e0",
                                  borderRadius: "4px",
                                }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Report Table - Only for Comparison */}

              {/* Comparison Report Table - Only for Comparison */}
              {activeReportType === "comparison" &&
                comparisonReportData &&
                comparisonReportData.rows &&
                comparisonReportData.rows.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-2">Comparison Report</h6>
                        <small className="text-muted">
                          {selectedRows.length > 0 &&
                            `${selectedRows.length} row(s) selected`}
                          {selectedRows.length > 0 &&
                            selectedColumns.length > 0 &&
                            " • "}
                          {selectedColumns.length > 0 &&
                            `${selectedColumns.length} column(s) selected`}
                        </small>
                      </div>

                      <div className="d-flex gap-2">
                        {(selectedRows.length > 0 ||
                          selectedColumns.length > 0) && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={clearSelections}
                          >
                            Clear Selection
                          </button>
                        )}

                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-success dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            onClick={() =>
                              setShowExportOptions(!showExportOptions)
                            }
                          >
                            Export Selected
                          </button>
                          {showExportOptions && (
                            <div
                              className="dropdown-menu show"
                              style={{ position: "absolute", right: 0 }}
                            >
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  exportSelectedData("excel");
                                  setShowExportOptions(false);
                                }}
                              >
                                <img
                                  src={xls}
                                  alt="Excel"
                                  style={{ width: "20px", height: "20px" }}
                                />
                                Export to Excel
                              </button>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  exportSelectedData("pdf");
                                  setShowExportOptions(false);
                                }}
                              >
                                <img
                                  src={pdf}
                                  alt="PDF"
                                  style={{ width: "20px", height: "20px" }}
                                />
                                Export to PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.tableContainer}>
                      <table
                        className="table table-hover mb-0 text-center align-middle"
                        style={{ borderCollapse: "separate", borderSpacing: 0 }}
                      >
                        <thead
                          style={{ position: "sticky", top: 0, zIndex: 100 }}
                        >
                          <tr>
                            <th
                              rowSpan={2}
                              style={{
                                verticalAlign: "middle",
                                position: "sticky",
                                left: 0,
                                background: "#003176",
                                zIndex: 102,
                                border: "1px solid #dee2e6",
                                width: "45px",
                                minWidth: "45px",
                                color: "white",
                                fontWeight: 700,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectAllRows}
                                onChange={toggleAllRowsSelection}
                                className="form-check-input"
                                style={{
                                  filter:
                                    "invert(1) grayscale(1) brightness(2)",
                                }}
                              />
                            </th>
                            <th
                              rowSpan={2}
                              style={{
                                verticalAlign: "middle",
                                position: "sticky",
                                left: 45,
                                background: "#003176",
                                zIndex: 102,
                                border: "1px solid #dee2e6",
                                width: "60px",
                                minWidth: "60px",
                                color: "white",
                                fontWeight: 700,
                              }}
                            >
                              S.No
                            </th>
                            <th
                              rowSpan={2}
                              style={{
                                verticalAlign: "middle",
                                position: "sticky",
                                left: 105,
                                background: "#003176",
                                zIndex: 102,
                                border: "1px solid #dee2e6",
                                width: "130px",
                                minWidth: "130px",
                                whiteSpace: "nowrap",
                                color: "white",
                                fontWeight: 700,
                              }}
                            >
                              Date
                            </th>
                            {comparisonReportData.stores &&
                              comparisonReportData.stores.map((store) => (
                                <th
                                  key={store.id}
                                  colSpan={4}
                                  className="text-center"
                                  style={{
                                    background: "#003176",
                                    color: "white",
                                    border: "1px solid #dee2e6",
                                    fontWeight: 700,
                                    padding: "8px",
                                  }}
                                >
                                  <div className="d-flex align-items-center justify-content-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedColumns.includes(
                                        store.id,
                                      )}
                                      onChange={() =>
                                        toggleColumnSelection(store.id)
                                      }
                                      className="form-check-input mt-0"
                                      style={{
                                        filter:
                                          "invert(1) grayscale(1) brightness(2)",
                                      }}
                                    />
                                    <span
                                      style={{
                                        fontSize: "13px",
                                        letterSpacing: "0.3px",
                                      }}
                                    >
                                      {store.name}
                                    </span>
                                  </div>
                                </th>
                              ))}
                          </tr>
                          <tr>
                            {comparisonReportData.stores &&
                              comparisonReportData.stores.map((store) => (
                                <React.Fragment key={store.id + "-headers"}>
                                  <th
                                    style={{
                                      fontSize: "12px",
                                      color: "white",
                                      background: "#495057",
                                      border: "1px solid #dee2e6",
                                      fontWeight: 600,
                                      padding: "6px",
                                    }}
                                  >
                                    Sales
                                  </th>
                                  <th
                                    style={{
                                      fontSize: "12px",
                                      color: "white",
                                      background: "#495057",
                                      border: "1px solid #dee2e6",
                                      fontWeight: 600,
                                      padding: "6px",
                                    }}
                                  >
                                    Change
                                  </th>
                                  <th
                                    style={{
                                      fontSize: "12px",
                                      color: "white",
                                      background: "#495057",
                                      border: "1px solid #dee2e6",
                                      fontWeight: 600,
                                      padding: "6px",
                                    }}
                                  >
                                    Accum.
                                  </th>
                                  <th
                                    style={{
                                      fontSize: "12px",
                                      color: "white",
                                      background: "#495057",
                                      border: "1px solid #dee2e6",
                                      fontWeight: 600,
                                      padding: "6px",
                                    }}
                                  >
                                    Unit
                                  </th>
                                </React.Fragment>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonReportData.rows.map((row, index) => (
                            <tr
                              key={index}
                              className={
                                selectedRows.includes(index)
                                  ? "table-active"
                                  : ""
                              }
                              style={{
                                cursor: "pointer",
                                transition: "background 0.2s",
                              }}
                            >
                              <td
                                onClick={() => toggleRowSelection(index)}
                                style={{
                                  position: "sticky",
                                  left: 0,
                                  background: selectedRows.includes(index)
                                    ? "#f1f5f9"
                                    : "#fff",
                                  zIndex: 10,
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(index)}
                                  onChange={() => toggleRowSelection(index)}
                                  className="form-check-input"
                                />
                              </td>
                              <td
                                style={{
                                  position: "sticky",
                                  left: 45,
                                  background: selectedRows.includes(index)
                                    ? "#f1f5f9"
                                    : "#fff",
                                  zIndex: 10,
                                  borderRight: "1px solid #e2e8f0",
                                }}
                              >
                                {row.sNo}
                              </td>
                              <td
                                className="fw-bold"
                                style={{
                                  position: "sticky",
                                  left: 105,
                                  background: selectedRows.includes(index)
                                    ? "#f1f5f9"
                                    : "#fff",
                                  zIndex: 10,
                                  borderRight: "1px solid #e2e8f0",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.date}
                              </td>
                              {comparisonReportData.stores &&
                                comparisonReportData.stores.map(
                                  (store, sIdx) => {
                                    const storeData =
                                      row.stores?.[store.id] || {};
                                    const isColumnSelected =
                                      selectedColumns.includes(store.id);
                                    const groupBg =
                                      sIdx % 2 === 0
                                        ? "rgba(102, 126, 234, 0.015)"
                                        : "rgba(118, 75, 162, 0.015)";

                                    return (
                                      <React.Fragment
                                        key={store.id + "-data-" + index}
                                      >
                                        {/* Sales */}
                                        <td
                                          className={
                                            isColumnSelected ? "table-info" : ""
                                          }
                                          style={{
                                            background: isColumnSelected
                                              ? undefined
                                              : groupBg,
                                            borderLeft: "1px solid #e2e8f0",
                                            fontSize: "13.5px",
                                          }}
                                        >
                                          <span className="text-dark fw-medium">
                                            {storeData.sales?.toLocaleString() ??
                                              0}
                                          </span>
                                        </td>

                                        {/* Change */}
                                        <td
                                          className={
                                            isColumnSelected ? "table-info" : ""
                                          }
                                          style={{
                                            background: isColumnSelected
                                              ? undefined
                                              : groupBg,
                                            fontSize: "13px",
                                            color:
                                              (storeData.increaseOrDecrease ??
                                                0) >= 0
                                                ? "#10b981"
                                                : "#ef4444",
                                            fontWeight: "600",
                                          }}
                                        >
                                          <div className="d-flex align-items-center justify-content-center gap-1">
                                            {(storeData.increaseOrDecrease ??
                                              0) >= 0
                                              ? "↑"
                                              : "↓"}
                                            <span>
                                              {Math.abs(
                                                storeData.increaseOrDecrease ??
                                                  0,
                                              ).toLocaleString()}
                                            </span>
                                          </div>
                                        </td>

                                        {/* Accumulated */}
                                        <td
                                          className={
                                            isColumnSelected ? "table-info" : ""
                                          }
                                          style={{
                                            background: isColumnSelected
                                              ? undefined
                                              : groupBg,
                                            fontSize: "13px",
                                            fontWeight: "500",
                                            color: "#64748b",
                                          }}
                                        >
                                          {storeData.accumulated?.toLocaleString() ??
                                            0}
                                        </td>

                                        {/* Unit — click opens bags modal */}
                                        {/* Unit — click opens bags modal */}
                                        <td
                                          className={
                                            isColumnSelected ? "table-info" : ""
                                          }
                                          style={{
                                            background: isColumnSelected
                                              ? undefined
                                              : groupBg,
                                            fontSize: "13px",
                                            fontWeight: "500",
                                            color: "#3b82f6",
                                            cursor: "pointer",
                                            textDecoration: "underline dotted",
                                          }}
                                          title="Click to view bag details"
                                        >
                                          Bags
                                        </td>
                                      </React.Fragment>
                                    );
                                  },
                                )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="row mt-3">
                      <div className="col-md-12">
                        <div className="card bg-light">
                          <div className="card-body p-3">
                            <div className="row text-center">
                              <div className="col-md-3">
                                <small className="text-muted">Total Days</small>
                                <h6 className="mb-0">
                                  {comparisonReportData.rows.length}
                                </h6>
                              </div>
                              <div className="col-md-3">
                                <small className="text-muted">
                                  Stores Compared
                                </small>
                                <h6 className="mb-0">
                                  {comparisonReportData.stores?.length || 0}
                                </h6>
                              </div>
                              <div className="col-md-3">
                                <small className="text-muted">Date Range</small>
                                <h6 className="mb-0">
                                  {comparisonReportData.rows[0]?.date} -{" "}
                                  {
                                    comparisonReportData.rows[
                                      comparisonReportData.rows.length - 1
                                    ]?.date
                                  }
                                </h6>
                              </div>
                              <div className="col-md-3">
                                <small className="text-muted">
                                  Report Type
                                </small>
                                <h6 className="mb-0 text-capitalize">
                                  {activeReportType}
                                </h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Unit / Bags Modal ── */}
                    {unitModal.show && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="modal-backdrop fade show"
                          style={{ zIndex: 1040 }}
                          onClick={() =>
                            setUnitModal({
                              show: false,
                              bags: 0,
                              date: "",
                              storeName: "",
                            })
                          }
                        />

                        {/* Modal */}
                        <div
                          className="modal fade show d-block"
                          style={{ zIndex: 1050 }}
                          tabIndex={-1}
                          role="dialog"
                        >
                          <div
                            className="modal-dialog modal-dialog-centered modal-sm"
                            role="document"
                          >
                            <div
                              className="modal-content"
                              style={{
                                borderRadius: "12px",
                                overflow: "hidden",
                              }}
                            >
                              {/* Header */}
                              <div
                                className="modal-header"
                                style={{
                                  background: "#003176",
                                  color: "white",
                                  borderBottom: "none",
                                  padding: "14px 18px",
                                }}
                              >
                                <div>
                                  <h6 className="modal-title mb-0 fw-bold">
                                    Unit Details
                                  </h6>
                                  <small
                                    style={{ opacity: 0.75, fontSize: "11px" }}
                                  >
                                    {unitModal.storeName}&nbsp;|&nbsp;
                                    {unitModal.date}
                                  </small>
                                </div>
                                <button
                                  type="button"
                                  className="btn-close btn-close-white"
                                  onClick={() =>
                                    setUnitModal({
                                      show: false,
                                      bags: 0,
                                      date: "",
                                      storeName: "",
                                    })
                                  }
                                />
                              </div>

                              {/* Body */}
                              <div className="modal-body p-0">
                                <table className="table table-bordered mb-0 text-center">
                                  <thead style={{ background: "#f1f5f9" }}>
                                    <tr>
                                      <th
                                        style={{
                                          color: "#374151",
                                          fontWeight: 600,
                                          fontSize: "13px",
                                          padding: "10px",
                                        }}
                                      >
                                        Type
                                      </th>
                                      <th
                                        style={{
                                          color: "#374151",
                                          fontWeight: 600,
                                          fontSize: "13px",
                                          padding: "10px",
                                        }}
                                      >
                                        Count
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr style={{ background: "#eff6ff" }}>
                                      <td
                                        className="fw-semibold"
                                        style={{
                                          color: "#1d4ed8",
                                          padding: "12px 10px",
                                        }}
                                      >
                                        🛍️ Bags
                                      </td>
                                      <td
                                        className="fw-bold"
                                        style={{
                                          fontSize: "15px",
                                          color: "#1e293b",
                                          padding: "12px 10px",
                                        }}
                                      >
                                        {unitModal.bags?.toLocaleString() ?? 0}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Footer */}
                              <div
                                className="modal-footer"
                                style={{
                                  borderTop: "1px solid #e2e8f0",
                                  padding: "10px 14px",
                                }}
                              >
                                <button
                                  className="btn btn-sm btn-outline-secondary w-100"
                                  onClick={() =>
                                    setUnitModal({
                                      show: false,
                                      bags: 0,
                                      date: "",
                                      storeName: "",
                                    })
                                  }
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

              {/* Summary Report Table (Rows) - Only for Summary/Leaderboard */}
              {(activeReportType === "summary" ||
                activeReportType === "leaderboard") &&
                comparisonReportData &&
                comparisonReportData.rows &&
                comparisonReportData.rows.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-2">
                          {activeReportType === "summary"
                            ? "Summary"
                            : "Leaderboard"}{" "}
                          Report
                        </h6>
                        <small className="text-muted">
                          {selectedRows.length > 0 &&
                            `${selectedRows.length} row(s) selected`}
                        </small>
                      </div>

                      <div className="d-flex gap-2">
                        {selectedRows.length > 0 && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={clearSelections}
                          >
                            Clear Selection
                          </button>
                        )}

                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-success dropdown-toggle"
                            type="button"
                            onClick={() =>
                              setShowExportOptions(!showExportOptions)
                            }
                          >
                            Export Data
                          </button>
                          {showExportOptions && (
                            <div
                              className="dropdown-menu show"
                              style={{ position: "absolute", right: 0 }}
                            >
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  exportSelectedData("excel");
                                  setShowExportOptions(false);
                                }}
                              >
                                <img
                                  src={xls}
                                  alt="Excel"
                                  style={{ width: "20px", height: "20px" }}
                                />
                                Export to Excel
                              </button>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  exportSelectedData("pdf");
                                  setShowExportOptions(false);
                                }}
                              >
                                <img
                                  src={pdf}
                                  alt="PDF"
                                  style={{ width: "20px", height: "20px" }}
                                />
                                Export to PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.tableContainer}>
                      <table className="table table-bordered table-hover borderedtable bg-white text-center align-middle">
                        <thead
                          className="table-light"
                          style={{ position: "sticky", top: 0, zIndex: 10 }}
                        >
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                checked={selectAllRows}
                                onChange={toggleAllRowsSelection}
                                className="form-check-input"
                              />
                            </th>
                            <th>S.No</th>
                            <th>Store Name</th>
                            <th>Store Code</th>
                            <th>Total Sales</th>
                            <th>Prev. Period Sales</th>
                            <th>Diff</th>
                            <th>Growth %</th>
                            <th>Avg Daily Sales</th>
                            <th>Peak Day</th>
                            <th>Peak Day Sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonReportData.rows.map((row, index) => (
                            <tr
                              key={index}
                              className={
                                selectedRows.includes(index)
                                  ? "table-active"
                                  : ""
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <td onClick={() => toggleRowSelection(index)}>
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(index)}
                                  onChange={() => toggleRowSelection(index)}
                                  className="form-check-input"
                                />
                              </td>
                              <td>{row.sNo}</td>
                              <td className="fw-bold text-start">
                                {row.storeName}
                              </td>
                              <td>
                                <span className="badge bg-secondary">
                                  {row.storeCode}
                                </span>
                              </td>
                              <td className="fw-bold text-primary">
                                ₹{row.totalSales?.toLocaleString()}
                              </td>
                              <td className="text-muted">
                                ₹{row.previousMonthTotalSales?.toLocaleString()}
                              </td>
                              <td
                                className={
                                  row.increaseOrDecrease >= 0
                                    ? "text-success fw-bold"
                                    : "text-danger fw-bold"
                                }
                              >
                                {row.increaseOrDecrease >= 0 ? "↑ " : "↓ "}
                                ₹{Math.abs(
                                  row.increaseOrDecrease,
                                )?.toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className={`badge ${row.growthPercentage >= 0 ? "bg-success" : "bg-danger"}`}
                                >
                                  {row.growthPercentage >= 0 ? "+" : ""}
                                  {row.growthPercentage?.toFixed(2)}%
                                </span>
                              </td>
                              <td>₹{row.averageDailySales?.toLocaleString()}</td>
                              <td>
                                <span className="badge bg-info text-dark">
                                  {row.peakDay || "-"}
                                </span>
                              </td>
                              <td className="text-success fw-bold">
                                ₹{row.peakDaySales?.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="row mt-3 g-3">
                      <div className="col-md-3">
                        <div className="card border-primary">
                          <div className="card-body text-center">
                            <small className="text-muted">Total Stores</small>
                            <h5 className="mb-0 text-primary">
                              {comparisonReportData.rows.length}
                            </h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card border-success">
                          <div className="card-body text-center">
                            <small className="text-muted">Total Sales</small>
                            <h5 className="mb-0 text-success">
                              {comparisonReportData.rows
                                .reduce(
                                  (sum, row) => sum + (row.totalSales || 0),
                                  0,
                                )
                                .toLocaleString()}
                            </h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card border-info">
                          <div className="card-body text-center">
                            <small className="text-muted">Avg Growth</small>
                            <h5 className="mb-0 text-info">
                              {(
                                comparisonReportData.rows.reduce(
                                  (sum, row) =>
                                    sum + (row.growthPercentage || 0),
                                  0,
                                ) / comparisonReportData.rows.length
                              ).toFixed(2)}
                              %
                            </h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card border-warning">
                          <div className="card-body text-center">
                            <small className="text-muted">Best Performer</small>
                            <h6 className="mb-0 text-warning">
                              {comparisonReportData.rows.reduce(
                                (max, row) =>
                                  (row.growthPercentage || 0) >
                                  (max.growthPercentage || 0)
                                    ? row
                                    : max,
                                comparisonReportData.rows[0],
                              )?.storeName || "-"}
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Trend Report Table - Only for Trend */}
              {activeReportType === "trend" &&
                comparisonReportData &&
                comparisonReportData.rows &&
                comparisonReportData.rows.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="mb-2">Trend Analysis Report</h6>
                        <small className="text-muted">
                          {selectedRows.length > 0 &&
                            `${selectedRows.length} row(s) selected`}
                        </small>
                      </div>

                      <div className="d-flex gap-2">
                        {selectedRows.length > 0 && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={clearSelections}
                          >
                            Clear Selection
                          </button>
                        )}

                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-success dropdown-toggle"
                            type="button"
                            onClick={() =>
                              setShowExportOptions(!showExportOptions)
                            }
                          >
                            Export Data
                          </button>
                          {showExportOptions && (
                            <div
                              className="dropdown-menu show"
                              style={{ position: "absolute", right: 0 }}
                            >
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  exportSelectedData("excel");
                                  setShowExportOptions(false);
                                }}
                              >
                                <img
                                  src={xls}
                                  alt="Excel"
                                  style={{ width: "20px", height: "20px" }}
                                />
                                Export to Excel
                              </button>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => {
                                  exportSelectedData("pdf");
                                  setShowExportOptions(false);
                                }}
                              >
                                <img
                                  src={pdf}
                                  alt="PDF"
                                  style={{ width: "20px", height: "20px" }}
                                />
                                Export to PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.tableContainer}>
                      <table className="table table-bordered table-hover borderedtable bg-white text-center align-middle">
                        <thead
                          className="table-light"
                          style={{ position: "sticky", top: 0, zIndex: 10 }}
                        >
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                checked={selectAllRows}
                                onChange={toggleAllRowsSelection}
                                className="form-check-input"
                              />
                            </th>
                            <th>S.No</th>
                            <th>Date</th>
                            <th>Store</th>
                            <th>Sales</th>
                            <th>Prev Month</th>
                            <th>Change</th>
                            <th
                              style={{
                                whiteSpace: "nowrap",
                                background: "#fff3cd",
                                color: "#856404",
                              }}
                            >
                              Target (Amt)
                            </th>
                            <th
                              style={{
                                whiteSpace: "nowrap",
                                background: "#cff4fc",
                                color: "#055160",
                              }}
                            >
                              Target (Bags)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonReportData.rows.map((row, index) => {
                            const storeObj = availableStoresForComparison.find(
                              (s) => s.id === row.storeId,
                            );
                            const storeName = storeObj
                              ? storeObj.name
                              : `Store ${row.storeId}`;
                            const change = row.increaseOrDecrease || 0;

                            return (
                              <tr
                                key={index}
                                className={
                                  selectedRows.includes(index)
                                    ? "table-active"
                                    : ""
                                }
                                style={{ cursor: "pointer" }}
                              >
                                <td onClick={() => toggleRowSelection(index)}>
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.includes(index)}
                                    onChange={() => toggleRowSelection(index)}
                                    className="form-check-input"
                                  />
                                </td>
                                <td>{index + 1}</td>
                                <td className="fw-bold">
                                  {row.date || row.isoDate}
                                </td>
                                <td>
                                  <span className="badge bg-primary">
                                    {storeName}
                                  </span>
                                </td>
                                <td className="text-success fw-bold">
                                  ₹{row.totalSales?.toLocaleString()}
                                </td>
                                <td className="text-muted">
                                  ₹
                                  {row.previousMonthSameDateSales?.toLocaleString()}
                                </td>
                                <td
                                  className={
                                    change >= 0
                                      ? "text-success fw-bold"
                                      : "text-danger fw-bold"
                                  }
                                >
                                  {change >= 0 ? "↑ " : "↓ "}₹
                                  {Math.abs(change)?.toLocaleString()}
                                </td>
                                {/* Target Amount */}
                                <td style={{ background: "#fffdf0" }}>
                                  {row.target?.amount ? (
                                    <div className="d-flex flex-column align-items-center gap-1">
                                      <small
                                        className="text-muted"
                                        style={{ fontSize: "11px" }}
                                      >
                                        ₹
                                        {Number(
                                          row.target.amount.achieved || 0,
                                        ).toLocaleString()}
                                        <span className="text-secondary mx-1">
                                          /
                                        </span>
                                        ₹
                                        {Number(
                                          row.target.amount.target || 0,
                                        ).toLocaleString()}
                                      </small>
                                      <div
                                        className="progress w-100"
                                        style={{ height: "5px" }}
                                      >
                                        <div
                                          className="progress-bar bg-warning"
                                          style={{
                                            width: `${Math.min(row.target.amount.percentage || 0, 100)}%`,
                                          }}
                                        />
                                      </div>
                                      <span
                                        className={`badge ${(row.target.amount.percentage || 0) >= 100 ? "bg-success" : "bg-warning text-dark"}`}
                                        style={{ fontSize: "10px" }}
                                      >
                                        {Number(
                                          row.target.amount.percentage || 0,
                                        ).toFixed(1)}
                                        %
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                                {/* Target Bags */}
                                <td style={{ background: "#f0feff" }}>
                                  {row.target?.bags ? (
                                    <div className="d-flex flex-column align-items-center gap-1">
                                      <small
                                        className="text-muted"
                                        style={{ fontSize: "11px" }}
                                      >
                                        {Number(
                                          row.target.bags.achieved || 0,
                                        ).toLocaleString()}
                                        <span className="text-secondary mx-1">
                                          /
                                        </span>
                                        {Number(
                                          row.target.bags.target || 0,
                                        ).toLocaleString()}
                                      </small>
                                      <div
                                        className="progress w-100"
                                        style={{ height: "5px" }}
                                      >
                                        <div
                                          className="progress-bar bg-info"
                                          style={{
                                            width: `${Math.min(row.target.bags.percentage || 0, 100)}%`,
                                          }}
                                        />
                                      </div>
                                      <span
                                        className={`badge ${(row.target.bags.percentage || 0) >= 100 ? "bg-success" : "bg-info"}`}
                                        style={{ fontSize: "10px" }}
                                      >
                                        {Number(
                                          row.target.bags.percentage || 0,
                                        ).toFixed(1)}
                                        %
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Trend Summary */}
                    <div className="card bg-light mt-3">
                      <div className="card-body">
                        <div className="row text-center">
                          <div className="col-md-4">
                            <small className="text-muted">Total Records</small>
                            <h6 className="mb-0">
                              {comparisonReportData.rows.length}
                            </h6>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">
                              Positive Trends
                            </small>
                            <h6 className="mb-0 text-success">
                              {
                                comparisonReportData.rows.filter(
                                  (r) => (r.increaseOrDecrease || 0) >= 0,
                                ).length
                              }
                            </h6>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">
                              Negative Trends
                            </small>
                            <h6 className="mb-0 text-danger">
                              {
                                comparisonReportData.rows.filter(
                                  (r) => (r.increaseOrDecrease || 0) < 0,
                                ).length
                              }
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Date Wise Report Table (Leaderboard only now) */}
              {activeReportType !== "trend" &&
                comparisonReportData &&
                comparisonReportData.dateWise &&
                comparisonReportData.dateWise.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-3">
                      <button
                        className={commonStyles.xls}
                        onClick={() =>
                          exportToExcel(selectedNames, comparisonReportData)
                        }
                      >
                        <p>Export to </p>
                        <img src={xls} alt="Excel" />
                      </button>
                      <button
                        className={commonStyles.xls}
                        onClick={() =>
                          exportToPDF(selectedNames, comparisonReportData)
                        }
                      >
                        <p>Export to </p>
                        <img src={pdf} alt="PDF" />
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-bordered borderedtable bg-white">
                        <thead>
                          <tr>
                            <th rowSpan={2}>S.No</th>
                            <th rowSpan={2}>Date</th>
                            {selectedNames.map((name) => (
                              <th
                                key={name}
                                colSpan={4}
                                className="text-center"
                              >
                                {name}
                              </th>
                            ))}
                          </tr>
                          <tr>
                            {selectedNames.map((name) => (
                              <React.Fragment key={name + "-headers"}>
                                <th>Qty</th>
                                <th>Increase</th>
                                <th>Decrease</th>
                                <th>Accumulated</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonReportData.dateWise.map((day, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{day.date}</td>
                              {selectedNames.map((name) => (
                                <React.Fragment key={name + index}>
                                  <td>{day[name] ?? 0}</td>
                                  <td>
                                    {comparisonReportData.increase?.[name]?.[
                                      day.date
                                    ] ?? 0}
                                  </td>
                                  <td>
                                    {comparisonReportData.decrease?.[name]?.[
                                      day.date
                                    ] ?? 0}
                                  </td>
                                  <td>
                                    {comparisonReportData.accumulation?.[
                                      name
                                    ]?.[day.date] ?? 0}
                                  </td>
                                </React.Fragment>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Show message if no data but search was performed */}
              {comparisonReportData &&
                !comparisonLoading &&
                (!comparisonReportData.dateWise ||
                  comparisonReportData.dateWise.length === 0) &&
                (!comparisonReportData.rows ||
                  comparisonReportData.rows.length === 0) && (
                  <div className="mt-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center py-5">
                        <div className="mb-4">
                          <FaBoxOpen
                            size={80}
                            className="text-muted opacity-50"
                          />
                        </div>
                        <h4 className="text-muted mb-3">No Data Found</h4>
                        <p className="text-muted mb-4">
                          We couldn't find any data for the selected criteria.
                          <br />
                          Try adjusting your filters or selecting different
                          stores.
                        </p>
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              setSelectedComparisonStoreIds([]);
                              setComparisonReportData(null);
                            }}
                          >
                            Reset Filters
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={toggleSelectAllStores}
                          >
                            Select All Stores
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Stores Table */}
        <div className={styles.tableContainer}>
          <table className={styles.reportsTable}>
            <thead>
              <tr>
                <th className="ps-4">S.No</th>
                <th>Store Name</th>
                <th className="text-center">Type</th>
                <th colSpan="2" className="text-center border-start border-end">
                  Today Sales
                </th>
                <th colSpan="2" className="text-center border-end">
                  Monthly Sales
                </th>
                <th className="text-end">Available Cash</th>
                <th
                  className="text-center"
                  style={{
                    background: "#fff3cd",
                    color: "#856404",
                    whiteSpace: "nowrap",
                  }}
                >
                  Target (Amt)
                </th>
                <th
                  className="text-center"
                  style={{
                    background: "#cff4fc",
                    color: "#055160",
                    whiteSpace: "nowrap",
                  }}
                >
                  Target (Bags)
                </th>
                <th className="text-center">Actions</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th></th>
                {/* Today Sub-headers */}
                <th className="text-center border-start">Value (₹)</th>
                <th className="text-center border-end">Qty</th>
                {/* Monthly Sub-headers */}
                <th className="text-center">Value (₹)</th>
                <th className="text-center border-end">Qty</th>

                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center p-5">
                    <Loading />
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center p-5 text-muted">
                    No stores found.
                  </td>
                </tr>
              ) : (
                filteredStores.map((store, index) => (
                  <tr key={store.storeId}>
                    <td className="ps-4">{index + 1}</td>
                    <td>
                      <span
                        className="text-primary fw-bold text-decoration-underline"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleStoreClick(store)}
                      >
                        {store.storeName}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge bg-${(store.storeType || "").toLowerCase() === "franchise" ? "success" : "warning"}`}
                      >
                        {store.storeType || "Own"}
                      </span>
                    </td>

                    <td className="text-center border-start fw-bold">
                      ₹{store.todaySales?.value?.toLocaleString() || 0}
                    </td>
                    <td className="text-center border-end">
                      {store.todaySales?.qty || 0}
                    </td>

                    <td className="text-center">
                      ₹{store.monthlySales?.value?.toLocaleString() || 0}
                    </td>
                    <td className="text-center border-end">
                      {store.monthlySales?.qty || 0}
                    </td>

                    <td className="text-end fw-bold text-success">
                      ₹{(store.availableCash || 0).toLocaleString()}
                    </td>

                    {/* Target Amount Column */}
                    <td
                      className="text-center"
                      style={{ background: "#fffdf0" }}
                    >
                      {store.target?.amount ? (
                        <div className="d-flex flex-column align-items-center gap-1 px-2">
                          <small
                            className="text-muted"
                            style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          >
                            ₹
                            {Number(
                              store.target.amount.achieved || 0,
                            ).toLocaleString()}
                            <span className="mx-1">/</span>₹
                            {Number(
                              store.target.amount.target || 0,
                            ).toLocaleString()}
                          </small>
                          <div
                            className="progress w-100"
                            style={{ height: "5px" }}
                          >
                            <div
                              className="progress-bar bg-warning"
                              style={{
                                width: `${Math.min(store.target.amount.percentage || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`badge ${(store.target.amount.percentage || 0) >= 100 ? "bg-success" : "bg-warning text-dark"}`}
                            style={{ fontSize: "10px" }}
                          >
                            {Number(
                              store.target.amount.percentage || 0,
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Target Bags Column */}
                    <td
                      className="text-center"
                      style={{ background: "#f0feff" }}
                    >
                      {store.target?.bags ? (
                        <div className="d-flex flex-column align-items-center gap-1 px-2">
                          <small
                            className="text-muted"
                            style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          >
                            {Number(
                              store.target.bags.achieved || 0,
                            ).toLocaleString()}
                            <span className="mx-1">/</span>
                            {Number(
                              store.target.bags.target || 0,
                            ).toLocaleString()}
                          </small>
                          <div
                            className="progress w-100"
                            style={{ height: "5px" }}
                          >
                            <div
                              className="progress-bar bg-info"
                              style={{
                                width: `${Math.min(store.target.bags.percentage || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`badge ${(store.target.bags.percentage || 0) >= 100 ? "bg-success" : "bg-info"}`}
                            style={{ fontSize: "10px" }}
                          >
                            {Number(store.target.bags.percentage || 0).toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-link text-decoration-none"
                        onClick={() => navigate("/store/stock-summary")}
                      >
                        Closing Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Navigation Confirmation Modal */}
        {showNavModal && (
          <div
            className="modal show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title">Go to Store?</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowNavModal(false)}
                  ></button>
                </div>
                <div className="modal-body text-center py-4">
                  <div className="mb-3">
                    <FaStore size={40} className="text-primary opacity-75" />
                  </div>
                  <p className="mb-0">
                    Are you sure you want to go to{" "}
                    <strong>{selectedStoreForNav?.name}</strong>?
                  </p>
                </div>
                <div className="modal-footer border-0 justify-content-center">
                  <button
                    className="btn btn-light px-4"
                    onClick={() => setShowNavModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary px-4"
                    onClick={confirmNavigation}
                  >
                    Yes, Go to Store
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <ErrorModal
            message={error}
            isOpen={isErrorModalOpen}
            onClose={() => setIsErrorModalOpen(false)}
          />
        )}
      </div>
    </>
  );
}
