import React, { lazy, Suspense } from "react";
import styles from "./Employees.module.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import PageSkeleton from "../../SkeletonLoaders/PageSkeleton";

// Lazy-loaded components
const CreateEmployee = lazy(() => import("./CreateEmployee"));
const EmployeeHome = lazy(() => import("./EmployeeHome"));
const ManageEmployees = lazy(() => import("./ManageEmployees"));
const TeamTransfer = lazy(() => import("./TeamTransfer"));

import {
  isAdmin as checkAdmin,
  isDivisionHead,
  isZBM,
  isRBM,
  isAreaBusinessManager,
} from "../../../utils/roleUtils";

function EmployeeRoutes() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  // Allow Admin OR Division Head OR ZBM OR RBM OR ABM
  const isAdmin = checkAdmin(user) || isDivisionHead(user) || isZBM(user) || isRBM(user) || isAreaBusinessManager(user);
  const canCreateEmployees = isAdmin;
  const canManageEmployees = isAdmin;
  const canTransferTeams = isAdmin;

  return (
    <Routes>
      <Route
        index
        element={
          <Suspense fallback={<PageSkeleton />}>
            <EmployeeHome navigate={navigate} isAdmin={isAdmin}/>
          </Suspense>
        }
      />
      {canCreateEmployees && (
        <Route
          path="/create-employee"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <CreateEmployee navigate={navigate} isAdmin={isAdmin} />
            </Suspense>
          }
        />
      )}
      {canManageEmployees && (
        <Route
          path="/manage-employees"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ManageEmployees navigate={navigate} isAdmin={isAdmin} />
            </Suspense>
          }
        />
      )}
      {canTransferTeams && (
        <Route
          path="/team-transfer"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <TeamTransfer navigate={navigate} isAdmin={isAdmin} />
            </Suspense>
          }
        />
      )}
    </Routes>
  );
}

export default EmployeeRoutes;
