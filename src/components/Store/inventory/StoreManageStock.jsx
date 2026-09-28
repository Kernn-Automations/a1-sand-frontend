import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import StoreImportPanel from "@/components/Store/inventory/StoreImportPanel";
import storeService from "@/services/storeService";
import {
  formatDateTimeIN,
  getCurrentDateTimeLocal,
  isFutureDateTimeLocal,
} from "@/utils/dateFormat";
import { isAdmin, isDivisionHead, isSuperAdmin } from "@/utils/roleUtils";
import styles from "../../Dashboard/Customers/Customer.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";

function StoreManageStock() {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastLedgerResult, setLastLedgerResult] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolverRef = useRef(null);
  const productCacheRef = useRef(new Map());
  const stockCacheRef = useRef(new Map());

  // Store ID
  const [storeId, setStoreId] = useState(null);
  const [storeCode, setStoreCode] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    productId: "",
    transactionType: "stockin",
    quantity: "",
    reason: "",
    recordedAt: getCurrentDateTimeLocal(),
  });

  // Data arrays
  const [products, setProducts] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const actualUser = userData.user || userData || {};
  const canUseBackdatedImport =
    isAdmin(actualUser) ||
    isSuperAdmin(actualUser) ||
    isDivisionHead(actualUser);

  const selectedProduct = products.find(
    (product) =>
      String(product.id || product.productId) === String(formData.productId),
  );
  const selectedActualProductId =
    selectedProduct?.productId ||
    selectedProduct?.product?.id ||
    selectedProduct?.id ||
    "";

  // Get store ID from multiple sources
  const getStoreContext = () => {
    try {
      // Priority 1: selectedStore from localStorage
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        try {
          const store = JSON.parse(selectedStore);
          if (store && store.id) {
            return {
              id: store.id,
              storeCode: store.storeCode || store.code || "",
            };
          }
        } catch (e) {
          console.error("Error parsing selectedStore:", e);
        }
      }

      // Priority 2: currentStoreId from localStorage
      const currentStoreId = localStorage.getItem("currentStoreId");
      if (currentStoreId) {
        const id = parseInt(currentStoreId);
        if (!isNaN(id)) {
          return { id, storeCode: "" };
        }
      }

      // Priority 3: From user data
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const user = userData.user || userData;
      if (user?.storeId) {
        return {
          id: user.storeId,
          storeCode: user.storeCode || user?.store?.storeCode || "",
        };
      }
      if (user?.store?.id) {
        return {
          id: user.store.id,
          storeCode: user.store.storeCode || "",
        };
      }

      return { id: null, storeCode: "" };
    } catch (err) {
      console.error("Error getting store ID:", err);
      return { id: null, storeCode: "" };
    }
  };

  // Load initial data
  useEffect(() => {
    const hydrateStoreContext = () => {
      const { id, storeCode: currentStoreCode } = getStoreContext();
      if (id) {
        setStoreId(id);
        setStoreCode(currentStoreCode || "");
        loadProducts(id);
      }
    };

    hydrateStoreContext();
    window.addEventListener("storeChanged", hydrateStoreContext);
    return () =>
      window.removeEventListener("storeChanged", hydrateStoreContext);
  }, []);

  // Load current stock as of the selected recorded time
  useEffect(() => {
    let cancelled = false;

    const fetchProductStock = async () => {
      if (!storeId || !formData.productId) {
        setCurrentStock(null);
        setStockLoading(false);
        return;
      }

      const resolvedProductId = selectedActualProductId || formData.productId;
      const cacheKey = `${storeId}:${resolvedProductId}:${formData.recordedAt || ""}`;
      const cachedStock = stockCacheRef.current.get(cacheKey);
      if (cachedStock) {
        setCurrentStock(cachedStock);
        setStockLoading(false);
        return;
      }

      try {
        const response = await storeService.getStoreProductStock(
          storeId,
          resolvedProductId,
          formData.recordedAt,
        );

        if (cancelled) return;

        const stockData = response?.data || {};
        const normalizedStock = {
          quantity: Number(stockData.stockQuantity || 0),
          unit: stockData.unit || "bag",
          recordedAt: stockData.recordedAt || formData.recordedAt,
        };
        stockCacheRef.current.set(cacheKey, normalizedStock);
        setCurrentStock(normalizedStock);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching product stock as of recorded time:", err);
        const fallbackStock = {
          quantity: 0,
          unit: "bag",
          recordedAt: formData.recordedAt,
        };
        stockCacheRef.current.set(cacheKey, fallbackStock);
        setCurrentStock(fallbackStock);
      } finally {
        if (!cancelled) {
          setStockLoading(false);
        }
      }
    };

    if (!formData.productId) {
      setCurrentStock(null);
      setStockLoading(false);
      return undefined;
    }

    setStockLoading(true);
    const timeoutId = setTimeout(fetchProductStock, 120);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    formData.productId,
    formData.recordedAt,
    selectedActualProductId,
    storeId,
  ]);

  const loadProducts = async (storeId) => {
    try {
      if (productCacheRef.current.has(storeId)) {
        setProducts(productCacheRef.current.get(storeId));
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      const response = await storeService.getStoreProducts(storeId, {
        compact: true,
        selector: true,
      });

      if (response.success) {
        const productList = response.data || response.products || [];
        productCacheRef.current.set(storeId, productList);
        setProducts(productList);
      } else if (response.data) {
        const productList = Array.isArray(response.data) ? response.data : [];
        productCacheRef.current.set(storeId, productList);
        setProducts(productList);
      } else if (Array.isArray(response)) {
        productCacheRef.current.set(storeId, response);
        setProducts(response);
      } else {
        setError(response.message || "Failed to load products");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products");
      setShowErrorModal(true);
    } finally {
      setPageLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "transactionType" &&
      (value === "openingstock" || value === "closingstock")
        ? {
            reason:
              prev.reason ||
              (value === "openingstock"
                ? "Opening stock for new store"
                : "Closing stock for selected date"),
          }
        : {}),
    }));
  };

  const promptUserConfirmation = ({
    title,
    message,
    confirmLabel = "Proceed",
    cancelLabel = "Cancel",
  }) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmDialog({
        title,
        message,
        confirmLabel,
        cancelLabel,
      });
    });

  const resolveConfirmation = (value) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    setConfirmDialog(null);
  };

  const submitStockChange = async ({ allowNegativeLedger = false } = {}) => {
    setError(null);
    setShowErrorModal(false);
    setSuccess(null);
    setShowSuccessModal(false);

    // Validation
    if (!formData.productId || !formData.quantity || !formData.reason) {
      setError("Please fill in all required fields");
      setShowErrorModal(true);
      return;
    }

    const parsedQuantity = Number(formData.quantity);
    if (
      Number.isNaN(parsedQuantity) ||
      !Number.isInteger(parsedQuantity) ||
      (formData.transactionType === "closingstock"
        ? parsedQuantity < 0
        : parsedQuantity <= 0)
    ) {
      setError(
        formData.transactionType === "closingstock"
          ? "Closing stock must be a whole number zero or greater"
          : "Quantity must be a whole number greater than 0",
      );
      setShowErrorModal(true);
      return;
    }

    if (isFutureDateTimeLocal(formData.recordedAt)) {
      setError("Recorded At cannot be a future date/time");
      setShowErrorModal(true);
      return;
    }

    if (!storeId) {
      setError("Store ID not found");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      // Call the manage-stock endpoint
      const response = await storeService.manageStoreStock(storeId, {
        productId: parseInt(formData.productId),
        transactionType: formData.transactionType,
        quantity: parsedQuantity,
        reason: formData.reason.trim(),
        recordedAt: formData.recordedAt,
        allowNegativeLedger,
      });

      const responseData = response;

      if (
        responseData.success ||
        response.status === 200 ||
        response.status === 201
      ) {
        const ledgerDetails = responseData.data || null;
        setError(null);
        setShowErrorModal(false);
        setSuccess(
          `${
            formData.transactionType === "openingstock"
              ? "Opening stock saved successfully!"
              : formData.transactionType === "closingstock"
                ? "Closing stock saved successfully!"
              : "Stock updated successfully!"
          }${
            ledgerDetails
              ? `\n\nBalance at recorded time: ${Number(
                  ledgerDetails.balanceAtRecordedAt || 0,
                )} ${currentStock?.unit || "bag"}`
              : ""
          }`,
        );
        setShowSuccessModal(true);
        setLastLedgerResult(ledgerDetails);

        const touchedProductId = String(
          selectedActualProductId || formData.productId || "",
        );
        if (touchedProductId) {
          Array.from(stockCacheRef.current.keys()).forEach((key) => {
            if (key.startsWith(`${storeId}:${touchedProductId}:`)) {
              stockCacheRef.current.delete(key);
            }
          });
        }

        // Reset form
        setFormData({
          productId: "",
          transactionType: "stockin",
          quantity: "",
          reason: "",
          recordedAt: getCurrentDateTimeLocal(),
        });
        setCurrentStock(null);

      } else {
        setError(responseData.message || "Failed to update stock");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("Error updating stock:", err);
      const responseData = err.response?.data || {};
      const errorCode = responseData.errorCode || responseData.code || null;
      const errorDetails = responseData.errorDetails || responseData.details || null;

      if (!allowNegativeLedger && errorCode === "NEGATIVE_LEDGER") {
        const runningBalance = Number(
          errorDetails?.runningBalance ??
            Number(errorDetails?.available || 0) -
              Number(errorDetails?.required || errorDetails?.quantity || 0),
        );
        const userConfirmed = await promptUserConfirmation({
          title: "Negative Ledger Warning",
          message: `This stock entry will make the ledger balance negative for ${getProductName(
            formData.productId,
          )} at ${formatDateTimeIN(
            errorDetails?.recordedAt || formData.recordedAt,
          )}.\n\nExpected balance after posting: ${runningBalance} ${
            currentStock?.unit || "bag"
          }.\n\nDo you want to continue anyway?`,
          confirmLabel: "Proceed Anyway",
          cancelLabel: "Cancel",
        });

        if (userConfirmed) {
          await submitStockChange({ allowNegativeLedger: true });
        }
        return;
      }

      const errorMessage =
        responseData.message || err.message || "Failed to update stock";
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    await submitStockChange({ allowNegativeLedger: false });
  };

  const getProductName = (productId) => {
    const product = products.find(
      (p) =>
        p.id === parseInt(productId) || p.productId === parseInt(productId),
    );
    return product ? product.name || product.productName : "Unknown Product";
  };

  const disableWheel = (e) => {
    e.target.blur();
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
        <i className="bi bi-chevron-right"></i> Manage Stock
      </p>

      <div className="row m-0 p-3">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className={styles.head} style={{ margin: 0 }}>
            Manage Stock
          </h5>
          <button
            className="homebtn"
            onClick={() => navigate("/store/inventory/manage-stock/history")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "36px",
              border: "1px solid var(--primary-color)",
              color: "var(--primary-color)",
              background: "#fff",
            }}
          >
            History
          </button>
        </div>

        {/* Product Selection */}
        <div className={`col-4 ${styles.longform}`}>
          <label>Product :</label>
          {pageLoading && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#64748b",
                marginLeft: "10px",
              }}
            >
              <Spinner size="xs" color="#003176" thickness="2px" />
              Loading products...
            </div>
          )}
          <select
            name="productId"
            value={formData.productId}
            onChange={handleInputChange}
            required
            disabled={pageLoading || loading}
          >
            <option value="">--Select Product--</option>
            {products.map((product) => (
              <option
                key={product.id || product.productId}
                value={product.id || product.productId}
              >
                {product.name || product.productName}
              </option>
            ))}
          </select>
        </div>

        {/* Current Stock Display */}
        {formData.productId && (
          <div className={`col-4 ${styles.longform}`}>
            <label>Current Stock :</label>
            <span
              className="ms-2"
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color:
                  Number(currentStock?.quantity || 0) > 0 ? "#28a745" : "#dc3545",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "24px",
              }}
            >
              {stockLoading && !currentStock ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Spinner size="sm" color="#003176" thickness="2px" />
                  Loading current stock...
                </span>
              ) : (
                <>
                  <span>{`${Number(currentStock?.quantity || 0)} ${currentStock?.unit || "bag"}`}</span>
                  {stockLoading ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    >
                      <Spinner size="xs" color="#003176" thickness="2px" />
                      Refreshing...
                    </span>
                  ) : null}
                </>
              )}
            </span>
            <div
              style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}
            >
              Showing stock as of {formatDateTimeIN(formData.recordedAt)}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Quantity :</label>
          <input
            type="number"
            step="1"
            min={formData.transactionType === "closingstock" ? "0" : "1"}
            inputMode="numeric"
            onWheel={disableWheel}
            name="quantity"
            value={formData.quantity}
            onChange={(e) =>
              handleInputChange({
                target: {
                  name: "quantity",
                  value: e.target.value.replace(/[^\d]/g, ""),
                },
              })
            }
            placeholder={
              formData.transactionType === "closingstock"
                ? "Enter closing stock"
                : "Enter quantity"
            }
            required
          />
          {formData.transactionType === "closingstock" && (
            <div
              style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}
            >
              This sets the exact closing balance for the selected date and
              time.
            </div>
          )}
        </div>

        {/* Transaction Type */}
        <div className={`col-3 ${styles.longform}`}>
          <label>Transaction Type :</label>
          <select
            name="transactionType"
            value={formData.transactionType}
            onChange={handleInputChange}
            required
          >
            <option value="stockin">Stock In</option>
            <option value="stockout">Stock Out</option>
            <option value="adjustment">Adjustment Reset</option>
            <option value="openingstock">Opening Stock</option>
            <option value="closingstock">Closing Stock</option>
          </select>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
            Manual stock only supports stock in, stock out, adjustment reset,
            opening stock, and closing stock.
          </div>
        </div>

        <div className={`col-3 ${styles.longform}`}>
          <label>Recorded At :</label>
          <input
            type="datetime-local"
            name="recordedAt"
            value={formData.recordedAt}
            onChange={handleInputChange}
            max={getCurrentDateTimeLocal()}
            required
          />
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
            Date format: DD/MM/YYYY HH:mm
          </div>
        </div>

        {/* Reason */}
        <div className={`col-6 ${styles.longform}`}>
          <label>Reason :</label>
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder={
              formData.transactionType === "openingstock"
                ? "Enter opening stock note for this store"
                : formData.transactionType === "closingstock"
                  ? "Enter closing stock note for this date"
                  : "Enter reason for this stock movement"
            }
            required
          />
        </div>
      </div>

      {lastLedgerResult && (
        <div className="row m-0 p-3">
          <div className="col-12">
            <div
              style={{
                borderRadius: "18px",
                border: "1px solid #bfdbfe",
                background:
                  "linear-gradient(135deg, rgba(239, 246, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)",
                boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#2563eb",
                    }}
                  >
                    Ledger Transparency
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Stock position after this entry
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  Recorded at{" "}
                  {formatDateTimeIN(
                    lastLedgerResult.recordedAt || formData.recordedAt,
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    borderRadius: "14px",
                    background: "#ffffff",
                    border: "1px solid #dbeafe",
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#475569" }}>
                    Balance At Recorded Time
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#0f766e",
                      marginTop: "4px",
                    }}
                  >
                    {Number(lastLedgerResult.balanceAtRecordedAt || 0)}{" "}
                    {currentStock?.unit || "bag"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Immediate balance after posting at the selected date and
                    time.
                  </div>
                </div>
              </div>

              {lastLedgerResult.laterAdjustmentBoundary && (
                <div
                  style={{
                    marginTop: "14px",
                    borderRadius: "12px",
                    border: "1px solid #fed7aa",
                    background: "#fff7ed",
                    color: "#9a3412",
                    padding: "12px 14px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  A later adjustment boundary exists on{" "}
                  <strong>
                    {formatDateTimeIN(
                      lastLedgerResult.laterAdjustmentBoundary.recordedAt,
                    )}
                  </strong>
                  . That later reset can make the current balance differ from
                  the balance at the recorded time.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit and Cancel Buttons */}
      <div className="row m-0 p-3 justify-content-center">
        <div className="col-3">
          <button
            className="submitbtn"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              position: "relative",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Spinner size="sm" color="white" thickness="2px" />
                Updating...
              </span>
            ) : formData.transactionType === "openingstock" ? (
              "Save Opening Stock"
            ) : formData.transactionType === "closingstock" ? (
              "Save Closing Stock"
            ) : (
              "Update Stock"
            )}
          </button>
          <button
            className="cancelbtn"
            onClick={() => {
              setFormData({
                productId: "",
                transactionType: "stockin",
                quantity: "",
                reason: "",
                recordedAt: getCurrentDateTimeLocal(),
              });
              setCurrentStock(null);
              setLastLedgerResult(null);
            }}
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {canUseBackdatedImport && (
        <div className="row m-0 p-3">
          <div className="col-12">
            <StoreImportPanel
              storeCode={storeCode}
              allowMultiStore={false}
              onImportSuccess={() => loadProducts(storeId)}
            />
          </div>
        </div>
      )}

      {showErrorModal && (
        <ErrorModal
          isOpen={showErrorModal}
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          message={success}
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/store/inventory");
          }}
        />
      )}

      {confirmDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
              padding: "24px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: "12px",
              }}
            >
              {confirmDialog.title}
            </div>
            <div
              style={{
                whiteSpace: "pre-line",
                color: "#334155",
                lineHeight: 1.6,
                fontSize: "15px",
              }}
            >
              {confirmDialog.message}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                className="cancelbtn"
                type="button"
                onClick={() => resolveConfirmation(false)}
                style={{ width: "auto", minWidth: "120px" }}
              >
                {confirmDialog.cancelLabel}
              </button>
              <button
                className="submitbtn"
                type="button"
                onClick={() => resolveConfirmation(true)}
                style={{ width: "auto", minWidth: "160px" }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StoreManageStock;
