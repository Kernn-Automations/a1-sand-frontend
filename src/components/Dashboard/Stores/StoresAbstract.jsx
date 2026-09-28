import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Auth";
import { useDivision } from "../../context/DivisionContext";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import styles from "./StoresAbstract.module.css";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import { isZBM, isRBM } from "../../../utils/roleUtils";
import zonesService from "../../../services/zonesService";
import subZonesService from "../../../services/subZonesService";

const StoresAbstract = () => {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [storesData, setStoresData] = useState([]);
  const [filteredStoresData, setFilteredStoresData] = useState([]);
  const [selectedAgreementImage, setSelectedAgreementImage] = useState(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const [summary, setSummary] = useState({
    totalStores: 0,
    ownStores: 0,
    franchiseStores: 0,
  });

  // Search Application State
  const [searchFilters, setSearchFilters] = useState({});
  const [showSearch, setShowSearch] = useState({});

  // Handle click outside to close search inputs
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside any search input container
      if (!event.target.closest("[data-search-container]")) {
        // Optionally close all searches or leave them open.
        // For better UX like IncomingStock, we might want to close them if clicked outside.
        // However, with many columns, user might want to keep filters active.
        // IncomingStock closes them. Let's close active input if clicked outside.
        setShowSearch({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter Data Effect
  useEffect(() => {
    if (storesData) {
      let filtered = storesData;

      Object.keys(searchFilters).forEach((key) => {
        const term = searchFilters[key]?.toLowerCase() || "";
        if (term) {
          filtered = filtered.filter((store) => {
            let value = "";
            // Handle nested properties based on key naming convention (e.g., 'agreementDetails.landOwner')
            if (key.includes(".")) {
              const parts = key.split(".");
              value = store[parts[0]]?.[parts[1]] || "";
            } else {
              value = store[key] || "";
            }
            return String(value).toLowerCase().includes(term);
          });
        }
      });
      setFilteredStoresData(filtered);
    }
  }, [storesData, searchFilters]);

  // Toggle Search Input
  const toggleSearch = (column, e) => {
    e.stopPropagation();
    setShowSearch((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Update Search Filter
  const handleSearchChange = (column, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const clearSearch = (column, e) => {
    e.stopPropagation();
    handleSearchChange(column, "");
  };

  useEffect(() => {
    fetchStoresAbstract();
  }, [selectedDivision, showAllDivisions]);

  const exportColumns = [
    "S.No",
    "Store Name",
    "Store Code",
    "Type",
    "Division",
    "Zone",
    "Sub Zone",
    "Team",
    "Address",
    "Land Owner",
    "Agreement Period",
    "Start Date",
    "End Date",
    "Agreement",
    "Monthly Rent",
    "Security Deposit",
    "Bill Number",
    "Distributor",
    "Bill Allowance",
    "Aadhar",
    "PAN",
    "Mobile",
    "Beneficiary",
    "IFSC",
    "Account No",
    "Bank Name",
  ];

  const fetchStoresAbstract = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};

      // Division filter is handled by backend based on user role
      // For Division Head, backend automatically applies division filter
      // For Admin/Super Admin, we can optionally pass divisionId
      if (selectedDivision && !showAllDivisions) {
        params.divisionId = selectedDivision.id;
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (isZBM(user)) {
        try {
          // We need to find the zoneId for this ZBM
          const currentDivisionId = selectedDivision?.id;
          if (currentDivisionId) {
            const zonesResponse = await zonesService.getZones(
              { divisionId: currentDivisionId, isActive: true },
              currentDivisionId,
              false,
            );

            const zonesList =
              zonesResponse.data?.zones || zonesResponse.data || [];
            const zonesArray = Array.isArray(zonesList) ? zonesList : [];

            const zbmZone = zonesArray.find((z) => {
              const userId = String(user.id || "");
              const userEmpId = String(user.employeeId || "");
              const zoneHeadId = String(z.zoneHeadId || "");
              const headId = String(z.zoneHead?.id || "");
              const headEmpId = String(z.zoneHead?.employeeId || "");

              return (
                (userId && (zoneHeadId === userId || headId === userId)) ||
                (userEmpId &&
                  (headEmpId === userEmpId || zoneHeadId === userEmpId))
              );
            });

            if (zbmZone) {
              params.zoneId = zbmZone.id;
              console.log("ZBM Zone identified:", zbmZone.id);
            } else {
              console.warn(
                "ZBM user detected but no matching zone found in division",
              );
            }
          }
        } catch (zoneError) {
          console.error("Error identifying ZBM zone:", zoneError);
        }
      }

      if (isRBM(user)) {
        try {
          // Use new direct endpoint
          const response = await subZonesService.getSubZones();
          const data = response?.data || response || {};
          let subZonesList = data.subZones || data.data || data || [];
          subZonesList = Array.isArray(subZonesList) ? subZonesList : [];

          if (subZonesList.length > 0) {
            const targetSubZoneId = subZonesList[0].id;
            params.subZoneId = targetSubZoneId;
          } else {
            console.warn("RBM user but no subZoneId found");
          }
        } catch (rbmError) {
          console.error("Error setting up RBM filter:", rbmError);
        }
      }

      // Fetch stores abstract from new endpoint
      const response = await axiosAPI.get("/stores/abstract", params);
      const responseData = response.data || response;

      let storesList = [];
      if (responseData.success !== undefined) {
        if (responseData.success) {
          storesList = responseData.data || [];

          // ✅ SET SUMMARY FROM BACKEND
          if (responseData.summary) {
            setSummary({
              totalStores: responseData.summary.totalStores || 0,
              ownStores: responseData.summary.ownStores || 0,
              franchiseStores: responseData.summary.franchiseStores || 0,
            });
          } else {
            // Fallback (just in case)
            setSummary({
              totalStores: storesList.length,
              ownStores: storesList.filter((s) => s.type === "OWN").length,
              franchiseStores: storesList.filter((s) => s.type === "FRANCHISE")
                .length,
            });
          }
        } else {
          throw new Error(
            responseData.message || "Failed to fetch stores abstract",
          );
        }
      } else if (Array.isArray(responseData)) {
        storesList = responseData;
      } else if (responseData.data) {
        storesList = Array.isArray(responseData.data) ? responseData.data : [];
      }

      console.log("Stores abstract data received:", storesList);
      if (storesList.length > 0) {
        console.log("First store sample:", storesList[0]);
        console.log(
          "First store rentAgreementDocument:",
          storesList[0].rentAgreementDocument,
        );
      }
      setStoresData(storesList);
      setFilteredStoresData(storesList);
    } catch (err) {
      console.error("Error fetching stores abstract:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch stores abstract";
      setError(errorMessage);
      setIsErrorModalOpen(true);
      setStoresData([]);
      setFilteredStoresData([]);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const handleViewAgreement = (agreementImage) => {
    if (agreementImage) {
      let imageSrc;

      // Check if it's already a data URL
      if (agreementImage.startsWith("data:")) {
        imageSrc = agreementImage;
      }
      // Check if it's a URL (http/https)
      else if (
        agreementImage.startsWith("http://") ||
        agreementImage.startsWith("https://")
      ) {
        imageSrc = agreementImage;
      }
      // Otherwise, assume it's a base64 string
      else {
        imageSrc = `data:image/jpeg;base64,${agreementImage}`;
      }

      setSelectedAgreementImage(imageSrc);
      setShowAgreementModal(true);
    }
  };

  const closeAgreementModal = () => {
    setShowAgreementModal(false);
    setSelectedAgreementImage(null);
  };

  if (loading && storesData.length === 0) {
    return <Loading />;
  }

  const getExportData = () =>
    storesData.map((store, index) => {
      const agreement = store.agreementDetails || {};
      const power = store.powerBillDetails || {};
      const owner = store.ownerDetails || {};

      return [
        index + 1, // S.No
        store.storeName || "-",
        store.storeCode || "-",
        store.type || "-",
        store.division || "-",
        store.zone || "-",
        store.subZone || "-",
        store.team || "-",
        store.address || "-",
        agreement.landOwner || "-",
        agreement.agreementPeriod || "-",
        agreement.startDate ? formatDate(agreement.startDate) : "-",
        agreement.endDate ? formatDate(agreement.endDate) : "-",
        store.rentAgreementDocumentUrl ? "Yes" : "No", // Agreement
        agreement.monthlyRent || "-", // Monthly Rent
        agreement.securityDeposit || "-", // Security Deposit
        power.billNumber || "-", // Bill Number
        power.distributor || "-", // Distributor
        power.billAllowance || "-", // Bill Allowance
        owner.aadhar || "-", // Aadhar
        owner.panCard || "-", // PAN
        owner.mobile || "-", // Mobile
        owner.beneficiary || "-", // Beneficiary
        owner.ifsc || "-", // IFSC
        owner.accountNo || "-", // Account No
        owner.bankName || "-", // Bank Name
      ];
    });

  const handlePDFExport = async () => {
    await handleExportPDF(
      exportColumns,
      getExportData(),
      "Stores Abstract Report",
    );
  };

  const handleExcelExport = () => {
    handleExportExcel(exportColumns, getExportData(), "Stores Abstract Report");
  };

  return (
    <div className={styles.container}>
      <p className="path">
        <span onClick={() => navigate("/divisions?tab=stores")}>Stores</span>{" "}
        <i className="bi bi-chevron-right"></i> Stores Abstract
      </p>
      <div className={styles.header}>
        <h1>Stores Abstract</h1>
        <button
          className="homebtn"
          onClick={() => navigate("/divisions?tab=stores")}
        >
          Back to Stores
        </button>
        <div className={styles.actionButtons}>
          <button className={styles.excelBtn} onClick={handleExcelExport}>
            <i className="bi bi-file-earmark-excel"></i> Excel
          </button>

          <button className={styles.pdfBtn} onClick={handlePDFExport}>
            <i className="bi bi-file-earmark-pdf"></i> PDF
          </button>
        </div>
      </div>
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Stores</span>
          <span className={styles.summaryValue}>{summary.totalStores}</span>
        </div>

        <div className={`${styles.summaryItem} ${styles.ownSummary}`}>
          <span className={styles.summaryLabel}>Own Stores</span>
          <span className={styles.summaryValue}>{summary.ownStores}</span>
        </div>

        <div className={`${styles.summaryItem} ${styles.franchiseSummary}`}>
          <span className={styles.summaryLabel}>Franchise Stores</span>
          <span className={styles.summaryValue}>{summary.franchiseStores}</span>
        </div>
      </div>

      {error && !isErrorModalOpen && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={fetchStoresAbstract}>Retry</button>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table
            className={`table table-bordered borderedtable ${styles.abstractTable}`}
          >
            <thead>
              <tr>
                <th rowSpan="2">S.No</th>
                <th
                  rowSpan="2"
                  className={styles.storeColumn}
                  onClick={(e) => toggleSearch("storeName", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["storeName"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["storeName"] || ""}
                        onChange={(e) =>
                          handleSearchChange("storeName", e.target.value)
                        }
                        autoFocus
                        placeholder="Search..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("storeName", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Store Name {searchFilters["storeName"] && " *"}</>
                  )}
                </th>
                <th
                  rowSpan="2"
                  className={styles.codeColumn}
                  onClick={(e) => toggleSearch("storeCode", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["storeCode"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["storeCode"] || ""}
                        onChange={(e) =>
                          handleSearchChange("storeCode", e.target.value)
                        }
                        autoFocus
                        placeholder="Code..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("storeCode", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Store Code {searchFilters["storeCode"] && " *"}</>
                  )}
                </th>
                <th
                  rowSpan="2"
                  className={styles.typeColumn}
                  onClick={(e) => toggleSearch("type", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["type"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["type"] || ""}
                        onChange={(e) =>
                          handleSearchChange("type", e.target.value)
                        }
                        autoFocus
                        placeholder="Type..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("type", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Type {searchFilters["type"] && " *"}</>
                  )}
                </th>
                <th
                  rowSpan="2"
                  className={styles.divisionColumn}
                  onClick={(e) => toggleSearch("division", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["division"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["division"] || ""}
                        onChange={(e) =>
                          handleSearchChange("division", e.target.value)
                        }
                        autoFocus
                        placeholder="Div..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("division", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Division {searchFilters["division"] && " *"}</>
                  )}
                </th>
                <th
                  rowSpan="2"
                  className={styles.zoneColumn}
                  onClick={(e) => toggleSearch("zone", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["zone"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["zone"] || ""}
                        onChange={(e) =>
                          handleSearchChange("zone", e.target.value)
                        }
                        autoFocus
                        placeholder="Zone..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("zone", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Zone {searchFilters["zone"] && " *"}</>
                  )}
                </th>
                <th
                  rowSpan="2"
                  className={styles.zoneColumn}
                  onClick={(e) => toggleSearch("subZone", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["subZone"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["subZone"] || ""}
                        onChange={(e) =>
                          handleSearchChange("subZone", e.target.value)
                        }
                        autoFocus
                        placeholder="Sub Zone..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("subZone", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Sub Zone {searchFilters["subZone"] && " *"}</>
                  )}
                </th>
                <th
                  rowSpan="2"
                  className={styles.zoneColumn}
                  onClick={(e) => toggleSearch("team", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["team"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["team"] || ""}
                        onChange={(e) =>
                          handleSearchChange("team", e.target.value)
                        }
                        autoFocus
                        placeholder="Team..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("team", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Team {searchFilters["team"] && " *"}</>
                  )}
                </th>

                <th
                  rowSpan="2"
                  className={styles.addressColumn}
                  onClick={(e) => toggleSearch("address", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["address"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["address"] || ""}
                        onChange={(e) =>
                          handleSearchChange("address", e.target.value)
                        }
                        autoFocus
                        placeholder="Address..."
                        style={{
                          width: "100%",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("address", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Address {searchFilters["address"] && " *"}</>
                  )}
                </th>
                <th colSpan="7" className={styles.sectionHeader}>
                  Agreement Details
                </th>
                <th colSpan="3" className={styles.sectionHeader}>
                  Power Bill Details
                </th>
                <th colSpan="7" className={styles.sectionHeader}>
                  Owner Details
                </th>
              </tr>
              <tr>
                {/* Agreement Details Sub-headers */}
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("agreementDetails.landOwner", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["agreementDetails.landOwner"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["agreementDetails.landOwner"] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "agreementDetails.landOwner",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Owner..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("agreementDetails.landOwner", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Land Owner{" "}
                      {searchFilters["agreementDetails.landOwner"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) =>
                    toggleSearch("agreementDetails.agreementPeriod", e)
                  }
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["agreementDetails.agreementPeriod"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["agreementDetails.agreementPeriod"] ||
                          ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "agreementDetails.agreementPeriod",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Period..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("agreementDetails.agreementPeriod", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Agreement Period{" "}
                      {searchFilters["agreementDetails.agreementPeriod"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("agreementDetails.startDate", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["agreementDetails.startDate"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["agreementDetails.startDate"] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "agreementDetails.startDate",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Start..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("agreementDetails.startDate", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Start Date{" "}
                      {searchFilters["agreementDetails.startDate"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("agreementDetails.endDate", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["agreementDetails.endDate"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["agreementDetails.endDate"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "agreementDetails.endDate",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="End..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("agreementDetails.endDate", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      End Date{" "}
                      {searchFilters["agreementDetails.endDate"] && "*"}
                    </>
                  )}
                </th>
                <th className={styles.subHeader}>Agreement</th>
                <th
                  className={styles.subHeader}
                  onClick={(e) =>
                    toggleSearch("agreementDetails.monthlyRent", e)
                  }
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["agreementDetails.monthlyRent"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["agreementDetails.monthlyRent"] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "agreementDetails.monthlyRent",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Rent..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("agreementDetails.monthlyRent", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Monthly Rent{" "}
                      {searchFilters["agreementDetails.monthlyRent"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) =>
                    toggleSearch("agreementDetails.securityDeposit", e)
                  }
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["agreementDetails.securityDeposit"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["agreementDetails.securityDeposit"] ||
                          ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "agreementDetails.securityDeposit",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Deposit..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("agreementDetails.securityDeposit", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Security Deposit{" "}
                      {searchFilters["agreementDetails.securityDeposit"] && "*"}
                    </>
                  )}
                </th>
                {/* Power Bill Details Sub-headers */}
                <th
                  className={styles.subHeader}
                  onClick={(e) =>
                    toggleSearch("powerBillDetails.billNumber", e)
                  }
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["powerBillDetails.billNumber"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["powerBillDetails.billNumber"] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "powerBillDetails.billNumber",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Bill No..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("powerBillDetails.billNumber", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Bill Number{" "}
                      {searchFilters["powerBillDetails.billNumber"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) =>
                    toggleSearch("powerBillDetails.distributor", e)
                  }
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["powerBillDetails.distributor"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["powerBillDetails.distributor"] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "powerBillDetails.distributor",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Dist..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("powerBillDetails.distributor", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Distributor{" "}
                      {searchFilters["powerBillDetails.distributor"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) =>
                    toggleSearch("powerBillDetails.billAllowance", e)
                  }
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["powerBillDetails.billAllowance"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={
                          searchFilters["powerBillDetails.billAllowance"] || ""
                        }
                        onChange={(e) =>
                          handleSearchChange(
                            "powerBillDetails.billAllowance",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Allow..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("powerBillDetails.billAllowance", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Bill Allowance{" "}
                      {searchFilters["powerBillDetails.billAllowance"] && "*"}
                    </>
                  )}
                </th>
                {/* Owner Details Sub-headers */}
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.aadhar", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.aadhar"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.aadhar"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.aadhar",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Aadhar..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("ownerDetails.aadhar", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Aadhar {searchFilters["ownerDetails.aadhar"] && "*"}</>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.panCard", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.panCard"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.panCard"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.panCard",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Pan..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("ownerDetails.panCard", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Pan Card {searchFilters["ownerDetails.panCard"] && "*"}</>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.mobile", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.mobile"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.mobile"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.mobile",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Mobile..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("ownerDetails.mobile", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>Mobile {searchFilters["ownerDetails.mobile"] && "*"}</>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.beneficiary", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.beneficiary"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.beneficiary"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.beneficiary",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Benef..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("ownerDetails.beneficiary", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Beneficiary{" "}
                      {searchFilters["ownerDetails.beneficiary"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.ifsc", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.ifsc"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.ifsc"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.ifsc",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="IFSC..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("ownerDetails.ifsc", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>IFSC {searchFilters["ownerDetails.ifsc"] && "*"}</>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.accountNo", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.accountNo"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.accountNo"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.accountNo",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Acc No..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) =>
                          clearSearch("ownerDetails.accountNo", e)
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Account No{" "}
                      {searchFilters["ownerDetails.accountNo"] && "*"}
                    </>
                  )}
                </th>
                <th
                  className={styles.subHeader}
                  onClick={(e) => toggleSearch("ownerDetails.bankName", e)}
                  data-search-container
                  style={{ cursor: "pointer" }}
                >
                  {showSearch["ownerDetails.bankName"] ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={searchFilters["ownerDetails.bankName"] || ""}
                        onChange={(e) =>
                          handleSearchChange(
                            "ownerDetails.bankName",
                            e.target.value,
                          )
                        }
                        autoFocus
                        placeholder="Bank..."
                        style={{
                          width: "80px",
                          padding: "2px",
                          fontSize: "12px",
                          color: "black",
                        }}
                      />
                      <button
                        onClick={(e) => clearSearch("ownerDetails.bankName", e)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "red",
                          fontWeight: "bold",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      Bank Name {searchFilters["ownerDetails.bankName"] && "*"}
                    </>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStoresData.length === 0 ? (
                <tr>
                  <td colSpan={26} className={styles.noData}>
                    {storesData.length === 0
                      ? "No stores found"
                      : "No matching records found"}
                  </td>
                </tr>
              ) : (
                filteredStoresData.map((store, index) => {
                  // Extract nested data from new API format
                  const agreementDetails = store.agreementDetails || {};
                  const powerBillDetails = store.powerBillDetails || {};
                  const ownerDetails = store.ownerDetails || {};

                  return (
                    <tr key={store.id || index}>
                      <td>{index + 1}</td>
                      <td className={styles.storeNameCell}>
                        {store.storeName || "-"}
                      </td>
                      <td>{store.storeCode || "-"}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${store.type === "OWN" ? styles.badgeOwn : styles.badgeRented}`}
                        >
                          {store.type || "-"}
                        </span>
                      </td>
                      <td>{store.division || "-"}</td>
                      <td>{store.zone || "-"}</td>
                      <td>{store.subZone || "-"}</td>
                      <td>{store.team || "-"}</td>
                      <td className={styles.addressCell}>
                        {store.address || "-"}
                      </td>
                      {/* Agreement Details */}
                      <td>{agreementDetails.landOwner || "-"}</td>
                      <td>{agreementDetails.agreementPeriod || "-"}</td>
                      <td>{formatDate(agreementDetails.startDate)}</td>
                      <td>{formatDate(agreementDetails.endDate)}</td>
                      <td className={styles.agreementCell}>
                        {(() => {
                          // Check for agreementDocument field inside agreementDetails
                          // This is the field name from the updated API response
                          const agreementImageUrl =
                            agreementDetails?.agreementDocument ||
                            store.agreementDocument ||
                            store.rentAgreementDocument;

                          // Check if agreement period is missing
                          const agreementPeriod =
                            agreementDetails?.agreementPeriod;
                          const isAgreementPeriodMissing =
                            !agreementPeriod ||
                            agreementPeriod === "-" ||
                            agreementPeriod === null ||
                            agreementPeriod === "" ||
                            (typeof agreementPeriod === "string" &&
                              agreementPeriod.trim() === "");

                          // Show view button if agreement image URL exists and is valid
                          if (
                            agreementImageUrl &&
                            agreementImageUrl !== "-" &&
                            agreementImageUrl !== null &&
                            agreementImageUrl !== "" &&
                            typeof agreementImageUrl === "string" &&
                            agreementImageUrl.trim() !== ""
                          ) {
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <button
                                  className={styles.viewButton}
                                  onClick={() => {
                                    handleViewAgreement(agreementImageUrl);
                                  }}
                                  title="View Agreement Document"
                                >
                                  <i className="bi bi-eye"></i> View
                                </button>
                                {isAgreementPeriodMissing && (
                                  <span
                                    className={styles.warningBadge}
                                    title="Agreement period is missing"
                                  >
                                    <i className="bi bi-exclamation-triangle"></i>{" "}
                                    Period Missing
                                  </span>
                                )}
                              </div>
                            );
                          }

                          // If no agreement document but period is missing, show warning
                          if (isAgreementPeriodMissing) {
                            return (
                              <span
                                className={styles.warningBadge}
                                title="Agreement period is missing"
                              >
                                <i className="bi bi-exclamation-triangle"></i>{" "}
                                Period Missing
                              </span>
                            );
                          }

                          return "-";
                        })()}
                      </td>
                      <td>
                        {agreementDetails.monthlyRent
                          ? formatCurrency(agreementDetails.monthlyRent)
                          : "-"}
                      </td>
                      <td>
                        {agreementDetails.securityDeposit
                          ? formatCurrency(agreementDetails.securityDeposit)
                          : "-"}
                      </td>
                      {/* Power Bill Details */}
                      <td>{powerBillDetails.billNumber || "-"}</td>
                      <td>{powerBillDetails.distributor || "-"}</td>
                      <td>{powerBillDetails.billAllowance || "-"}</td>
                      {/* Owner Details */}
                      <td>{ownerDetails.aadhar || "-"}</td>
                      <td className={styles.panCell}>
                        {ownerDetails.panCard || "-"}
                      </td>
                      <td>{ownerDetails.mobile || "-"}</td>
                      <td>{ownerDetails.beneficiary || "-"}</td>
                      <td className={styles.ifscCell}>
                        {ownerDetails.ifsc || "-"}
                      </td>
                      <td className={styles.accountCell}>
                        {ownerDetails.accountNo || "-"}
                      </td>
                      <td>{ownerDetails.bankName || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={closeErrorModal}
        />
      )}

      {/* Agreement Image View Modal */}
      {showAgreementModal && selectedAgreementImage && (
        <div className={styles.modalOverlay} onClick={closeAgreementModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <button
                className={styles.modalCloseButton}
                onClick={closeAgreementModal}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <img
                src={selectedAgreementImage}
                alt="Agreement Document"
                className={styles.agreementImage}
                onError={(e) => {
                  e.target.src = "";
                  e.target.alt = "Failed to load image";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresAbstract;
