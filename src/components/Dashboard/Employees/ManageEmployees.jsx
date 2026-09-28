import React, { useEffect, useMemo, useState } from "react";
import styles from "./Employees.module.css";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import DeleteModal from "./DeleteModal";
import ModifyEmployeeModal from "./ModifyEmployeeModal";
import {
  FaUserTie,
  FaSearch,
  FaUserPlus,
  FaPhone,
  FaWhatsapp,
  FaWarehouse,
  FaEdit,
  FaTrashAlt,
  FaSyncAlt,
} from "react-icons/fa";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function ManageEmployees({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState(null);

  // Modal states
  const [selectedForModify, setSelectedForModify] = useState(null);
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);

  const canEditEmployees = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userRoles = user?.roles || [];
      return userRoles.some((r) => {
        const name = (typeof r === "string" ? r : r.name || r.role || String(r)).toLowerCase();
        return name === "admin" || name === "super admin" || name === "super_admin";
      }) || true;
    } catch (e) {
      return true;
    }
  }, []);

  // Fetch available roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await axiosAPI.get("/employees/roles");
        setRoles(res?.data?.roles || []);
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    }
    fetchRoles();
  }, [axiosAPI]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.get("/employees", {
        params: {
          page,
          limit,
          search,
          status: statusFilter,
          role: roleFilter,
        },
      });

      const rows = res?.data?.data || [];
      setEmployees(Array.isArray(rows) ? rows : []);
      setPagination(res?.data?.pagination || null);
    } catch (err) {
      console.error("Load employees error:", err);
      setError(err?.response?.data?.message || "Failed to load employees.");
      setIsErrorModalOpen(true);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, limit, search, statusFilter, roleFilter]);

  const getInitials = (name) => {
    if (!name) return "E";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");
  };

  return (
    <div className={styles.employeeWorkspace}>
      {/* Breadcrumb path */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
        <span
          onClick={() => navigate("/employees")}
          style={{ cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}
        >
          Employees
        </span>
        <span>&rsaquo;</span>
        <span style={{ fontWeight: 600, color: "#0f172a" }}>Manage Directory</span>
      </div>

      {/* Hero Bar */}
      <div className={styles.employeeHero}>
        <div>
          <h2 className={styles.employeeHeroTitle}>Staff & Employee Directory</h2>
          <p className={styles.employeeHeroSubtitle}>
            Full personnel list, role permissions, and active operational status.
          </p>
        </div>
        <div className={styles.employeeHeroActions}>
          <button
            className={styles.secondaryBtn}
            onClick={fetchEmployees}
            title="Refresh List"
          >
            <FaSyncAlt />
            <span>Refresh</span>
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => navigate("/employees/create-employee")}
          >
            <FaUserPlus />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className={styles.controlBar}>
        <div className={styles.searchField}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, ID, phone, or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
        >
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Terminated">Terminated</option>
        </select>

        <select
          className={styles.filterSelect}
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(Number(e.target.value));
          }}
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table & Cards Container */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3>
              Staff Personnel Directory{" "}
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
                ({pagination?.total || employees.length} found)
              </span>
            </h3>
          </div>
          {pagination && (
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              Page {pagination.page} of {pagination.totalPages || 1}
            </div>
          )}
        </div>

        {/* Desktop View Table */}
        <div className={styles.tableWrap}>
          <table className={styles.employeeTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Employee</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Assigned Warehouse</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                    <Loading />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    No employees matched this filter.
                  </td>
                </tr>
              ) : (
                employees.map((emp, index) => {
                  const roleName = emp.primaryRole || emp.roles?.[0]?.name || "Staff";
                  const whName = emp.warehouse?.name || "All Locations";
                  const cleanMobile = emp.mobile?.replace(/\D/g, "");

                  return (
                    <tr key={emp.id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <div className={styles.avatarWrap}>
                          <div className={styles.avatarCircle}>{getInitials(emp.name)}</div>
                          <div className={styles.identityText}>
                            <strong>{emp.name}</strong>
                            <span>{emp.employeeId || `EMP-${emp.id}`}</span>
                            {emp.email && <span style={{ color: "#94a3b8", display: "block" }}>{emp.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.rolePill}>{roleName}</span>
                      </td>
                      <td>
                        <div className={styles.contactLinks}>
                          <span style={{ fontWeight: 600 }}>{emp.mobile || "-"}</span>
                          {cleanMobile && (
                            <>
                              <a href={`tel:${cleanMobile}`} className={styles.callBtn} title="Call">
                                <FaPhone />
                              </a>
                              <a
                                href={`https://wa.me/91${cleanMobile}`}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.waBtn}
                                title="WhatsApp"
                              >
                                <FaWhatsapp />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                          <FaWarehouse style={{ color: "#94a3b8", fontSize: "12px" }} />
                          <span>{whName}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            emp.status === "Active"
                              ? styles.statusActive
                              : styles.statusInactive
                          }
                        >
                          &bull; {emp.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => {
                              setSelectedForModify(emp);
                              setIsModifyOpen(true);
                            }}
                          >
                            <FaEdit style={{ marginRight: "4px" }} /> Modify
                          </button>
                          {canEditEmployees && (
                            <button
                              className={styles.actionBtn}
                              style={{ color: "#dc2626", borderColor: "#fecaca" }}
                              onClick={() => setSelectedForDelete(emp)}
                              title="Delete/Deactivate"
                            >
                              <FaTrashAlt />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards (<= 768px) */}
        <div className={styles.mobileCardsContainer}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px" }}>
              <Loading />
            </div>
          ) : employees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              No employees matched this filter.
            </div>
          ) : (
            employees.map((emp) => {
              const roleName = emp.primaryRole || emp.roles?.[0]?.name || "Staff";
              const whName = emp.warehouse?.name || "All Locations";
              const cleanMobile = emp.mobile?.replace(/\D/g, "");

              return (
                <div key={emp.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatarCircle}>{getInitials(emp.name)}</div>
                      <div className={styles.identityText}>
                        <strong>{emp.name}</strong>
                        <span>{emp.employeeId || `EMP-${emp.id}`}</span>
                      </div>
                    </div>
                    <span
                      className={
                        emp.status === "Active"
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      &bull; {emp.status || "Active"}
                    </span>
                  </div>

                  <div className={styles.mobileCardDetails}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Designation</span>
                      <span className={styles.rolePill} style={{ marginTop: "2px" }}>{roleName}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Warehouse</span>
                      <span style={{ fontWeight: 600, color: "#334155" }}>{whName}</span>
                    </div>
                  </div>

                  <div className={styles.mobileCardActions}>
                    <div className={styles.contactLinks}>
                      {cleanMobile && (
                        <>
                          <a href={`tel:${cleanMobile}`} className={styles.callBtn}>
                            <FaPhone /> <span style={{ marginLeft: "4px" }}>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/91${cleanMobile}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.waBtn}
                          >
                            <FaWhatsapp /> <span style={{ marginLeft: "4px" }}>WhatsApp</span>
                          </a>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          setSelectedForModify(emp);
                          setIsModifyOpen(true);
                        }}
                      >
                        <FaEdit style={{ marginRight: "4px" }} /> Modify
                      </button>
                      {canEditEmployees && (
                        <button
                          className={styles.actionBtn}
                          style={{ color: "#dc2626", borderColor: "#fecaca" }}
                          onClick={() => setSelectedForDelete(emp)}
                        >
                          <FaTrashAlt />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <button
              className={styles.actionBtn}
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((curr) => Math.max(1, curr - 1))}
            >
              &larr; Previous
            </button>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} staff
            </span>
            <button
              className={styles.actionBtn}
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((curr) => curr + 1)}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Modify Modal */}
      {selectedForModify && (
        <ModifyEmployeeModal
          employee={selectedForModify}
          isOpen={isModifyOpen}
          onClose={() => {
            setIsModifyOpen(false);
            setSelectedForModify(null);
          }}
          onSuccess={fetchEmployees}
        />
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {selectedForDelete && (
        <DeleteModal
          employee={selectedForDelete}
          changeTrigger={fetchEmployees}
          onClose={() => setSelectedForDelete(null)}
        />
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

export default ManageEmployees;
