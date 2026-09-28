// src/components/Dashboard/Dashboard.jsx

import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import NavContainer from "./navs/NavContainer";
import DashHeader from "./DashHeader";
import FootLink from "./FootLink";
import MobileBottomNav from "./navs/MobileBottomNav";

// Local skeletons
import RouteSkeleton from "../SkeletonLoaders/RouteSkeleton";
import HomePageSkeleton from "../SkeletonLoaders/HomePageSkeleton";
import SettingRoutes from "./SettingsTab/SettingRoutes";
import ReportsRoutes from "./Reports/ReportsRoutes";
import LicenseBanner from "./Licensing/LicenseBanner";
import LicenseLockoutOverlay from "./Licensing/LicenseLockoutOverlay";
import PasskeyPromptModal from "./PasskeyPromptModal";
import { isPasskeySupported } from "../../services/passkeyService";

// Lazy-loaded Routes
const HomePage = lazy(() => import("./HomePage/HomePage"));
const InventoryRoutes = lazy(() => import("./Inventory/InventoryRoutes"));
const SalesRoutes = lazy(() => import("./Sales/SalesRoutes"));
const CustomerRoutes = lazy(() => import("./Customers/CustomerRoutes"));
const PaymentRoutes = lazy(() => import("./Payments/PaymentRoutes"));
const EmployeeRoutes = lazy(() => import("./Employees/EmployeeRoutes"));
const WarehouseRoutes = lazy(() => import("./Warehouses/WarehouseRoutes"));
const ProductRoutes = lazy(() => import("./Products/ProductRoutes"));
const InvoiceRoutes = lazy(() => import("./Invoice/InvoiceRoutes"));
const StockRoutes = lazy(() => import("./StockTransfer/StockRoutes"));
const ReturnRoutes = lazy(() => import("./Returns/ReturnRoutes"));

export default function Dashboard({
  admin,
  setAdmin,
  role,
  dept,
  setRoleclick,
  setBtnclick,
  orgadmin,
}) {
  const [storedUser, setStoredUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      return null;
    }
  });

  // Listen for user data changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          setStoredUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error updating stored user:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [hover, setHover] = useState(false);
  const [tab, setTab] = useState("home");
  const [isMobile, setIsMobile] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);

  // Detect if new device is not registered for passkey and prompt user
  useEffect(() => {
    if (!storedUser) return;
    const userObj = storedUser?.user || storedUser;
    const userId = userObj?.id || userObj?.employeeId;
    if (!userId) return;

    if (!isPasskeySupported()) return;

    const isRegistered = localStorage.getItem(`passkey_registered_${userId}`);
    const isDismissed = sessionStorage.getItem(`passkey_prompt_dismissed_${userId}`);

    if (!isRegistered && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPasskeyPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [storedUser]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (admin === true) {
    return <Navigate to="/admin" />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        position: "relative",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            width: hover ? 240 : 72,
            transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 90,
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e2e8f0",
            boxShadow: hover ? "4px 0 20px rgba(0,0,0,0.08)" : "none",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <NavContainer
            hover={hover}
            setTab={setTab}
            tab={tab}
            admin={admin}
            orgadmin={orgadmin}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: !isMobile ? 72 : 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: 0,
          width: !isMobile ? "calc(100% - 72px)" : "100%",
        }}
      >
        <DashHeader
          user={storedUser}
          setTab={setTab}
          admin={admin}
          setAdmin={setAdmin}
          orgadmin={orgadmin}
        />

        <LicenseBanner />

        <main
          style={{
            flex: 1,
            padding: isMobile ? "14px 14px 84px 14px" : "28px 36px",
            maxWidth: 1440,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <Routes>
            <Route
              index
              element={
                <Suspense fallback={<HomePageSkeleton />}>
                  <HomePage />
                </Suspense>
              }
            />
            <Route
              path="/sales/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <SalesRoutes />
                </Suspense>
              }
            />
            <Route
              path="/invoices/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <InvoiceRoutes />
                </Suspense>
              }
            />
            <Route
              path="/reports/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <ReportsRoutes />
                </Suspense>
              }
            />
            <Route
              path="/inventory/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <InventoryRoutes />
                </Suspense>
              }
            />
            <Route
              path="/customers/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <CustomerRoutes />
                </Suspense>
              }
            />
            <Route
              path="/products/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <ProductRoutes />
                </Suspense>
              }
            />
            <Route
              path="/warehouses/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <WarehouseRoutes />
                </Suspense>
              }
            />
            <Route
              path="/stock-transfer/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <StockRoutes />
                </Suspense>
              }
            />
            <Route
              path="/payments/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <PaymentRoutes />
                </Suspense>
              }
            />
            <Route
              path="/employees/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <EmployeeRoutes />
                </Suspense>
              }
            />
            <Route
              path="/returns/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <ReturnRoutes />
                </Suspense>
              }
            />
            <Route
              path="/settings/*"
              element={
                <Suspense fallback={<RouteSkeleton />}>
                  <SettingRoutes />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <FootLink />
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      {isMobile && <MobileBottomNav />}

      {/* Global Hard Lockout Shield */}
      <LicenseLockoutOverlay />

      {/* Auto-Prompt to Register New Device as Passkey */}
      {showPasskeyPrompt && (
        <PasskeyPromptModal
          user={storedUser?.user || storedUser}
          onClose={() => setShowPasskeyPrompt(false)}
        />
      )}
    </div>
  );
}
