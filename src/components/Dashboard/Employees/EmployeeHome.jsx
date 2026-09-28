import React, { useEffect, useState } from "react";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "./Employees.module.css";
import ModifyEmployeeModal from "./ModifyEmployeeModal";
import {
  FaUserTie,
  FaUserCheck,
  FaUserSlash,
  FaIdBadge,
  FaUserPlus,
  FaUsers,
  FaPhone,
  FaWhatsapp,
  FaWarehouse,
  FaEdit,
  FaSearch,
} from "react-icons/fa";

function EmployeeHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    rolesCount: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.get("/employees?limit=50");
      const rows = res?.data?.data || [];
      const safeRows = Array.isArray(rows) ? rows : [];
      setEmployees(safeRows);

      // Compute staff metrics
      const total = res?.data?.pagination?.total || safeRows.length;
      const active = safeRows.filter((e) => e.status === "Active").length;
      const inactive = safeRows.filter((e) => e.status !== "Active").length;
      const roleSet = new Set(
        safeRows.map((e) => e.primaryRole || e.roles?.[0]?.name).filter(Boolean)
      );

      setStats({
        total,
        active,
        inactive,
        rolesCount: roleSet.size || 6,
      });
    } catch (err) {
      console.error("Employee fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) ||
      emp.employeeId?.toLowerCase().includes(term) ||
      emp.mobile?.includes(term) ||
      (emp.primaryRole && emp.primaryRole.toLowerCase().includes(term))
    );
  });

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
      {/* Executive Dark Slate Hero Banner */}
      <div className={styles.employeeHero}>
        <div>
          <h1 className={styles.employeeHeroTitle}>Staff & Employee Directory</h1>
          <p className={styles.employeeHeroSubtitle}>
            Human resources, operational roles, and workforce assignments for{" "}
            <strong style={{ color: "#f8fafc" }}>Anjali Constructions & Materials</strong>.
          </p>
        </div>
        <div className={styles.employeeHeroActions}>
          <button
            className={styles.secondaryBtn}
            onClick={() => navigate("/employees/manage-employees")}
          >
            <FaUsers />
            <span>Full Directory</span>
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

      {/* Real-Time Operational KPI Metrics */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <FaUserTie />
          </div>
          <div>
            <div className={styles.kpiLabel}>Total Staff</div>
            <div className={styles.kpiValue}>{loading ? "..." : stats.total}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
            <FaUserCheck />
          </div>
          <div>
            <div className={styles.kpiLabel}>Active Staff</div>
            <div className={styles.kpiValue} style={{ color: "#059669" }}>
              {loading ? "..." : stats.active}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
            <FaUserSlash />
          </div>
          <div>
            <div className={styles.kpiLabel}>Inactive / On Leave</div>
            <div className={styles.kpiValue} style={{ color: "#dc2626" }}>
              {loading ? "..." : stats.inactive}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ backgroundColor: "#faf5ff", color: "#7c3aed" }}>
            <FaIdBadge />
          </div>
          <div>
            <div className={styles.kpiLabel}>Roles Covered</div>
            <div className={styles.kpiValue} style={{ color: "#7c3aed" }}>
              {loading ? "..." : stats.rolesCount}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Preview & Instant Search Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3>Active Workforce ({filteredEmployees.length})</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Quick access directory and contact shortcuts
            </span>
          </div>
          <div style={{ position: "relative", width: "240px", maxWidth: "100%" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px 7px 30px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Desktop View Table */}
        <div className={styles.tableWrap}>
          <table className={styles.employeeTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Employee / Staff</th>
                <th>Designation / Role</th>
                <th>Contact</th>
                <th>Base Warehouse</th>
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
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.slice(0, 15).map((emp, index) => {
                  const roleName = emp.primaryRole || emp.roles?.[0]?.name || "Staff";
                  const whName = emp.warehouse?.name || "All Locations";
                  const cleanMobile = emp.mobile?.replace(/\D/g, "");

                  return (
                    <tr key={emp.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className={styles.avatarWrap}>
                          <div className={styles.avatarCircle}>{getInitials(emp.name)}</div>
                          <div className={styles.identityText}>
                            <strong>{emp.name}</strong>
                            <span>{emp.employeeId || `EMP-${emp.id}`}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.rolePill}>{roleName}</span>
                      </td>
                      <td>
                        <div className={styles.contactLinks}>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>
                            {emp.mobile || "-"}
                          </span>
                          {cleanMobile && (
                            <>
                              <a
                                href={`tel:${cleanMobile}`}
                                className={styles.callBtn}
                                title="Call Staff"
                              >
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
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsModalOpen(true);
                          }}
                        >
                          <FaEdit style={{ marginRight: "4px" }} /> Modify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (<= 768px) */}
        <div className={styles.mobileCardsContainer}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px" }}>
              <Loading />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              No staff records found.
            </div>
          ) : (
            filteredEmployees.slice(0, 15).map((emp) => {
              const roleName = emp.primaryRole || emp.roles?.[0]?.name || "Staff";
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
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Role</span>
                      <span className={styles.rolePill} style={{ marginTop: "2px" }}>{roleName}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Base Warehouse</span>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {emp.warehouse?.name || "All Locations"}
                      </span>
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
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setIsModalOpen(true);
                      }}
                    >
                      <FaEdit style={{ marginRight: "4px" }} /> Modify
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inline Modify Staff Modal */}
      {selectedEmployee && (
        <ModifyEmployeeModal
          employee={selectedEmployee}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEmployee(null);
          }}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}

export default EmployeeHome;
