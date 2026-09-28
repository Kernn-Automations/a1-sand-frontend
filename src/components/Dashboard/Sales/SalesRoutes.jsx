import React, { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import styles from "./Sales.module.css";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";
import { useAuth } from "@/Auth";
import TrackingPage from "./TrackingPage";
import OrderTransferPage from "./OrderTransferPage";

// Lazy-loaded components
const SalesHome = lazy(() => import("./SalesHome"));
const Orders = lazy(() => import("./Orders"));
const MobileOrders = lazy(() => import("./MobileOrders"));
const MobileNewSalesOrder = lazy(() => import("./MobileNewSalesOrder"));
const SalesOrderDetail = lazy(() => import("./SalesOrderDetail"));
const Dispaches = lazy(() => import("./Dispaches"));
const Deliveries = lazy(() => import("./Deliveries"));
const NewSalesOrder = lazy(() => import("./NewSalesOrder"));
const Quotations = lazy(() => import("./Quotations"));
const NewQuotation = lazy(() => import("./NewQuotation"));
const QuotationDetail = lazy(() => import("./QuotationDetail"));
const PartialDispatchRequests = lazy(() => import("./PartialDispatchRequests"));
const CreatePartialDispatchRequest = lazy(
  () => import("./CreatePartialDispatchRequest"),
);
const PartialDispatchRequestDetail = lazy(
  () => import("./PartialDispatchRequestDetail"),
);
const CancelledOrders = lazy(() => import("./CancelledOrders"));
const StoreIndentRequests = lazy(() => import("./StoreIndentRequests"));
const CashBook = lazy(() => import("./CashBook"));
const BankBook = lazy(() => import("./BankBook"));

function SalesRoutes() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState();
  const [warehouses, setWarehouses] = useState();
  const [stores, setStores] = useState();
  const [orderId, setOrderId] = useState(null);
  const [managers, setManagers] = useState();

  const { axiosAPI } = useAuth();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const roles = user?.roles;
  const isAdmin = Array.isArray(roles)
    ? roles.includes("Admin")
    : typeof roles === "string"
      ? roles.includes("Admin")
      : false;
  // Add this near the top of SalesRoutes(), alongside the existing isAdmin logic:
  const isSuperAdmin = Array.isArray(roles)
    ? roles.includes("Super Admin")
    : typeof roles === "string"
      ? roles.includes("Super Admin")
      : false;

  const canApprove = Array.isArray(roles)
    ? roles.some((r) => r.name === "Admin" || r.name === "Super Admin")
    : false;
  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const today = new Date(Date.now()).toISOString().slice(0, 10);

  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(today);

  useEffect(() => {
    async function fetch() {
      try {
        const res1 = await axiosAPI.get("/warehouses");
        const res2 = await axiosAPI.get("/customers");

        setWarehouses(res1.data.warehouses);
        setCustomers(res2.data.customers);
        setStores([]);
      } catch (e) {
        // console.log(e);
      }
    }
    fetch();
  }, []);

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileOrders />
          </Suspense>
        }
      />
      <Route
        path="/orders"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileOrders />
          </Suspense>
        }
      />
      <Route
        path="/new"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileNewSalesOrder />
          </Suspense>
        }
      />
      <Route
        path="/new-order"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileNewSalesOrder />
          </Suspense>
        }
      />
      <Route
        path="/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileNewSalesOrder />
          </Suspense>
        }
      />
      <Route
        path="/orders/new"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileNewSalesOrder />
          </Suspense>
        }
      />
      <Route
        path="/orders/new-order"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileNewSalesOrder />
          </Suspense>
        }
      />
      <Route
        path="/orders/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <MobileNewSalesOrder />
          </Suspense>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <SalesOrderDetail />
          </Suspense>
        }
      />
      <Route
        path="/order/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <SalesOrderDetail />
          </Suspense>
        }
      />
      <Route
        path="/quotations"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Quotations />
          </Suspense>
        }
      />
      <Route
        path="/quotes"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Quotations />
          </Suspense>
        }
      />
      <Route
        path="/quotations/new"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <NewQuotation />
          </Suspense>
        }
      />
      <Route
        path="/quotes/new"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <NewQuotation />
          </Suspense>
        }
      />
      <Route
        path="/quotations/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <QuotationDetail />
          </Suspense>
        }
      />
      <Route
        path="/quotes/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <QuotationDetail />
          </Suspense>
        }
      />
      <Route
        path="/legacy-orders"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Orders
              navigate={navigate}
              warehouses={warehouses}
              stores={stores}
              customers={customers}
              setOrderId={setOrderId}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
            />
          </Suspense>
        }
      />
      <Route
        path="/tracking"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <TrackingPage
              navigate={navigate}
              setOrderId={setOrderId}
              orderId={orderId}
            />
          </Suspense>
        }
      />
      <Route
        path="/order-transfer"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <OrderTransferPage navigate={navigate} managers={managers} />
          </Suspense>
        }
      />
      <Route
        path="/cancelled-order"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CancelledOrders
              navigate={navigate}
              warehouses={warehouses}
              customers={customers}
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
            />
          </Suspense>
        }
      />
      <Route
        path="/partial-dispatch-requests"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <PartialDispatchRequests />
          </Suspense>
        }
      />
      <Route
        path="/cash-book"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CashBook stores={stores} />
          </Suspense>
        }
      />
      <Route
        path="/bank-book"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <BankBook stores={stores} />
          </Suspense>
        }
      />
      <Route
        path="/store-indent-requests"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <StoreIndentRequests canApprove={canApprove} />
          </Suspense>
        }
      />
      <Route
        path="/partial-dispatch-requests/create"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <CreatePartialDispatchRequest />
          </Suspense>
        }
      />
      <Route
        path="/partial-dispatch-requests/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <PartialDispatchRequestDetail />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default SalesRoutes;
