import React, { useEffect, useState, useMemo } from "react";
import styles from "./Customer.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ModifyCustomerModal from "./ModifyCustomerModal";
import {
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaPhoneAlt,
  FaWhatsapp,
  FaArrowLeft,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoiceDollar,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
} from "react-icons/fa";

export default function CustomerList({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(25);

  // Edit modal
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Status toggle loader
  const [togglingId, setTogglingId] = useState(null);

  const fetchCustomersAndWarehouses = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem("currentDivisionId");
      let endpoint = "/customers";
      if (currentDivisionId && currentDivisionId !== "1") {
        endpoint += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        endpoint += `?showAllDivisions=true`;
      }

      const [custRes, whRes] = await Promise.all([
        axiosAPI.get(endpoint),
        axiosAPI.get("/warehouses").catch(() => ({ data: { warehouses: [] } })),
      ]);

      setCustomers(custRes.data?.customers || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
    } catch (err) {
      console.error("Failed to load customer list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersAndWarehouses();
  }, []);

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (cust.name || "").toLowerCase().includes(q);
        const matchPhone = (cust.mobile || cust.phone || "").toLowerCase().includes(q);
        const matchFirm = (cust.firmName || cust.firm_name || "").toLowerCase().includes(q);
        const matchId = (cust.customer_id || "").toLowerCase().includes(q);
        const matchCity = (cust.city || "").toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchFirm && !matchId && !matchCity) return false;
      }

      // Warehouse
      if (selectedWarehouse !== "all") {
        const wId = String(cust.warehouseId || cust.warehouse?.id || "");
        if (wId !== String(selectedWarehouse)) return false;
      }

      // Status
      if (statusFilter !== "all") {
        if (cust.status !== statusFilter) return false;
      }

      return true;
    });
  }, [customers, searchTerm, selectedWarehouse, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / limit) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (pageNo - 1) * limit;
    return filteredCustomers.slice(start, start + limit);
  }, [filteredCustomers, pageNo, limit]);

  const handleStatusToggle = async (customer) => {
    const newStatus = customer.status === "Active" ? "Inactive" : "Active";
    try {
      setTogglingId(customer.id);
      await axiosAPI.put(`/customers/${customer.id}/status`, { status: newStatus });
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error("Toggle customer status error:", err);
      alert(err?.response?.data?.message || "Failed to update customer status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditClick = (cust) => {
    setSelectedCustomerToEdit(cust);
    setIsEditModalOpen(true);
  };

  return (
    <div className={styles.customerContainer}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <p style={{ margin: "0 0 4px 0", cursor: "pointer", color: "#64748b", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }} onClick={() => navigate("/customers")}>
            <FaArrowLeft size={10} /> Back to Hub
          </p>
          <h1>
            <FaBuilding style={{ color: "#ea580c" }} /> Contractors & Customers Directory
          </h1>
          <p>
            Browse all client accounts, toggle activation, and modify contractor details
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.primaryBtn}
            onClick={() => navigate("/customers/create")}
          >
            <FaUserPlus /> + Add Customer
          </button>
          <button
            className={styles.outlineBtn}
            onClick={fetchCustomersAndWarehouses}
            title="Refresh list"
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIconInside} />
          <input
            type="text"
            placeholder="Search contractor by name, phone, firm, city, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageNo(1);
            }}
          />
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              setPageNo(1);
            }}
          >
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageNo(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          <select
            className={styles.filterSelect}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPageNo(1);
            }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
            Contractor Accounts Directory
          </h3>
          <p className={styles.tableCount}>
            Showing{" "}
            {filteredCustomers.length > 0 ? (pageNo - 1) * limit + 1 : 0} to{" "}
            {Math.min(pageNo * limit, filteredCustomers.length)} of {filteredCustomers.length} contractors
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Loading />
            <p style={{ marginTop: "12px", color: "#64748b", fontSize: "13px" }}>
              Loading customers...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <FaBuilding size={42} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
            <h4 style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>No Contractors Found</h4>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
              {searchTerm ? "No customers match your filter criteria." : "No customer accounts have been registered yet."}
            </p>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate("/customers/create")}
              style={{ marginTop: "14px" }}
            >
              <FaUserPlus /> + Add Customer
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className={styles.tableWrapper}>
              <table className={styles.customerTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Customer ID</th>
                    <th>Contractor / Customer</th>
                    <th>Mobile & WhatsApp</th>
                    <th>Warehouse / City</th>
                    <th>Billing Terms</th>
                    <th>Status / Activation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((cust, idx) => {
                    const phone = cust.mobile || cust.phone || "";
                    const whatsapp = cust.whatsapp || phone;
                    const isToggling = togglingId === cust.id;

                    return (
                      <tr key={cust.id || idx}>
                        <td>{(pageNo - 1) * limit + idx + 1}</td>
                        <td>
                          <span className={styles.idBadge}>
                            {cust.customer_id || `ACM-C-${cust.id}`}
                          </span>
                        </td>
                        <td>
                          <div className={styles.contractorName}>{cust.name}</div>
                          {(cust.firmName || cust.firm_name) && (
                            <span className={styles.firmBadge}>
                              {cust.firmName || cust.firm_name}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.contactBox}>
                            {phone ? (
                              <a href={`tel:${phone}`} className={styles.callLink}>
                                <FaPhoneAlt size={11} /> {phone}
                              </a>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "12px" }}>No mobile</span>
                            )}
                            {whatsapp && (
                              <a
                                href={`https://wa.me/91${whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.whatsappIconBtn}
                                title="Chat on WhatsApp"
                              >
                                <FaWhatsapp />
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "13px" }}>
                            {cust.warehouse?.name || "Main Warehouse"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {cust.city || cust.district || "Hyderabad"}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: cust.discountType === "monthly" ? "#0284c7" : "#475569",
                              textTransform: "capitalize",
                            }}
                          >
                            {cust.discountType ? cust.discountType.replace("_", " ") : "Bill to Bill"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(cust)}
                            disabled={isToggling}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: isToggling ? "not-allowed" : "pointer",
                              padding: 0,
                            }}
                            title="Click to toggle Active / Inactive"
                          >
                            <span
                              className={
                                cust.status === "Active"
                                  ? styles.statusActive
                                  : styles.statusInactive
                              }
                              style={{ opacity: isToggling ? 0.6 : 1 }}
                            >
                              {cust.status === "Active" ? (
                                <FaCheckCircle size={10} />
                              ) : (
                                <FaTimesCircle size={10} />
                              )}
                              {isToggling ? "Updating..." : cust.status || "Active"}
                            </span>
                          </button>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button
                              className={styles.editActionBtn}
                              onClick={() => handleEditClick(cust)}
                              title="Modify Contractor Details"
                            >
                              <FaEdit size={12} /> Modify
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List (Active on <= 768px) */}
            <div className={styles.mobileCardsList}>
              {paginatedCustomers.map((cust) => {
                const phone = cust.mobile || cust.phone || "";
                const isToggling = togglingId === cust.id;

                return (
                  <div key={cust.id} className={styles.customerCardMobile}>
                    <div className={styles.cardTopMobile}>
                      <div>
                        <h4 className={styles.cardNameMobile}>{cust.name}</h4>
                        {(cust.firmName || cust.firm_name) && (
                          <div className={styles.cardFirmMobile}>
                            {cust.firmName || cust.firm_name}
                          </div>
                        )}
                        <span className={styles.idBadge} style={{ marginTop: "4px" }}>
                          {cust.customer_id || `ACM-C-${cust.id}`}
                        </span>
                      </div>
                      <button
                        onClick={() => handleStatusToggle(cust)}
                        disabled={isToggling}
                        style={{ background: "none", border: "none", padding: 0 }}
                      >
                        <span
                          className={
                            cust.status === "Active"
                              ? styles.statusActive
                              : styles.statusInactive
                          }
                        >
                          {cust.status || "Active"}
                        </span>
                      </button>
                    </div>

                    <div className={styles.cardMetaRow}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        📍 {cust.city || cust.district || "Hyderabad"}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7" }}>
                        {cust.discountType === "monthly" ? "Monthly" : "Bill-to-Bill"}
                      </span>
                    </div>

                    <div className={styles.mobileActionRow}>
                      {phone && (
                        <a href={`tel:${phone}`} className={styles.mobileCallBtn}>
                          <FaPhoneAlt size={12} /> Call ({phone})
                        </a>
                      )}
                      <button
                        className={styles.mobileEditBtn}
                        onClick={() => handleEditClick(cust)}
                      >
                        <FaEdit size={12} /> Modify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Page {pageNo} of {totalPages}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className={styles.outlineBtn}
                    onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                    disabled={pageNo === 1}
                    style={{ opacity: pageNo === 1 ? 0.5 : 1, padding: "6px 12px" }}
                  >
                    <FaChevronLeft size={10} /> Prev
                  </button>

                  <button
                    className={styles.outlineBtn}
                    onClick={() => setPageNo((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNo === totalPages}
                    style={{ opacity: pageNo === totalPages ? 0.5 : 1, padding: "6px 12px" }}
                  >
                    Next <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modify Customer Modal */}
      {selectedCustomerToEdit && (
        <ModifyCustomerModal
          customer={selectedCustomerToEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCustomerToEdit(null);
          }}
          onSuccess={fetchCustomersAndWarehouses}
        />
      )}
    </div>
  );
}
