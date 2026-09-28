// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./Auth"; // <-- just the hook
import "./App.css";
import { lazy, Suspense } from "react";
import DashboardSkeleton from "./components/SkeletonLoaders/DashboardSkeleton";
import LoginSkeleton from "./components/SkeletonLoaders/LoginSkeleton";
import ReportsPage from "./components/UnauthReports/ReportsPage";
import { isAdmin, isStoreManager, isStoreEmployee } from "./utils/roleUtils";
// lazy imports
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const Login = lazy(() => import("./components/Login"));
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));
const Divs = lazy(() => import("./pages/Divs"));
const StoreSelector = lazy(() => import("./pages/StoreSelector"));
const StoreDashboard = lazy(() => import("./components/Store/StoreDashboard"));
const SessionConflictPage = lazy(() => import("./pages/SessionConflictPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const DocumentAuthenticityPage = lazy(() =>
  import("./components/Public/DocumentAuthenticityPage"),
);

const getNormalizedUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user || parsed;
  } catch (error) {
    console.error("App.jsx - Failed to parse stored user:", error);
    return null;
  }
};

function DashboardEntry() {
  return <Dashboard />;
}

export default function App() {
  const { islogin, setIslogin } = useAuth();
  const token = localStorage.getItem("accessToken");

  // restore your old islogin logic
  useEffect(() => {
    // Only set login state if we're not already on a protected route
    if (window.location.pathname === "/login") {
      setIslogin(!!token);
    } else if (token) {
      setIslogin(true);
    }
  }, [token, setIslogin]);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoginSkeleton />}>
              <Login />
            </Suspense>
          }
        />

        <Route
          path="/daily-reports"
          element={
            <Suspense fallback={<LoginSkeleton />}>
              <ReportsPage />
            </Suspense>
          }
        />

        <Route
          path="/verify/:docType/:docNumber"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <DocumentAuthenticityPage />
            </Suspense>
          }
        />

        <Route
          path="/session-conflict"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <SessionConflictPage />
            </Suspense>
          }
        />

        <Route
          path="/404"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <NotFoundPage />
            </Suspense>
          }
        />


        {/* Protected Routes */}
        <Route element={<ProtectedRoute token={token} />}>
          {/* Dashboard with nested routes */}
          <Route
            path="/*"
            element={
              <Suspense fallback={<DashboardSkeleton />}>
                <DashboardEntry />
              </Suspense>
            }
          />

          {/* Direct routes to different sections */}
          {/* <Route path="/home" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <HomePage />
            </Suspense>
          } /> */}

          {/* <Route path="/divisions" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <DivisionManager />
            </Suspense>
          } /> */}
        </Route>

        <Route
          path="*"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
