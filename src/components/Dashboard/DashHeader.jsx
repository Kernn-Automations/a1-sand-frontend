import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import ProfileAvthar from "./ProfileAvthar";
import {
  FaSearch,
  FaTimes,
  FaBars,
  FaHome,
  FaBoxes,
  FaUsers,
  FaPercent,
  FaFileInvoiceDollar,
  FaWarehouse,
  FaChartBar,
  FaCog,
  FaPlusCircle,
  FaTruck,
  FaUserTie,
  FaMoneyBillWave,
} from "react-icons/fa";
import Logo from "./navs/Logo";
import SearchBar from "./SearchBar";
import { dashboardOptions } from "../../utils/searchOptions";

function DashHeader({
  notifications,
  user,
  setAdmin,
  setTab,
  admin,
  orgadmin,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close drawer when path changes
  useEffect(() => {
    setShowMobileDrawer(false);
    setShowMobileSearch(false);
  }, [location.pathname]);

  const handleMobileNav = (path) => {
    navigate(path);
    setShowMobileDrawer(false);
  };

  const navLinks = [
    { label: "Dashboard Home", path: "/", icon: <FaHome /> },
    { label: "Customers & Contractors", path: "/customers", icon: <FaUsers /> },
    { label: "Staff & Employees", path: "/employees", icon: <FaUserTie /> },
    { label: "Products Master", path: "/products", icon: <FaBoxes /> },
    { label: "Inventory & Transit Stock", path: "/inventory", icon: <FaBoxes /> },
    { label: "Reports & Financials", path: "/reports", icon: <FaChartBar /> },
    { label: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  return (
    <header
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: isMobile ? "10px 14px" : "12px 28px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          maxWidth: "100%",
        }}
      >
        {/* Left: Brand Identity & Mobile Drawer Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          {isMobile && (
            <button
              onClick={() => setShowMobileDrawer(true)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label="Open Navigation Drawer"
            >
              <FaBars size={18} />
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 8 : 12,
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <Logo size={isMobile ? 32 : 40} />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? "15px" : "18px",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Anjali Constructions
              </h1>
              <span
                style={{
                  fontSize: isMobile ? "10px" : "11px",
                  fontWeight: 600,
                  color: "#ea580c",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Materials & Aggregates
              </span>
            </div>
          </div>
        </div>

        {/* Center & Right: Search, Actions, Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: isMobile ? "none" : 1,
            justifyContent: "flex-end",
          }}
        >
          {/* Desktop Search Bar */}
          {!isMobile && (
            <div style={{ maxWidth: 360, width: "100%" }}>
              <SearchBar options={dashboardOptions} />
            </div>
          )}

          {/* Mobile Search Toggle */}
          {isMobile && showMobileSearch && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#ffffff",
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                zIndex: 110,
              }}
            >
              <div style={{ flex: 1 }}>
                <SearchBar options={dashboardOptions} isExpanded={true} />
              </div>
              <button
                onClick={() => setShowMobileSearch(false)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 8,
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <FaTimes size={18} />
              </button>
            </div>
          )}

          {isMobile && !showMobileSearch && (
            <button
              onClick={() => setShowMobileSearch(true)}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
                cursor: "pointer",
              }}
              aria-label="Search"
            >
              <FaSearch size={14} />
            </button>
          )}

          {/* Quick New Order Button on Desktop */}
          {!isMobile && (
            <button
              onClick={() => navigate("/sales/new")}
              style={{
                backgroundColor: "#ea580c",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <span>+</span> New Order
            </button>
          )}

          {/* Profile Avatar */}
          <div style={{ flexShrink: 0 }}>
            <ProfileAvthar user={user} setTab={setTab} />
          </div>
        </div>
      </div>

      {/* Mobile Slide-Out Navigation Drawer */}
      {isMobile && showMobileDrawer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(3px)",
            zIndex: 999,
            display: "flex",
          }}
          onClick={() => setShowMobileDrawer(false)}
        >
          <div
            style={{
              width: "290px",
              maxWidth: "85%",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 25px rgba(0, 0, 0, 0.3)",
              animation: "slideInLeft 0.22s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Logo size={32} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                    Anjali Constructions
                  </h3>
                  <span style={{ fontSize: "10px", color: "#ea580c", fontWeight: 600 }}>
                    Materials & Aggregates
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "18px",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
              {navLinks.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => handleMobileNav(item.path)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isActive
                        ? "#1e293b"
                        : item.highlight
                        ? "rgba(234, 88, 12, 0.15)"
                        : "transparent",
                      color: isActive
                        ? "#ffffff"
                        : item.highlight
                        ? "#fb923c"
                        : "#cbd5e1",
                      fontWeight: isActive || item.highlight ? 700 : 500,
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: "4px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "16px", display: "flex", alignItems: "center" }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div
              style={{
                padding: "14px 16px",
                borderTop: "1px solid #1e293b",
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Kernn Automations v2.4</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>● Online</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default DashHeader;
