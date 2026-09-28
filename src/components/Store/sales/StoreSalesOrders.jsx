import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import styles from "./StoreSalesOrders.module.css";
import homeStyles from "../../Dashboard/HomePage/HomePage.module.css";
import salesStyles from "../../Dashboard/Sales/Sales.module.css";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import { FaBan } from "react-icons/fa"; // Importing Cancel icon
import storeService from "../../../services/storeService";
import { isAdmin } from "../../../utils/roleUtils";
import { toaster } from "@/components/ui/toaster";
import {
  handleExportExcel,
  handleExportPDF,
} from "../../../utils/PDFndXLSGenerator";

const DEFAULT_FILTERS = {
  from: "",
  to: "",
  customer: "",
  product: "",
  employee: "",
  status: "all",
};

function StoreSalesOrders({ onBack }) {
  const { axiosAPI } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [entityCount, setEntityCount] = useState(10);
  const [orders, setOrders] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);
  const customerSearchTimeoutRef = useRef(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const [historyOrder, setHistoryOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  // Header Search States
  const [showSearch, setShowSearch] = useState({
    invoiceNumber: false,
    customerName: false,
  });

  const [searchTerms, setSearchTerms] = useState({
    invoiceNumber: initialSearch,
    customerName: "",
  });

  const toggleSearch = (key) => {
    setShowSearch((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleSearchChange = (key, value) => {
    setSearchTerms((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearch = (key) => {
    setSearchTerms((prev) => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showSearch[searchKey];
    const searchTerm = searchTerms[searchKey];

    return (
      <th
        onClick={() => toggleSearch(searchKey)}
        style={{ cursor: "pointer", position: "relative" }}
        data-search-header="true"
        {...{ [dataAttr]: true }}
      >
        {isSearching ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1,
                padding: "2px 6px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px",
                minWidth: "120px",
                height: "28px",
                color: "#000",
                backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch(searchKey);
                }}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #dc3545",
                  borderRadius: "4px",
                  background: "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  minWidth: "24px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <>{label}</>
        )}
      </th>
    );
  };

  useEffect(() => {
    // Get store ID from multiple sources
    try {
      let id = null;

      // Try from selectedStore in localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          id = store.id;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }

      // Fallback to currentStoreId
      if (!id) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        id = currentStoreId ? parseInt(currentStoreId) : null;
      }

      // Fallback to user object
      if (!id) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        id = user?.storeId || user?.store?.id;
      }

      if (id) {
        setStoreId(id);
      } else {
        setError("Store information missing. Please re-login to continue.");
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Unable to parse stored user data", err);
      setError("Unable to determine store information. Please re-login.");
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      fetchSales();
    }
  }, [storeId, appliedFilters, page, entityCount]);

  useEffect(() => {
    if (storeId) {
      fetchStoreProducts();
    }
  }, [storeId]);

  useEffect(() => {
    if (!location.state?.successMessage) return;

    const message = location.state.successMessage;
    setSuccessMessage(message);
    toaster.create({
      type: "success",
      title: "Success",
      description: message,
      closable: true,
    });
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {},
    });
  }, [location.pathname, location.search, location.state, navigate]);

  const fetchStoreProducts = async () => {
    if (!storeId) return;

    try {
      const response = await storeService.getStoreProducts(storeId, {
        compact: true,
      });
      const productsData =
        response?.data?.products ||
        response?.data ||
        response?.products ||
        response ||
        [];

      const mappedProducts = Array.isArray(productsData)
        ? productsData
            .map((product) => product?.name || product?.productName)
            .filter(Boolean)
        : [];

      setStoreProducts(mappedProducts);
    } catch (err) {
      console.error("Error fetching store products for filter:", err);
      setStoreProducts([]);
    }
  };

  // Debounced customer search
  const searchCustomers = useCallback(
    async (searchTerm) => {
      if (!storeId || !searchTerm || searchTerm.trim().length < 2) {
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
        return;
      }

      setCustomerSearchLoading(true);
      try {
        const response = await storeService.searchStoreCustomers(
          storeId,
          searchTerm.trim(),
        );
        const customers = response.data || response.customers || response || [];
        setCustomerSearchResults(Array.isArray(customers) ? customers : []);
        setShowCustomerDropdown(true);
      } catch (err) {
        console.error("Error searching customers:", err);
        setCustomerSearchResults([]);
        setShowCustomerDropdown(false);
      } finally {
        setCustomerSearchLoading(false);
      }
    },
    [storeId],
  );

  // Handle customer search input with debounce
  const handleCustomerSearchChange = (value) => {
    setCustomerSearchTerm(value);

    // Clear existing timeout
    if (customerSearchTimeoutRef.current) {
      clearTimeout(customerSearchTimeoutRef.current);
    }

    // If value is cleared, reset customer filter
    if (!value || value.trim().length === 0) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      handleFilterChange("customer", "");
      return;
    }

    // Debounce search
    customerSearchTimeoutRef.current = setTimeout(() => {
      searchCustomers(value);
    }, 300);
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setCustomerSearchTerm(customer.name || customer.customerCode || "");
    handleFilterChange(
      "customer",
      customer.name || customer.customerCode || "",
    );
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
      // Close header search if clicked outside
      if (!event.target.closest("[data-search-header]")) {
        setShowSearch({
          saleCode: false,
          customerName: false,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, []);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          invoiceNumber: false,
          customerName: false,
        });
        setSearchTerms({
          invoiceNumber: "",
          customerName: "",
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const fetchSales = async () => {
    if (!storeId) return;

    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: entityCount,
        compact: "true",
      };

      // Add filters (only send backend-supported filters)
      if (appliedFilters.from) params.fromDate = appliedFilters.from;
      if (appliedFilters.to) params.toDate = appliedFilters.to;
      if (appliedFilters.status !== "all")
        params.status = appliedFilters.status;
      // Note: customer and employee filters are handled client-side since we're using names

      // Check if user is admin to use admin endpoint
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      const isAdminUser = isAdmin(user);

      const response = isAdminUser
        ? await storeService.getStoreSalesAdmin(storeId, params)
        : await storeService.getStoreSales(storeId, params);
      // Handle backend response format
      const salesData = response.data || response.sales || response || [];
      const paginationData = response.pagination || {};

      // Map API response to match component structure
      const mappedOrders = Array.isArray(salesData)
        ? salesData.map((sale, index) => {
            // Get customer name with proper fallback
            // Check if customer exists and has the fields
            let customerName = "Customer";
            if (sale.customer) {
              // Check farmerName first (trim to handle whitespace)
              const farmerName = sale.customer.farmerName?.trim();
              if (farmerName && farmerName !== "" && farmerName !== "null") {
                customerName = farmerName;
              } else {
                // Check displayName
                const displayName = sale.customer.displayName?.trim();
                if (
                  displayName &&
                  displayName !== "" &&
                  displayName !== "null"
                ) {
                  customerName = displayName;
                } else {
                  // Check name
                  const name = sale.customer.name?.trim();
                  if (name && name !== "" && name !== "null") {
                    customerName = name;
                  }
                }
              }
            }

            return {
              id: sale.saleCode || sale.id,
              saleCode: sale.saleCode || `SALE-${sale.id}`,
              date:
                sale.invoice?.invoiceDate ||
                sale.createdAt ||
                sale.saleDate ||
                new Date().toISOString(),
              storeName: sale.store?.name || "Store",
              storeEmployee:
                sale.employee?.name ||
                sale.reportedByEmployee?.name ||
                "Employee",
              customerName: customerName,
              customerId: sale.customerId || sale.customer?.id,
              quantity:
                sale.items?.reduce(
                  (sum, item) => sum + (item.quantity || 0),
                  0,
                ) || 0,
              status: sale.saleStatus || sale.paymentStatus || "pending",
              paymentStatus: sale.paymentStatus || "pending",
              grandTotal: sale.grandTotal || sale.totalAmount || 0,
              totalAmount: sale.totalAmount || 0,
              taxAmount: sale.taxAmount || 0,
              discountAmount: sale.discountAmount || 0,
              freightCharges: sale.freightCharges || 0,
              paymentMethod:
                sale.paymentMethod ||
                sale.modeOfPayment ||
                sale.payments?.[0]?.paymentMethod ||
                "N/A",
              items: sale.items || [],
              productNames:
                sale.items?.map(
                  (item) => item.product?.name || item.productName || item.name,
                )?.filter(Boolean) || [],
              invoices: sale.invoices || [], // Include invoices array
              invoiceNumber: sale.invoice?.invoiceNumber || "N/A", // Get first invoice number
              invoiceId: sale.invoice?.id || null, // Get first invoice ID
              editableUntil: sale.editableUntil || null,
              isBeyondEditableWindow: Boolean(sale.isBeyondEditableWindow),
              lockDeadline: sale.lockDeadline || null,
              isLockedByMonthlyClose: Boolean(sale.isLockedByMonthlyClose),
              editHistoryCount: sale.editHistoryCount || 0,
              editHistory: sale.editHistory || [],
              adjustments: sale.adjustments || [],
              customerOutstandingCredit: sale.customerOutstandingCredit || 0,
              pendingAdditionalCollection:
                sale.pendingAdditionalCollection || 0,
              customerCreditLimit: sale.customerCreditLimit || 0,
              saleType: sale.saleType || "retail",
              notes: sale.notes || "",
              createdAt: sale.createdAt || sale.saleDate || sale.invoice?.invoiceDate,
              updatedAt: sale.updatedAt || null,
              cancelledAt: sale.cancelledAt || sale.originalData?.cancelledAt || null,
              cancelledBy:
                sale.cancelledByName ||
                sale.cancelledByEmployee?.name ||
                sale.cancelledBy ||
                null,
              cancelNote: sale.cancelNote || sale.cancellationReason || "",
              createdByName:
                sale.createdBy?.name ||
                sale.employee?.name ||
                sale.createdByEmployee?.name ||
                sale.reportedByEmployee?.name ||
                sale.createdByName ||
                "Employee",
              originalData: sale,
            };
          })
        : [];

      setOrders(mappedOrders);
      setTotal(paginationData.total || mappedOrders.length);
      setTotalPages(
        paginationData.totalPages ||
          Math.ceil(
            (paginationData.total || mappedOrders.length) / entityCount,
          ) ||
          1,
      );
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch sales data.",
      );
      setIsModalOpen(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = useMemo(() => {
    const uniques = new Set(
      orders.map((order) => order.customerName).filter(Boolean),
    );
    return Array.from(uniques);
  }, [orders]);

  const employeeOptions = useMemo(() => {
    const uniques = new Set(
      orders.map((order) => order.storeEmployee).filter(Boolean),
    );
    return Array.from(uniques);
  }, [orders]);

  const productOptions = useMemo(() => {
    const uniques = new Set(
      [...storeProducts, ...orders.flatMap((order) => order.productNames || [])]
        .filter(Boolean),
    );
    return Array.from(uniques).sort((a, b) => a.localeCompare(b));
  }, [orders, storeProducts]);

  // Apply client-side filtering for customer and employee (since we're using names)
  // Also apply header search filters
  const displayOrders = useMemo(() => {
    let filtered = orders;

    if (appliedFilters.customer) {
      filtered = filtered.filter(
        (order) =>
          order.customerName === appliedFilters.customer ||
          order.customerName
            ?.toLowerCase()
            .includes(appliedFilters.customer.toLowerCase()),
      );
    }

    if (appliedFilters.employee) {
      filtered = filtered.filter(
        (order) => order.storeEmployee === appliedFilters.employee,
      );
    }

    if (appliedFilters.product) {
      const productFilter = appliedFilters.product.toLowerCase();
      filtered = filtered.filter((order) =>
        (order.productNames || []).some((name) =>
          name?.toLowerCase().includes(productFilter),
        ),
      );
    }

    // Header Search Filters
    if (searchTerms.invoiceNumber) {
      filtered = filtered.filter((order) =>
        order.invoiceNumber
          ?.toLowerCase()
          .includes(searchTerms.invoiceNumber.toLowerCase()),
      );
    }

    if (searchTerms.customerName) {
      filtered = filtered.filter((order) =>
        order.customerName
          ?.toLowerCase()
          .includes(searchTerms.customerName.toLowerCase()),
      );
    }

    return filtered;
  }, [
    orders,
    appliedFilters.customer,
    appliedFilters.product,
    appliedFilters.employee,
    searchTerms.invoiceNumber,
    searchTerms.customerName,
  ]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadInvoice = async (order) => {
    if (!storeId || !order.invoiceId) {
      setError("Invoice not available for this order.");
      setIsModalOpen(true);
      return;
    }

    setDownloadingInvoiceId(order.invoiceId);
    setError(null);

    // Check if user is admin
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const user = userData.user || userData;
    const isAdminUser = isAdmin(user);

    // Use the provided endpoints
    // Admin: GET /stores/admin/:storeId/invoices/:invoiceId/download?divisionId=1
    // Store: GET /stores/:storeId/invoices/:invoiceId/download
    // Note: divisionId is automatically added by the API interceptor, so we don't add it manually
    const endpoint = isAdminUser
      ? `/stores/admin/${storeId}/invoices/${order.invoiceId}/download`
      : `/stores/${storeId}/invoices/${order.invoiceId}/download`;

    console.log("Attempting invoice download:", endpoint);
    console.log("Invoice ID:", order.invoiceId);
    console.log("Store ID:", storeId);
    console.log("Is Admin:", isAdminUser);

    try {
      const response = await axiosAPI.getpdf(endpoint);

      // Check if we got a valid response
      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Check if it's a proper blob
      if (!(response.data instanceof Blob)) {
        console.error("Response is not a blob:", response.data);
        throw new Error("Invalid response format - expected blob");
      }

      // Check if blob has content
      if (response.data.size === 0) {
        throw new Error("Received empty file from server");
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const invoiceNumber =
        order.invoiceNumber || order.saleCode || `invoice-${order.invoiceId}`;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("Invoice download initiated successfully");
    } catch (err) {
      console.error("Error downloading invoice:", err);
      console.error("Attempted endpoint:", endpoint);
      console.error("Invoice ID:", order.invoiceId);
      console.error("Sale ID:", order.id);
      console.error("Store ID:", storeId);
      console.error("Error status:", err.response?.status);
      console.error("Error response:", err.response?.data);

      // Provide more helpful error message
      let errorMessage = "Failed to download invoice. ";
      if (err.response?.status === 403) {
        errorMessage +=
          "You don't have permission to download this invoice. Please contact your administrator.";
      } else if (err.response?.status === 404) {
        errorMessage +=
          "Invoice download endpoint not found. Please contact support or check if the invoice is available.";
      } else {
        // Try to parse blob error message if available
        let backendMessage = "";
        if (err.response?.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            backendMessage = JSON.parse(text)?.message || text;
          } catch (parseErr) {
            backendMessage = "";
          }
        }
        errorMessage +=
          backendMessage ||
          err.response?.data?.message ||
          err.message ||
          "Please try again.";
      }

      setError(errorMessage);
      setIsModalOpen(true);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleCancelClick = (order) => {
    setSaleToCancel(order);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const handleEditClick = (order) => {
    localStorage.setItem(
      "storeSaleEditDraft",
      JSON.stringify(order.originalData || order),
    );
    navigate(
      `/store/sales?mode=create&editSaleId=${order.originalData?.id || order.id}`,
    );
  };

  const confirmCancellation = async () => {
    if (!saleToCancel) return;

    setCancelling(true);
    try {
      await storeService.cancelSale(storeId, saleToCancel.saleCode);

      setOrders((prev) =>
        prev.map((order) =>
          order.saleCode === saleToCancel.saleCode
            ? {
                ...order,
                status: "cancelled",
                paymentStatus: "cancelled",
                originalData: {
                  ...order.originalData,
                  saleStatus: "cancelled",
                  paymentStatus: "cancelled",
                },
              }
            : order,
        ),
      );

      fetchSales();
      setShowCancelModal(false);
      setSaleToCancel(null);
    } catch (err) {
      console.error("Error cancelling sale:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to cancel invoice",
      );
      setShowCancelModal(false); // Close cancel modal
      setIsModalOpen(true); // Show error modal
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = () => {
    setAppliedFilters(filters);
    setPage(1); // Reset to first page when filters are applied
    // Keep customer search term if a customer is selected
    if (!filters.customer) {
      setCustomerSearchTerm("");
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    }
  };

  const handleCancel = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setEntityCount(10);
    setPage(1); // Reset to first page
    setCustomerSearchTerm("");
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && page < totalPages) {
      setPage((prev) => prev + 1);
    } else if (direction === "prev" && page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleExport = (type) => {
    if (!displayOrders || displayOrders.length === 0) return;

    const columns = [
      "S.No",
      "Date",
      "Invoice Number",
      "Farmer Name",
      "Quantity",
      "Total Amount",
      "Payment Method",
      "Status",
    ];

    const data = displayOrders.map((order, index) => ({
      "S.No": index + 1,
      Date: formatDate(order.date),
      "Invoice Number": order.invoiceNumber || order.saleCode || order.id,
      "Farmer Name": order.customerName,
      Quantity: order.quantity,
      "Total Amount": order.totalAmount,
      "Payment Method": order.paymentMethod,
      Status: order.status || order.paymentStatus,
    }));

    if (type === "XLS") {
      handleExportExcel(columns, data, "Sales");
    } else {
      handleExportPDF(columns, data, "Sales");
    }
  };

  const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const closeModal = () => setIsModalOpen(false);

  return (
    <div style={{ padding: "20px" }}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Store Sales</h2>
          <p className="path">
            <span onClick={() => navigate("/store/sales")}>Sales</span>{" "}
            <i className="bi bi-chevron-right"></i> Orders
          </p>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #b7ebc6",
            background: "#edf9f0",
            color: "#146c2e",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            style={{
              border: "none",
              background: "transparent",
              color: "#146c2e",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && <Loading />}

      <div className={`${homeStyles.orderStatusCard} ${styles.cardWrapper}`}>
        <div className={`row g-3 ${styles.filtersRow}`}>
          <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
            <label>From :</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
            />
          </div>
          <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 formcontent">
            <label>To :</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
            />
          </div>
          <div
            className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent"
            ref={customerSearchRef}
            style={{ position: "relative" }}
          >
            <label>Customers :</label>
            <div style={{ position: "relative", display: "inline-block" }}>
              <input
                type="text"
                value={customerSearchTerm}
                onChange={(e) => handleCustomerSearchChange(e.target.value)}
                onFocus={() => {
                  if (customerSearchResults.length > 0) {
                    setShowCustomerDropdown(true);
                  }
                }}
                placeholder="Search by name or mobile..."
                style={{
                  width: "160px",
                  height: "32px",
                  outline: "1.5px solid var(--primary-color)",
                  padding: "2px 10px",
                  borderRadius: "16px",
                  boxShadow: "2px 2px 4px #333",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                  border: "none",
                  backgroundColor: "white",
                }}
              />
              {customerSearchLoading && (
                <div
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Searching...
                </div>
              )}
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                    marginTop: "4px",
                  }}
                >
                  {customerSearchResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        fontFamily: "Poppins",
                        fontSize: "14px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "white")
                      }
                    >
                      <div style={{ fontWeight: 500, color: "#333" }}>
                        {customer.name || customer.customerCode}
                      </div>
                      {customer.mobile && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            marginTop: "2px",
                          }}
                        >
                          {customer.mobile}
                        </div>
                      )}
                      {customer.customerCode && customer.name && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#999",
                            marginTop: "2px",
                          }}
                        >
                          {customer.customerCode}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showCustomerDropdown &&
                customerSearchResults.length === 0 &&
                customerSearchTerm.length >= 2 &&
                !customerSearchLoading && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      padding: "12px",
                      fontFamily: "Poppins",
                      fontSize: "14px",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    No customers found
                  </div>
                )}
            </div>
          </div>
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent">
            <label>Product :</label>
            <select
              value={filters.product}
              onChange={(e) => handleFilterChange("product", e.target.value)}
            >
              <option value="">Select</option>
              {productOptions.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent">
            <label>Store Employee :</label>
            <select
              value={filters.employee}
              onChange={(e) => handleFilterChange("employee", e.target.value)}
            >
              <option value="">Select</option>
              {employeeOptions.map((employee) => (
                <option key={employee} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
          </div>
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 formcontent">
            <label>Status :</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className={styles.buttonsRow}>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="submitbtn" onClick={handleSubmit}>
              Submit
            </button>
            <button className="cancelbtn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>

        <div className={styles.exportSection}>
          <div className={styles.exportButtons}>
            <button
              className={salesStyles.xls}
              onClick={() => handleExport("XLS")}
            >
              <p>Export to </p>
              <img src={xls} alt="Export to Excel" />
            </button>
            <button
              className={salesStyles.xls}
              onClick={() => handleExport("PDF")}
            >
              <p>Export to </p>
              <img src={pdf} alt="Export to PDF" />
            </button>
          </div>
          <div className={`${salesStyles.entity} ${styles.entityOverride}`}>
            <label>Entity :</label>
            <select
              value={entityCount}
              onChange={(e) => {
                setEntityCount(Number(e.target.value));
                setPage(1); // Reset to first page when limit changes
              }}
            >
              {[10, 20, 30, 40, 50].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`${styles.tableContainer} table-responsive`}>
          <table className="table table-hover table-bordered borderedtable">
            <thead>
              <tr>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  S.No
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Date
                </th>
                {renderSearchHeader(
                  "Invoice Number",
                  "invoiceNumber",
                  "data-invoice-header",
                )}
                {renderSearchHeader(
                  "Farmer Name",
                  "customerName",
                  "data-customer-name-header",
                )}
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Total Amount
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Payment Method
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Invoice
                </th>
              </tr>
              {(searchTerms.invoiceNumber || searchTerms.customerName) && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      borderRadius: "0",
                      backgroundColor: "#f8f9fa",
                      color: "#666",
                    }}
                  >
                    {displayOrders.length} orders found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center"
                    style={{ padding: "20px" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : displayOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center"
                    style={{ padding: "20px" }}
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                displayOrders.map((order, index) => {
                  const actualIndex = (page - 1) * entityCount + index + 1;
                  return (
                    <tr key={order.id || index}>
                      <td>{actualIndex}</td>
                      <td>{formatDate(order.date)}</td>
                      <td style={{ fontWeight: 600 }}>
                        {order.invoiceNumber || order.invoiceNumber || "N/A"}
                        {order.editHistoryCount > 0 && (
                          <div
                            style={{
                              marginTop: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {order.editHistoryCount} edit
                            {order.editHistoryCount > 1 ? "s" : ""}
                          </div>
                        )}
                        {order.isLockedByMonthlyClose && (
                          <div
                            style={{
                              marginTop: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            Month Locked
                          </div>
                        )}
                      </td>

                      <td>{order.customerName}</td>
                      <td>{order.quantity}</td>
                      <td>
                        ₹
                        {Number(order.totalAmount || 0).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {order.paymentMethod || "N/A"}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            (order.status || "").toLowerCase() === "cancelled"
                              ? styles.cancelled
                              : (order.status || "").toLowerCase() ===
                                    "completed" ||
                                  (order.paymentStatus || "").toLowerCase() ===
                                    "completed"
                                ? styles.completed
                                : styles.pending
                          }`}
                        >
                          {order.status || order.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-light"
                          onClick={() => setViewOrder(order)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "12px",
                            minWidth: "58px",
                            border: "1px solid #cbd5e1",
                            color: "#0f172a",
                            background: "#f8fafc",
                          }}
                        >
                          View
                        </button>
                        {order.invoiceId ? (
                          <button
                            className="submitbtn"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingInvoiceId === order.invoiceId}
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              minWidth: "80px",
                              marginLeft: "6px",
                            }}
                          >
                            {downloadingInvoiceId === order.invoiceId
                              ? "Downloading..."
                              : "Download"}
                          </button>
                        ) : (
                          <span style={{ color: "#999", fontSize: "12px" }}>
                            N/A
                          </span>
                        )}

                        {/* Edit / cancel stay visible for audit, but cancelled invoices should not allow either action */}
                        <button
                          className="submitbtn"
                          onClick={() => handleEditClick(order)}
                          title={
                            order.isLockedByMonthlyClose
                              ? "This invoice is locked after month close"
                              : String(
                                    order.status ||
                                      order.saleStatus ||
                                      order.paymentStatus ||
                                      "",
                                  ).toLowerCase() === "cancelled"
                                ? "Cancelled invoices cannot be edited"
                              : "Edit Sale"
                          }
                          disabled={
                            order.isLockedByMonthlyClose ||
                            String(
                              order.status ||
                                order.saleStatus ||
                                order.paymentStatus ||
                                "",
                            ).toLowerCase() === "cancelled"
                          }
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            minWidth: "48px",
                            marginLeft: "6px",
                            opacity:
                              order.isLockedByMonthlyClose ||
                              String(
                                order.status ||
                                  order.saleStatus ||
                                  order.paymentStatus ||
                                  "",
                              ).toLowerCase() === "cancelled"
                                ? 0.55
                                : 1,
                            cursor:
                              order.isLockedByMonthlyClose ||
                              String(
                                order.status ||
                                  order.saleStatus ||
                                  order.paymentStatus ||
                                  "",
                              ).toLowerCase() === "cancelled"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Edit
                        </button>
                        {order.editHistoryCount > 0 && (
                          <button
                            className="btn btn-light"
                            onClick={() => setHistoryOrder(order)}
                            title="View Edit History"
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              minWidth: "58px",
                              marginLeft: "6px",
                              border: "1px solid #bfdbfe",
                              color: "#1d4ed8",
                              background: "#eff6ff",
                            }}
                          >
                            History
                          </button>
                        )}
                        <button
                          className="cancelbtn"
                          onClick={() => handleCancelClick(order)}
                          title={
                            order.isLockedByMonthlyClose
                              ? "This invoice is locked after month close"
                              : String(
                                    order.status ||
                                      order.saleStatus ||
                                      order.paymentStatus ||
                                      "",
                                  ).toLowerCase() === "cancelled"
                                ? "Cancelled invoices cannot be cancelled again"
                              : "Cancel Invoice"
                          }
                          disabled={
                            order.isLockedByMonthlyClose ||
                            String(
                              order.status ||
                                order.saleStatus ||
                                order.paymentStatus ||
                                "",
                            ).toLowerCase() === "cancelled"
                          }
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            minWidth: "30px",
                            opacity:
                              order.isLockedByMonthlyClose ||
                              String(
                                order.status ||
                                  order.saleStatus ||
                                  order.paymentStatus ||
                                  "",
                              ).toLowerCase() === "cancelled"
                                ? 0.55
                                : 1,
                            marginLeft: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor:
                              order.isLockedByMonthlyClose ||
                              String(
                                order.status ||
                                  order.saleStatus ||
                                  order.paymentStatus ||
                                  "",
                              ).toLowerCase() === "cancelled"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <FaBan color="white" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {viewOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
            }}
            onClick={() => setViewOrder(null)}
          >
            <div
              style={{
                width: "min(860px, 94vw)",
                maxHeight: "84vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "18px",
                padding: "22px",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: "#0f172a" }}>Sale Details</h4>
                  <div style={{ color: "#64748b", fontSize: "13px", marginTop: 4 }}>
                    {viewOrder.invoiceNumber || viewOrder.saleCode}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setViewOrder(null)}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                {[
                  ["Sale Code", viewOrder.saleCode || "N/A"],
                  ["Invoice Number", viewOrder.invoiceNumber || "N/A"],
                  ["Customer", viewOrder.customerName || "N/A"],
                  ["Created By", viewOrder.createdByName || "N/A"],
                  ["Created At", formatDateTime(viewOrder.createdAt || viewOrder.date)],
                  ["Updated At", formatDateTime(viewOrder.updatedAt)],
                  ["Status", viewOrder.status || viewOrder.paymentStatus || "pending"],
                  ["Payment", viewOrder.paymentMethod || "N/A"],
                  ["Sale Type", (viewOrder.saleType || "retail").replace(/_/g, " ")],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      background: "#f8fafc",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{label}</div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontWeight: 700,
                        color: "#0f172a",
                        textTransform:
                          label === "Status" || label === "Sale Type"
                            ? "capitalize"
                            : "none",
                      }}
                    >
                      {String(value || "N/A")}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                {[
                  ["Subtotal", formatCurrency(viewOrder.totalAmount)],
                  ["Tax", formatCurrency(viewOrder.taxAmount)],
                  ["Discount", formatCurrency(viewOrder.discountAmount)],
                  ["Freight", formatCurrency(viewOrder.freightCharges)],
                  ["Grand Total", formatCurrency(viewOrder.grandTotal)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: "14px",
                      padding: "12px 14px",
                      background:
                        label === "Grand Total"
                          ? "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)"
                          : "#ffffff",
                      border:
                        label === "Grand Total"
                          ? "1px solid #93c5fd"
                          : "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{label}</div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontWeight: 800,
                        color: "#0f172a",
                        fontSize: "16px",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {String(
                viewOrder.status ||
                  viewOrder.saleStatus ||
                  viewOrder.paymentStatus ||
                  "",
              ).toLowerCase() === "cancelled" && (
                <div
                  style={{
                    marginBottom: "16px",
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    borderRadius: "16px",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      color: "#b91c1c",
                      fontWeight: 800,
                      marginBottom: "8px",
                    }}
                  >
                    Cancellation Details
                  </div>
                  <div style={{ display: "grid", gap: "6px", color: "#7f1d1d" }}>
                    <div>Cancelled At: {formatDateTime(viewOrder.cancelledAt)}</div>
                    <div>Cancelled By: {viewOrder.cancelledBy || "N/A"}</div>
                    <div>Reason: {viewOrder.cancelNote || "Not provided"}</div>
                  </div>
                </div>
              )}

              {viewOrder.notes && (
                <div
                  style={{
                    marginBottom: "16px",
                    border: "1px solid #dbeafe",
                    background: "#f8fbff",
                    borderRadius: "16px",
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      marginBottom: "6px",
                    }}
                  >
                    Notes
                  </div>
                  <div style={{ color: "#334155", lineHeight: 1.5 }}>
                    {viewOrder.notes}
                  </div>
                </div>
              )}

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Sale Items
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewOrder.items || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "18px" }}>
                            No item details available.
                          </td>
                        </tr>
                      ) : (
                        (viewOrder.items || []).map((item, index) => (
                          <tr key={item.id || `${item.productId || "item"}-${index}`}>
                            <td>{item.product?.name || item.productName || item.name || "Product"}</td>
                            <td>{item.product?.SKU || item.productSku || item.sku || "N/A"}</td>
                            <td>{Number(item.quantity || 0)}</td>
                            <td>{formatCurrency(item.unitPrice || item.price || 0)}</td>
                            <td>
                              {formatCurrency(
                                item.totalPrice ||
                                  item.totalAmount ||
                                  Number(item.quantity || 0) * Number(item.unitPrice || item.price || 0),
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {historyOrder && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
            }}
            onClick={() => setHistoryOrder(null)}
          >
            <div
              style={{
                width: "min(760px, 94vw)",
                maxHeight: "80vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "18px",
                padding: "20px",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h4 style={{ margin: 0 }}>Invoice Edit History</h4>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    {historyOrder.invoiceNumber || historyOrder.saleCode}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setHistoryOrder(null)}
                >
                  Close
                </button>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {(historyOrder.editHistory || []).map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px",
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        Edited on{" "}
                        {new Date(entry.editedAt).toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "13px", color: "#475569" }}>
                        By {entry.editor?.name || "Unknown"}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "10px",
                        marginTop: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Old Total
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          ₹
                          {Number(entry.originalGrandTotal || 0).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          New Total
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          ₹
                          {Number(entry.revisedGrandTotal || 0).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Difference
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color:
                              Number(entry.deltaAmount || 0) >= 0
                                ? "#166534"
                                : "#b91c1c",
                          }}
                        >
                          ₹
                          {Number(entry.deltaAmount || 0).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Settlement
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {(entry.settlementMode || "not specified").replace(
                            /_/g,
                            " ",
                          )}
                        </div>
                      </div>
                    </div>
                    {entry.settlementNote && (
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "13px",
                          color: "#334155",
                        }}
                      >
                        Note: {entry.settlementNote}
                      </div>
                    )}
                    {Array.isArray(entry.adjustments) &&
                      entry.adjustments.length > 0 && (
                        <div
                          style={{
                            marginTop: "10px",
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          {entry.adjustments.map((adjustment) => (
                            <div
                              key={adjustment.id}
                              style={{
                                borderRadius: "12px",
                                padding: "10px 12px",
                                background: "#ffffff",
                                border: "1px solid #dbeafe",
                                fontSize: "12px",
                                color: "#334155",
                              }}
                            >
                              <strong style={{ textTransform: "capitalize" }}>
                                {(
                                  adjustment.adjustmentKind ||
                                  adjustment.settlementMode ||
                                  "adjustment"
                                ).replace(/_/g, " ")}
                              </strong>{" "}
                              | Amount ₹
                              {Number(adjustment.amount || 0).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}{" "}
                              | Balance ₹
                              {Number(
                                adjustment.balanceAmount || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              | Status{" "}
                              {(adjustment.status || "pending").replace(
                                /_/g,
                                " ",
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    {entry.diff?.items && (
                      <div
                        style={{
                          marginTop: "12px",
                          display: "grid",
                          gap: "10px",
                        }}
                      >
                        {entry.diff.items.added?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#166534",
                                fontWeight: 700,
                                marginBottom: 4,
                              }}
                            >
                              Added Items
                            </div>
                            {entry.diff.items.added.map((item, idx) => (
                              <div
                                key={`added-${idx}`}
                                style={{ fontSize: "12px", color: "#334155" }}
                              >
                                {item.productName ||
                                  item.productSku ||
                                  item.productId}
                                : Qty {Number(item.quantity || 0)} at ₹
                                {Number(item.unitPrice || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {entry.diff.items.removed?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#b91c1c",
                                fontWeight: 700,
                                marginBottom: 4,
                              }}
                            >
                              Removed Items
                            </div>
                            {entry.diff.items.removed.map((item, idx) => (
                              <div
                                key={`removed-${idx}`}
                                style={{ fontSize: "12px", color: "#334155" }}
                              >
                                {item.productName ||
                                  item.productSku ||
                                  item.productId}
                                : Qty {Number(item.quantity || 0)} at ₹
                                {Number(item.unitPrice || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {entry.diff.items.changed?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#0f172a",
                                fontWeight: 700,
                                marginBottom: 4,
                              }}
                            >
                              Changed Items
                            </div>
                            {entry.diff.items.changed.map((item) => (
                              <div
                                key={item.key}
                                style={{ fontSize: "12px", color: "#334155" }}
                              >
                                {item.productName ||
                                  item.productSku ||
                                  item.key}
                                : Qty {Number(item.before?.quantity || 0)} →{" "}
                                {Number(item.after?.quantity || 0)}, Price ₹
                                {Number(
                                  item.before?.unitPrice || 0,
                                ).toLocaleString("en-IN")}{" "}
                                → ₹
                                {Number(
                                  item.after?.unitPrice || 0,
                                ).toLocaleString("en-IN")}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCancelModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                width: "400px",
                maxWidth: "90%",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <h4 style={{ margin: "0 0 15px", color: "#EF4444" }}>
                Confirm Cancellation
              </h4>
              <p
                style={{
                  marginBottom: "20px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Are you sure you want to cancel Invoice{" "}
                <strong>{saleToCancel?.invoiceNumber}</strong>? This action
                cannot be undone.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSaleToCancel(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                  disabled={cancelling}
                >
                  Close
                </button>
                <button
                  onClick={confirmCancellation}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#EF4444",
                    color: "white",
                    cursor: "pointer",
                  }}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="row m-0 p-0 pt-3 justify-content-between">
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {page > 1 && (
                <button onClick={() => handlePageChange("prev")}>
                  <span>
                    <FaArrowLeftLong />
                  </span>{" "}
                  Previous
                </button>
              )}
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {page < totalPages && (
                <button onClick={() => handlePageChange("next")}>
                  Next{" "}
                  <span>
                    <FaArrowRightLong />
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ErrorModal isOpen={isModalOpen} message={error} onClose={closeModal} />
      )}
    </div>
  );
}

export default StoreSalesOrders;
