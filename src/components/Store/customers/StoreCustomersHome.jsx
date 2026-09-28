import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import { FaUserCheck, FaUserClock } from "react-icons/fa";
import storeService from "../../../services/storeService";
import Loading from "@/components/Loading";

export default function StoreCustomersHome() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    try {
      let id = null;
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        id = store?.id;
      }
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId, 10) : null;
      }
      if (!id) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        id = user?.storeId || user?.store?.id;
      }
      if (id) setStoreId(id);
    } catch (error) {
      console.error("Failed to determine store for customers home:", error);
    }
  }, []);

  useEffect(() => {
    if (storeId) fetchCustomers();
  }, [storeId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await storeService.getStoreCustomers(storeId, {
        page: 1,
        limit: 8,
      });
      setCustomers(response.data || []);
      setPagination(response.pagination || null);
    } catch (error) {
      console.error("Error fetching customer home data:", error);
      setCustomers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = pagination?.total || customers.length;
    const active = customers.filter((customer) => customer.isActive !== false).length;
    const inactive = customers.filter((customer) => customer.isActive === false).length;
    const withRecentPurchase = customers.filter((customer) => customer.lastPurchaseDate).length;
    return {
      total,
      active,
      inactive,
      withRecentPurchase,
    };
  }, [customers, pagination]);

  const getStatusBadge = (customer) => {
    if (customer.isActive === false) {
      return { class: "bg-danger", icon: <FaUserClock />, label: "Inactive" };
    }
    if (customer.lastPurchaseDate) {
      return { class: "bg-success", icon: <FaUserCheck />, label: "Active Buyer" };
    }
    return { class: "bg-warning", icon: <FaUserClock />, label: "New Customer" };
  };

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
          Customer Management
        </h2>
        <p
          style={{
            fontFamily: "Poppins",
            fontSize: isMobile ? "12px" : "14px",
            color: "#666",
            margin: 0,
          }}
        >
          Recent customer activity and quick actions for the current store
        </p>
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
          <button
            className="homebtn"
            onClick={() => navigate("/store/customers/create")}
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
            Create Customer
          </button>
          <button
            className="homebtn"
            onClick={() => navigate("/store/customers/list")}
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
            Customers List
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.orderStatusCard} style={{ minHeight: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loading />
        </div>
      ) : (
        <>
          <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: "24px" }}>
            <ReusableCard title="Total Customers" value={String(summary.total || 0)} />
            <ReusableCard title="Active" value={String(summary.active || 0)} color="green.500" />
            <ReusableCard title="Inactive" value={String(summary.inactive || 0)} color="red.500" />
            <ReusableCard title="Recent Buyers" value={String(summary.withRecentPurchase || 0)} color="blue.500" />
          </Flex>

          <div className={styles.orderStatusCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h4 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600, fontSize: "20px", color: "var(--primary-color)" }}>
                Recent Customers
              </h4>
              <button className="btn btn-sm btn-outline-primary" onClick={() => navigate("/store/customers/list")}>
                View All
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ marginBottom: 0, fontFamily: "Poppins" }}>
                <thead>
                  <tr>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Customer Code</th>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Farmer</th>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Mobile</th>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Village</th>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Purchases</th>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Status</th>
                    <th style={{ fontWeight: 600, fontSize: "13px" }}>Last Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        No customers found for this store yet.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, i) => {
                      const statusInfo = getStatusBadge(customer);
                      return (
                        <tr key={customer.id || i} style={{ background: i % 2 === 0 ? "rgba(59, 130, 246, 0.03)" : "transparent" }}>
                          <td style={{ fontSize: "13px", fontWeight: 600 }}>{customer.customerCode || "-"}</td>
                          <td style={{ fontSize: "13px", fontWeight: 600 }}>{customer.farmerName || customer.name || "-"}</td>
                          <td style={{ fontSize: "13px" }}>{customer.mobile || customer.phoneNo || "-"}</td>
                          <td style={{ fontSize: "13px" }}>{customer.village || customer.area || "-"}</td>
                          <td style={{ fontSize: "13px", fontWeight: 600 }}>
                            Rs.{Number(customer.totalPurchases || 0).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span className={`badge ${statusInfo.class}`} style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={{ fontSize: "13px", color: "#6b7280" }}>
                            {customer.lastPurchaseDate
                              ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
                              : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
