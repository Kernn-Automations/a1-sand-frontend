import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ token }) {
  const location = useLocation();

  const knownProtectedPrefixes = [
    "/",
    "/inventory",
    "/purchases",
    "/sales",
    "/invoices",
    "/customers",
    "/farmers",
    "/payments",
    "/stock-transfer",
    "/employees",
    "/discounts",
    "/warehouses",
    "/products",
    "/samples",
    "/targets",
    "/reports",
    "/returns",
    "/teams",
    "/settings",
    "/divisions",
    "/stores-products",
    "/stores-abstract",
  ];

  const isKnownProtectedRoute = knownProtectedPrefixes.some((prefix) => {
    if (prefix === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
    );
  });

  // If no token, redirect to login
  if (!token) {
    if (!isKnownProtectedRoute) {
      return <Navigate to="/404" replace />;
    }

    return <Navigate to="/login" />;
  }

  // If token exists, render child routes
  return <Outlet />;
}
