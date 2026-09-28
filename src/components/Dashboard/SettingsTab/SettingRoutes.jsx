import React, { lazy, Suspense } from "react";
import styles from "./Settings.module.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import OngoingDropoff from "./OngoingDropoff";
import OngoingMinOrder from "./OngoingMinOrder";
import OngoingWarehouseRules from "./OngoingWarehouseRules";

// Lazy-loaded components
const AnjaliSettings = lazy(() => import("./AnjaliSettings"));
const SettingsHome = lazy(() => import("./SettingsHome"));
const DropoffRules = lazy(() => import("./DropoffRules"));
const MinimumOrderRules = lazy(() => import("./MinimumOrderRules"));
const WarehouseRules = lazy(() => import("./WarehouseRules"));
const IndentRevertingSettings = lazy(() => import("./IndentRevertingSettings"));
const LogsViewer = lazy(() => import("./LogsViewer"));
const LicenseSettingsPage = lazy(() => import("./LicenseSettingsPage"));

function SettingRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/license"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LicenseSettingsPage />
          </Suspense>
        }
      />
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AnjaliSettings />
          </Suspense>
        }
      />
      <Route
        path="/company"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AnjaliSettings />
          </Suspense>
        }
      />
      <Route
        path="/legacy-settings"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <SettingsHome navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/drop-off-rules/*"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <OngoingDropoff navigate={navigate}/>
          </Suspense>
        }
      />
      <Route
        path="/minimum-order-rules/*"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <OngoingMinOrder navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/warehouse-rules/*"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <OngoingWarehouseRules navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/indent-reverting"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <IndentRevertingSettings navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/logs"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LogsViewer />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default SettingRoutes;
