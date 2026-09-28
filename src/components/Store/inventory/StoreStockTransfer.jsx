import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import storeService from "../../../services/storeService";
import {
  formatDateTimeIN,
  getCurrentDateTimeLocal,
  isFutureDateTimeLocal,
} from "@/utils/dateFormat";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

function StoreStockTransfer() {
  const TRANSFER_DISPLAY_UNIT = "bag";

  const toDateTimeLocalValue = (value) => {
    if (!value) return getCurrentDateTimeLocal();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return getCurrentDateTimeLocal();
    const pad = (input) => String(input).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (input) => String(input).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const normalizeHistoryDateValue = (value) => {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      return value;
    }

    const mmddyyyy = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      return `${year}-${month}-${day}`;
    }

    const ddmmyyyy = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return toDateInputValue(parsed);
  };

  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [pageInitializing, setPageInitializing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [storesWarning, setStoresWarning] = useState("");

  // Store data
  const [currentStore, setCurrentStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedDestinationStore, setSelectedDestinationStore] = useState("");
  const [currentStock, setCurrentStock] = useState([]);
  const [stockTableTitle, setStockTableTitle] = useState("Available Stock");
  const [inventoryType, setInventoryType] = useState("good");
  const [recordedAt, setRecordedAt] = useState(getCurrentDateTimeLocal());
  const [stockAsOfLabel, setStockAsOfLabel] = useState("");

  // Destination store search
  const [storeSearch, setStoreSearch] = useState("");

  // Transfer items
  // Transfer items
  const [transferItems, setTransferItems] = useState({}); // { productId: { quantity, product } }

  // History State
  const [viewMode, setViewMode] = useState("create"); // "create" or "history"
  const [transferHistory, setTransferHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState({
    fromDate: "",
    toDate: "",
  });
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [historyTransfer, setHistoryTransfer] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState(null);
  const [editingTransferCode, setEditingTransferCode] = useState("");
  const [editChangeNote, setEditChangeNote] = useState("");

  // Rejection State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Search Visibility states
  const [showSearch, setShowSearch] = useState({
    product: false,
    historyTransferCode: false,
    historyToStore: false,
  });

  // Search Term states
  const [searchTerms, setSearchTerms] = useState({
    product: "",
    historyTransferCode: "",
    historyToStore: "",
  });

  const filteredDestinationStores = stores.filter((store) => {
    if (!storeSearch) return true;

    const term = storeSearch.toLowerCase();
    return (
      store.name?.toLowerCase().includes(term) ||
      store.storeCode?.toLowerCase().includes(term) ||
      (store.storeType || store.type || "").toLowerCase().includes(term)
    );
  });

  // Filtered Stock
  const [filteredStock, setFilteredStock] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  const buildOtherStoreLabel = (transfer) => {
    if (!transfer) return "-";
    const isOutgoing = Boolean(transfer.isOutgoing);
    const otherStore = isOutgoing
      ? transfer.toStore?.name || transfer.toStoreName
      : transfer.fromStore?.name || transfer.fromStoreName;
    return otherStore || "-";
  };

  const getDraftQuantityForProduct = (productId) =>
    Number(
      transferItems[productId]?.quantity ||
        transferItems[String(productId)]?.quantity ||
        0,
    );

  const getEffectiveAvailableStock = (product) => {
    const productId = product?.productId || product?.id;
    const baseAvailable = Number(
      product?.available || product?.currentStock || 0,
    );
    if (!editingTransferId) return baseAvailable;
    return baseAvailable + getDraftQuantityForProduct(productId);
  };

  const toggleSearch = (key) => {
    setShowSearch((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      fontFamily: "Poppins",
      fontSize: "14px",
      minHeight: "38px",
      borderColor: "#dee2e6",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#ced4da",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      fontFamily: "Poppins",
      fontSize: "14px",
      backgroundColor: state.isSelected
        ? "var(--primary-color)"
        : state.isFocused
          ? "rgba(59, 130, 246, 0.1)"
          : "white",
      color: state.isSelected ? "white" : "#333",
    }),
    singleValue: (provided) => ({
      ...provided,
      fontFamily: "Poppins",
      fontSize: "14px",
      color: "#333",
    }),
    menu: (provided) => ({
      ...provided,
      fontFamily: "Poppins",
      fontSize: "14px",
      zIndex: 9999,
    }),
  };

  const storeOptions = stores
    .filter((store) => store.id !== currentStore?.id)
    .map((store) => ({
      value: store.id,
      label: `${store.name} (${(store.storeType || store.type || "own").toUpperCase()})`,
      store: store,
    }));

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
        style={{
          cursor: "pointer",
          position: "relative",
          fontFamily: "Poppins",
          fontWeight: 600,
          fontSize: "13px",
        }}
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
    fetchCurrentStore();
  }, []);

  useEffect(() => {
    if (currentStore?.id) {
      fetchCurrentStock();
      fetchStores();
    }
  }, [currentStore]);

  useEffect(() => {
    if (!currentStore?.id || viewMode !== "create") return;
    if (inventoryType === "damaged") {
      fetchDamagedStock();
      return;
    }
    fetchCurrentStock();
  }, [recordedAt]);

  useEffect(() => {
    if (viewMode === "history" && currentStore?.id) {
      fetchHistory();
    }
  }, [
    viewMode,
    currentStore,
    historyPage,
    historyLimit,
    appliedHistoryFilters.fromDate,
    appliedHistoryFilters.toDate,
  ]);

  const fetchCurrentStore = async () => {
    try {
      setPageInitializing(true);
      let storeId = null;
      let cachedStore = null;

      // Try from selectedStore in localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          storeId = store.id;
          cachedStore = store;
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }

      // Fallback to currentStoreId
      if (!storeId) {
        const currentStoreId = localStorage.getItem("currentStoreId");
        storeId = currentStoreId ? parseInt(currentStoreId) : null;
      }

      // Fallback to user object
      if (!storeId) {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const user = userData.user || userData;
        storeId = user?.storeId || user?.store?.id;
      }

      if (!storeId) {
        throw new Error(
          "Store information missing. Please re-login to continue.",
        );
      }

      if (cachedStore && cachedStore.id) {
        setCurrentStore(cachedStore);
      } else {
        // Fallback only when local cache is unavailable.
        const res = await storeService.getStoreById(storeId);
        const store = res.store || res.data || res;
        if (store && store.id) {
          setCurrentStore(store);
        } else {
          throw new Error("Store not found");
        }
      }
    } catch (err) {
      console.error("Error fetching current store:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching store information",
      );
    } finally {
      setPageInitializing(false);
    }
  };

  const fetchStores = async () => {
    if (!currentStore?.id) return;

    setStoresLoading(true);
    try {
      const response = await storeService.getDestinationStores(currentStore.id);
      const storesData = response.data || response.stores || response || [];
      const mappedStores = Array.isArray(storesData)
        ? storesData.map((store) => ({
            id: store.id,
            name: store.name || store.storeName,
            storeCode: store.storeCode || store.code,
            storeType: store.storeType || store.type || "own",
            type: store.type || store.storeType || "own",
            division: store.division || null,
          }))
        : [];

      setStores(mappedStores);
      if (mappedStores.length === 0) {
        setStoresWarning("No destination stores available for transfer.");
      } else {
        setStoresWarning("");
      }
    } catch (err) {
      console.error("Error fetching destination stores:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching destination stores",
      );
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchCurrentStock = async () => {
    if (!currentStore?.id) return;

    setStockLoading(true);
    try {
      const response = await storeService.getAvailableStockForTransfer(
        currentStore.id,
        recordedAt,
      );
      const stockData = response.data || response.stock || response || [];

      // Map backend response to frontend format
      const mappedStock = Array.isArray(stockData)
        ? stockData.map((item) => ({
            id: item.productId,
            productId: item.productId,
            productName: item.productName || item.name,
            productCode: item.sku || item.SKU || item.productCode,
            currentStock: item.available || item.quantity || 0,
            available: item.available || item.quantity || 0,
            unit: TRANSFER_DISPLAY_UNIT,
            unitPrice: item.customPrice || item.basePrice || 0,
            basePrice: item.basePrice || 0,
            customPrice: item.customPrice || null,
            productType: item.productType || "packed",
          }))
        : [];

      setCurrentStock(mappedStock);
      setStockTableTitle("Available Stock");
      setStockAsOfLabel(response.stockAsOf || recordedAt || "");
    } catch (err) {
      console.error("Error fetching available stock:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching available stock",
      );
      setCurrentStock([]);
      setStockAsOfLabel("");
    } finally {
      setStockLoading(false);
    }
  };

  const fetchDamagedStock = async () => {
    if (!currentStore?.id) return;

    setStockLoading(true);
    try {
      const response = await storeService.getAvailableDamagedStockForTransfer(
        currentStore.id,
      );
      const stockData = response.data || response.stock || response || [];

      // Map backend response to frontend format
      const mappedStock = Array.isArray(stockData)
        ? stockData.map((item) => ({
            id: item.productId,
            productId: item.productId,
            productName: item.productName || item.name,
            productCode: item.sku || item.SKU || item.productCode,
            currentStock:
              item.damagedQuantity || item.available || item.quantity || 0,
            available:
              item.damagedQuantity || item.available || item.quantity || 0,
            unit: TRANSFER_DISPLAY_UNIT,
            unitPrice: item.customPrice || item.basePrice || 0,
            basePrice: item.basePrice || 0,
            customPrice: item.customPrice || null,
            productType: item.productType || "packed",
          }))
        : [];

      setCurrentStock(mappedStock);
      setStockTableTitle("Damaged Inventory Available Stock");
      setStockAsOfLabel(recordedAt || "");
    } catch (err) {
      console.error("Error fetching damaged stock:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error fetching damaged stock",
      );
      setCurrentStock([]);
      setStockAsOfLabel("");
    } finally {
      setStockLoading(false);
    }
  };

  const handleGoodInventoryClick = () => {
    fetchCurrentStock();
    setStockTableTitle("Good Inventory Available Stock");
    setInventoryType("good");
  };

  const handleDamagedInventoryClick = () => {
    fetchDamagedStock();
    setInventoryType("damaged");
  };

  // Effect to handle Destination Store changes
  useEffect(() => {
    const destStore = getDestinationStore();
    if (
      destStore &&
      ((destStore.storeType || "").toString().toLowerCase() === "company" ||
        (destStore.type || "").toString().toLowerCase() === "company")
    ) {
      // If Company store selected, clear default stock and wait for user selection
      setCurrentStock([]);
      setStockTableTitle("");
    } else if (currentStore?.id && currentStock.length === 0) {
      // Only repopulate stock when we are coming back from a company destination
      // that had explicitly cleared the table.
      fetchCurrentStock();
    }
  }, [selectedDestinationStore, currentStore, currentStock.length]);

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          product: false,
          historyTransferCode: false,
          historyToStore: false,
        });
        setSearchTerms({
          product: "",
          historyTransferCode: "",
          historyToStore: "",
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-search-header]")) {
        setShowSearch({
          product: false,
          historyTransferCode: false,
          historyToStore: false,
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Filtering Logic for Available Stock
  useEffect(() => {
    const mergedStockMap = new Map();

    (currentStock || []).forEach((product) => {
      const productId = Number(product.productId || product.id);
      if (!productId) return;
      mergedStockMap.set(productId, product);
    });

    if (editingTransferId) {
      Object.values(transferItems || {}).forEach((entry) => {
        const draftProduct = entry?.product;
        const productId = Number(draftProduct?.productId || draftProduct?.id);
        if (!productId) return;

        if (!mergedStockMap.has(productId)) {
          mergedStockMap.set(productId, {
            id: productId,
            productId,
            productName: draftProduct.productName || "Product",
            productCode:
              draftProduct.productCode ||
              draftProduct.sku ||
              draftProduct.SKU ||
              "",
            currentStock: Number(
              draftProduct.currentStock || draftProduct.available || 0,
            ),
            available: Number(
              draftProduct.available || draftProduct.currentStock || 0,
            ),
            unit: TRANSFER_DISPLAY_UNIT,
            unitPrice: Number(
              draftProduct.unitPrice || draftProduct.basePrice || 0,
            ),
            basePrice: Number(
              draftProduct.basePrice || draftProduct.unitPrice || 0,
            ),
            customPrice: draftProduct.customPrice || null,
            productType: draftProduct.productType || "packed",
          });
        }
      });
    }

    let filtered = Array.from(mergedStockMap.values());
    if (searchTerms.product) {
      filtered = filtered.filter(
        (item) =>
          item.productName
            ?.toLowerCase()
            .includes(searchTerms.product.toLowerCase()) ||
          item.productCode
            ?.toLowerCase()
            .includes(searchTerms.product.toLowerCase()),
      );
    }
    setFilteredStock(filtered);
  }, [currentStock, transferItems, editingTransferId, searchTerms.product]);

  // Filtering Logic for History
  useEffect(() => {
    let filtered = transferHistory;
    if (searchTerms.historyTransferCode) {
      filtered = filtered.filter((item) =>
        item.transferCode
          ?.toLowerCase()
          .includes(searchTerms.historyTransferCode.toLowerCase()),
      );
    }
    if (searchTerms.historyToStore) {
      filtered = filtered.filter((item) =>
        buildOtherStoreLabel(item)
          .toLowerCase()
          .includes(searchTerms.historyToStore.toLowerCase()),
      );
    }
    setFilteredHistory(filtered);
  }, [
    transferHistory,
    searchTerms.historyTransferCode,
    searchTerms.historyToStore,
  ]);

  const handleQuantityChange = (productId, quantity) => {
    const qty = parseInt(quantity, 10) || 0;
    if (qty < 0) return;

    if (qty === 0) {
      setTransferItems((prev) => {
        const next = { ...prev };
        delete next[productId];
        delete next[String(productId)];
        return next;
      });
      return;
    }

    const product =
      currentStock.find(
        (p) => p.id === productId || p.productId === productId,
      ) ||
      transferItems[productId]?.product ||
      transferItems[String(productId)]?.product;
    if (!product) return;

    const availableStock = getEffectiveAvailableStock(product);
    if (qty > availableStock) {
      setError(
        `Quantity cannot exceed available stock (${availableStock} ${product.unit})`,
      );
      return;
    }

    setTransferItems((prev) => ({
      ...prev,
      [productId]: {
        quantity: qty,
        product: product,
      },
    }));
  };

  const getDestinationStore = () => {
    return stores.find((s) => s.id == selectedDestinationStore);
  };

  const getTransferType = () => {
    if (!currentStore || !selectedDestinationStore) return null;

    const destinationStore = getDestinationStore();
    if (!destinationStore) return null;

    // Check if both stores are own stores or franchise stores
    const currentStoreType =
      currentStore.storeType || currentStore.type || "own";
    const destStoreType =
      destinationStore.storeType || destinationStore.type || "own";

    // If transfer from own store to franchise store, it's a sale
    if (currentStoreType === "own" && destStoreType === "franchise") {
      return "sale";
    }

    // If transfer between two own stores, it's a stock transfer
    if (currentStoreType === "own" && destStoreType === "own") {
      return "stock_transfer";
    }

    // Default to stock transfer for other cases
    return "stock_transfer";
  };

  const handleSubmit = async () => {
    if (!recordedAt) {
      setError("Please select a recorded date and time");
      return;
    }
    if (isFutureDateTimeLocal(recordedAt)) {
      setError("Recorded At cannot be a future date/time");
      return;
    }
    if (!selectedDestinationStore) {
      setError("Please select a destination store");
      return;
    }

    const items = Object.values(transferItems);
    if (items.length === 0) {
      setError("Please add at least one product to transfer");
      return;
    }

    // Validate quantities
    for (const item of items) {
      if (item.quantity <= 0) {
        setError(`Invalid quantity for ${item.product.productName}`);
        return;
      }
      const liveProduct = currentStock.find(
        (product) =>
          Number(product.productId || product.id) ===
          Number(item.product.productId || item.product.id),
      );
      const availableStock = Number(
        liveProduct
          ? getEffectiveAvailableStock(liveProduct)
          : item.product.available || item.product.currentStock || 0,
      );
      if (availableStock > 0 && item.quantity > availableStock) {
        setError(
          `Quantity exceeds available stock for ${item.product.productName}`,
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const transferType = getTransferType();
      const destinationStore = getDestinationStore();

      let payload = {};

      if (
        destinationStore &&
        ((destinationStore.storeType || "").toString().toLowerCase() ===
          "company" ||
          (destinationStore.type || "").toString().toLowerCase() === "company")
      ) {
        // Company Transfer Payload
        payload = {
          fromStoreId: currentStore.id,
          destinationType: "company",
          recordedAt,
          inventoryType: inventoryType,
          items: items.map((item) => ({
            productId: item.product.productId || item.product.id,
            quantity: item.quantity,
          })),
          notes: `Stock transfer from ${currentStore.name || "Current Store"} to Company`,
        };
      } else {
        // Normal Store Transfer Payload
        payload = {
          fromStoreId: currentStore.id,
          toStoreId: destinationStore
            ? destinationStore.id
            : selectedDestinationStore,
          recordedAt,
          items: items.map((item) => ({
            productId: item.product.productId || item.product.id,
            quantity: item.quantity,
          })),
          notes: `Stock transfer from ${currentStore.name || "Current Store"} to ${destinationStore?.name || "Destination Store"}`,
        };
      }

      let res;
      let transferCode = "N/A";
      if (editingTransferId) {
        res = await storeService.updateStockTransfer(
          currentStore.id,
          editingTransferId,
          {
            ...payload,
            changeNote: editChangeNote,
          },
        );
        const transferData = res.data || res;
        transferCode =
          transferData?.transferCode ||
          transferData?.transfer?.transferCode ||
          editingTransferCode ||
          "N/A";
        setSuccessMessage(
          `Stock transfer updated successfully! Transfer Code: ${transferCode}`,
        );
      } else {
        res = await storeService.createStockTransfer(payload);
        const transferData = res.data || res;
        transferCode =
          transferData?.transfer?.transferCode ||
          transferData?.transferCode ||
          res.transferCode ||
          "N/A";
        setSuccessMessage(
          `Stock transfer completed successfully! Transfer Code: ${transferCode}`,
        );
      }

      // Clear form
      setTransferItems({});
      setSelectedDestinationStore("");
      setRecordedAt(getCurrentDateTimeLocal());
      setEditingTransferId(null);
      setEditingTransferCode("");
      setEditChangeNote("");
      setViewMode("history");
      setShowDetailModal(false);
      setSelectedTransfer(null);

      // Refresh stock and history immediately so edited rows/history are visible
      await Promise.all([fetchCurrentStock(), fetchHistory()]);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error submitting stock transfer:", err);
      setError(
        err?.response?.data?.message || "Failed to submit stock transfer",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeErrorModal = () => {
    setError(null);
  };

  const fetchHistory = async () => {
    if (!currentStore?.id) return;
    setHistoryLoading(true);
    try {
      const res = await storeService.getStockTransfers(currentStore.id, {
        page: historyPage,
        limit: historyLimit,
        fromDate: appliedHistoryFilters.fromDate,
        toDate: appliedHistoryFilters.toDate,
      });
      const data = res.data || res.transfers || res || [];
      setTransferHistory(Array.isArray(data) ? data : []);
      setHistoryPagination(
        res.pagination || {
          page: historyPage,
          limit: historyLimit,
          total: Array.isArray(data) ? data.length : 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      console.error("Error fetching transfer history:", err);
      // setError("Failed to fetch transfer history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetails = async (transfer) => {
    if (!currentStore?.id) return;
    const transferId = transfer?.id;
    if (!transferId) return;
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await storeService.getStockTransferById(
        currentStore.id,
        transferId,
        { includeHistory: false },
      );
      const data = res.data || res.transfer || res;
      setSelectedTransfer((prev) =>
        prev && Number(prev.id) === Number(transferId)
          ? { ...prev, ...data }
          : data,
      );
    } catch (err) {
      console.error("Error fetching transfer details:", err);
      setError("Failed to fetch transfer details");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransfer(null);
  };

  const handleEditTransfer = (transfer) => {
    const draft = transfer || selectedTransfer;
    if (!draft) return;
    if (Number(draft.fromStoreId) !== Number(currentStore?.id)) {
      setError(
        "Only outgoing transfers from the current store can be edited here",
      );
      return;
    }
    if (Number(draft.toStoreId) === Number(currentStore?.id)) {
      setError(
        "This transfer points back to the current store and cannot be edited from this screen",
      );
      return;
    }

    const nextTransferItems = {};
    (draft.items || []).forEach((item) => {
      const productId = item.productId || item.product?.id;
      if (!productId) return;
      nextTransferItems[productId] = {
        quantity: Number(item.quantity || 0),
        product: {
          id: productId,
          productId,
          productName: item.product?.name || item.productName || "Product",
          productCode:
            item.product?.SKU || item.product?.sku || item.productCode || "",
          available: Number(item.availableStock || item.available || 0),
          currentStock: Number(item.availableStock || item.available || 0),
          unit: TRANSFER_DISPLAY_UNIT,
          unitPrice: Number(item.unitPrice || 0),
          basePrice: Number(item.unitPrice || 0),
          productType:
            item.productType || item.product?.productType || "packed",
        },
      };
    });

    setEditingTransferId(draft.id);
    setEditingTransferCode(draft.transferCode || draft.transferNumber || "");
    setSelectedDestinationStore(draft.toStoreId || "");
    setRecordedAt(toDateTimeLocalValue(draft.transferDate || draft.createdAt));
    setTransferItems(nextTransferItems);
    setEditChangeNote("Transfer quantities or destination updated");
    setViewMode("create");
    setShowDetailModal(false);
    setSelectedTransfer(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenTransferHistory = async (transfer) => {
    const targetTransfer = transfer || selectedTransfer;
    if (!targetTransfer || !currentStore?.id) return;

    if (Array.isArray(targetTransfer.editHistory)) {
      setHistoryTransfer(targetTransfer);
      setShowEditHistoryModal(true);
      return;
    }

    try {
      setDetailLoading(true);
      const res = await storeService.getStockTransferById(
        currentStore.id,
        targetTransfer.id,
        { includeHistory: true },
      );
      const data = res.data || res.transfer || res;
      setHistoryTransfer(data);
      setShowEditHistoryModal(true);
    } catch (err) {
      console.error("Error fetching transfer edit history:", err);
      setError("Failed to fetch transfer edit history");
    } finally {
      setDetailLoading(false);
    }
  };

  const resetDraft = () => {
    setEditingTransferId(null);
    setEditingTransferCode("");
    setEditChangeNote("");
    setTransferItems({});
    setSelectedDestinationStore("");
    setRecordedAt(getCurrentDateTimeLocal());
  };

  const handleDownloadInvoice = async (transferId) => {
    if (!transferId) return;
    setDownloadLoading(true);
    try {
      const response =
        await storeService.downloadStockTransferInvoice(transferId);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock_transfer_invoice_${transferId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError("Failed to download invoice");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleRejectTransferClick = () => {
    setShowRejectModal(true);
  };

  const handleConfirmRejectTransfer = async () => {
    if (!selectedTransfer) return;

    setRejectLoading(true);
    try {
      await storeService.rejectStockTransfer(selectedTransfer.id);

      setSuccessMessage("Stock transfer rejected successfully");

      // Close all modals
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelectedTransfer(null);

      // Refresh history
      fetchHistory();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error rejecting transfer:", err);
      // Show error in the rejection modal or main component?
      // Main component error state is safer
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reject stock transfer",
      );
      setShowRejectModal(false); // Close rejection modal on error to show error modal
    } finally {
      setRejectLoading(false);
    }
  };

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Product",
      "Product Code",
      "Available Stock",
      "Unit",
    ];
    const dataToExport =
      filteredStock && filteredStock.length > 0
        ? filteredStock.filter(
            (product) => (product.available || product.currentStock || 0) > 0,
          )
        : (currentStock || []).filter(
            (product) => (product.available || product.currentStock || 0) > 0,
          );
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          Product: item.productName || "-",
          "Product Code": item.productCode || "-",
          "Available Stock": Number(
            item.available || item.currentStock || 0,
          ).toFixed(2),
          Unit: item.unit || "bag",
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Stock_Transfer");
      else if (type === "XLS") handleExportExcel(columns, arr, "StockTransfer");
    } else {
      setError("Table is Empty");
    }
  };

  const transferItemsList = Object.values(transferItems);
  const hasAppliedHistoryFilters = Boolean(
    appliedHistoryFilters.fromDate || appliedHistoryFilters.toDate,
  );
  const visibleHistoryCount = filteredHistory.length;
  const totalHistoryCount = Number(historyPagination.total || 0);

  const applyHistoryFilters = () => {
    setHistoryPage(1);
    setAppliedHistoryFilters({
      fromDate: normalizeHistoryDateValue(historyFromDate),
      toDate: normalizeHistoryDateValue(historyToDate),
    });
  };

  const resetHistoryFilters = () => {
    setHistoryFromDate("");
    setHistoryToDate("");
    setHistoryPage(1);
    setAppliedHistoryFilters({
      fromDate: "",
      toDate: "",
    });
  };

  const totalItems = transferItemsList.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const transferType = getTransferType();
  const destinationStore = getDestinationStore();

  return (
    <div style={{ padding: "20px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontFamily: "Poppins",
            fontWeight: 700,
            fontSize: "28px",
            color: "var(--primary-color)",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Stock Transfer
        </h2>
        <p className="path">
          <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
          <i className="bi bi-chevron-right"></i> Stock Transfer
        </p>
      </div>

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          className="homebtn"
          onClick={() =>
            setViewMode(viewMode === "create" ? "history" : "create")
          }
          style={{
            fontFamily: "Poppins",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {viewMode === "create" ? (
            <>
              <i className="bi bi-clock-history"></i> History
            </>
          ) : (
            <>
              <i className="bi bi-plus-lg"></i> New Transfer
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {pageInitializing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "22px 26px",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontFamily: "Poppins",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "999px",
                border: "3px solid #dbeafe",
                borderTopColor: "#2563eb",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span>
              {pageInitializing
                ? "Loading stock transfer workspace..."
                : "Loading transfer details..."}
            </span>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={closeErrorModal} />}

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            border: "1px solid #86efac",
            marginBottom: "16px",
            fontFamily: "Poppins",
            fontWeight: 600,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Stores Warning */}
      {storesWarning && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fcd34d",
            marginBottom: "16px",
            fontFamily: "Poppins",
            fontSize: "14px",
          }}
        >
          <strong>⚠️ Warning:</strong> {storesWarning}
        </div>
      )}

      {currentStore && viewMode === "create" && (
        <>
          {editingTransferId && (
            <div
              style={{
                marginBottom: "16px",
                padding: "16px 18px",
                borderRadius: "14px",
                border: "1px solid #bfdbfe",
                background:
                  "linear-gradient(135deg, rgba(239,246,255,0.98), rgba(224,242,254,0.9))",
                fontFamily: "Poppins",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Editing Transfer{" "}
                    {editingTransferCode || `#${editingTransferId}`}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#475569",
                      marginTop: "4px",
                    }}
                  >
                    Review the destination, recorded time, and items below.
                    Saving will update this same transfer and store the change
                    in transfer history.
                  </div>
                </div>
                <button
                  className="btn btn-light"
                  onClick={resetDraft}
                  disabled={submitting}
                  style={{ fontFamily: "Poppins" }}
                >
                  Cancel Edit
                </button>
              </div>
            </div>
          )}

          {/* Store Information */}
          <div
            className={styles.orderStatusCard}
            style={{ marginBottom: "24px" }}
          >
            <h4
              style={{
                margin: 0,
                marginBottom: "16px",
                fontFamily: "Poppins",
                fontWeight: 600,
                fontSize: "20px",
                color: "var(--primary-color)",
              }}
            >
              Transfer Information
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  From Store (Source)
                </label>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {currentStore.name || "Current Store"}
                </div>
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  Type:{" "}
                  {(
                    currentStore.storeType ||
                    currentStore.type ||
                    "own"
                  ).toUpperCase()}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  To Store (Destination)
                </label>
                <Select
                  options={storeOptions}
                  value={
                    selectedDestinationStore
                      ? storeOptions.find(
                          (opt) => opt.value == selectedDestinationStore,
                        )
                      : null
                  }
                  onChange={(option) =>
                    setSelectedDestinationStore(option ? option.value : "")
                  }
                  placeholder="Select destination store..."
                  styles={customSelectStyles}
                  isClearable
                  isSearchable
                  isLoading={storesLoading}
                />
              </div>
              {destinationStore && (
                <div>
                  <label
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#666",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Transfer Type
                  </label>
                  <div
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: transferType === "sale" ? "#dc2626" : "#059669",
                    }}
                  >
                    {transferType === "sale" ? "SALE" : "STOCK TRANSFER"}
                  </div>
                  <div
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {transferType === "sale"
                      ? "Own store to Franchise store"
                      : "Own store to Own store"}
                  </div>
                </div>
              )}
              <div>
                <label
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#666",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Recorded At
                </label>
                <input
                  type="datetime-local"
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  max={getCurrentDateTimeLocal()}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontFamily: "Poppins",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                />
                <div
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "6px",
                  }}
                >
                  Date format: DD/MM/YYYY HH:mm
                </div>
              </div>
              {editingTransferId && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      fontFamily: "Poppins",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#666",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Change Note
                  </label>
                  <textarea
                    value={editChangeNote}
                    onChange={(e) => setEditChangeNote(e.target.value)}
                    rows={3}
                    placeholder="Describe what changed in this transfer for audit history"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontFamily: "Poppins",
                      fontSize: "14px",
                      color: "#111827",
                      resize: "vertical",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Export buttons */}
          {currentStock.filter(
            (product) => (product.available || product.currentStock || 0) > 0,
          ).length > 0 && (
            <div className="row m-0 p-3 justify-content-around">
              <div className="col-lg-5">
                <button
                  className={inventoryStyles.xls}
                  onClick={() => onExport("XLS")}
                >
                  <p>Export to </p>
                  <img src={xls} alt="" />
                </button>
                <button
                  className={inventoryStyles.xls}
                  onClick={() => onExport("PDF")}
                >
                  <p>Export to </p>
                  <img src={pdf} alt="" />
                </button>
              </div>
            </div>
          )}

          {/* Company Store Inventory Buttons */}
          {destinationStore &&
            ((destinationStore.storeType || "").toString().toLowerCase() ===
              "company" ||
              (destinationStore.type || "").toString().toLowerCase() ===
                "company") && (
              <div className="row m-0 p-3 justify-content-around">
                <div
                  className="col-lg-5"
                  style={{ display: "flex", gap: "10px" }}
                >
                  <button
                    className="btn btn-success"
                    style={{ fontFamily: "Poppins", fontSize: "14px", flex: 1 }}
                    onClick={handleGoodInventoryClick}
                  >
                    Good Inventory
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ fontFamily: "Poppins", fontSize: "14px", flex: 1 }}
                    onClick={handleDamagedInventoryClick}
                  >
                    Damaged Inventory
                  </button>
                </div>
              </div>
            )}

          {/* Available Stock */}
          {(stockLoading || currentStock.length > 0) && (
            <div
              className={styles.orderStatusCard}
              style={{ marginBottom: "24px" }}
            >
              <h4
                style={{
                  margin: 0,
                  marginBottom: "16px",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                {stockTableTitle}
              </h4>
              {stockAsOfLabel ? (
                <div
                  style={{
                    marginBottom: "12px",
                    fontFamily: "Poppins",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  Stock shown as of {formatDateTimeIN(stockAsOfLabel)}
                </div>
              ) : null}
              {stockLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "28px 12px",
                    color: "#475569",
                    fontFamily: "Poppins",
                    fontWeight: 500,
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "999px",
                      border: "3px solid #dbeafe",
                      borderTopColor: "#2563eb",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span>Refreshing stock in the background...</span>
                </div>
              ) : currentStock.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  <p style={{ fontFamily: "Poppins" }}>
                    No stock available for transfer
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    className="table table-bordered borderedtable table-sm"
                    style={{ fontFamily: "Poppins" }}
                  >
                    <thead className="table-light">
                      <tr>
                        {renderSearchHeader(
                          "Product",
                          "product",
                          "data-product-header",
                        )}
                        <th
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          Available
                        </th>
                        <th
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          Unit
                        </th>
                        <th
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          Transfer Qty
                        </th>
                        <th
                          style={{
                            fontFamily: "Poppins",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          Action
                        </th>
                      </tr>
                      {searchTerms.product && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              borderRadius: "0",
                              backgroundColor: "#f8f9fa",
                              color: "#666",
                            }}
                          >
                            {
                              filteredStock.filter(
                                (p) => getEffectiveAvailableStock(p) > 0,
                              ).length
                            }{" "}
                            products found
                          </td>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {filteredStock
                        .filter(
                          (product) => getEffectiveAvailableStock(product) > 0,
                        )
                        .map((product, index) => {
                          const productId = product.id || product.productId;
                          const availableStock =
                            getEffectiveAvailableStock(product);
                          const transferItem =
                            transferItems[productId] ||
                            transferItems[String(productId)];
                          const transferQty = transferItem?.quantity || 0;
                          return (
                            <tr
                              key={productId}
                              style={{
                                background:
                                  index % 2 === 0
                                    ? "rgba(59, 130, 246, 0.03)"
                                    : "transparent",
                              }}
                            >
                              <td
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  {product.productName}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#666" }}
                                >
                                  {product.productCode || product.sku}
                                </div>
                              </td>
                              <td
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                }}
                              >
                                {Number(availableStock || 0).toFixed(2)}
                              </td>
                              <td
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "13px",
                                }}
                              >
                                {product.unit}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  max={availableStock}
                                  step="1"
                                  inputMode="numeric"
                                  onWheel={(e) => e.target.blur()}
                                  value={transferQty}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      productId,
                                      e.target.value.replace(/\D/g, ""),
                                    )
                                  }
                                  style={{
                                    width: "100px",
                                    padding: "6px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid #000",
                                    fontFamily: "Poppins",
                                    fontSize: "13px",
                                    backgroundColor: "#fff",
                                    color: "#000",
                                  }}
                                  placeholder="0"
                                />
                              </td>
                              <td>
                                {transferQty > 0 && (
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() =>
                                      handleQuantityChange(productId, 0)
                                    }
                                    style={{
                                      fontFamily: "Poppins",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Remove
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Transfer Summary */}
          {transferItemsList.length > 0 && (
            <div
              className={styles.orderStatusCard}
              style={{ marginBottom: "24px" }}
            >
              <h4
                style={{
                  margin: 0,
                  marginBottom: "16px",
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  fontSize: "20px",
                  color: "var(--primary-color)",
                }}
              >
                Transfer Summary
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table
                  className="table table-bordered borderedtable table-sm"
                  style={{ fontFamily: "Poppins" }}
                >
                  <thead className="table-light">
                    <tr>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Product
                      </th>
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
                        Unit
                      </th>
                      <th
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferItemsList.map((item, index) => (
                      <tr
                        key={item.product.id || item.product.productId}
                        style={{
                          background:
                            index % 2 === 0
                              ? "rgba(59, 130, 246, 0.03)"
                              : "transparent",
                        }}
                      >
                        <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                          <div style={{ fontWeight: 600 }}>
                            {item.product.productName}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {item.product.productCode || item.product.sku}
                          </div>
                        </td>
                        <td
                          style={{
                            fontFamily: "Poppins",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          {Number(item.quantity || 0)}
                        </td>
                        <td style={{ fontFamily: "Poppins", fontSize: "13px" }}>
                          {TRANSFER_DISPLAY_UNIT}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.product.id || item.product.productId,
                                0,
                              )
                            }
                            style={{ fontFamily: "Poppins", fontSize: "12px" }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#eff6ff",
                  borderRadius: "8px",
                  fontFamily: "Poppins",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", color: "#475569" }}>
                      Total Items
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {transferItemsList.length} products
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "#475569" }}>
                      Total Quantity
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "var(--primary-color)",
                      }}
                    >
                      {totalItems} units
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "24px",
            }}
          >
            <button
              className="btn btn-light"
              onClick={
                editingTransferId
                  ? resetDraft
                  : () => navigate("/store/inventory")
              }
              disabled={submitting}
              style={{ fontFamily: "Poppins" }}
            >
              {editingTransferId ? "Discard Edit" : "Cancel"}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={
                submitting ||
                transferItemsList.length === 0 ||
                !selectedDestinationStore ||
                !recordedAt
              }
              style={{ fontFamily: "Poppins" }}
            >
              {submitting
                ? editingTransferId
                  ? "Saving Changes..."
                  : "Submitting..."
                : editingTransferId
                  ? "Save Transfer Changes"
                  : transferType === "sale"
                    ? "Record Sale"
                    : "Transfer Stock"}
            </button>
          </div>
        </>
      )}

      {/* History View */}
      {currentStore && viewMode === "history" && (
        <div className={styles.orderStatusCard}>
          <h4
            style={{
              margin: 0,
              marginBottom: "16px",
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "20px",
              color: "var(--primary-color)",
            }}
          >
            Transfer History
          </h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "flex-end",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#475569",
                  }}
                >
                  From Date
                </label>
                <input
                  type="date"
                  value={historyFromDate}
                  onChange={(e) => setHistoryFromDate(e.target.value)}
                  style={{
                    minWidth: "160px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid #dbe2ea",
                    fontFamily: "Poppins",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#475569",
                  }}
                >
                  To Date
                </label>
                <input
                  type="date"
                  value={historyToDate}
                  onChange={(e) => setHistoryToDate(e.target.value)}
                  style={{
                    minWidth: "160px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid #dbe2ea",
                    fontFamily: "Poppins",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#475569",
                  }}
                >
                  Rows Per Page
                </label>
                <select
                  value={historyLimit}
                  onChange={(e) => {
                    setHistoryPage(1);
                    setHistoryLimit(Number(e.target.value));
                  }}
                  style={{
                    minWidth: "120px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid #dbe2ea",
                    fontFamily: "Poppins",
                    background: "#fff",
                  }}
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-sm btn-success"
                  onClick={applyHistoryFilters}
                  style={{ fontFamily: "Poppins", padding: "8px 14px" }}
                >
                  Apply
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={resetHistoryFilters}
                  style={{ fontFamily: "Poppins", padding: "8px 14px" }}
                >
                  Reset
                </button>
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                minWidth: "220px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Loaded Results
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--primary-color)",
                }}
              >
                {visibleHistoryCount} / {totalHistoryCount}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Page {historyPagination.page || 1} of{" "}
                {historyPagination.totalPages || 1}
              </div>
            </div>
          </div>
          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              Loading history...
            </div>
          ) : transferHistory.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#666" }}
            >
              <p style={{ fontFamily: "Poppins" }}>No transfer history found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                className="table table-bordered borderedtable table-sm"
                style={{ fontFamily: "Poppins" }}
              >
                <thead className="table-light">
                  <tr>
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
                      "Transfer Code",
                      "historyTransferCode",
                      "data-history-transfer-code",
                    )}
                    {renderSearchHeader(
                      "Other Store",
                      "historyToStore",
                      "data-history-to-store",
                    )}
                    <th
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Direction
                    </th>
                    <th
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Items
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
                      Action
                    </th>
                  </tr>
                  {(searchTerms.historyTransferCode ||
                    searchTerms.historyToStore ||
                    hasAppliedHistoryFilters) && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: "4px 12px",
                          fontSize: "12px",
                          borderRadius: "0",
                          backgroundColor: "#f8f9fa",
                          color: "#666",
                        }}
                      >
                        Showing {filteredHistory.length} transfer
                        {filteredHistory.length === 1 ? "" : "s"} on this page
                        {hasAppliedHistoryFilters
                          ? " with the selected date range"
                          : ""}
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredHistory.map((transfer) => (
                    <tr key={transfer.id}>
                      <td>
                        {formatDateTimeIN(
                          transfer.transferDate || transfer.createdAt,
                        )}
                      </td>
                      <td>{transfer.transferCode || "-"}</td>
                      <td>
                        {buildOtherStoreLabel(transfer)}
                        {transfer.editHistoryCount > 0 && (
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
                            {transfer.editHistoryCount} edit
                            {transfer.editHistoryCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor: transfer.isOutgoing
                              ? "#dcfce7"
                              : "#dbeafe",
                            color: transfer.isOutgoing ? "#166534" : "#1d4ed8",
                          }}
                        >
                          {transfer.isOutgoing ? "OUTGOING" : "INCOMING"}
                        </span>
                      </td>
                      <td>
                        {transfer.items?.length || transfer.itemCount || 0}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor:
                              transfer.status === "completed"
                                ? "#dcfce7"
                                : transfer.status === "pending"
                                  ? "#fef9c3"
                                  : "#fee2e2",
                            color:
                              transfer.status === "completed"
                                ? "#166534"
                                : transfer.status === "pending"
                                  ? "#854d0e"
                                  : "#991b1b",
                          }}
                        >
                          {(transfer.status || "Unknown").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(transfer)}
                          style={{ fontSize: "12px" }}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleEditTransfer(transfer)}
                          disabled={!transfer.canEdit}
                          title={
                            transfer.canEdit
                              ? "Edit transfer"
                              : transfer.isLockedByMonthlyClose
                                ? "This transfer is locked after month close"
                                : transfer.isBeyondEditableWindow
                                  ? "This transfer is beyond your edit window"
                                  : "Only outgoing store-to-store transfers from this store can be edited here"
                          }
                          style={{ fontSize: "12px", marginLeft: "6px" }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleOpenTransferHistory(transfer)}
                          style={{ fontSize: "12px", marginLeft: "6px" }}
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Showing page {historyPagination.page || 1} of{" "}
                  {historyPagination.totalPages || 1}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={(historyPagination.page || 1) <= 1}
                    onClick={() =>
                      setHistoryPage((prev) => Math.max(prev - 1, 1))
                    }
                    style={{ fontFamily: "Poppins" }}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    disabled={
                      (historyPagination.page || 1) >=
                      (historyPagination.totalPages || 1)
                    }
                    onClick={() =>
                      setHistoryPage((prev) =>
                        Math.min(
                          prev + 1,
                          Number(historyPagination.totalPages || 1),
                        ),
                      )
                    }
                    style={{ fontFamily: "Poppins" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTransfer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={closeDetailModal}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "22px",
              padding: "24px",
              width: "90%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.28)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ margin: 0, fontFamily: "Poppins", fontWeight: 600 }}>
                Transfer Details
              </h4>
              <button
                onClick={closeDetailModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                marginBottom: "16px",
                padding: "14px 16px",
                borderRadius: "16px",
                border:
                  String(selectedTransfer.status || "").toLowerCase() ===
                  "rejected"
                    ? "1px solid #fecaca"
                    : String(selectedTransfer.status || "").toLowerCase() ===
                        "completed"
                      ? "1px solid #bbf7d0"
                      : "1px solid #fde68a",
                background:
                  String(selectedTransfer.status || "").toLowerCase() ===
                  "rejected"
                    ? "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)"
                    : String(selectedTransfer.status || "").toLowerCase() ===
                        "completed"
                      ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                      : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color:
                        String(selectedTransfer.status || "").toLowerCase() ===
                        "rejected"
                          ? "#b91c1c"
                          : String(
                                selectedTransfer.status || "",
                              ).toLowerCase() === "completed"
                            ? "#166534"
                            : "#92400e",
                    }}
                  >
                    TRANSFER STATUS
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color:
                        String(selectedTransfer.status || "").toLowerCase() ===
                        "rejected"
                          ? "#991b1b"
                          : String(
                                selectedTransfer.status || "",
                              ).toLowerCase() === "completed"
                            ? "#166534"
                            : "#854d0e",
                    }}
                  >
                    {(selectedTransfer.status || "Unknown").toUpperCase()}
                  </div>
                </div>
                <div
                  style={{
                    minWidth: "180px",
                    padding: "10px 12px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.8)",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Transfer Code
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800 }}>
                    {selectedTransfer.transferCode || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginBottom: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div>
                <small style={{ color: "#666" }}>Transfer Code</small>
                <div style={{ fontWeight: 600 }}>
                  {selectedTransfer.transferCode || "-"}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>Date</small>
                <div style={{ fontWeight: 600 }}>
                  {formatDateTimeIN(
                    selectedTransfer.transferDate || selectedTransfer.createdAt,
                  )}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>From Store</small>
                <div style={{ fontWeight: 600 }}>
                  {selectedTransfer.fromStore?.name || "-"}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>To Store</small>
                <div style={{ fontWeight: 600 }}>
                  {selectedTransfer.toStore?.name || "-"}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>Status</small>
                <div>
                  {(selectedTransfer.status || "Unknown").toUpperCase()}
                </div>
              </div>
              <div>
                <small style={{ color: "#666" }}>Type</small>
                <div>{selectedTransfer.transferType || "-"}</div>
              </div>
              {(selectedTransfer.remarks || selectedTransfer.notes) && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <small style={{ color: "#666" }}>Notes</small>
                  <div>
                    {selectedTransfer.remarks || selectedTransfer.notes}
                  </div>
                </div>
              )}
              {selectedTransfer.editHistoryCount > 0 && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <small style={{ color: "#666" }}>Change History</small>
                  <div style={{ fontWeight: 600, color: "#1d4ed8" }}>
                    {selectedTransfer.editHistoryCount} previous edit
                    {selectedTransfer.editHistoryCount > 1 ? "s" : ""} recorded
                  </div>
                </div>
              )}
              {(selectedTransfer.isBeyondEditableWindow ||
                selectedTransfer.isLockedByMonthlyClose) && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    borderRadius: "10px",
                    border: "1px solid #fed7aa",
                    background: selectedTransfer.isLockedByMonthlyClose
                      ? "#fef2f2"
                      : "#fff7ed",
                    color: selectedTransfer.isLockedByMonthlyClose
                      ? "#b91c1c"
                      : "#9a3412",
                    padding: "10px 12px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedTransfer.isLockedByMonthlyClose
                    ? "This transfer belongs to a locked month and can no longer be modified."
                    : "This transfer is beyond the normal modification window for your role."}
                </div>
              )}
            </div>

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
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Transfer Items
              </div>
              {detailLoading ? (
                <div
                  style={{
                    padding: "18px 16px",
                    fontSize: "14px",
                    color: "#475569",
                    background: "#fff",
                  }}
                >
                  Loading item details...
                </div>
              ) : (
                <table
                  className="table table-sm table-bordered"
                  style={{
                    fontFamily: "Poppins",
                    fontSize: "14px",
                    marginBottom: 0,
                  }}
                >
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Received Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedTransfer.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center" }}>
                          No transfer items found
                        </td>
                      </tr>
                    ) : (
                      (selectedTransfer.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div>
                              {item.product?.name ||
                                item.productName ||
                                "Product"}
                            </div>
                            <small style={{ color: "#666" }}>
                              {item.product?.SKU ||
                                item.product?.sku ||
                                item.sku ||
                                ""}
                            </small>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{item.receivedQuantity || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              {["pending", "completed"].includes(
                String(selectedTransfer.status || "").toLowerCase(),
              ) && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleEditTransfer(selectedTransfer)}
                  disabled={!selectedTransfer.canEdit}
                  title={
                    selectedTransfer.canEdit
                      ? "Edit transfer"
                      : selectedTransfer.isLockedByMonthlyClose
                        ? "This transfer is locked after month close"
                        : selectedTransfer.isBeyondEditableWindow
                          ? "This transfer is beyond your edit window"
                          : "Only store-to-store transfers can be edited here"
                  }
                  style={{ fontFamily: "Poppins" }}
                >
                  Edit Transfer
                </button>
              )}
              {selectedTransfer.editHistoryCount > 0 && (
                <button
                  className="btn btn-light btn-sm"
                  onClick={() => handleOpenTransferHistory(selectedTransfer)}
                  style={{
                    fontFamily: "Poppins",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    background: "#eff6ff",
                  }}
                >
                  History
                </button>
              )}
              {["pending", "Pending"].includes(selectedTransfer.status) && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleRejectTransferClick}
                  disabled={
                    selectedTransfer.isBeyondEditableWindow ||
                    selectedTransfer.isLockedByMonthlyClose
                  }
                  title={
                    selectedTransfer.isLockedByMonthlyClose
                      ? "This transfer is locked after month close"
                      : selectedTransfer.isBeyondEditableWindow
                        ? "This transfer is beyond your modification window"
                        : "Transfer Rejection"
                  }
                  style={{ fontFamily: "Poppins" }}
                >
                  Transfer Rejection
                </button>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadInvoice(selectedTransfer.id)}
                disabled={downloadLoading}
                style={{ fontFamily: "Poppins" }}
              >
                {downloadLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                      style={{ marginRight: "8px" }}
                    />
                    Downloading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-download"></i> Download Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditHistoryModal && historyTransfer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1070,
          }}
          onClick={() => {
            setShowEditHistoryModal(false);
            setHistoryTransfer(null);
          }}
        >
          <div
            style={{
              width: "min(760px, 94vw)",
              maxHeight: "82vh",
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
                <h4 style={{ margin: 0 }}>Transfer Edit History</h4>
                <div style={{ color: "#64748b", fontSize: "13px" }}>
                  {historyTransfer.transferCode ||
                    historyTransfer.transferNumber ||
                    `#${historyTransfer.id}`}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditHistoryModal(false);
                  setHistoryTransfer(null);
                }}
              >
                Close
              </button>
            </div>

            {(historyTransfer.editHistory || []).length === 0 ? (
              <div style={{ color: "#64748b", fontFamily: "Poppins" }}>
                No previous transfer edits recorded.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {(historyTransfer.editHistory || []).map((entry) => (
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
                        Edited on {formatDateTimeIN(entry.editedAt)}
                      </div>
                      <div style={{ fontSize: "13px", color: "#475569" }}>
                        By {entry.editor?.name || "Unknown"}
                      </div>
                    </div>

                    {entry.changeNote && (
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "13px",
                          color: "#334155",
                        }}
                      >
                        Note: {entry.changeNote}
                      </div>
                    )}

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
                          Old Destination
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {entry.beforeSnapshot?.transfer?.toStoreName || "-"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          New Destination
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {entry.afterSnapshot?.transfer?.toStoreName || "-"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          Old Recorded At
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {formatDateTimeIN(
                            entry.beforeSnapshot?.transfer?.transferDate,
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          New Recorded At
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {formatDateTimeIN(
                            entry.afterSnapshot?.transfer?.transferDate,
                          )}
                        </div>
                      </div>
                    </div>

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
                                : Qty {Number(item.quantity || 0)}
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
                                : Qty {Number(item.quantity || 0)}
                              </div>
                            ))}
                          </div>
                        )}
                        {entry.diff.items.changed?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#1d4ed8",
                                fontWeight: 700,
                                marginBottom: 4,
                              }}
                            >
                              Changed Items
                            </div>
                            {entry.diff.items.changed.map((item, idx) => (
                              <div
                                key={`changed-${idx}`}
                                style={{ fontSize: "12px", color: "#334155" }}
                              >
                                {item.productName ||
                                  item.productSku ||
                                  item.key}
                                : Qty {Number(item.before?.quantity || 0)} to{" "}
                                {Number(item.after?.quantity || 0)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1060, // Higher than detail modal
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => !rejectLoading && setShowRejectModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5
              style={{
                fontFamily: "Poppins",
                marginBottom: "16px",
                color: "#dc2626",
              }}
            >
              Confirm Rejection
            </h5>
            <p style={{ fontFamily: "Poppins", marginBottom: "24px" }}>
              Do you really want to reject stock transfer?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                className="btn btn-light"
                onClick={() => setShowRejectModal(false)}
                disabled={rejectLoading}
                style={{ fontFamily: "Poppins" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmRejectTransfer}
                disabled={rejectLoading}
                style={{ fontFamily: "Poppins" }}
              >
                {rejectLoading ? "Rejecting..." : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
}

export default StoreStockTransfer;
