import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import { FaArrowDown } from "react-icons/fa";
import { useAuth } from "../../../Auth";
import { isAdmin, isDivisionHead, isStoreManager } from "../../../utils/roleUtils";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

export default function StoreInventory() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const getStoreId = () => {
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        if (store?.id) return store.id;
      }

      const currentStoreId = localStorage.getItem("currentStoreId");
      if (currentStoreId) {
        const id = parseInt(currentStoreId, 10);
        if (!Number.isNaN(id)) return id;
      }

      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      return user?.storeId || user?.store?.id || null;
    } catch (err) {
      console.error("Error getting store ID:", err);
      return null;
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const id = getStoreId();
    if (id) setStoreId(id);
  }, []);

  useEffect(() => {
    if (storeId) fetchInventoryDashboard();
  }, [storeId]);

  const fetchInventoryDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      const isAdminUser = isAdmin(user);
      const isDivisionHeadUser = isDivisionHead(user);
      const isStoreManagerUser = isStoreManager(user);

      let endpoint;
      if (isAdminUser || isDivisionHeadUser) {
        endpoint = `/stores/admin/${storeId}/inventory/dashboard`;
      } else if (isStoreManagerUser) {
        endpoint = `/stores/${storeId}/inventory/dashboard`;
      } else {
        endpoint = `/stores/${storeId}/inventory/dashboard`;
      }

      const response = await axiosAPI.get(endpoint);
      const responseData = response.data || response;

      if (responseData.success && responseData.data) {
        setDashboardData(responseData.data);
      } else if (responseData.data) {
        setDashboardData(responseData.data);
      } else {
        throw new Error(responseData.message || "Failed to fetch inventory dashboard");
      }
    } catch (err) {
      console.error("Error fetching inventory dashboard:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch inventory dashboard";
      setError(errorMessage);
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  const summary = dashboardData?.summary || {};
  const lowStockAlerts = dashboardData?.lowStockAlerts || [];
  const recentMovements = dashboardData?.recentMovements || [];

  return (
    <div style={{ padding: isMobile ? "12px 8px" : "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: isMobile ? "22px" : "28px",
            color: "var(--primary-color)",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Inventory Management
        </h2>
      </div>

      <div className="row m-0 p-2" style={{ marginBottom: "24px" }}>
        <div
          className="col"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            ...(isMobile
              ? {
                  flexDirection: "row",
                  gap: "6px",
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  marginLeft: "0",
                  width: "100%",
                }
              : {
                  gap: "10px",
                }),
          }}
        >
          {[
            { label: "Manage Stock", path: "/store/inventory/manage-stock" },
            { label: "Current Stock", path: "/store/current-stock" },
            { label: "Stock Summary", path: "/store/stock-summary" },
            { label: "Damaged Stock", path: "/store/damaged-stock" },
            { label: "Stock Transfer", path: "/store/stock-transfer" },
          ].map(({ label, path }) => (
            <button
              className="homebtn"
              key={label}
              onClick={() => navigate(path)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: "1",
                ...(isMobile
                  ? {
                      padding: "6px 8px",
                      fontSize: "11px",
                      borderRadius: "6px",
                      flex: "0 0 calc(33.333% - 4px)",
                      maxWidth: "calc(33.333% - 4px)",
                      width: "calc(33.333% - 4px)",
                      minHeight: "32px",
                      boxSizing: "border-box",
                      whiteSpace: "normal",
                      margin: 0,
                    }
                  : {
                      padding: "12px 24px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      whiteSpace: "nowrap",
                    }),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          className={styles.orderStatusCard}
          style={{
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loading />
        </div>
      ) : (
        <>
          <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: "24px" }}>
            <ReusableCard title="Low Stock Items" value={summary.lowStockItems?.toString() || "0"} color="red.500" />
            <ReusableCard title="Incoming Transfers" value={summary.incomingTransfers?.toString() || "0"} color="blue.500" />
            <ReusableCard title="Damaged This Week" value={summary.damagedThisWeek?.toString() || "0"} color="yellow.500" />
            <ReusableCard
              title="Total Stock Value"
              value={`Rs.${summary.totalStockValue?.toLocaleString("en-IN") || "0"}`}
              color="green.500"
            />
          </Flex>

          <div className={styles.dashboardGrid}>
            <div className={styles.firstRow}>
              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: "20px",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Low Stock Alerts
                </h4>
                <div style={{ overflowX: "auto" }}>
                  {lowStockAlerts.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "20px", color: "#6b7280", fontFamily: "Poppins" }}>
                      No low stock items
                    </p>
                  ) : (
                    <table className="table" style={{ marginBottom: 0, fontFamily: "Poppins" }}>
                      <thead>
                        <tr>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>Product</th>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>Current</th>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>Threshold</th>
                          <th style={{ fontWeight: 600, fontSize: "13px" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockAlerts.map((alert, i) => (
                          <tr
                            key={alert.productId || i}
                            style={{
                              background: i % 2 === 0 ? "rgba(59, 130, 246, 0.03)" : "transparent",
                            }}
                          >
                            <td style={{ fontSize: "13px" }}>{alert.productName || "Unknown"}</td>
                            <td style={{ fontSize: "13px" }}>{alert.current || "-"}</td>
                            <td style={{ fontSize: "13px" }}>{alert.threshold || "-"}</td>
                            <td>
                              <span className="badge bg-warning" style={{ fontSize: "11px" }}>
                                {alert.status || "Low"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className={styles.orderStatusCard}>
                <h4
                  style={{
                    margin: 0,
                    marginBottom: "20px",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "var(--primary-color)",
                  }}
                >
                  Recent Stock Movements
                </h4>
                <div>
                  {recentMovements.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "20px", color: "#6b7280", fontFamily: "Poppins" }}>
                      No recent movements
                    </p>
                  ) : (
                    recentMovements.map((movement, idx) => (
                      <div
                        key={movement.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          background: idx % 2 === 0 ? "rgba(59, 130, 246, 0.03)" : "transparent",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background:
                                movement.type === "Incoming"
                                  ? "rgba(5, 150, 105, 0.1)"
                                  : "rgba(239, 68, 68, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: movement.type === "Incoming" ? "#059669" : "#ef4444",
                            }}
                          >
                            <FaArrowDown
                              style={{
                                transform: movement.type === "Incoming" ? "rotate(180deg)" : "none",
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#111827",
                                fontFamily: "Poppins",
                                fontSize: "14px",
                              }}
                            >
                              {movement.productName || "Unknown Product"}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "Poppins" }}>
                              {movement.type || movement.transactionType} | {movement.timeAgo || "Recently"}
                            </div>
                            {movement.remarks && (
                              <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "Poppins", marginTop: "2px" }}>
                                {movement.remarks}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: movement.type === "Incoming" ? "#059669" : "#ef4444",
                            fontFamily: "Poppins",
                            fontSize: "16px",
                            marginLeft: "12px",
                          }}
                        >
                          {movement.quantity ||
                            (movement.quantityValue
                              ? `${movement.type === "Incoming" ? "+" : "-"}${movement.quantityValue}`
                              : "-")}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isErrorModalOpen && (
        <ErrorModal isOpen={isErrorModalOpen} message={error} onClose={closeErrorModal} />
      )}
    </div>
  );
}
