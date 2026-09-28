import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import storeService from "../../../services/storeService";
import settingsService from "../../../services/settingsService";
import Loading from "../../Loading";
import ErrorModal from "../../ErrorModal";
import SuccessModal from "../../SuccessModal";
import compressImageToUnder100KB from "@/services/compressImageUnder100kb";
import {
  formatDateTimeIN,
  getCurrentDateTimeLocal,
  isFutureDateTimeLocal,
} from "@/utils/dateFormat";

const styles = {
  stepIndicator: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "5px",
    border: "1px solid #d9d9d9",
    boxShadow: "1px 1px 3px #333",
    gap: "12px",
    flexWrap: "wrap",
  },
  stepIndicatorMobile: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "12px",
    padding: "8px",
    backgroundColor: "white",
    borderRadius: "5px",
    border: "1px solid #d9d9d9",
    boxShadow: "1px 1px 3px #333",
    gap: "8px",
    flexWrap: "wrap",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  stepItemActive: {
    backgroundColor: "var(--primary-color)",
    color: "white",
  },
  stepItemCompleted: {
    backgroundColor: "#28a745",
    color: "white",
  },
  stepItemPending: {
    backgroundColor: "#f8f9fa",
    color: "#6c757d",
    border: "1px solid #dee2e6",
  },
  stepNumber: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
    width: "100%",
  },
  productGridMobile: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    width: "100%",
  },
  productCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    backgroundColor: "#fff",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
    transition: "all 0.2s ease",
  },
  productTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: "12px",
  },
  productInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
    color: "#475569",
  },
  productActions: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },
  productLoadingSpinner: {
    border: "2px solid #e2e8f0",
    borderTop: "2px solid var(--primary-color)",
    borderRadius: "50%",
    width: "14px",
    height: "14px",
    animation: "spin 1s linear infinite",
  },
  surfaceCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  sidebarCard: {
    background:
      "linear-gradient(180deg, rgba(239, 246, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)",
    border: "1px solid #dbeafe",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 22px 50px rgba(15, 23, 42, 0.08)",
  },
};

