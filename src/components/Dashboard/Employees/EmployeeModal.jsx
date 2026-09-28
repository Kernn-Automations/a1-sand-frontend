import React from "react";
import styles from "./Employees.module.css";
import { User, Mail, Phone, Calendar, Shield, Briefcase, Users } from "lucide-react";

function EmployeeModal({ employee }) {
  if (!employee) return null;

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Extract initials for avatar
  const getInitials = (name) => {
    if (!name) return "EE";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isActive = employee.status?.toLowerCase() === "active";

  return (
    <div className={styles.viewModalWrapper}>
      {/* Header section with avatar, name, ID, status */}
      <div className={styles.viewModalHeader}>
        <div className={styles.viewModalAvatar}>
          {getInitials(employee.name)}
        </div>
        <div className={styles.viewModalMeta}>
          <div className={styles.viewModalNameRow}>
            <h2>{employee.name || "N/A"}</h2>
            <span
              className={`${styles.employeeBadge} ${
                isActive ? styles.employeeBadgeSuccess : styles.employeeBadgeMuted
              }`}
            >
              {employee.status || "Inactive"}
            </span>
          </div>
          <span className={styles.viewModalSub}>ID: {employee.employeeId || "N/A"}</span>
        </div>
      </div>

      {/* Grid containing categories */}
      <div className={styles.viewModalBody}>
        <div className={styles.viewModalGrid}>
          {/* Section 1: Contact Details */}
          <div className={styles.viewModalSection}>
            <h4 className={styles.viewModalSectionTitle}>
              <User size={16} /> Contact Information
            </h4>
            <div className={styles.viewModalFields}>
              <div className={styles.viewModalField}>
                <span className={styles.viewModalLabel}>Mobile Number</span>
                <span className={styles.viewModalValue}>
                  <Phone size={14} className={styles.fieldIcon} />
                  {employee.mobile || "N/A"}
                </span>
              </div>
              
              <div className={styles.viewModalField}>
                <span className={styles.viewModalLabel}>Email Address</span>
                <span className={styles.viewModalValue}>
                  <Mail size={14} className={styles.fieldIcon} />
                  {employee.email || "N/A"}
                </span>
              </div>

              <div className={styles.viewModalField}>
                <span className={styles.viewModalLabel}>Member Since</span>
                <span className={styles.viewModalValue}>
                  <Calendar size={14} className={styles.fieldIcon} />
                  {formatDate(employee.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Employment details */}
          <div className={styles.viewModalSection}>
            <h4 className={styles.viewModalSectionTitle}>
              <Briefcase size={16} /> Employment & Org
            </h4>
            <div className={styles.viewModalFields}>
              <div className={styles.viewModalField}>
                <span className={styles.viewModalLabel}>Supervisor / Manager</span>
                <span className={styles.viewModalValue}>
                  <Users size={14} className={styles.fieldIcon} />
                  {employee.supervisor?.name || "No Supervisor"}
                </span>
              </div>

              <div className={styles.viewModalField}>
                <span className={styles.viewModalLabel}>Assigned Roles</span>
                <div className={styles.viewModalRolePills}>
                  {employee.roles && employee.roles.length > 0 ? (
                    employee.roles.map((role) => (
                      <span key={role.id} className={styles.viewModalRolePill}>
                        <Shield size={12} className={styles.fieldIcon} />
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className={styles.viewModalNoRoles}>No Roles Assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;
