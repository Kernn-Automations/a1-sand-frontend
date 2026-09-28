import React, { useEffect, useState, useMemo } from "react";
import styles from "./Customer.module.css";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ModifyCustomerModal from "./ModifyCustomerModal";
import {
  FaUserPlus,
  FaList,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaPhoneAlt,
  FaWhatsapp,
  FaEdit,
  FaSearch,
  FaBuilding,
  FaFileInvoiceDollar,
} from "react-icons/fa";

export default function CustomerHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerToEdit, setSelectedCustomerToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const currentDivisionId = localStorage.getItem("currentDivisionId");
      let endpoint = "/customers";
      if (currentDivisionId && currentDivisionId !== "1") {
        endpoint += `?divisionId=${currentDivisionId}`;
      } else if (currentDivisionId === "1") {
        endpoint += `?showAllDivisions=true`;
      }

      const res = await axiosAPI.get(endpoint);
      const list = res.data?.customers || [];
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "Active").length;
    const inactive = customers.filter((c) => c.status === "Inactive").length;
    const billToBill = customers.filter(
      (c) => !c.discountType || c.discountType === "bill_to_bill"
    ).length;
    const monthly = customers.filter(
      (c) => c.discountType === "monthly"
    ).length;

    return { total, active, inactive, billToBill, monthly };
  }, [customers]);

  // Filtered recent customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers.slice(0, 15);
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.mobile || c.phone || "").toLowerCase().includes(q) ||
        (c.firmName || c.firm_name || "").toLowerCase().includes(q) ||
        (c.customer_id || "").toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleEditClick = (cust) => {
    setSelectedCustomerToEdit(cust);
    setIsEditModalOpen(true);
  };

  return (
    <div className={styles.customerContainer}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>
            <FaBuilding style={{ color: "#ea580c" }} /> Customers & Contractors Hub
          </h1>
          <p>
            Client directory, builders & direct sales contractor accounts for Anjali Constructions
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
            className={styles.secondaryBtn}
            onClick={() => navigate("/customers/customer-list")}
          >
            <FaList /> View All Customers ({customers.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (KYC removed) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Total Customers</h3>
            <p className={styles.kpiValue}>{stats.total}</p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <FaUsers />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Active Contractors</h3>
            <p className={styles.kpiValue} style={{ color: "#16a34a" }}>
              {stats.active}
            </p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#dcfce7", color: "#16a34a" }}>
            <FaCheckCircle />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Inactive Accounts</h3>
            <p className={styles.kpiValue} style={{ color: "#dc2626" }}>
              {stats.inactive}
            </p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#fee2e2", color: "#dc2626" }}>
            <FaTimesCircle />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <h3>Billing Terms</h3>
            <p className={styles.kpiValue} style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              {stats.billToBill} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>B2B</span> &bull;{" "}
              {stats.monthly} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Monthly</span>
            </p>
          </div>
          <div className={styles.kpiIconBox} style={{ background: "#ffedd5", color: "#ea580c" }}>
            <FaFileInvoiceDollar />
          </div>
        </div>
      </div>

      {/* Quick Search & Shortcuts Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIconInside} />
          <input
            type="text"
            placeholder="Quick search contractor by name, phone, or firm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          <button
            className={styles.outlineBtn}
            onClick={() => navigate("/customers/create")}
          >
            <FaUserPlus /> New Contractor
          </button>
          <button
            className={styles.outlineBtn}
            onClick={() => navigate("/customers/customer-list")}
          >
            <FaList /> Manage Directory
          </button>
        </div>
      </div>

      {/* Recent Customers Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
            {searchQuery.trim() ? "Search Results" : "Recent Contractors & Customers"}
          </h3>
          <p className={styles.tableCount}>
            Showing {filteredCustomers.length} of {customers.length} contractors
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Loading />
            <p style={{ marginTop: "10px", color: "#64748b", fontSize: "13px" }}>
              Loading customer directory...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <FaUsers size={40} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
            <h4 style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>No Customers Found</h4>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
              {searchQuery ? "Try searching with a different name or phone number" : "Click '+ Add Customer' to onboard your first contractor."}
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
            {/* Desktop Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.customerTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Customer ID</th>
                    <th>Contractor / Customer</th>
                    <th>Mobile & WhatsApp</th>
                    <th>Warehouse / City</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust, idx) => {
                    const phone = cust.mobile || cust.phone || "";
                    const whatsapp = cust.whatsapp || phone;
                    return (
                      <tr key={cust.id || idx}>
                        <td>{idx + 1}</td>
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
                            className={
                              cust.status === "Active" ? styles.statusActive : styles.statusInactive
                            }
                          >
                            {cust.status === "Active" ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                            {cust.status || "Active"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionBtnGroup}>
                            <button
                              className={styles.editActionBtn}
                              onClick={() => handleEditClick(cust)}
                              title="Modify Customer Details"
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

            {/* Mobile Cards List (Active on screen <= 768px) */}
            <div className={styles.mobileCardsList}>
              {filteredCustomers.map((cust) => {
                const phone = cust.mobile || cust.phone || "";
                const whatsapp = cust.whatsapp || phone;
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
                      <span
                        className={
                          cust.status === "Active" ? styles.statusActive : styles.statusInactive
                        }
                      >
                        {cust.status || "Active"}
                      </span>
                    </div>

                    <div className={styles.cardMetaRow}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        📍 {cust.city || cust.district || "Hyderabad"}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#0284c7" }}>
                        {cust.discountType === "monthly" ? "Monthly Discount" : "Bill-to-Bill"}
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
          onSuccess={fetchCustomers}
        />
      )}
    </div>
  );
}