function StepIndicator({ step, steps, isMobile }) {
  const meta = steps.map((title, idx) => ({
    number: idx + 1,
    title,
    description:
      title === "Products"
        ? "Add products to cart"
        : title === "Overview"
          ? "Review order details"
          : "Payment information",
  }));

  return (
    <div
      style={
        isMobile
          ? { ...styles.stepIndicator, ...styles.stepIndicatorMobile }
          : styles.stepIndicator
      }
    >
      {meta.map((item, index) => {
        let stepStyle = { ...styles.stepItem };
        if (index < step)
          stepStyle = { ...stepStyle, ...styles.stepItemCompleted };
        else if (index === step)
          stepStyle = { ...stepStyle, ...styles.stepItemActive };
        else stepStyle = { ...stepStyle, ...styles.stepItemPending };

        return (
          <div key={item.title} style={stepStyle}>
            <div style={styles.stepNumber}>
              {index < step ? "✓" : index + 1}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.8 }}>
                {item.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StoreCreateSale() {
  const singleStepCheckout = true;
  const [step, setStep] = useState(0);

  // Step 1: mobile number
  const [mobile, setMobile] = useState("");
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [checking, setChecking] = useState(false);

  // Steps: Products, Overview, Payment
  const steps = useMemo(() => ["Products", "Overview", "Payment"], []);

  // Step 2: customer form (only if not exists)
  const [customerForm, setCustomerForm] = useState({
    name: "",
    mobile: "",
    email: "",
    area: "",
    city: "",
    pincode: "",
  });
  const [readonlyExisting, setReadonlyExisting] = useState(true);
  const [customerChecked, setCustomerChecked] = useState(false);

  // Step 2: products & cart
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [selectedProductForQty, setSelectedProductForQty] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [inputQuantity, setInputQuantity] = useState("");
  const [loadingProductIds, setLoadingProductIds] = useState(new Set());

  // Track original values for each item (itemId -> { basePrice, taxAmount, finalAmount })
  const [originalItemValues, setOriginalItemValues] = useState({});

  // Helper to prepare items for API payloads (shared by calculate and create)
  const prepareItemsForApi = () => {
    const items = cartItemsList
      .filter((item) => item.productId)
      .map((item) => {
        return {
          productId: item.productId,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice:
            item.unitPrice !== undefined ? item.unitPrice : item.price || 0,
          discountAmount: parseFloat(item.discountAmount) || 0,
          finalAmount: item.finalAmount, // Backend might use this as a hint or override
        };
      });
    return items;
  };

  // Step 2: Payment
  const [mobileNumber, setMobileNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Replaced single discount with array of discount objects
  const [discounts, setDiscounts] = useState([]); // [{ id: timestamp, productIds: [], amount: '', reason: '' }]
  const [activeDiscountDropdown, setActiveDiscountDropdown] = useState(null); // ID of discount row with active product dropdown
  const [fridgeAmount, setFridgeAmount] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [cows, setCows] = useState("");
  const [buffaloes, setBuffaloes] = useState("");
  const [additionalAnimals, setAdditionalAnimals] = useState([]);

  // Customer search states for payment step
  const [farmerSearchTerm, setFarmerSearchTerm] = useState("");
  const [farmerSearchResults, setFarmerSearchResults] = useState([]);
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const [farmerSearchLoading, setFarmerSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const farmerSearchRef = useRef(null);
  const farmerSearchTimeoutRef = useRef(null);
  const productListCacheRef = useRef(new Map());
  const recentCustomersCacheRef = useRef([]);
  const customerSearchCacheRef = useRef(new Map());
  const mobileLookupCacheRef = useRef(new Map());
  const villageSearchCacheRef = useRef(new Map());

  // Village search states
  const [villageSearchTerm, setVillageSearchTerm] = useState("");
  const [storeVillages, setStoreVillages] = useState([]);
  // Village creation states
  const [showAddVillageModal, setShowAddVillageModal] = useState(false);
  const [newVillageNameInput, setNewVillageNameInput] = useState("");
  const [creatingVillage, setCreatingVillage] = useState(false);

  // Dummy customer data - Replace with actual API call later
  const dummyCustomers = [
    {
      id: 1,
      name: "Kaushik Patel",
      mobile: "9876543210",
      village: "Gandhinagar",
      area: "Sector 5",
      city: "Gandhinagar",
    },
    {
      id: 2,
      name: "Kaushik Sharma",
      mobile: "9876543211",
      village: "Ahmedabad",
      area: "Navrangpura",
      city: "Ahmedabad",
    },
    {
      id: 3,
      name: "Rajesh Kumar",
      mobile: "9876543212",
      village: "Surat",
      area: "Adajan",
      city: "Surat",
    },
    {
      id: 4,
      name: "Priya Mehta",
      mobile: "9876543213",
      village: "Vadodara",
      area: "Makarpura",
      city: "Vadodara",
    },
    {
      id: 5,
      name: "Amit Singh",
      mobile: "9876543214",
      village: "Rajkot",
      area: "University Road",
      city: "Rajkot",
    },
    {
      id: 6,
      name: "Sneha Patel",
      mobile: "9876543215",
      village: "Bhavnagar",
      area: "Talaja",
      city: "Bhavnagar",
    },
    {
      id: 7,
      name: "Vikram Desai",
      mobile: "9876543216",
      village: "Anand",
      area: "Vidyanagar",
      city: "Anand",
    },
    {
      id: 8,
      name: "Pooja Shah",
      mobile: "9876543217",
      village: "Mehsana",
      area: "Modhera",
      city: "Mehsana",
    },
  ];
  const [generatedOrderId] = useState(
    () => `STORE-${Date.now().toString().slice(-6)}`,
  );
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [payments, setPayments] = useState([
    {
      transactionDate: getTodayDate(),
      paymentMethod: "cash", // "cash", "bank", or "both"
      paymentMode: "", // "UPI", "Card", or "Bank Transfer" (only when paymentMethod is "bank" or "both")
      amount: "", // Total amount when paymentMethod is "both", or single amount for cash/bank
      cashAmount: "", // Amount for cash payment (only when paymentMethod is "both")
      bankAmount: "", // Amount for bank payment (only when paymentMethod is "both")
      reference: "",
      remark: "",
      utrNumber: "", // UTR number for bank payments
      cashProofFile: null,
      cashProofPreviewUrl: null,
      cashProofBase64: null,

      bankProofFile: null,
      bankProofPreviewUrl: null,
      bankProofBase64: null,
    },
  ]);
  const [activePaymentTab, setActivePaymentTab] = useState(0);
  const [qrCodeData, setQrCodeData] = useState({}); // Store QR code data for each payment: { paymentIndex: { upiId, amount, showQR } }
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [editDraftMeta, setEditDraftMeta] = useState(null);
  const [editSettlementMode, setEditSettlementMode] = useState("collect_now");
  const [editSettlementNote, setEditSettlementNote] = useState("");
  const [editSettlementAcknowledged, setEditSettlementAcknowledged] =
    useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState(null); // { subtotal, tax, total }
  const [calculatingTotal, setCalculatingTotal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editSaleId = searchParams.get("editSaleId");
  const [recordedAt, setRecordedAt] = useState(getCurrentDateTimeLocal());
  const [hasManuallyChangedRecordedAt, setHasManuallyChangedRecordedAt] =
    useState(Boolean(editSaleId));
  const [creditUsageEnabled, setCreditUsageEnabled] = useState(false);
  const deferredRecordedAt = useDeferredValue(recordedAt);
  const effectiveProductsRecordedAt =
    editSaleId && deferredRecordedAt
      ? deferredRecordedAt
      : hasManuallyChangedRecordedAt && deferredRecordedAt
        ? deferredRecordedAt
        : "";

  // Get current store ID from localStorage
  const getStoreId = () => {
    try {
      const selectedStore = localStorage.getItem("selectedStore");
      if (selectedStore) {
        const store = JSON.parse(selectedStore);
        return store.id;
      }
      const currentStoreId = localStorage.getItem("currentStoreId");
      return currentStoreId ? parseInt(currentStoreId) : null;
    } catch (e) {
      console.error("Error parsing store data:", e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadOperationalSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        const value = response?.setting?.value || {};
        if (isMounted) {
          setCreditUsageEnabled(Boolean(value.customer_credit_usage_enabled));
        }
      } catch (err) {
        console.warn("Could not load credit usage settings:", err?.message);
      }
    };

    loadOperationalSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const sanitizeMobile = (value = "") =>
    String(value || "")
      .replace(/[^0-9]/g, "")
      .slice(-10);

  const getCartItemUnitPrice = (item) => {
    const parsedPrice = Number(
      item?.unitPrice !== undefined ? item.unitPrice : item?.price || 0,
    );
    return Number.isFinite(parsedPrice) ? parsedPrice : 0;
  };

  const getCartItemDisplayTotal = (item) => {
    if (
      item?.finalAmount !== undefined &&
      item?.finalAmount !== null &&
      item?.finalAmount !== ""
    ) {
      const parsedFinalAmount = Number(item.finalAmount);
      if (Number.isFinite(parsedFinalAmount)) {
        return parsedFinalAmount;
      }
    }

    const quantity = Number(item?.quantity || 0);
    const unitPrice = getCartItemUnitPrice(item);
    const computedTotal = unitPrice * quantity;
    if (Number.isFinite(computedTotal)) {
      return computedTotal;
    }

    const storedTotal = Number(item?.totalPrice || 0);
    return Number.isFinite(storedTotal) ? storedTotal : 0;
  };

  const updateCartItemFromUnitPrice = (itemId, rawValue) => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) return prev;

      const quantity = Number(currentItem.quantity || 0);
      const nextUnitPrice =
        rawValue === "" ? 0 : Number.parseFloat(rawValue || 0);
      const safeUnitPrice = Number.isFinite(nextUnitPrice) ? nextUnitPrice : 0;
      const nextTotal = safeUnitPrice * quantity;

      return {
        ...prev,
        [itemId]: {
          ...currentItem,
          price: safeUnitPrice,
          unitPrice: safeUnitPrice,
          totalPrice: nextTotal,
          finalAmount: quantity > 0 ? nextTotal : 0,
        },
      };
    });
  };

  const updateCartItemFromTotal = (itemId, rawValue) => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) return prev;

      const quantity = Number(currentItem.quantity || 0);
      const nextTotal =
        rawValue === "" ? 0 : Number.parseFloat(rawValue || 0);
      const safeTotal = Number.isFinite(nextTotal) ? nextTotal : 0;
      const derivedUnitPrice =
        quantity > 0 ? Number((safeTotal / quantity).toFixed(2)) : 0;

      return {
        ...prev,
        [itemId]: {
          ...currentItem,
          price: derivedUnitPrice,
          unitPrice: derivedUnitPrice,
          totalPrice: safeTotal,
          finalAmount: safeTotal,
        },
      };
    });
  };

  const normalizeCustomerResults = (customers = []) =>
    Array.isArray(customers)
      ? customers.map((customer) => {
          const displayName =
            customer.name ||
            customer.farmerName ||
            customer.label ||
            customer.customerName ||
            "";
          const displayVillage =
            customer.villageName || customer.village || customer.area || "";

          return {
            id: customer.id || customer.customerId,
            name: displayName,
            farmerName: customer.farmerName || displayName,
            customerCode: customer.customerCode || "",
            mobile:
              customer.mobile || customer.phone || customer.phoneNo || "",
            village:
              displayVillage ||
              customer.villageName ||
              customer.village ||
              customer.area ||
              "",
            villageName:
              customer.villageName ||
              displayVillage ||
              customer.village ||
              customer.area ||
              "",
            area: customer.area || "",
            city: customer.city || "",
            state: customer.state || "",
            pincode: customer.pincode || "",
            address: customer.address || "",
            noOfCows: customer.noOfCows || "",
            noOfBuffaloes: customer.noOfBuffaloes || "",
            totalPurchases: customer.totalPurchases,
            lastPurchaseDate: customer.lastPurchaseDate,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
            storeId: customer.storeId,
          };
        })
      : [];

  const cacheCustomers = (customers = []) => {
    if (!Array.isArray(customers) || customers.length === 0) return;
    const existingById = new Map(
      recentCustomersCacheRef.current.map((customer) => [customer.id, customer]),
    );
    customers.forEach((customer) => {
      if (customer?.id) {
        existingById.set(customer.id, customer);
      }
      const mobileKey = sanitizeMobile(customer?.mobile);
      if (mobileKey) {
        mobileLookupCacheRef.current.set(mobileKey, customer);
      }
    });
    recentCustomersCacheRef.current = Array.from(existingById.values()).slice(
      0,
      150,
    );
  };

  useEffect(() => {
    if (!editSaleId) return;

    const draftRaw = localStorage.getItem("storeSaleEditDraft");
    if (!draftRaw) return;

    try {
      const draft = JSON.parse(draftRaw);
      setEditDraftMeta({
        saleId: draft.id || null,
        saleCode: draft.saleCode || null,
        invoiceNumber:
          draft.invoice?.invoiceNumber ||
          draft.invoices?.[0]?.invoiceNumber ||
          null,
        originalGrandTotal:
          Number(
            draft.invoice?.grandTotal ||
              draft.invoices?.[0]?.grandTotal ||
              draft.grandTotal ||
              0,
          ) || 0,
        customerName:
          draft.customer?.farmerName ||
          draft.customer?.name ||
          draft.customerName ||
          null,
        createdAt: draft.createdAt || null,
        editableUntil: draft.editableUntil || null,
        customerOutstandingCredit:
          Number(draft.customerOutstandingCredit || 0) || 0,
        pendingAdditionalCollection:
          Number(draft.pendingAdditionalCollection || 0) || 0,
        customerCreditLimit: Number(draft.customerCreditLimit || 0) || 0,
        customerRequiresIdentityForCredit: Boolean(
          draft.customerRequiresIdentityForCredit,
        ),
      });
      setRecordedAt(
        draft.createdAt
          ? new Date(draft.createdAt).toISOString().slice(0, 16)
          : getCurrentDateTimeLocal(),
      );

      if (draft.customer) {
        setExistingCustomer(draft.customer);
        setCustomerChecked(true);
        setCustomerForm((prev) => ({
          ...prev,
          name: draft.customer.name || draft.customer.farmerName || "",
          mobile: draft.customer.mobile || "",
        }));
        setMobileNumber(draft.customer.mobile || "");
        setFarmerName(draft.customer.farmerName || draft.customer.name || "");
        setVillageName(draft.customer.village || "");
      }

      if (Array.isArray(draft.items) && draft.items.length > 0) {
        const nextCart = {};
        draft.items.forEach((item) => {
          const key = item.productId;
          const quantity = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice || 0);
          const parsedFinalAmount =
            item.finalAmount !== undefined && item.finalAmount !== null
              ? Number(item.finalAmount)
              : undefined;
          nextCart[key] = {
            id: key,
            storeProductId: key,
            productId: item.productId,
            name: item.product?.name || item.productName || "Product",
            sku: item.product?.SKU || item.sku || "",
            productType: item.product?.productType || item.productType || "packed",
            unit: "bag",
            price: unitPrice,
            unitPrice,
            quantity,
            totalPrice:
              Number(item.totalPrice || 0) ||
              (Number.isFinite(parsedFinalAmount)
                ? parsedFinalAmount
                : unitPrice * quantity),
            discountAmount: Number(item.discountAmount || 0),
            finalAmount: Number.isFinite(parsedFinalAmount)
              ? parsedFinalAmount
              : undefined,
          };
        });
        setCartItems(nextCart);
      }

      if (Array.isArray(draft.payments) && draft.payments.length > 0) {
        setPayments(
          draft.payments.map((payment) => ({
            transactionDate: payment.transactionDate
              ? new Date(payment.transactionDate).toISOString().slice(0, 10)
              : getTodayDate(),
            paymentMethod: payment.paymentMethod || "cash",
            paymentMode: "",
            amount: payment.amount || "",
            cashAmount: "",
            bankAmount: "",
            reference: "",
            remark: payment.remarks || "",
            utrNumber: payment.transactionNumber || "",
            cashProofFile: null,
            cashProofPreviewUrl: null,
            cashProofBase64: null,
            bankProofFile: null,
            bankProofPreviewUrl: null,
            bankProofBase64: null,
          })),
        );
      }

      setNotes(draft.notes || "");
      setStep(1);
    } catch (error) {
      console.error("Failed to hydrate edit draft:", error);
    }
  }, [editSaleId]);

  const handleCheckMobile = async (mobileNumber = mobile) => {
    const cleanedMobile = sanitizeMobile(mobileNumber);
    const storeId = getStoreId();
    if (cleanedMobile.length !== 10 || !storeId) return;

    try {
      setChecking(true);
      setCustomerChecked(false);
      let customer = mobileLookupCacheRef.current.get(cleanedMobile) || null;

      if (!customer) {
        const response = await storeService.searchStoreCustomers(
          storeId,
          cleanedMobile,
          10,
        );
        const customers = normalizeCustomerResults(
          response.data || response.customers || response || [],
        );
        cacheCustomers(customers);
        customer =
          customers.find(
            (entry) => sanitizeMobile(entry.mobile) === cleanedMobile,
          ) || null;
      }

      if (customer) {
        setExistingCustomer(customer);
        setCustomerForm({
          name: customer.name || customer.farmerName || "",
          mobile: customer.mobile || cleanedMobile,
          email: customer.email || "",
          area: customer.area || "",
          city: customer.city || "",
          pincode: customer.pincode || "",
        });
        setReadonlyExisting(true);
      } else {
        console.log("No customer found");
        setExistingCustomer(null);
        setCustomerForm((f) => ({ ...f, mobile: cleanedMobile }));
      }
      setCustomerChecked(true);
    } catch (error) {
      console.error("Error checking customer:", error);
      setExistingCustomer(null);
      setCustomerForm((f) => ({ ...f, mobile: cleanedMobile }));
      setCustomerChecked(true);
    } finally {
      setChecking(false);
    }
  };

  // Search customers by farmer name - using backend API
  const searchFarmers = async (searchTerm = "") => {
    const storeId = getStoreId();
    if (!storeId) {
      console.warn("Store ID not found, cannot search customers");
      setFarmerSearchResults([]);
      return;
    }

    setFarmerSearchLoading(true);
    try {
      const trimmedTerm = searchTerm.trim();
      let formattedCustomers = [];

      if (!trimmedTerm) {
        if (recentCustomersCacheRef.current.length > 0) {
          formattedCustomers = recentCustomersCacheRef.current;
        } else {
          const response = await storeService.getStoreCustomers(storeId, {
            limit: 100,
          });
          formattedCustomers = normalizeCustomerResults(
            response.data?.customers || response.customers || response.data || [],
          );
          cacheCustomers(formattedCustomers);
        }
      } else {
        const cacheKey = trimmedTerm.toLowerCase();
        if (customerSearchCacheRef.current.has(cacheKey)) {
          formattedCustomers = customerSearchCacheRef.current.get(cacheKey);
        } else {
          const response = await storeService.searchStoreCustomers(
            storeId,
            trimmedTerm,
            20,
          );
          formattedCustomers = normalizeCustomerResults(
            response.data || response.customers || response || [],
          );
          customerSearchCacheRef.current.set(cacheKey, formattedCustomers);
          cacheCustomers(formattedCustomers);
        }
      }

      setFarmerSearchResults(formattedCustomers);
      if (!showFarmerDropdown) {
        setShowFarmerDropdown(true);
      }
    } catch (err) {
      console.error("Error searching farmers:", err);
      console.error("Error details:", err.response?.data || err.message);
      setFarmerSearchResults([]);
      // Don't show error modal for search failures - just log and continue
    } finally {
      setFarmerSearchLoading(false);
    }
  };

  // Get unique villages from customers - fetch from API when needed
  // Filter villages using backend API
  const filterVillages = async (searchTerm = "") => {
    // This is now handled by the select dropdown
    // But keeping it empty if needed for future search within dropdown
  };

  // Handle farmer search input with debounce
  const handleFarmerSearchChange = (value) => {
    const processedValue = value.replace(/\s\s+/g, ' ');
    setFarmerSearchTerm(processedValue);

    // Clear existing timeout
    if (farmerSearchTimeoutRef.current) {
      clearTimeout(farmerSearchTimeoutRef.current);
    }

    // Show all customers if field is focused/clicked, or search if typing
    if (processedValue && processedValue.trim().length > 0) {
      // Debounce search (wait 300ms after user stops typing)
      farmerSearchTimeoutRef.current = setTimeout(() => {
        searchFarmers(processedValue);
      }, 300);
    } else {
      // If empty, show all customers
      searchFarmers("");
    }
  };

  // Handle farmer field focus - show all customers
  const handleFarmerFieldFocus = () => {
    if (!showFarmerDropdown) {
      searchFarmers("");
    }
    setShowFarmerDropdown(true);
  };

  // Handle village search input
  const handleVillageSearchChange = (value) => {
    setVillageSearchTerm(value);
  };

  const fetchStoreVillages = async (storeId, { silent = false } = {}) => {
    if (!storeId) return;
    try {
      const response = await storeService.getStoreVillages(storeId);
      const villagesPayload =
        response.data || response.villages || response || [];
      const mapped = Array.isArray(villagesPayload)
        ? villagesPayload.map((village) => ({
            id: village.id || village.villageId || village.value || village,
            villageName: village.villageName || village.label || village.value || village,
          }))
        : [];
      setStoreVillages(mapped);
    } catch (err) {
      if (!silent) {
        console.warn("Error fetching villages:", err?.message || err);
      }
    }
  };

  const handleCreateVillage = async () => {
    if (!newVillageNameInput || !newVillageNameInput.trim()) {
      setError("Please enter a village name");
      setIsErrorModalOpen(true);
      return;
    }

    const storeId = getStoreId();
    if (!storeId) return;

    try {
      setCreatingVillage(true);
      const response = await storeService.createStoreVillage(
        storeId,
        newVillageNameInput.trim(),
      );

      if (response && response.success) {
        // Select the newly created village
        const createdVillageName =
          response.data?.villageName || newVillageNameInput.trim();
        setStoreVillages((prev) => {
          const exists = prev.some(
            (village) =>
              String(village.villageName || village.value || "")
                .toLowerCase()
                .trim() === createdVillageName.toLowerCase().trim(),
          );
          if (exists) return prev;
          const next = [
            ...prev,
            {
              id: response.data?.id || `local-${Date.now()}`,
              villageName: createdVillageName,
            },
          ];
          return next.sort((a, b) =>
            String(a.villageName || "").localeCompare(String(b.villageName || "")),
          );
        });
        villageSearchCacheRef.current.clear();
        setVillageName(createdVillageName);
        setVillageSearchTerm(createdVillageName);

        // Close modal and reset
        setShowAddVillageModal(false);
        setNewVillageNameInput("");
        setSuccessMessage("Village added successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error creating village:", err);
      const errorMessage = err?.response?.data?.message || err.message || "Failed to create village";
      if (errorMessage.toLowerCase().includes("already exists")) {
        await fetchStoreVillages(storeId, { silent: true });
      }
      setError(err.message || "Failed to create village");
      setIsErrorModalOpen(true);
    } finally {
      setCreatingVillage(false);
    }
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    if (customer === "CREATE_NEW") {
      // User wants to create new customer - keep current search term as farmer name
      setFarmerName(farmerSearchTerm);
      setSelectedCustomer(null);
      setShowFarmerDropdown(false);
      // Keep village and mobile empty for new customer
      return;
    }

    // Populate all fields with selected customer data
    // Use name if available, otherwise fall back to farmerName or label
    const customerDisplayName =
      customer.name || customer.farmerName || customer.label || "";
    const customerVillage = customer.village || customer.villageName || "";
    const customerMobile =
      customer.mobile || customer.phone || customer.phoneNo || "";

    setFarmerName(customerDisplayName);
    setVillageName(customerVillage);
    setMobileNumber(customerMobile);
    setFarmerSearchTerm(
      customerVillage
        ? `${customerDisplayName} - ${customerVillage}`
        : customerDisplayName,
    );
    setVillageSearchTerm(customerVillage);
    setSelectedCustomer(customer);
    setShowFarmerDropdown(false);
    setFarmerSearchResults([]);
  };

  // Sync villageSearchTerm with villageName when villageName changes externally
  useEffect(() => {
    if (villageName && villageSearchTerm !== villageName) {
      setVillageSearchTerm(villageName);
    }
  }, [villageName]);

  // Sync farmerSearchTerm with farmerName when farmerName changes externally
  useEffect(() => {
    if (!selectedCustomer && farmerName && !showFarmerDropdown) {
      // Only sync if no customer is selected and not actively searching
      if (farmerSearchTerm !== farmerName) {
        setFarmerSearchTerm(farmerName);
      }
    }
  }, [farmerName, selectedCustomer, showFarmerDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        farmerSearchRef.current &&
        !farmerSearchRef.current.contains(event.target)
      ) {
        setShowFarmerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch real products from store products API
  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      const storeId = getStoreId();
      if (!storeId) {
        console.warn("Store ID not found, cannot fetch products");
        console.warn("Available localStorage keys:", {
          selectedStore: localStorage.getItem("selectedStore"),
          currentStoreId: localStorage.getItem("currentStoreId"),
          user: localStorage.getItem("user"),
        });
        setProductsLoading(false);
        return;
      }

      const cacheKey = effectiveProductsRecordedAt
        ? `${storeId}::${effectiveProductsRecordedAt}`
        : null;
      const cached = cacheKey
        ? productListCacheRef.current.get(cacheKey)
        : null;

      if (cached) {
        if (!active) return;
        setProducts(cached.products || []);
        if (Array.isArray(cached.villages) && cached.villages.length > 0) {
          setStoreVillages(cached.villages);
        }
        return;
      }

      try {
        if (active) {
          setProductsLoading(true);
        }

        const response = await storeService.getStoreProductsForSale(
          storeId,
          "",
          "",
          effectiveProductsRecordedAt,
          { compact: true },
        );

        if (response.success && Array.isArray(response.data)) {
          // Map API response - /stores/:storeId/products/for-sale returns simplified structure
          const mappedProducts = response.data.map((item) => ({
            id: item.id, // Store product ID (this is what we need for the sale)
            storeProductId: item.id, // Store product ID
            productId: item.productId, // Original product ID
            name: item.productName || "-",
            sku: item.sku || "-",
            quantity: item.stock || 0, // Available stock
            unit: item.unit || "kg",
            basePrice: item.basePrice || 0,
            customPrice: item.customPrice, // Keep track of custom price
            price: item.customPrice || item.price || item.basePrice || 0, // Prioritize custom price
            isOutOfStock: item.isOutOfStock || false,
          }));
          const mappedVillages = Array.isArray(response.villages)
            ? response.villages.map((villageName, index) => ({
                id: `prefetched-${index}`,
                villageName,
              }))
            : Array.isArray(response.data?.villages)
              ? response.data.villages || []
              : [];

          if (cacheKey) {
            productListCacheRef.current.set(cacheKey, {
              products: mappedProducts,
              villages: mappedVillages,
            });
          }

          if (!active) return;
          setProducts(mappedProducts);
          if (Array.isArray(response.villages)) {
            setStoreVillages(mappedVillages);
          } else if (mappedVillages.length > 0) {
            setStoreVillages(mappedVillages);
          } else if (storeVillages.length === 0) {
            await fetchStoreVillages(storeId, { silent: true });
          }
        } else {
          const errorMsg = response.message || "Failed to load products";
          console.error("Failed to fetch products:", errorMsg, response);
          if (active && products.length === 0) {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        console.error("Error details:", err.response?.data || err.message);
        if (active && products.length === 0) {
          setProducts([]);
        }
      } finally {
        if (active) {
          setProductsLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, [effectiveProductsRecordedAt, storeVillages.length, editSaleId]);

  useEffect(() => {
    const storeId = getStoreId();
    if (!storeId) return;
    fetchStoreVillages(storeId, { silent: true });
  }, []);

  useEffect(() => {
    const storeId = getStoreId();
    if (!storeId) return;

    let active = true;
    const preloadRecentCustomers = async () => {
      try {
        const response = await storeService.getStoreCustomers(storeId, {
          limit: 100,
        });
        if (!active) return;
        const customers = normalizeCustomerResults(
          response.data?.customers || response.customers || response.data || [],
        );
        cacheCustomers(customers);
      } catch (error) {
        console.warn("Could not preload recent store customers:", error?.message);
      }
    };

    preloadRecentCustomers();
    return () => {
      active = false;
    };
  }, []);

  const cartItemsList = useMemo(
    () =>
      Object.values(cartItems).map((item) => ({
        ...item,
        totalPrice: getCartItemDisplayTotal(item),
      })),
    [cartItems],
  );
  const cartItemsCount = cartItemsList.length;
  const totalCartValue = cartItemsList.reduce(
    (sum, item) => sum + getCartItemDisplayTotal(item),
    0,
  );

  // 1. Stringify the cart items to create a stable dependency
  // This only changes if IDs or quantities actually change
  // 1. Create a stable "Fingerprint" of your cart data.
  // This string only changes if a specific value that affects the total changes.
  const cartFingerprint = JSON.stringify(
    Object.values(cartItems).map((item) => ({
      id: item.id,
      qty: item.quantity,
      price: item.unitPrice,
      finalAmount: item.finalAmount,
      discount: item.discountAmount, // Included the per-item discount here
    })),
  );
  const deferredCartFingerprint = useDeferredValue(cartFingerprint);
  const deferredFreightAmount = useDeferredValue(fridgeAmount);

  useEffect(() => {
    if (submitting || cartItemsCount === 0) {
      setCalculatedTotal(null);
      return;
    }

    const calculateTotal = async () => {
      const storeId = getStoreId();
      if (!storeId) return;

      try {
        setCalculatingTotal(true);
        const items = prepareItemsForApi(); // This uses your existing helper

        const calculateData = {
          storeId: storeId,
          items: items,
          discountAmount: 0, // Per-item discounts are already inside 'items'
          fridgeAmount: parseFloat(fridgeAmount) || 0,
          freightCharges: parseFloat(fridgeAmount) || 0,
        };

        const response = await storeService.calculateSaleTotal(calculateData);

        if (response && response.success && response.data) {
          const data = response.data.summary || response.data;

          // Prevent re-setting state if values are identical
          setCalculatedTotal((prev) => {
            const isSame =
              prev &&
              prev.total === (data.grandTotal || data.total) &&
              prev.tax === (data.taxAmount || data.tax);

            if (isSame) return prev;

            return {
              subtotal: data.subtotal || data.totalAmount,
              tax: data.taxAmount || data.tax || 0,
              discountAmount: data.discountAmount || 0,
              freightCharges: data.freightCharges || data.fridgeAmount || 0,
              total: data.grandTotal || data.total,
            };
          });
        }
      } catch (err) {
        console.error("Error calculating total:", err);
      } finally {
        setCalculatingTotal(false);
      }
    };

    // Debounce to prevent rapid typing from hitting the server
    const timeoutId = setTimeout(calculateTotal, 350);
    return () => clearTimeout(timeoutId);

    // We only re-run if the fingerprint changes or freight changes
    // We EXCLUDE 'originalItemValues' from here to stop the infinite loop
  }, [deferredCartFingerprint, deferredFreightAmount, submitting]);
  // Update original item values with tax when calculatedTotal is available
  useEffect(() => {
    if (!calculatedTotal || !cartItemsCount) return;

    const totalTax = calculatedTotal.tax || 0;
    const totalBase = totalCartValue;

    // Calculate tax proportionally for each item
    setOriginalItemValues((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      cartItemsList.forEach((item) => {
        if (updated[item.id]) {
          const unitPrice =
            item.unitPrice !== undefined ? item.unitPrice : item.price || 0;
          const itemBaseTotal = unitPrice * item.quantity;
          // Calculate tax proportionally based on item's share of total base
          // Note: totalBase should also reflect edited prices ideally, but for now we use totalCartValue (original) as approximation or re-sum it.
          // Better: Re-calculate totalBase from effective prices.
          // However, keeping it simple as per original logic structure, but using itemBaseTotal for this item.
          // If we want perfect proportion, we need sum of all itemBaseTotals.

          const itemTax =
            totalBase > 0 ? (itemBaseTotal / totalBase) * totalTax : 0;
          const itemFinalAmount = itemBaseTotal + itemTax;

          // Only update if values have changed
          if (
            updated[item.id].taxAmount !== itemTax ||
            updated[item.id].finalAmount !== itemFinalAmount
          ) {
            updated[item.id] = {
              ...updated[item.id],
              taxAmount: itemTax,
              finalAmount: itemFinalAmount,
            };
            hasChanges = true;
          }
        } else {
          // Initialize if not exists
          const unitPrice =
            item.unitPrice !== undefined ? item.unitPrice : item.price || 0;
          const itemBaseTotal = unitPrice * item.quantity;
          const itemTax =
            totalBase > 0 ? (itemBaseTotal / totalBase) * totalTax : 0;
          const itemFinalAmount = itemBaseTotal + itemTax;

          updated[item.id] = {
            basePrice: item.price || 0,
            baseTotal: itemBaseTotal,
            taxAmount: itemTax,
            finalAmount: itemFinalAmount,
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        console.log("Updated original item values with tax:", updated);
      }

      return updated;
    });
  }, [calculatedTotal, cartItemsList, cartItemsCount, totalCartValue]);

  const reviewData = useMemo(() => {
    if (!cartItemsCount) return null;

    const customerInfo = existingCustomer
      ? {
          name: existingCustomer.name || customerForm.name,
          mobile: existingCustomer.mobile || customerForm.mobile,
          email: existingCustomer.email || customerForm.email,
          address:
            existingCustomer.address ||
            [
              existingCustomer.area,
              existingCustomer.city,
              existingCustomer.pincode,
            ]
              .filter(Boolean)
              .join(", "),
        }
      : {
          name: customerForm.name,
          mobile: customerForm.mobile,
          email: customerForm.email,
          address: [customerForm.area, customerForm.city, customerForm.pincode]
            .filter(Boolean)
            .join(", "),
        };

    const items = cartItemsList.map((item) => {
      const finalAmount =
        item.finalAmount !== undefined
          ? item.finalAmount
          : originalItemValues[item.id]?.finalAmount ||
            item.unitPrice * item.quantity;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        price: item.unitPrice,
        unitPrice: item.unitPrice,
        total: finalAmount,
        originalTotal: item.quantity * (item.price || 0),
        editedFinalAmount: item.finalAmount, // Keep this for UI highlighting
      };
    });

    // Calculate subtotal from final amounts (edited or original)
    // Note: final amounts already include tax, so subtotal here is the sum of all final amounts
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    // Calculate total number of bags (sum of all quantities)
    const totalBags = items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0,
    );

    // Tax amount (from backend calculation)
    // For per-line discounts, we sum them up for display
    const totalItemDiscounts = cartItemsList.reduce(
      (sum, item) => sum + (parseFloat(item.discountAmount) || 0),
      0,
    );
    const tax = calculatedTotal?.tax || 0;
    const discountAmt =
      calculatedTotal?.discountAmount || totalItemDiscounts || 0;
    const freightAmt =
      calculatedTotal?.freightCharges ||
      calculatedTotal?.fridgeAmount ||
      parseFloat(fridgeAmount) ||
      0;

    // Calculate totals - Prefer usage of backend response for Order Summary
    const displaySubtotal = calculatedTotal?.subtotal || subtotal;
    const displayTotal =
      calculatedTotal?.total || subtotal - discountAmt + freightAmt;

    return {
      orderId: generatedOrderId,
      customer: customerInfo,
      items,
      totals: {
        subtotal: displaySubtotal,
        tax,
        discountAmount: discountAmt,
        freightCharges: freightAmt,
        total: displayTotal,
      },
      totalBags: totalBags,
      upiId: "feedbazaar@upi",
      bankDetails: {
        accountNumber: "1234567890",
        ifsc: "FEEDBAZAAR0001",
        bankName: "Feed Bazaar Bank",
      },
    };
  }, [
    cartItemsCount,
    cartItemsList,
    customerForm,
    existingCustomer,
    generatedOrderId,
    calculatedTotal,
    discounts,
    fridgeAmount,
    originalItemValues,
  ]);

  const originalInvoiceTotal = Number(editDraftMeta?.originalGrandTotal || 0);
  const revisedInvoiceTotal = Number(reviewData?.totals?.total || 0);
  const invoiceDelta = Number(
    (revisedInvoiceTotal - originalInvoiceTotal).toFixed(2),
  );
  const customerOutstandingCredit = Number(
    editDraftMeta?.customerOutstandingCredit || 0,
  );
  const pendingAdditionalCollection = Number(
    editDraftMeta?.pendingAdditionalCollection || 0,
  );
  const customerCreditLimit = Number(editDraftMeta?.customerCreditLimit || 0);
  const invoiceEditCutoff =
    editDraftMeta?.editableUntil ? new Date(editDraftMeta.editableUntil) : null;
  const isPastNormalEditWindow =
    Boolean(editSaleId) &&
    Boolean(invoiceEditCutoff) &&
    invoiceEditCutoff.getTime() < Date.now();
  const effectiveCustomerIdentity = {
    name:
      customerForm.name?.trim() ||
      farmerName?.trim() ||
      selectedCustomer?.name?.trim() ||
      selectedCustomer?.farmerName?.trim() ||
      "",
    mobile:
      sanitizeMobile(
        mobileNumber ||
          customerForm.mobile ||
          selectedCustomer?.mobile ||
          selectedCustomer?.phoneNo ||
          "",
      ) || "",
  };
  const canCarryCustomerCredit = Boolean(
    effectiveCustomerIdentity.name || effectiveCustomerIdentity.mobile,
  );
  const projectedCustomerCredit =
    editSettlementMode === "customer_credit"
      ? customerOutstandingCredit + Math.abs(invoiceDelta || 0)
      : customerOutstandingCredit;
  const hasInvoiceDelta = Boolean(
    editSaleId && reviewData && Math.abs(invoiceDelta) >= 0.01,
  );
  const invoiceDeltaDirection =
    invoiceDelta > 0 ? "collect" : invoiceDelta < 0 ? "refund" : "none";
  const requiresImmediateCollection =
    !editSaleId ||
    (hasInvoiceDelta &&
      invoiceDeltaDirection === "collect" &&
      editSettlementMode === "collect_now");
  const requiredPaymentAmount = requiresImmediateCollection
    ? Number(
        editSaleId
          ? Math.abs(invoiceDelta || 0)
          : calculatedTotal?.total || reviewData?.totals?.total || totalCartValue,
      )
    : 0;
  const shouldShowPaymentSection = requiresImmediateCollection;
  const shouldShowNoPaymentNotice =
    Boolean(editSaleId) &&
    (!hasInvoiceDelta ||
      invoiceDeltaDirection === "refund" ||
      (invoiceDeltaDirection === "collect" &&
        ["collect_later", "manager_adjustment"].includes(editSettlementMode)));
  const submitBlockedReason = (() => {
    if (submitting || !reviewData) return "Review data is not ready yet.";
    if (cartItemsCount <= 0) return "Add at least one product.";
    if (hasInvoiceDelta && !editSettlementAcknowledged) {
      return "Acknowledge the invoice amount change before saving.";
    }
    if (isPastNormalEditWindow && !editSettlementNote?.trim()) {
      return "Late invoice edits need a reason note.";
    }
    if (
      hasInvoiceDelta &&
      ["manager_adjustment", "collect_later", "customer_credit"].includes(
        editSettlementMode,
      ) &&
      !editSettlementNote?.trim()
    ) {
      return "Add a note for this invoice adjustment.";
    }
    if (
      hasInvoiceDelta &&
      editSettlementMode === "customer_credit" &&
      !canCarryCustomerCredit
    ) {
      return "Customer credit needs farmer name or mobile number.";
    }
    if (
      hasInvoiceDelta &&
      editSettlementMode === "customer_credit" &&
      customerCreditLimit > 0 &&
      projectedCustomerCredit - customerCreditLimit > 0.01
    ) {
      return "Customer credit limit would be exceeded.";
    }
    if (!shouldShowPaymentSection) return "";
    if (!Array.isArray(payments) || payments.length === 0) {
      return "Add a payment method.";
    }
    const invalidBothPayments = payments.some(
      (payment) =>
        payment.paymentMethod === "both" &&
        ((!payment.cashAmount || parseFloat(payment.cashAmount) <= 0) ||
          (!payment.bankAmount || parseFloat(payment.bankAmount) <= 0)),
    );
    if (invalidBothPayments) {
      return "Enter both cash and bank amounts.";
    }
    const invalidUtrPayments = payments.some(
      (payment) =>
        (payment.paymentMethod === "bank" || payment.paymentMethod === "both") &&
        (!payment.utrNumber || payment.utrNumber.trim() === ""),
    );
    if (invalidUtrPayments) {
      return "UTR number is required for bank payments.";
    }
    const totalPaymentAmount = payments.reduce((sum, payment) => {
      if (payment.paymentMethod === "both") {
        return (
          sum +
          (parseFloat(payment.cashAmount) || 0) +
          (parseFloat(payment.bankAmount) || 0)
        );
      }
      return sum + requiredPaymentAmount;
    }, 0);
    if (Math.abs(totalPaymentAmount - requiredPaymentAmount) > 1) {
      return "Payment amount does not match the amount to be collected.";
    }
    return "";
  })();

  const canGoNext = () => {
    if (step === 0) return cartItemsCount > 0; // Products step - need at least one item
    if (step === 1) return reviewData !== null; // Overview step
    if (step === 2) return true; // Payment step
    return false;
  };

  const setProductLoadingState = (productId, enable) => {
    setLoadingProductIds((prev) => {
      const next = new Set(prev);
      if (enable) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const showQuantityModalForProduct = (product) => {
    setSelectedProductForQty(product);
    setInputQuantity("");
    setShowQuantityModal(true);
  };

  const handleQuantityConfirm = () => {
    if (!selectedProductForQty) return;
    const quantity = parseInt(inputQuantity, 10);
    if (!quantity || quantity <= 0) return;

    // Use storeProductId (which is the id from store products API) as the key
    // The id field from store products API is the store product ID we need for the sale
    const productId =
      selectedProductForQty.storeProductId || selectedProductForQty.id;
    if (!productId) {
      console.error("Product missing ID:", selectedProductForQty);
      return;
    }

    setProductLoadingState(productId, true);

    setCartItems((prev) => {
      const existing = prev[productId] || {};
      const newQuantity = (existing.quantity || 0) + quantity;
      const unitPrice =
        existing.unitPrice ||
        existing.price ||
        selectedProductForQty.price ||
        selectedProductForQty.customPrice ||
        selectedProductForQty.basePrice ||
        0;
      const totalPrice = unitPrice * newQuantity;

      const newItem = {
        ...selectedProductForQty,
        id: productId, // Ensure id is set to store product ID
        storeProductId: productId, // Ensure storeProductId is set
        quantity: newQuantity,
        unit:
          selectedProductForQty.productType === "packed"
            ? "packs"
            : selectedProductForQty.unit || "units",
        price: unitPrice, // Base price for reference
        unitPrice: unitPrice, // Editable price
        totalPrice,
        discountAmount: 0,
        finalAmount: undefined,
      };

      // Store original values if this is a new item or quantity changed
      if (!existing.quantity || existing.quantity !== newQuantity) {
        // Store base price and total price initially
        setOriginalItemValues((prev) => ({
          ...prev,
          [productId]: {
            basePrice: unitPrice,
            baseTotal: totalPrice,
            taxAmount: 0,
            finalAmount: totalPrice,
          },
        }));
      }

      return {
        ...prev,
        [productId]: newItem,
      };
    });

    setProductLoadingState(productId, false);
    setShowQuantityModal(false);
    setSelectedProductForQty(null);
    setInputQuantity("");
    setProductLoadingState(productId, false);
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const addPayment = () => {
    setPayments((prev) => [
      ...prev,
      {
        transactionDate: getTodayDate(),
        paymentMethod: "cash",
        paymentMode: "",
        amount: "",
        cashAmount: "",
        bankAmount: "",
        reference: "",
        remark: "",
        utrNumber: "",
        cashProofFile: null,
        cashProofPreviewUrl: null,
        cashProofBase64: null,

        bankProofFile: null,
        bankProofPreviewUrl: null,
        bankProofBase64: null,
      },
    ]);
  };

  const removePayment = (idx) => {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePaymentField = (idx, field, value) => {
    setPayments((prev) => {
      const next = [...prev];
      const currentPayment = next[idx];

      // If payment method is changing, reset amount fields appropriately
      if (field === "paymentMethod") {
        if (value === "both") {
          // When switching to "both", clear single amount and initialize cash/bank amounts
          next[idx] = {
            ...currentPayment,
            paymentMethod: "both",
            amount: "", // Clear single amount
            cashAmount: currentPayment.cashAmount || "",
            bankAmount: currentPayment.bankAmount || "",
          };
        } else {
          // When switching to "cash" or "bank", clear cash/bank amounts and use single amount
          next[idx] = {
            ...currentPayment,
            paymentMethod: value,
            amount: currentPayment.amount || "",
            cashAmount: "", // Clear cash amount
            bankAmount: "", // Clear bank amount
          };
        }
      } else {
        // For other fields, just update normally
        next[idx] = { ...currentPayment, [field]: value };
      }

      return next;
    });

    // If amount changes and QR is shown, hide it to force regeneration
    if (
      (field === "amount" || field === "bankAmount") &&
      qrCodeData[idx]?.showQR
    ) {
      setQrCodeData((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], showQR: false },
      }));
    }
  };

  // Discount management functions
  const addDiscount = () => {
    setDiscounts((prev) => [
      ...prev,
      { id: Date.now(), productIds: [], amount: "", reason: "" },
    ]);
  };

  const removeDiscount = (id) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDiscount = (id, field, value) => {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const toggleDiscountProduct = (discountId, productId) => {
    setDiscounts((prev) =>
      prev.map((d) => {
        if (d.id !== discountId) return d;

        const currentIds = d.productIds || [];
        const isSelected = currentIds.includes(productId);

        let newIds;
        if (productId === "ALL") {
          if (currentIds.length === cartItemsList.length) {
            newIds = []; // Deselect all if all active
          } else {
            newIds = cartItemsList.map((item) => item.id); // Select all active items
          }
        } else {
          if (isSelected) {
            newIds = currentIds.filter((pid) => pid !== productId);
          } else {
            newIds = [...currentIds, productId];
          }
        }

        return { ...d, productIds: newIds };
      }),
    );
  };

  const handlePaymentProof = async (idx, file, type) => {
    if (!file) return;

    // Convert file to base64 for API
    try {
      let finalFile = file;
      if (file.type.startsWith("image/")) {
        // Compress image if it's an image file
        const compressedBlob = await compressImageToUnder100KB(file);

        finalFile = new File([compressedBlob], file.name, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const previewUrl = URL.createObjectURL(finalFile);
        setPayments((prev) => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            [`${type}ProofFile`]: finalFile,
            [`${type}ProofPreviewUrl`]: previewUrl,
            [`${type}ProofBase64`]: base64String,
          };
          return next;
        });
      };
      reader.onerror = () => {
        setError("Error reading proof file");
        setIsErrorModalOpen(true);
      };
      reader.readAsDataURL(finalFile);
    } catch (err) {
      console.error("Error processing proof file:", err);
      setError("Error processing proof file");
      setIsErrorModalOpen(true);
    }
  };

  const handleSubmitPayment = async (e) => {
    // Prevent any default form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Submit Payment button clicked");
    console.log("Current state:", {
      reviewData,
      cartItemsCount,
      customerForm,
      payments,
    });

    // Validate required data
    if (!reviewData || cartItemsCount === 0) {
      setError("Please add products to cart before submitting");
      setIsErrorModalOpen(true);
      return;
    }

    // Mobile number is optional, but if provided, it must be valid (10 digits)
    if (
      customerForm.mobile &&
      customerForm.mobile.trim() !== "" &&
      customerForm.mobile.length !== 10
    ) {
      setError("Please enter a valid 10-digit mobile number or leave it empty");
      setIsErrorModalOpen(true);
      return;
    }

    // Customer details are optional - no validation needed

    // Validate payments
    // For "both" payment method, calculate total from cashAmount + bankAmount
    // For "cash" or "bank", the amount is auto-filled from expectedTotal
    const expectedTotal = requiredPaymentAmount;

    if (hasInvoiceDelta && !editSettlementAcknowledged) {
      setError(
        "Please acknowledge the invoice amount change and choose how the difference will be handled before saving the edited invoice.",
      );
      setIsErrorModalOpen(true);
      return;
    }

    if (isPastNormalEditWindow) {
      if (!editSettlementAcknowledged) {
        setError(
          "This invoice is outside the normal edit window. Please acknowledge the correction before saving.",
        );
        setIsErrorModalOpen(true);
        return;
      }

      if (!editSettlementNote?.trim()) {
        setError(
          "Please add a reason note for editing this invoice after the normal edit window.",
        );
        setIsErrorModalOpen(true);
        return;
      }
    }

    if (
      hasInvoiceDelta &&
      ["manager_adjustment", "collect_later", "customer_credit"].includes(
        editSettlementMode,
      ) &&
      !editSettlementNote?.trim()
    ) {
      setError(
        "Please add a note so this edited invoice adjustment can be tracked clearly.",
      );
      setIsErrorModalOpen(true);
      return;
    }

    if (hasInvoiceDelta && editSettlementMode === "customer_credit") {
      if (!canCarryCustomerCredit) {
        setError(
          "Customer credit needs a real customer. Please add farmer name or mobile number before saving this edited invoice.",
        );
        setIsErrorModalOpen(true);
        return;
      }

      if (
        customerCreditLimit > 0 &&
        projectedCustomerCredit - customerCreditLimit > 0.01
      ) {
        setError(
          `Customer credit limit exceeded. Current credit is ₹${customerOutstandingCredit.toLocaleString(
            "en-IN",
          )} and this change would take it to ₹${projectedCustomerCredit.toLocaleString(
            "en-IN",
          )}, above the limit of ₹${customerCreditLimit.toLocaleString("en-IN")}.`,
        );
        setIsErrorModalOpen(true);
        return;
      }
    }

    const totalPaymentAmount = shouldShowPaymentSection
      ? payments.reduce((sum, p) => {
          if (p.paymentMethod === "both") {
            const cashAmt = parseFloat(p.cashAmount) || 0;
            const bankAmt = parseFloat(p.bankAmount) || 0;
            return sum + cashAmt + bankAmt;
          }
          return sum + expectedTotal;
        }, 0)
      : 0;

    if (shouldShowPaymentSection && totalPaymentAmount <= 0) {
      setError("Please enter payment amounts");
      setIsErrorModalOpen(true);
      return;
    }

    // Validate "both" payments have both amounts
    const invalidBothPayments = shouldShowPaymentSection
      ? payments.filter(
          (p) =>
            p.paymentMethod === "both" &&
            (!p.cashAmount ||
              parseFloat(p.cashAmount) <= 0 ||
              !p.bankAmount ||
              parseFloat(p.bankAmount) <= 0),
        )
      : [];

    if (invalidBothPayments.length > 0) {
      setError(
        "For 'Both' payment method, please enter amounts for both Cash and Bank",
      );
      setIsErrorModalOpen(true);
      return;
    }

    // Validate UTR number for Bank or Both payments
    const invalidUtrPayments = shouldShowPaymentSection
      ? payments.filter(
          (p) =>
            (p.paymentMethod === "bank" || p.paymentMethod === "both") &&
            (!p.utrNumber || p.utrNumber.trim() === ""),
        )
      : [];

    if (invalidUtrPayments.length > 0) {
      setError("UTR Number is mandatory for Bank payments");
      setIsErrorModalOpen(true);
      return;
    }

    const hasCreditPayment = shouldShowPaymentSection && payments.some(
      (p) => p.paymentMethod === "credit",
    );
    if (hasCreditPayment) {
      if (!creditUsageEnabled) {
        setError("Customer credit usage is disabled in settings.");
        setIsErrorModalOpen(true);
        return;
      }

      if (!canCarryCustomerCredit) {
        setError(
          "Customer credit can only be used for an identified customer. Please add farmer name or mobile number first.",
        );
        setIsErrorModalOpen(true);
        return;
      }
    }

    // Validate payment amount matches calculated total (with tolerance for rounding)
    const paymentDifference = Math.abs(totalPaymentAmount - expectedTotal);
    if (shouldShowPaymentSection && paymentDifference > 1) {
      // Allow 1 rupee difference for rounding
      setError(
        `Payment amount (₹${totalPaymentAmount.toLocaleString("en-IN")}) does not match order total (₹${expectedTotal.toLocaleString("en-IN")}). Please enter the correct amount.`,
      );
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const storeId = getStoreId();

      if (!storeId) {
        setError("Store not selected. Please select a store first.");
        setIsErrorModalOpen(true);
        setSubmitting(false);
        return;
      }

      // Step 1: Prepare customer object for sale API
      // The sale API expects customer object with name and mobile, not customerId
      // Customer details are optional
      const customer = {};

      // Add name if provided
      if (customerForm.name && customerForm.name.trim()) {
        customer.name = customerForm.name.trim();
      }

      // Add mobile if provided
      if (customerForm.mobile && customerForm.mobile.trim()) {
        const customerMobile = sanitizeMobile(customerForm.mobile);
        if (customerMobile && customerMobile.length === 10) {
          customer.mobile = customerMobile;
        }
      }

      // Add optional fields if provided
      if (customerForm.email && customerForm.email.trim()) {
        customer.email = customerForm.email.trim();
      }

      // Only include customer object if it has at least one field
      // If customer object is empty, backend should handle it or we can send null/undefined

      // Step 2: Use shared helper to prepare items for consistency
      const items = prepareItemsForApi();

      if (items.length === 0) {
        setError("No valid products in cart. Please add products to cart.");
        setIsErrorModalOpen(true);
        setSubmitting(false);
        return;
      }

      console.log("SALE CREATE PAYLOAD ITEMS:");
      console.table(items);
      console.log("Full items JSON:", JSON.stringify(items, null, 2));

      // Step 3: Format payments for API (paymentMethod and amount required)
      // For "both" payment method, split into two separate payment records (one cash, one bank)
      // Payment proof is handled separately via UTR endpoint if needed
      const formattedPayments = [];

      if (shouldShowPaymentSection) {
        payments.forEach((payment) => {
          if (payment.paymentMethod === "both") {
            const cashAmt = parseFloat(payment.cashAmount) || 0;
            const bankAmt = parseFloat(payment.bankAmount) || 0;

            if (cashAmt > 0) {
              formattedPayments.push({
                paymentMethod: "cash",
                amount: cashAmt,
                paymentProof: payment.cashProofBase64 || null,
                remarks: payment.remarks || null,
              });
            }

            if (bankAmt > 0) {
              formattedPayments.push({
                paymentMethod: "bank",
                amount: bankAmt,
                transactionNumber: payment.utrNumber || null,
                paymentProof: payment.bankProofBase64 || null,
                remarks: payment.remarks || null,
              });
            }
          } else {
            const amount = expectedTotal;
            if (amount > 0) {
              formattedPayments.push({
                paymentMethod: payment.paymentMethod || "cash",
                amount: amount,
                transactionNumber:
                  payment.paymentMethod === "bank"
                    ? payment.utrNumber || null
                    : null,
                paymentProof:
                  payment.paymentMethod === "bank"
                    ? payment.bankProofBase64 || null
                    : payment.paymentMethod === "credit"
                      ? null
                      : payment.cashProofBase64 || null,
                remarks: payment.remarks || null,
              });
            }
          }
        });
      }

      if (shouldShowPaymentSection && formattedPayments.length === 0) {
        setError("Please enter at least one payment with a valid amount");
        setIsErrorModalOpen(true);
        setSubmitting(false);
        return;
      }

      if (isFutureDateTimeLocal(recordedAt)) {
        setError("Recorded At cannot be a future date/time");
        setIsErrorModalOpen(true);
        setSubmitting(false);
        return;
      }

      // Step 4: Prepare sale request body according to backend API
      const saleData = {
        storeId: storeId,
        items: items, // Array of { productId, quantity, unitPrice, discountAmount }
        payments: formattedPayments, // Array of { paymentMethod, amount }
        recordedAt,
        discountAmount: 0, // Explicitly 0 for per-item discounts
        ...(notes && notes.trim() && { notes: notes.trim() }), // Optional notes field
        ...(editSaleId && { editSaleId: Number(editSaleId) }),
        ...(editSaleId && {
          editSettlement: {
            originalInvoiceTotal,
            revisedInvoiceTotal,
            invoiceDelta,
            settlementMode: editSettlementMode,
            settlementNote: editSettlementNote?.trim() || null,
            acknowledgedByManager: editSettlementAcknowledged,
          },
        }),
      };

      // Removed legacy root discountAmount accumulation logic

      // Removed complex discount logic as per new per-item requirement
      if (false) {
        // Format discount reason with product breakdown
        // Format: "Reason (Product A, Product B) | Reason 2 (Product C)"
        const reasonParts = discounts
          .filter((d) => parseFloat(d.amount) > 0)
          .map((d) => {
            const reasonText = d.reason || "Discount";
            let productText = "";

            if (
              !d.productIds ||
              d.productIds.length === 0 ||
              d.productIds.length === cartItemsList.length
            ) {
              productText = "All Products";
            } else {
              // Map IDs to names
              const names = d.productIds
                .map(
                  (pid) => cartItemsList.find((item) => item.id === pid)?.name,
                )
                .filter(Boolean);

              if (names.length <= 3) {
                productText = names.join(", ");
              } else {
                productText = `${names.length} Products`;
              }
            }

            return `${reasonText} (${productText})`;
          });

        if (reasonParts.length > 0) {
          saleData.discountReason = reasonParts.join(" | ");
        }
      }

      // Add freight charges (fridgeAmount) as additional charge if provided
      // Backend accepts both fridgeAmount and freightCharges
      if (fridgeAmount && parseFloat(fridgeAmount) > 0) {
        saleData.fridgeAmount = parseFloat(fridgeAmount);
        saleData.freightCharges = parseFloat(fridgeAmount); // Also send as freightCharges for compatibility
      }

      // Build customer object with all optional fields
      const customerData = { ...customer };

      // Add payment step customer details if provided
      if (mobileNumber && mobileNumber.trim()) {
        const cleanedMobile = sanitizeMobile(mobileNumber);
        if (cleanedMobile.length === 10) {
          customerData.mobile = cleanedMobile;
        }
      }

      if (farmerName && farmerName.trim()) {
        customerData.farmerName = farmerName.trim();
      }

      if (villageName && villageName.trim()) {
        customerData.villageName = villageName.trim();
      }

      // Format animals data
      const animalsArray = [];
      if (cows && parseInt(cows) > 0) {
        animalsArray.push(`${cows} Cows`);
      }
      if (buffaloes && parseInt(buffaloes) > 0) {
        animalsArray.push(`${buffaloes} Buffaloes`);
      }
      additionalAnimals.forEach((animal) => {
        if (
          animal.type &&
          animal.type.trim() &&
          animal.count &&
          parseInt(animal.count) > 0
        ) {
          animalsArray.push(`${animal.count} ${animal.type.trim()}`);
        }
      });

      if (animalsArray.length > 0) {
        customerData.animals = animalsArray.join(", ");
      }

      // Only include customer if it has at least one field
      if (Object.keys(customerData).length > 0) {
        saleData.customer = customerData;
      }

      console.log("Creating sale with data:", saleData);
      console.log("Sale data JSON:", JSON.stringify(saleData, null, 2));

      // Step 5: Create sale
      let saleResponse;
      try {
        saleResponse = await storeService.createSale(saleData);
        console.log("Sale creation response:", saleResponse);
      } catch (apiErr) {
        // If the API service throws an error, it might be in a different format
        console.error("API Service error:", apiErr);
        throw apiErr; // Re-throw to be caught by outer catch
      }

      if (saleResponse.success || saleResponse.data) {
        // Get the sale ID from response
        const saleId =
          saleResponse.data?.id || saleResponse.data?.saleId || saleResponse.id;

        // Update UTR numbers for bank payments if provided
        if (saleId) {
          const bankPaymentsWithUTR = payments.filter(
            (p) =>
              (p.paymentMethod === "bank" || p.paymentMethod === "both") &&
              p.utrNumber &&
              p.utrNumber.trim().length > 0,
          );

          // Update UTR for each bank payment
          for (const payment of bankPaymentsWithUTR) {
            try {
              await storeService.updateSalePaymentUTR(
                saleId,
                payment.utrNumber.trim(),
              );
              console.log(
                `UTR updated successfully for sale ${saleId}: ${payment.utrNumber}`,
              );
            } catch (utrErr) {
              console.error(`Error updating UTR for sale ${saleId}:`, utrErr);
              // Don't fail the entire sale creation if UTR update fails
              // Just log the error - UTR can be updated later manually
            }
          }
        }

        if (editSaleId) {
          localStorage.removeItem("storeSaleEditDraft");
          navigate("/store/sales", {
            replace: true,
            state: {
              successMessage:
                "Sale updated successfully. The same invoice number has been updated with the corrected details.",
            },
          });
        } else {
          navigate("/store/sales", {
            replace: true,
            state: {
              successMessage: "Sale created successfully!",
            },
          });
        }
        return;
      } else {
        // Check if error is about payment amount mismatch
        const errorMessage = saleResponse.message || "";
        if (
          errorMessage.includes("Payment amount") &&
          errorMessage.includes("does not match sale total")
        ) {
          // Extract the expected total from error message if possible
          const totalMatch = errorMessage.match(/sale total \(([\d,]+)\)/);
          if (totalMatch) {
            const expectedTotal = totalMatch[1].replace(/,/g, "");
            setError(
              `Payment amount mismatch. Backend calculated total (with tax): ₹${parseInt(expectedTotal).toLocaleString("en-IN")}. Please enter this amount as payment.`,
            );
          } else {
            setError(
              errorMessage +
                " Please check the payment amount matches the backend calculated total (subtotal + tax).",
            );
          }
        } else {
          setError(errorMessage || "Failed to create sale");
        }
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      console.error("Error creating sale:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);

      // Get detailed error message from backend
      let errorMessage = "Failed to create sale. Please try again.";

      if (err.response?.data) {
        const errorData = err.response.data;
        // Try to get the most detailed error message
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e) => e.message || e).join(", ");
        } else if (errorData.errors && typeof errorData.errors === "object") {
          errorMessage = Object.values(errorData.errors).flat().join(", ");
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Check if error is about payment amount mismatch
      if (
        errorMessage.includes("Payment amount") &&
        errorMessage.includes("does not match sale total")
      ) {
        // Extract the expected total from error message if possible
        const totalMatch = errorMessage.match(/sale total \(([\d,]+)\)/);
        if (totalMatch) {
          const expectedTotal = totalMatch[1].replace(/,/g, "");
          setError(
            `Payment amount mismatch. Backend calculated total (with tax): ₹${parseInt(expectedTotal).toLocaleString("en-IN")}. Please enter this amount as payment.`,
          );
        } else {
          setError(
            errorMessage +
              " Please check the payment amount matches the backend calculated total (subtotal + tax).",
          );
        }
      } else {
        setError(errorMessage);
      }
      setIsErrorModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuantityModal = () => {
    if (!showQuantityModal || !selectedProductForQty) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at top, rgba(37, 99, 235, 0.22), rgba(15, 23, 42, 0.66))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowQuantityModal(false);
            setSelectedProductForQty(null);
            setInputQuantity("");
          }
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
            borderRadius: "24px",
            padding: isMobile ? "18px" : "26px",
            width: isMobile ? "95vw" : "440px",
            maxWidth: "95vw",
            border: "1px solid rgba(191, 219, 254, 0.9)",
            boxShadow: "0 26px 60px rgba(15, 23, 42, 0.28)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                Quick Add
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                Add quantity without leaving the checkout flow.
              </div>
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(37, 99, 235, 0.1)",
                color: "#1d4ed8",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              SKU {selectedProductForQty.sku || "N/A"}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>Product</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginTop: 4,
                }}
              >
                {selectedProductForQty.name}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
                ₹
                {(
                  selectedProductForQty.price ||
                  selectedProductForQty.customPrice ||
                  selectedProductForQty.basePrice ||
                  0
                ).toLocaleString("en-IN")}{" "}
                per bag
              </div>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: selectedProductForQty.isOutOfStock
                  ? "rgba(254, 242, 242, 0.95)"
                  : selectedProductForQty.isLowStock
                    ? "rgba(255, 247, 237, 0.95)"
                    : "rgba(240, 253, 244, 0.95)",
                border: `1px solid ${
                  selectedProductForQty.isOutOfStock
                    ? "#fecaca"
                    : selectedProductForQty.isLowStock
                      ? "#fed7aa"
                      : "#86efac"
                }`,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>Available</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginTop: 4,
                }}
              >
                {selectedProductForQty.quantity || 0}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, color: "#475569" }}>
                {selectedProductForQty.productType === "packed"
                  ? "bags ready to sell"
                  : selectedProductForQty.unit || "units"}
              </div>
            </div>
          </div>
          <label
            style={{
              display: "block",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#0f172a",
            }}
          >
            Quantity to add
          </label>
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={inputQuantity}
            onChange={(e) => setInputQuantity(e.target.value.replace(/\D/g, ""))}
            onWheel={(e) => e.target.blur()} 
            placeholder="Enter quantity"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "16px",
              border: "1px solid #bfdbfe",
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)",
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {[1, 2, 5, 10].map((quickQty) => (
              <button
                key={quickQty}
                type="button"
                onClick={() => setInputQuantity(String(quickQty))}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                +{quickQty}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn btn-light"
              onClick={() => {
                setShowQuantityModal(false);
                setSelectedProductForQty(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!inputQuantity || parseInt(inputQuantity, 10) <= 0}
              onClick={handleQuantityConfirm}
              style={{
                borderRadius: 12,
                minWidth: 144,
                fontWeight: 700,
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      style={{
        padding: isMobile ? 8 : 14,
        maxWidth: 1480,
        margin: "0 auto",
        overflowX: "hidden",
      }}
    >
      <p className="path">
        <span onClick={() => navigate("/store/sales")}>Sales</span>{" "}
        <i className="bi bi-chevron-right"></i> {editSaleId ? "Edit Sale" : "Create Sale"}
      </p>
      <h4
        style={{
          marginBottom: isMobile ? 12 : 8,
          fontSize: isMobile ? "18px" : "20px",
        }}
      >
        {editSaleId ? "Edit And Replace Items" : "Quick Checkout"}
      </h4>
      <div
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
          border: "1px solid #dbeafe",
          borderRadius: 12,
          padding: isMobile ? 12 : 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
            {editSaleId ? "Editing an invoiced sale" : "Single-page sale checkout"}
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            {editSaleId
              ? "You can remove a wrong product, add a replacement item, change quantities, customer details, payment details, or recorded time. Saving will update the same invoice number with the corrected details."
              : "Add products, review the order, and complete payment in one flow. The sale ledger posts against the recorded date and time below."}
          </div>
        </div>
        <div>
          <label
            className="form-label"
            style={{ fontWeight: 600, marginBottom: 8 }}
          >
            Recorded At
          </label>
          <input
            type="datetime-local"
            className="form-control"
            value={recordedAt}
            onChange={(e) => {
              setHasManuallyChangedRecordedAt(true);
              setRecordedAt(e.target.value);
            }}
            max={getCurrentDateTimeLocal()}
          />
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#0f172a",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Displayed as: {recordedAt ? formatDateTimeIN(recordedAt) : "DD/MM/YYYY HH:mm"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Browser picker format may vary by device, but the sale is recorded and shown in Indian format `DD/MM/YYYY HH:mm`.
          </div>
        </div>
      </div>
      {editSaleId && (
        <div
          style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)",
            border: "1px solid #fed7aa",
            borderRadius: 12,
            padding: isMobile ? 12 : 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: "#9a3412" }}>
            Replacement workflow
          </div>
          <div style={{ fontSize: 13, color: "#7c2d12", marginTop: 6, display: "grid", gap: 4 }}>
            <div>
              Original sale: <strong>{editDraftMeta?.saleCode || `Sale #${editSaleId}`}</strong>
            </div>
            <div>
              Current invoice: <strong>{editDraftMeta?.invoiceNumber || "Already generated"}</strong>
            </div>
            <div>
              Customer: <strong>{editDraftMeta?.customerName || "Existing customer"}</strong>
            </div>
            <div>
              To replace a product like <strong>FB-22</strong>, click <strong>Remove</strong> on that line and then add the new product to the cart. You can also change quantity and price before saving.
            </div>
            <div>
              The invoice number will remain the same after saving. Only the invoice contents and totals will be updated.
            </div>
          </div>
        </div>
      )}
      {cartItemsCount > 0 && (
        <div
          style={{
            position: "sticky",
            top: 12,
            zIndex: 8,
            marginBottom: 16,
            padding: isMobile ? 12 : 14,
            borderRadius: 18,
            border: "1px solid #bfdbfe",
            background:
              "linear-gradient(135deg, rgba(219, 234, 254, 0.96) 0%, rgba(240, 249, 255, 0.96) 100%)",
            boxShadow: "0 18px 36px rgba(37, 99, 235, 0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: 12,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Selected Items
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                Remove a wrong item here instantly, then add the replacement from
                the product grid below.
              </div>
            </div>
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Live checkout total
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                ₹
                {(
                  calculatedTotal?.total || reviewData?.totals?.total || totalCartValue
                ).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              marginTop: 14,
              paddingBottom: 4,
            }}
          >
            {cartItemsList.map((item) => (
              <div
                key={`quick-${item.id}`}
                style={{
                  minWidth: isMobile ? 240 : 260,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(59, 130, 246, 0.18)",
                  display: "grid",
                  gap: 8,
                  boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#0f172a",
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      SKU {item.sku || "N/A"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      borderRadius: 999,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#334155",
                  }}
                >
                  <span>{item.quantity} bag</span>
                  <strong>
                    ₹{(item.totalPrice || 0).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            ))}
          </div>
          {calculatingTotal && (
            <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 10 }}>
              Updating totals in the background...
            </div>
          )}
        </div>
      )}
      {!singleStepCheckout && (
        <StepIndicator step={step} steps={steps} isMobile={isMobile} />
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.7fr) 360px",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
      {(singleStepCheckout || steps[step] === "Products") && (
        <div
          style={styles.surfaceCard}
        >
          <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: 4 }}>
            Add Products
          </div>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
            {editSaleId
              ? "Review the loaded items, remove anything incorrect, and add the replacement products before saving the updated invoice."
              : "Select products and build the cart just like the sales order experience."}
          </p>

          {cartItemsCount > 0 && (
            <div
              style={{
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                padding: 12,
                backgroundColor: "#eff6ff",
                marginBottom: 16,
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
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    Cart Summary
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {cartItemsCount} item{cartItemsCount !== 1 ? "s" : ""}{" "}
                    selected
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}
                  >
                    ₹{totalCartValue.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    Total Value
                  </div>
                </div>
              </div>
            </div>
          )}

          {productsLoading && products.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#475569" }}>
              Loading products...
            </div>
          ) : (
            <>
              {productsLoading && products.length > 0 && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Refreshing product stock...
                </div>
              )}
            <div
              style={
                isMobile
                  ? { ...styles.productGrid, ...styles.productGridMobile }
                  : styles.productGrid
              }
            >
              {products.filter(product => !product.isOutOfStock).map((product) => {
                const inCart = cartItems[product.id]?.quantity || 0;
                const isLoading = loadingProductIds.has(product.id);

                return (
                  <div
                    key={product.id}
                    style={{
                      ...styles.productCard,
                      borderColor: inCart ? "#22c55e" : "#e2e8f0",
                      backgroundColor: inCart
                        ? "rgba(34, 197, 94, 0.08)"
                        : "#fff",
                    }}
                  >
                    <div style={styles.productTitle}>{product.name}</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={styles.productInfo}>
                        <span style={{ fontWeight: 600 }}>SKU</span>
                        <span>{product.sku || "N/A"}</span>
                      </div>
                      <div style={styles.productInfo}>
                        <span style={{ fontWeight: 600 }}>Stock</span>
                        <span
                          style={{
                            color: product.isOutOfStock
                              ? "#dc2626"
                              : product.isLowStock
                                ? "#f97316"
                                : "#16a34a",
                          }}
                        >
                          {product.isOutOfStock
                            ? "Out of Stock"
                            : `${product.quantity || 0}${product.isLowStock ? " (Low)" : ""}`}
                        </span>
                      </div>
                      <div style={styles.productInfo}>
                        <span style={{ fontWeight: 600 }}>Unit</span>
                        <span>
                          {product.productType === "packed"
                            ? "packs"
                            : product.unit === "packet"
                              ? "packs"
                              : product.unit || "unit"}
                        </span>
                      </div>
                      <div style={styles.productInfo}>
                        <span style={{ fontWeight: 600 }}>Price</span>
                        <span
                          style={{
                            color: "var(--primary-color)",
                            fontWeight: 600,
                          }}
                        >
                          ₹{(product.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.productActions,
                        flexDirection: isMobile ? "column" : "row",
                      }}
                    >
                      <button
                        className={`btn ${inCart ? "btn-success" : "btn-primary"}`}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          minHeight: isMobile ? "44px" : "auto",
                          fontSize: isMobile ? "14px" : "16px",
                        }}
                        disabled={isLoading}
                        onClick={() => showQuantityModalForProduct(product)}
                      >
                        {isLoading && (
                          <div style={styles.productLoadingSpinner}></div>
                        )}
                        {isLoading
                          ? "Adding..."
                          : inCart
                            ? "Add More"
                            : "Add to Cart"}
                      </button>
                      {inCart > 0 && (
                        <button
                          className="btn btn-outline-danger"
                          style={{
                            minWidth: isMobile ? "100%" : 90,
                            minHeight: isMobile ? "44px" : "auto",
                            fontSize: isMobile ? "14px" : "16px",
                          }}
                          onClick={() => removeFromCart(product.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {inCart > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 10,
                          borderRadius: 8,
                          backgroundColor: "#dcfce7",
                          border: "1px solid #86efac",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#166534",
                            marginBottom: 6,
                            fontWeight: 600,
                          }}
                        >
                          In Cart
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                          }}
                        >
                          <span>Quantity</span>
                          <strong>
                            {cartItems[product.id].quantity}{" "}
                            {cartItems[product.id].unit}
                          </strong>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                          }}
                        >
                          <span>Line Total</span>
                          <strong>
                            ₹
                            {(
                              cartItems[product.id].totalPrice || 0
                            ).toLocaleString("en-IN")}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )}

          {!singleStepCheckout && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={next}
                disabled={cartItemsCount === 0}
                style={{
                  minHeight: isMobile ? "44px" : "auto",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Continue to Overview
              </button>
            </div>
          )}
        </div>
      )}

      {(singleStepCheckout || steps[step] === "Overview") && (
        <div
          style={styles.surfaceCard}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: "1px solid #dbeafe",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                Review Order
              </div>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                }}
              >
                Final billing workspace for customer details, line-level pricing,
                and invoice totals.
              </p>
            </div>
            <div
              style={{
                textAlign: isMobile ? "left" : "right",
                alignSelf: isMobile ? "stretch" : "auto",
                padding: "10px 14px",
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
                border: "1px solid #bfdbfe",
                minWidth: isMobile ? "100%" : 170,
              }}
            >
              <div style={{ color: "#475569", fontWeight: 700, fontSize: 12 }}>
                Order ID
              </div>
              <div style={{ fontSize: 15, color: "#0f172a", fontWeight: 800 }}>
                {reviewData?.orderId || "N/A"}
              </div>
            </div>
          </div>

          {!reviewData ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
              Add at least one product to review the order.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 20,
                    padding: 18,
                    background:
                      "linear-gradient(180deg, rgba(239,246,255,0.95) 0%, rgba(255,255,255,0.98) 100%)",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 10,
                      fontSize: 15,
                    }}
                  >
                    Customer
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", display: "grid", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Farmer Name
                      </div>
                      <strong style={{ color: "#0f172a" }}>{reviewData.customer.name || "-"}</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Mobile Number
                      </div>
                      <strong style={{ color: "#0f172a" }}>
                        {reviewData.customer.mobile || "-"}
                      </strong>
                    </div>
                    {reviewData.customer.address && (
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Address
                        </div>
                        <strong style={{ color: "#0f172a" }}>
                          {reviewData.customer.address}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 20,
                    padding: 18,
                    background:
                      "linear-gradient(180deg, rgba(240,253,250,0.95) 0%, rgba(255,255,255,0.98) 100%)",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 10,
                      fontSize: 15,
                    }}
                  >
                    Billing Snapshot
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", display: "grid", gap: 8 }}>
                    <div>
                      <strong>Items:</strong> {reviewData.items.length}
                    </div>
                    <div>
                      <strong>Total Bags:</strong> {reviewData.totalBags || 0}
                    </div>
                    <div>
                      <strong>Subtotal:</strong> ₹
                      {reviewData.totals.subtotal.toLocaleString("en-IN")}
                    </div>
                    <div>
                      <strong>Tax:</strong> ₹
                      {reviewData.totals.tax.toLocaleString("en-IN")}
                    </div>
                    <div>
                      <strong>Total:</strong> ₹
                      {reviewData.totals.total.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              {editSaleId && (
                <div
                  style={{
                    border: `1px solid ${
                      !hasInvoiceDelta
                        ? "#bbf7d0"
                        : invoiceDeltaDirection === "collect"
                          ? "#fed7aa"
                          : "#fbcfe8"
                    }`,
                    borderRadius: 18,
                    padding: 18,
                    background:
                      !hasInvoiceDelta
                        ? "linear-gradient(180deg, rgba(240,253,244,0.96) 0%, rgba(255,255,255,0.98) 100%)"
                        : invoiceDeltaDirection === "collect"
                          ? "linear-gradient(180deg, rgba(255,247,237,0.96) 0%, rgba(255,255,255,0.98) 100%)"
                          : "linear-gradient(180deg, rgba(253,242,248,0.96) 0%, rgba(255,255,255,0.98) 100%)",
                    marginBottom: 16,
                    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "flex-start" : "center",
                      flexDirection: isMobile ? "column" : "row",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
                        Invoice Change Acknowledgement
                      </div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                        Keep the same invoice number visible to the store team, but
                        make the amount change explicit before saving the correction.
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        background:
                          !hasInvoiceDelta
                            ? "rgba(34,197,94,0.12)"
                            : invoiceDeltaDirection === "collect"
                              ? "rgba(249,115,22,0.12)"
                              : "rgba(236,72,153,0.12)",
                        color:
                          !hasInvoiceDelta
                            ? "#166534"
                            : invoiceDeltaDirection === "collect"
                              ? "#9a3412"
                              : "#9d174d",
                        fontWeight: 800,
                      }}
                    >
                      {!hasInvoiceDelta
                        ? "No amount change"
                        : invoiceDeltaDirection === "collect"
                          ? `Collect ₹${Math.abs(invoiceDelta).toLocaleString("en-IN")}`
                          : `Return ₹${Math.abs(invoiceDelta).toLocaleString("en-IN")}`}
                    </div>
                  </div>
                  {isPastNormalEditWindow && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 14,
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, rgba(254,240,138,0.28) 0%, rgba(255,255,255,0.96) 100%)",
                        border: "1px solid rgba(217,119,6,0.28)",
                        color: "#92400e",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      This invoice is beyond the normal edit window. The correction is still allowed, but manager acknowledgement and a reason note are required so the audit trail remains clean.
                    </div>
                  )}
                  {(customerOutstandingCredit > 0 ||
                    pendingAdditionalCollection > 0 ||
                    customerCreditLimit > 0) && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                        gap: 12,
                        marginTop: 14,
                      }}
                    >
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Current customer credit
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                          ₹{customerOutstandingCredit.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Pending extra collection
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                          ₹{pendingAdditionalCollection.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Customer credit limit
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                          ₹{customerCreditLimit.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#64748b" }}>Original invoice total</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                        ₹{originalInvoiceTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#64748b" }}>Revised total</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                        ₹{revisedInvoiceTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#64748b" }}>Difference</div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color:
                            !hasInvoiceDelta
                              ? "#166534"
                              : invoiceDeltaDirection === "collect"
                                ? "#9a3412"
                                : "#9d174d",
                          marginTop: 4,
                        }}
                      >
                        {invoiceDelta > 0 ? "+" : invoiceDelta < 0 ? "-" : ""}
                        ₹{Math.abs(invoiceDelta).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  {hasInvoiceDelta && (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                        How will this difference be handled?
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                          marginBottom: 12,
                        }}
                      >
                        {(
                          invoiceDeltaDirection === "collect"
                            ? [
                                ["collect_now", "Collect Now"],
                                ["collect_later", "Collect Later"],
                                ["manager_adjustment", "Manager Adjustment"],
                              ]
                            : [
                                ["refund_now", "Refund Now"],
                                ["customer_credit", "Customer Credit"],
                                ["manager_adjustment", "Manager Adjustment"],
                              ]
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEditSettlementMode(value)}
                            style={{
                              border: `1px solid ${
                                editSettlementMode === value ? "#1d4ed8" : "#cbd5e1"
                              }`,
                              background:
                                editSettlementMode === value ? "#eff6ff" : "#fff",
                              color:
                                editSettlementMode === value ? "#1d4ed8" : "#334155",
                              borderRadius: 999,
                              padding: "8px 14px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Optional note: who collected the difference, who approved the adjustment, or why the refund is being carried as credit."
                        value={editSettlementNote}
                        onChange={(e) => setEditSettlementNote(e.target.value)}
                        style={{ marginBottom: 12, borderRadius: 12 }}
                      />
                      {editSettlementMode === "customer_credit" && (
                        <div
                          style={{
                            marginBottom: 12,
                            padding: 14,
                            borderRadius: 14,
                            border: `1px solid ${canCarryCustomerCredit ? "#bfdbfe" : "#fecaca"}`,
                            background: canCarryCustomerCredit ? "#eff6ff" : "#fff7ed",
                            color: canCarryCustomerCredit ? "#1d4ed8" : "#b91c1c",
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          {canCarryCustomerCredit
                            ? `Credit after this edit: ₹${projectedCustomerCredit.toLocaleString(
                                "en-IN",
                              )} of ₹${customerCreditLimit.toLocaleString(
                                "en-IN",
                              )} allowed.`
                            : "This sale still looks like a walk-in customer. Add farmer name or mobile number below before using Customer Credit."}
                        </div>
                      )}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          fontSize: 13,
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editSettlementAcknowledged}
                          onChange={(e) =>
                            setEditSettlementAcknowledged(e.target.checked)
                          }
                          style={{ marginTop: 3 }}
                        />
                        <span>
                          I acknowledge this edited invoice changes the amount by{" "}
                          <strong>₹{Math.abs(invoiceDelta).toLocaleString("en-IN")}</strong>
                          {" "}and the store team will handle it using the selected option above.
                        </span>
                      </label>
                    </>
                  )}
                </div>
              )}

              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 18,
                  marginBottom: 16,
                  overflow: "hidden",
                  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%)",
                    padding: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Products Review</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Edit unit rate or billed total. Both fields stay in sync.
                  </span>
                </div>
                {reviewData.items.map((item) => {
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "minmax(220px, 2fr) minmax(120px, 0.9fr) minmax(180px, 1.1fr) minmax(230px, 1.2fr)",
                        padding: "14px 16px",
                        borderTop: "1px solid #e2e8f0",
                        fontSize: isMobile ? 12 : 13,
                        color: "#475569",
                        gap: isMobile ? "10px" : "16px",
                        alignItems: "center",
                        background:
                          item.editedFinalAmount !== undefined
                            ? "linear-gradient(90deg, rgba(239,246,255,0.7) 0%, rgba(255,255,255,1) 100%)"
                            : "#fff",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                          {item.sku || "SKU NA"}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Quantity
                        </div>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                          {item.quantity} {item.unit}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>Price: ₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            item.unitPrice !== undefined
                              ? item.unitPrice
                              : item.price
                          }
                          onChange={(e) =>
                            updateCartItemFromUnitPrice(item.id, e.target.value)
                          }
                          style={{
                            width: "112px",
                            padding: "8px 10px",
                            border: "1px solid #dbeafe",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: 700,
                            background: "#f8fbff",
                            color: "#0f172a",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.total || ""}
                          onChange={(e) =>
                            updateCartItemFromTotal(item.id, e.target.value)
                          }
                          style={{
                            width: "132px",
                            padding: "8px 10px",
                            border: `1px solid ${item.editedFinalAmount !== undefined ? "#60a5fa" : "#dbeafe"}`,
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#0f172a",
                            backgroundColor:
                              item.editedFinalAmount !== undefined
                                ? "#eff6ff"
                                : "#f8fbff",
                          }}
                          placeholder="Amount"
                        />
                        {item.editedFinalAmount !== undefined && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCartItems((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  finalAmount: undefined,
                                },
                              }));
                            }}
                            type="button"
                            style={{
                              padding: "8px 12px",
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                              borderRadius: "10px",
                              cursor: "pointer",
                            }}
                            title="Reset to calculated amount"
                          >
                            Reset
                          </button>
                        )}
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          Editing total recalculates the unit rate automatically.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 18,
                  padding: 18,
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
                  marginBottom: 16,
                  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                    paddingBottom: 10,
                    borderBottom: "1px solid #dbeafe",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      Billing Totals
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Final payable values after line edits, discounts, and freight.
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Live refresh
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  <span>Subtotal</span>
                  <strong>
                    ₹{reviewData.totals.subtotal.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  <span>
                    Tax{" "}
                    {calculatingTotal && (
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        (calculating...)
                      </span>
                    )}
                  </span>
                  <strong>
                    ₹{reviewData.totals.tax.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Grand Total</span>
                  <strong style={{ fontSize: 18, color: "#0f172a" }}>
                    ₹{reviewData.totals.total.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {!singleStepCheckout && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <button
                    className="btn btn-light"
                    onClick={prev}
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    Back to Products
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={next}
                    disabled={!reviewData}
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    Continue to Payment
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {(singleStepCheckout || steps[step] === "Payment") && (
        <div
          style={styles.surfaceCard}
        >
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            Checkout Details
          </div>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
            Complete customer and payment information to finalize the order
          </p>

          {!reviewData ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
              Add at least one product to continue with checkout.
            </div>
          ) : (
            <>
              {/* Customer Information Fields - Similar to Warehouse Field Style */}
              <div
                className="row m-0 p-3"
                style={{
                  marginBottom: "16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {editSaleId &&
                  editSettlementMode === "customer_credit" &&
                  !canCarryCustomerCredit && (
                    <div className="col-12" style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 14,
                          background:
                            "linear-gradient(135deg, rgba(254,242,242,0.96) 0%, rgba(255,255,255,0.98) 100%)",
                          border: "1px solid #fecaca",
                          color: "#991b1b",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        Customer credit cannot be issued against an anonymous walk-in invoice. Please create or complete the customer details first by adding at least a farmer name or mobile number.
                      </div>
                    </div>
                  )}
                {/* Farmer Name - Searchable Dropdown */}
                <div
                  className="col-4 formcontent"
                  ref={farmerSearchRef}
                  style={{ position: "relative" }}
                >
                  <label htmlFor="farmerName">Farmer Name:</label>
                  <input
                    id="farmerName"
                    type="text"
                    placeholder="Select or Type"
                    value={farmerSearchTerm || farmerName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFarmerName(value);
                      handleFarmerSearchChange(value);
                    }}
                    onFocus={handleFarmerFieldFocus}
                    onBlur={() =>
                      setTimeout(() => setShowFarmerDropdown(false), 200)
                    }
                  />
                  {farmerSearchLoading && (
                    <div
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "25px",
                      }}
                    >
                      Searching...
                    </div>
                  )}
                  {showFarmerDropdown && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "60px",
                        left: "80px",
                        zIndex: 999,
                        background: "white",
                        width: "260px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        borderRadius: "10px",
                        boxShadow: "2px 2px 4px #333",
                        padding: "0",
                        margin: "0",
                        listStyle: "none",
                      }}
                    >
                      {farmerSearchResults.length > 0 ? (
                        <>
                          {farmerSearchResults.map((customer) => (
                            <li
                              key={customer.id}
                              onMouseDown={() => handleCustomerSelect(customer)}
                              style={{
                                padding: "5px 10px",
                                cursor: "pointer",
                                fontSize: "14px",
                                borderBottom: "1px solid #f0f0f0",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#f1f1f1")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              <div style={{ fontWeight: "600" }}>
                                {(() => {
                                  const name =
                                    customer.name ||
                                    customer.farmerName ||
                                    customer.label ||
                                    "Customer";
                                  // Check all possible village field names - backend might use different field names
                                  const village =
                                    customer.village ||
                                    customer.villageName ||
                                    customer.area ||
                                    "";
                                  console.log("Dropdown - Customer:", {
                                    id: customer.id,
                                    name,
                                    village,
                                    customerVillage: customer.village,
                                    customerVillageName: customer.villageName,
                                    customerArea: customer.area,
                                    fullCustomer: customer,
                                  });
                                  return village
                                    ? `${name} - ${village}`
                                    : name;
                                })()}
                              </div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                {(() => {
                                  const name =
                                    customer.name ||
                                    customer.farmerName ||
                                    customer.label ||
                                    "Customer";
                                  // Check all possible village field names
                                  const village =
                                    customer.village ||
                                    customer.villageName ||
                                    customer.area ||
                                    "";
                                  const mobile =
                                    customer.mobile ||
                                    customer.phone ||
                                    customer.phoneNo ||
                                    "";
                                  const parts = [];
                                  if (village) parts.push(`📍 ${village}`);
                                  if (mobile) parts.push(`📱 ${mobile}`);
                                  return parts.length > 0
                                    ? parts.join(" • ")
                                    : "No additional info";
                                })()}
                              </div>
                            </li>
                          ))}
                          {farmerSearchTerm && farmerSearchTerm.length > 0 && (
                            <li
                              onMouseDown={() =>
                                handleCustomerSelect("CREATE_NEW")
                              }
                              style={{
                                padding: "5px 10px",
                                cursor: "pointer",
                                fontSize: "14px",
                                backgroundColor: "#e8f5e9",
                                borderTop: "2px solid #4caf50",
                                fontWeight: "600",
                                color: "#2e7d32",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#c8e6c9")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#e8f5e9")
                              }
                            >
                              ➕ Create New: "{farmerSearchTerm}"
                            </li>
                          )}
                        </>
                      ) : (
                        <li
                          onMouseDown={() => handleCustomerSelect("CREATE_NEW")}
                          style={{
                            padding: "5px 10px",
                            cursor: "pointer",
                            fontSize: "14px",
                            backgroundColor: "#e8f5e9",
                            fontWeight: "600",
                            color: "#2e7d32",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#c8e6c9")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#e8f5e9")
                          }
                        >
                          ➕ Create New Customer
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Village Name - Dropdown */}
                <div className="col-4 formcontent">
                  <label htmlFor="villageName">Village Name:</label>
                  <select
                    id="villageName"
                    value={villageName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "ADD_NEW") {
                        setShowAddVillageModal(true);
                      } else {
                        setVillageName(value);
                        setVillageSearchTerm(value);
                      }
                    }}
                  >
                    <option value="">-- Select Village --</option>
                    {storeVillages.map((village) => (
                      <option key={village.id} value={village.villageName}>
                        {village.villageName}
                      </option>
                    ))}
                    <option
                      value="ADD_NEW"
                      style={{
                        fontWeight: "bold",
                        color: "var(--primary-color)",
                      }}
                    >
                      ➕ Add New Village
                    </option>
                  </select>
                </div>

                {/* Village Creation Modal */}
                {showAddVillageModal && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1001,
                    }}
                    onClick={() => setShowAddVillageModal(false)}
                  >
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "24px",
                        width: isMobile ? "90vw" : "400px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3
                        style={{
                          margin: "0 0 16px 0",
                          fontSize: "18px",
                          fontWeight: "600",
                        }}
                      >
                        Add New Village
                      </h3>
                      <div style={{ marginBottom: "20px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          Village Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter village name"
                          value={newVillageNameInput}
                          onChange={(e) =>
                            setNewVillageNameInput(e.target.value)
                          }
                          className="form-control"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateVillage();
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn btn-light"
                          onClick={() => setShowAddVillageModal(false)}
                          disabled={creatingVillage}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleCreateVillage}
                          disabled={
                            creatingVillage || !newVillageNameInput.trim()
                          }
                        >
                          {creatingVillage ? "Adding..." : "Add Village"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Number - Auto-populated or manual entry */}
                <div className="col-4 formcontent">
                  <label htmlFor="mobileNumber">Mobile Number:</label>
                  <input
                    id="mobileNumber"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer Details Section */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: 12,
                  }}
                >
                  Additional Customer Information
                </div>
                <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
                  Optional - Enter additional customer information
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                    <label className="form-label" style={{ marginBottom: 12 }}>
                      Animals (Optional)
                    </label>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "repeat(2, 1fr)",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: 13,
                            color: "#475569",
                            marginBottom: 4,
                            display: "block",
                          }}
                        >
                          Cows
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Number of cows"
                          value={cows}
                          onChange={(e) =>
                            setCows(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          className="form-control"
                          style={{ fontFamily: "Poppins" }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: 13,
                            color: "#475569",
                            marginBottom: 4,
                            display: "block",
                          }}
                        >
                          Buffaloes
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Number of buffaloes"
                          value={buffaloes}
                          onChange={(e) =>
                            setBuffaloes(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          className="form-control"
                          style={{ fontFamily: "Poppins" }}
                        />
                      </div>
                    </div>

                    {/* Additional Animals */}
                    {additionalAnimals.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            fontSize: 13,
                            color: "#475569",
                            marginBottom: 8,
                            display: "block",
                          }}
                        >
                          Additional Animals
                        </label>
                        {additionalAnimals.map((animal, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              gap: 8,
                              marginBottom: 8,
                              alignItems: "flex-end",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <input
                                type="text"
                                placeholder="Animal type (e.g., Goats, Sheep)"
                                value={animal.type}
                                onChange={(e) => {
                                  const updated = [...additionalAnimals];
                                  updated[index].type = e.target.value;
                                  setAdditionalAnimals(updated);
                                }}
                                className="form-control"
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "14px",
                                }}
                              />
                            </div>
                            <div
                              style={{ width: isMobile ? "100px" : "120px" }}
                            >
                              <input
                                type="number"
                                min="0"
                                placeholder="Count"
                                value={animal.count}
                                onChange={(e) => {
                                  const updated = [...additionalAnimals];
                                  updated[index].count = e.target.value.replace(
                                    /[^0-9]/g,
                                    "",
                                  );
                                  setAdditionalAnimals(updated);
                                }}
                                className="form-control"
                                style={{
                                  fontFamily: "Poppins",
                                  fontSize: "14px",
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = additionalAnimals.filter(
                                  (_, i) => i !== index,
                                );
                                setAdditionalAnimals(updated);
                              }}
                              style={{
                                padding: "8px 12px",
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAdditionalAnimals([
                          ...additionalAnimals,
                          { type: "", count: "" },
                        ]);
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>+</span> Add Another Animal
                    </button>
                  </div>
                </div>
              </div>

              {/* Discount Section */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>
                    Per-Item Discounts
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {cartItemsList.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 12,
                        backgroundColor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ flex: "1 1 200px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#334155",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Qty: {item.quantity} | Rate: ₹
                          {(item.unitPrice !== undefined
                            ? item.unitPrice
                            : item.price
                          ).toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          Discount (₹):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          value={
                            item.discountAmount !== undefined
                              ? item.discountAmount
                              : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setCartItems((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                discountAmount:
                                  val === "" ? "" : parseFloat(val),
                              },
                            }));
                          }}
                          placeholder="0"
                          style={{
                            width: "100px",
                            fontSize: 13,
                            height: "34px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Charges Section */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: 12,
                  }}
                >
                  Additional Charges
                </div>

                <div>
                  <label className="form-label">Freight Charges (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={fridgeAmount}
                    onChange={(e) => setFridgeAmount(e.target.value)}
                    placeholder="Enter freight charges amount"
                    style={{ maxWidth: "300px" }}
                  />
                  <small
                    className="text-muted"
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    Additional charge like freight charges, delivery charges,
                    etc.
                  </small>
                </div>
              </div>

              {/* Order Summary */}
              <div
                style={{
                  border: "1px solid #c7d2fe",
                  borderRadius: 20,
                  padding: 18,
                  background:
                    "linear-gradient(135deg, rgba(238,242,255,0.98) 0%, rgba(224,231,255,0.92) 100%)",
                  marginBottom: 16,
                  boxShadow: "0 18px 40px rgba(79, 70, 229, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexDirection: isMobile ? "column" : "row",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#312e81" }}>
                      Order Total
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#1e1b4b",
                      }}
                    >
                      ₹{reviewData.totals.total.toLocaleString("en-IN")}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#4338ca",
                        marginTop: "4px",
                      }}
                    >
                      Subtotal: ₹
                      {reviewData.totals.subtotal.toLocaleString("en-IN")} +
                      Tax: ₹{reviewData.totals.tax.toLocaleString("en-IN")}
                      {reviewData.totals.discountAmount > 0 && (
                        <span style={{ color: "#dc2626" }}>
                          {" "}
                          - Discount: ₹
                          {reviewData.totals.discountAmount.toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      )}
                      {reviewData.totals.freightCharges > 0 && (
                        <span style={{ color: "#059669" }}>
                          {" "}
                          + Freight Charges: ₹
                          {reviewData.totals.freightCharges.toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#4338ca" }}>
                      Order ID: {reviewData.orderId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {shouldShowPaymentSection ? (
              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 18,
                  padding: 18,
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
                  marginBottom: 16,
                  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>
                    {editSaleId ? "Additional Collection" : "Payment Info"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {editSaleId
                      ? `Collect only the extra amount of ₹${requiredPaymentAmount.toLocaleString("en-IN")} before saving this edited invoice.`
                      : "Keep the sale moving while payment proof and UTR are captured."}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#0f172a",
                      fontSize: "14px",
                    }}
                  >
                    Payment Record
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {payments.map((payment, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          Enter transaction details
                        </div>
                      </div>
                      {/* Payment Method Buttons */}
                      <div
                        style={{ marginBottom: "16px", gridColumn: "1 / -1" }}
                      >
                        <label
                          className="form-label"
                          style={{ marginBottom: "12px", display: "block" }}
                        >
                          Payment Method
                        </label>
                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            flexDirection: isMobile ? "column" : "row",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updatePaymentField(idx, "paymentMethod", "cash")
                            }
                            style={{
                              padding: isMobile ? "12px 20px" : "10px 24px",
                              borderRadius: "8px",
                              border: "2px solid",
                              borderColor:
                                (payment.paymentMethod || "cash") === "cash"
                                  ? "var(--primary-color)"
                                  : "#e2e8f0",
                              backgroundColor:
                                (payment.paymentMethod || "cash") === "cash"
                                  ? "var(--primary-color)"
                                  : "#fff",
                              color:
                                (payment.paymentMethod || "cash") === "cash"
                                  ? "#fff"
                                  : "#4a5568",
                              fontWeight: "600",
                              fontSize: isMobile ? "14px" : "14px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              minHeight: isMobile ? "44px" : "auto",
                              flex: isMobile ? "1" : "none",
                            }}
                            onMouseEnter={(e) => {
                              if (
                                (payment.paymentMethod || "cash") !== "cash"
                              ) {
                                e.target.style.borderColor =
                                  "var(--primary-color)";
                                e.target.style.backgroundColor = "#f0f4ff";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (
                                (payment.paymentMethod || "cash") !== "cash"
                              ) {
                                e.target.style.borderColor = "#e2e8f0";
                                e.target.style.backgroundColor = "#fff";
                              }
                            }}
                          >
                            Cash
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updatePaymentField(idx, "paymentMethod", "bank")
                            }
                            style={{
                              padding: isMobile ? "12px 20px" : "10px 24px",
                              borderRadius: "8px",
                              border: "2px solid",
                              borderColor:
                                payment.paymentMethod === "bank"
                                  ? "var(--primary-color)"
                                  : "#e2e8f0",
                              backgroundColor:
                                payment.paymentMethod === "bank"
                                  ? "var(--primary-color)"
                                  : "#fff",
                              color:
                                payment.paymentMethod === "bank"
                                  ? "#fff"
                                  : "#4a5568",
                              fontWeight: "600",
                              fontSize: isMobile ? "14px" : "14px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              minHeight: isMobile ? "44px" : "auto",
                              flex: isMobile ? "1" : "none",
                            }}
                            onMouseEnter={(e) => {
                              if (payment.paymentMethod !== "bank") {
                                e.target.style.borderColor =
                                  "var(--primary-color)";
                                e.target.style.backgroundColor = "#f0f4ff";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (payment.paymentMethod !== "bank") {
                                e.target.style.borderColor = "#e2e8f0";
                                e.target.style.backgroundColor = "#fff";
                              }
                            }}
                          >
                            Bank
                          </button>
                          {creditUsageEnabled && (
                            <button
                              type="button"
                              onClick={() =>
                                updatePaymentField(idx, "paymentMethod", "credit")
                              }
                              style={{
                                padding: isMobile ? "12px 20px" : "10px 24px",
                                borderRadius: "8px",
                                border: "2px solid",
                                borderColor:
                                  payment.paymentMethod === "credit"
                                    ? "#166534"
                                    : "#e2e8f0",
                                backgroundColor:
                                  payment.paymentMethod === "credit"
                                    ? "#166534"
                                    : "#fff",
                                color:
                                  payment.paymentMethod === "credit"
                                    ? "#fff"
                                    : "#4a5568",
                                fontWeight: "600",
                                fontSize: isMobile ? "14px" : "14px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                minHeight: isMobile ? "44px" : "auto",
                                flex: isMobile ? "1" : "none",
                              }}
                            >
                              Credit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              updatePaymentField(idx, "paymentMethod", "both")
                            }
                            style={{
                              padding: isMobile ? "12px 20px" : "10px 24px",
                              borderRadius: "8px",
                              border: "2px solid",
                              borderColor:
                                payment.paymentMethod === "both"
                                  ? "var(--primary-color)"
                                  : "#e2e8f0",
                              backgroundColor:
                                payment.paymentMethod === "both"
                                  ? "var(--primary-color)"
                                  : "#fff",
                              color:
                                payment.paymentMethod === "both"
                                  ? "#fff"
                                  : "#4a5568",
                              fontWeight: "600",
                              fontSize: isMobile ? "14px" : "14px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              minHeight: isMobile ? "44px" : "auto",
                              flex: isMobile ? "1" : "none",
                            }}
                            onMouseEnter={(e) => {
                              if (payment.paymentMethod !== "both") {
                                e.target.style.borderColor =
                                  "var(--primary-color)";
                                e.target.style.backgroundColor = "#f0f4ff";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (payment.paymentMethod !== "both") {
                                e.target.style.borderColor = "#e2e8f0";
                                e.target.style.backgroundColor = "#fff";
                              }
                            }}
                          >
                            Both
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile
                            ? "1fr"
                            : "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: 12,
                        }}
                      >
                        <div>
                          <label className="form-label">Transaction Date</label>
                          <input
                            type="date"
                            className="form-control"
                            value={payment.transactionDate || getTodayDate()}
                            onChange={(e) =>
                              updatePaymentField(
                                idx,
                                "transactionDate",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        {/* Amount fields - different based on payment method */}
                        {payment.paymentMethod === "credit" ? (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <div
                              style={{
                                borderRadius: 12,
                                border: `1px solid ${canCarryCustomerCredit ? "#bbf7d0" : "#fecaca"}`,
                                background: canCarryCustomerCredit ? "#f0fdf4" : "#fff7ed",
                                padding: 14,
                                color: canCarryCustomerCredit ? "#166534" : "#b91c1c",
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              {canCarryCustomerCredit
                                ? `This invoice will be posted against customer credit for ₹${expectedTotal.toLocaleString("en-IN")}.`
                                : "Customer credit requires a saved customer with at least a farmer name or mobile number."}
                            </div>
                          </div>
                        ) : payment.paymentMethod === "both" ? (
                          <>
                            <div>
                              <label className="form-label">
                                Cash Amount (₹)
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.01"
                                value={payment.cashAmount || ""}
                                onChange={(e) =>
                                  updatePaymentField(
                                    idx,
                                    "cashAmount",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter cash amount"
                              />
                            </div>
                            <div>
                              <label className="form-label">
                                Bank Amount (₹)
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.01"
                                value={payment.bankAmount || ""}
                                onChange={(e) =>
                                  updatePaymentField(
                                    idx,
                                    "bankAmount",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter bank amount"
                              />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <small
                                className="text-muted"
                                style={{
                                  fontSize: "12px",
                                  display: "block",
                                  marginTop: "4px",
                                }}
                              >
                                Total to pay: ₹
                                {(requiredPaymentAmount || 0).toLocaleString(
                                  "en-IN",
                                )}
                                {payment.cashAmount && payment.bankAmount && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      color: "#059669",
                                    }}
                                  >
                                    (Cash: ₹
                                    {(
                                      parseFloat(payment.cashAmount) || 0
                                    ).toLocaleString("en-IN")}{" "}
                                    + Bank: ₹
                                    {(
                                      parseFloat(payment.bankAmount) || 0
                                    ).toLocaleString("en-IN")}{" "}
                                    = ₹
                                    {(
                                      (parseFloat(payment.cashAmount) || 0) +
                                      (parseFloat(payment.bankAmount) || 0)
                                    ).toLocaleString("en-IN")}
                                    )
                                  </span>
                                )}
                              </small>
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="form-label">Amount (₹)</label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              step="0.01"
                              value={requiredPaymentAmount || 0}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                cursor: "not-allowed",
                              }}
                            />
                            <small
                              className="text-muted"
                              style={{
                                fontSize: "12px",
                                display: "block",
                                marginTop: "4px",
                              }}
                            >
                              {editSaleId
                                ? "Additional amount to collect (auto-filled)"
                                : "Total amount to pay (auto-filled)"}
                            </small>
                          </div>
                        )}

                        {(payment.paymentMethod === "bank" ||
                          payment.paymentMethod === "both") && (
                          <div>
                            <label className="form-label">
                              UTR Number <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter UTR number"
                              value={payment.utrNumber || ""}
                              onChange={(e) =>
                                updatePaymentField(
                                  idx,
                                  "utrNumber",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        )}
                        {(payment.paymentMethod === "bank" ||
                          payment.paymentMethod === "both") && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <label
                              className="form-label"
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#334155",
                              }}
                            >
                              Bank Transaction Proof{" "}
                              <span style={{ color: "#64748b" }}>
                                (Optional)
                              </span>
                            </label>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              {/* Hidden native input */}
                              <input
                                type="file"
                                id={`bank-proof-${idx}`}
                                accept="image/*,application/pdf"
                                style={{ display: "none" }}
                                onChange={(e) =>
                                  handlePaymentProof(
                                    idx,
                                    e.target.files?.[0],
                                    "bank",
                                  )
                                }
                              />

                              {/* Custom button */}
                              <label
                                htmlFor={`bank-proof-${idx}`}
                                style={{
                                  padding: "6px 14px",
                                  backgroundColor: "var(--primary-color)",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Choose File
                              </label>

                              {/* File name / placeholder */}
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: payment.bankProofFile
                                    ? "#0f172a"
                                    : "#94a3b8",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "180px",
                                }}
                              >
                                {payment.bankProofFile
                                  ? payment.bankProofFile.name
                                  : "No file selected"}
                              </span>
                            </div>

                            {/* View link */}
                            {payment.bankProofPreviewUrl && (
                              <a
                                href={payment.bankProofPreviewUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--primary-color)",
                                  marginTop: "4px",
                                  width: "fit-content",
                                }}
                              >
                                View Bank Proof
                              </a>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="form-label">Remark</label>
                          <input
                            type="text"
                            className="form-control"
                            value={payment.remark}
                            onChange={(e) =>
                              updatePaymentField(idx, "remark", e.target.value)
                            }
                          />
                        </div>

                        {(payment.paymentMethod === "cash" ||
                          payment.paymentMethod === "both") && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <label
                              className="form-label"
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#334155",
                              }}
                            >
                              Cash Proof{" "}
                              <span style={{ color: "#64748b" }}>
                                (Optional)
                              </span>
                            </label>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              {/* Hidden native input */}
                              <input
                                type="file"
                                id={`cash-proof-${idx}`}
                                accept="image/*,application/pdf"
                                style={{ display: "none" }}
                                onChange={(e) =>
                                  handlePaymentProof(
                                    idx,
                                    e.target.files?.[0],
                                    "cash",
                                  )
                                }
                              />

                              {/* Custom button */}
                              <label
                                htmlFor={`cash-proof-${idx}`}
                                style={{
                                  padding: "6px 14px",
                                  backgroundColor: "var(--primary-color)",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Choose File
                              </label>

                              {/* File name / placeholder */}
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: payment.cashProofFile
                                    ? "#0f172a"
                                    : "#94a3b8",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "180px",
                                }}
                              >
                                {payment.cashProofFile
                                  ? payment.cashProofFile.name
                                  : "No file selected"}
                              </span>
                            </div>

                            {/* View link */}
                            {payment.cashProofPreviewUrl && (
                              <a
                                href={payment.cashProofPreviewUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--primary-color)",
                                  marginTop: "4px",
                                  width: "fit-content",
                                }}
                              >
                                View Cash Proof
                              </a>
                            )}
                          </div>
                        )}
                        {(payment.paymentMethod === "bank" ||
                          payment.paymentMethod === "both") && (
                          <div
                            style={{ gridColumn: "1 / -1", marginTop: "8px" }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                // For "both" payment method, use bankAmount; for "bank", use amount
                                const amount =
                                  payment.paymentMethod === "both"
                                    ? parseFloat(payment.bankAmount) || 0
                                    : reviewData?.totals?.total ||
                                      parseFloat(payment.amount) ||
                                      0;

                                if (amount <= 0) {
                                  setSuccessMessage(
                                    payment.paymentMethod === "both"
                                      ? "Please enter a valid bank amount first"
                                      : "Please enter a valid amount first",
                                  );
                                  setTimeout(() => setSuccessMessage(""), 3000);
                                  return;
                                }

                                const upiId =
                                  reviewData?.upiId || "feedbazaar@upi";
                                const upiUrl = `upi://pay?pa=${upiId}&pn=Feed Bazaar Private Limited&am=${amount.toFixed(2)}&cu=INR`;

                                setQrCodeData((prev) => ({
                                  ...prev,
                                  [idx]: {
                                    upiId: upiId,
                                    amount: amount,
                                    upiUrl: upiUrl,
                                    showQR: !prev[idx]?.showQR,
                                  },
                                }));
                              }}
                              style={{
                                padding: "10px 20px",
                                borderRadius: "8px",
                                border: "2px solid var(--primary-color)",
                                backgroundColor: qrCodeData[idx]?.showQR
                                  ? "var(--primary-color)"
                                  : "#fff",
                                color: qrCodeData[idx]?.showQR
                                  ? "#fff"
                                  : "var(--primary-color)",
                                fontWeight: "600",
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                              onMouseEnter={(e) => {
                                if (!qrCodeData[idx]?.showQR) {
                                  e.target.style.backgroundColor =
                                    "var(--primary-color)";
                                  e.target.style.color = "#fff";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!qrCodeData[idx]?.showQR) {
                                  e.target.style.backgroundColor = "#fff";
                                  e.target.style.color = "var(--primary-color)";
                                }
                              }}
                            >
                              {qrCodeData[idx]?.showQR
                                ? "Hide QR"
                                : "Generate QR"}
                            </button>

                            {qrCodeData[idx]?.showQR && (
                              <div
                                style={{
                                  marginTop: "20px",
                                  padding: "20px",
                                  backgroundColor: "#fff",
                                  borderRadius: "12px",
                                  border: "2px solid #e5e7eb",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "16px",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "20px",
                                    backgroundColor: "#fff",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    minWidth: "250px",
                                    minHeight: "250px",
                                  }}
                                >
                                  <QRCodeSVG
                                    value={qrCodeData[idx].upiUrl}
                                    size={250}
                                    level="H"
                                    includeMargin={true}
                                  />
                                </div>

                                <div
                                  style={{
                                    textAlign: "center",
                                    width: "100%",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontFamily: "Poppins",
                                      fontSize: "16px",
                                      fontWeight: 600,
                                      color: "#0f172a",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    UPI ID: {qrCodeData[idx].upiId}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: "Poppins",
                                      fontSize: "18px",
                                      fontWeight: 700,
                                      color: "var(--primary-color)",
                                      marginTop: "4px",
                                    }}
                                  >
                                    Amount: ₹
                                    {qrCodeData[idx].amount.toLocaleString(
                                      "en-IN",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: "Poppins",
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      marginTop: "8px",
                                    }}
                                  >
                                    Scan with any UPI app to pay
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              ) : shouldShowNoPaymentNotice ? (
              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 18,
                  padding: 18,
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
                  marginBottom: 16,
                  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>
                  Payment Info
                </div>
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {invoiceDeltaDirection === "refund"
                    ? `This edited invoice is lower by ₹${Math.abs(
                        invoiceDelta,
                      ).toLocaleString(
                        "en-IN",
                      )}. No new payment will be collected here. Handle the difference using Refund, Customer Credit, or Manager Adjustment above.`
                    : "No immediate payment is required for this edited invoice. Save will stay enabled once the selected adjustment rules are satisfied."}
                </div>
              </div>
              ) : null}

              <div style={{ marginTop: 16, marginBottom: 16, fontSize: "12px", color: "#64748b" }}>
                Ledger posting follows the selected recorded time shown at the top of the checkout page.
              </div>

              {/* Notes field (optional) */}
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <label
                  className="form-label"
                  style={{ fontWeight: 600, marginBottom: 8 }}
                >
                  Notes (Optional)
                </label>
                <textarea
                  className="form-control"
                  placeholder="Enter any additional notes about this sale..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={{ fontSize: "14px" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 16,
                  justifyContent: "flex-end",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                {!singleStepCheckout && (
                  <button
                    className="btn btn-light"
                    type="button"
                    onClick={prev}
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    Back to Overview
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={(e) => {
                    console.log("Button clicked, calling handleSubmitPayment");
                    handleSubmitPayment(e);
                  }}
                  disabled={Boolean(submitBlockedReason)}
                  title={submitBlockedReason || ""}
                  style={{
                    minHeight: isMobile ? "44px" : "auto",
                    width: isMobile ? "100%" : "auto",
                    cursor:
                      submitBlockedReason ? "not-allowed" : "pointer",
                    opacity: submitBlockedReason ? 0.6 : 1,
                  }}
                >
                  {submitting
                    ? "Submitting..."
                    : editSaleId
                      ? "Save Invoice Changes"
                      : "Complete Sale"}
                </button>
              </div>
              {submitBlockedReason && !submitting && (
                <div
                  style={{
                    marginTop: 10,
                    color: "#b42318",
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  {submitBlockedReason}
                </div>
              )}
              {successMessage && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    border: "1px solid #86efac",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {successMessage}
                </div>
              )}
            </>
          )}
        </div>
      )}
        </div>
        {!isMobile && (
          <div
            style={{
              position: "sticky",
              top: 108,
              display: "grid",
              gap: 14,
            }}
          >
            <div style={styles.sidebarCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>
                    Fast Checkout
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Everything you need to edit and save, without hunting around.
                  </div>
                </div>
                <div
                  style={{
                    minWidth: 56,
                    height: 56,
                    borderRadius: 16,
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #0f766e 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 20,
                    boxShadow: "0 14px 28px rgba(29, 78, 216, 0.18)",
                  }}
                >
                  {cartItemsCount}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(59,130,246,0.16)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b" }}>Items in cart</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                    {cartItemsCount}
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.88)",
                    border: "1px solid rgba(59,130,246,0.16)",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b" }}>Current total</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
                    ₹
                    {(
                      calculatedTotal?.total ||
                      reviewData?.totals?.total ||
                      totalCartValue
                    ).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 12, color: calculatingTotal ? "#1d4ed8" : "#64748b" }}>
                    {calculatingTotal
                      ? "Refreshing totals..."
                      : "Updates as you edit quantity, price, and freight."}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {cartItemsCount === 0 ? (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.75)",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    Add products from the left to start checkout.
                  </div>
                ) : (
                  cartItemsList.map((item) => (
                    <div
                      key={`rail-${item.id}`}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(59,130,246,0.14)",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            Qty {item.quantity} bag
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFromCart(item.productId)}
                          style={{ borderRadius: 999, fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          color: "#334155",
                        }}
                      >
                        <span>{item.sku || "N/A"}</span>
                        <strong>₹{getCartItemDisplayTotal(item).toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {renderQuantityModal()}

      {/* Loading overlay */}
      {submitting && <Loading />}

      {/* Error Modal */}
      {isErrorModalOpen && (
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={error}
          onClose={() => {
            setIsErrorModalOpen(false);
            setError("");
          }}
        />
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          message={successMessage || "Sale created successfully!"}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setSuccessMessage("");
            // Navigate back to sales page after closing modal
            navigate("/store/sales");
          }}
        />
      )}
    </div>
  );
}
