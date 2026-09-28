import React, { lazy, Suspense } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import CustomerReportRoute from "./CustomerReportRoute";

// Direct import for TargetReports to avoid lazy loading issue
import TargetReports from "./TargetReports";

// Lazy-loaded components
const AnjaliLiveReports = lazy(() => import("./AnjaliLiveReports"));
const CustomerReports = lazy(() => import("./CustomerReports/CustomerReports"));
const EmployeeReports = lazy(() => import("./EmployeeReports"));
const ReportsHome = lazy(() => import("./ReportsHome"));
const SalesReports = lazy(() => import("./SalesReports"));
const StockReports = lazy(() => import("./StockReports"));
const ErpReports = lazy(() => import("./ErpReports"));

const LedgerReports = lazy(() => import("./LedgerReports"));
const StoreReports = lazy(() => import("./StoreReports"));

function ReportsRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AnjaliLiveReports />
          </Suspense>
        }
      />
      <Route
        path="/live"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AnjaliLiveReports />
          </Suspense>
        }
      />
      <Route
        path="/legacy-home"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ReportsHome navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/customer-reports/*"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CustomerReportRoute navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/employee-reports/*"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <EmployeeReports navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/sales-reports"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <SalesReports navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/stock-reports/*"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StockReports navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/target-reports"
        element={<TargetReports navigate={navigate} />}
      />
      <Route
        path="/ledger-reports"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LedgerReports navigate={navigate} />
          </Suspense>

        }
      />
      <Route
        path="/store-reports"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreReports navigate={navigate} />
          </Suspense>
        }
      />
      <Route
        path="/erp-reports"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ErpReports navigate={navigate} />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default ReportsRoutes;
