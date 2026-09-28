import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomerTabSection from "./CustomerTabSection";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import storeService from "../../../services/storeService";

function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState("");
  const [creditNote, setCreditNote] = useState("");
  const [savingCredit, setSavingCredit] = useState(false);

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
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    const storeId = getStoreId();
    if (!storeId) {
      setError("Store not selected. Please select a store first.");
      setIsModalOpen(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await storeService.getStoreCustomerById(storeId, id);

      console.log("Customer details response:", response);

      // Handle different response formats
      const customerData = response.data || response.customer || response;

      if (customerData && customerData.id) {
        // Map customer data to match payment step structure
        // Payment step uses: name (or farmerName), mobile, villageName, etc.
        const mappedCustomer = {
          ...customerData,
          // Map name - check multiple field names
          name:
            customerData.name ||
            customerData.farmerName ||
            customerData.label ||
            customerData.customerName ||
            "N/A",
          farmerName:
            customerData.farmerName ||
            customerData.name ||
            customerData.label ||
            "",
          // Map mobile - check multiple field names
          mobile:
            customerData.mobile ||
            customerData.phone ||
            customerData.phoneNo ||
            "",
          // Map village - check multiple field names
          village:
            customerData.village ||
            customerData.villageName ||
            customerData.area ||
            "",
          villageName:
            customerData.villageName ||
            customerData.village ||
            customerData.area ||
            "",
          // Preserve other fields
          customerCode: customerData.customerCode || "",
          email: customerData.email || "",
          area: customerData.area || "",
          city: customerData.city || "",
          address: customerData.address || "",
          pincode: customerData.pincode || "",
          totalPurchases: customerData.totalPurchases || 0,
          lastPurchaseDate: customerData.lastPurchaseDate || null,
          createdAt: customerData.createdAt || null,
          updatedAt: customerData.updatedAt || null,
          createdByEmployee:
            customerData.createdByEmployee || customerData.createdBy || null,
          noOfCows: customerData.noOfCows || null,
          noOfBuffaloes: customerData.noOfBuffaloes || null,
          // Map sales to orders for OrdersTab
          orders: (customerData.sales || []).map((sale) => ({
            id: sale.saleCode || sale.id,
            date: sale.createdAt
              ? new Date(sale.createdAt).toLocaleDateString("en-IN")
              : "N/A",
            items: sale.items ? sale.items.length : 0,
            itemsList: sale.items
              ? sale.items.map((item) => ({
                  name:
                    item.product?.name || item.productName || "Unknown Product",
                  quantity: item.quantity,
                  unit: item.product?.unit || item.unit || "",
                }))
              : [],
            amount: parseFloat(sale.grandTotal || sale.totalAmount || 0),
            status: "Completed", // Store sales are completed immediately
          })),
        };

        console.log("Mapped customer data:", mappedCustomer);
        setCustomer(mappedCustomer);
      } else {
        setError(response.message || "Failed to load customer details");
        setIsModalOpen(true);
        setCustomer(null);
      }
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError(
        err.message || "Failed to load customer details. Please try again.",
      );
      setIsModalOpen(true);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCreditAdjustment = async () => {
    const storeId = getStoreId();
    if (!storeId || !customer?.id) return;

    try {
      setSavingCredit(true);
      const response = await storeService.updateStoreCustomerCreditConfig(
        storeId,
        customer.id,
        {
          manualAdjustment: Number(creditAdjustment || 0),
          note: creditNote,
        },
      );

      setCustomer((prev) => ({
        ...prev,
        creditProfile: response.data?.creditProfile || prev.creditProfile,
      }));
    } catch (err) {
      console.error("Error updating customer credit config:", err);
      setError(err.message || "Failed to update customer credit settings");
      setIsModalOpen(true);
    } finally {
      setSavingCredit(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Loading />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4">
        <p>Customer not found</p>
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i>{" "}
        <span onClick={() => navigate("/store/customers/list")}>
          Customers List
        </span>{" "}
        <i className="bi bi-chevron-right"></i> Customer Details
      </p>

      <div className="p-4">
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "10px",
            }}
          >
            <div>
              <h4
                style={{
                  fontFamily: "Poppins",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--primary-color)",
                }}
              >
                {customer.name ||
                  customer.farmerName ||
                  customer.label ||
                  "Customer"}
              </h4>
              <p
                style={{
                  fontFamily: "Poppins",
                  color: "#666",
                  margin: 0,
                  fontSize: "14px",
                }}
              >
                {customer.mobile || customer.phone || customer.phoneNo || "N/A"}
                {customer.email ? ` • ${customer.email}` : ""}
                {customer.village || customer.villageName
                  ? ` • ${customer.village || customer.villageName}`
                  : ""}
              </p>
            </div>
            {customer.customerCode && (
              <div
                style={{
                  background: "#f3f4f6",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                {customer.customerCode}
              </div>
            )}
          </div>
          {customer.totalPurchases !== undefined && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontFamily: "Poppins",
                  fontSize: "14px",
                  margin: 0,
                  color: "#666",
                }}
              >
                <strong style={{ color: "#374151" }}>Total Purchases:</strong> ₹
                {customer.totalPurchases?.toLocaleString("en-IN") || "0"}
              </p>
            </div>
          )}
        </div>

        {customer.creditProfile && (
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h5
              style={{
                fontFamily: "Poppins",
                fontWeight: 600,
                marginBottom: "20px",
                color: "var(--primary-color)",
              }}
            >
              Credit Profile
            </h5>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {[
                [
                  "Outstanding Credit",
                  customer.creditProfile.outstandingCredit || 0,
                  "#991b1b",
                  "#fef2f2",
                ],
                [
                  "Available Credit",
                  customer.creditProfile.availableAdditionalCredit || 0,
                  "#166534",
                  "#f0fdf4",
                ],
                [
                  "Effective Limit",
                  customer.creditProfile.effectiveLimit || 0,
                  "#1d4ed8",
                  "#eff6ff",
                ],
                /*[
                  /*["Company Pool Left", customer.creditProfile.companyAvailableCredit || 0, "#7c3aed", "#f5f3ff"],
                ],*/
              ].map(([label, value, color, background]) => (
                <div
                  key={label}
                  style={{
                    background,
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color }}>
                    ₹{Number(value || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
            {customer.canManualAdjustCreditLimit && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <h6 style={{ marginBottom: 10, fontWeight: 700 }}>
                  Manual Credit Limit Adjustment
                </h6>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                  Positive values increase this customer's limit. Negative
                  values reduce it. Use this for approved exceptions or
                  payment-slip based credit restoration.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px, 220px) 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    className="form-control"
                    value={creditAdjustment}
                    onChange={(e) => setCreditAdjustment(e.target.value)}
                    placeholder="Adjustment amount"
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    placeholder="Reason / payment note"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveCreditAdjustment}
                    disabled={savingCredit}
                  >
                    {savingCredit ? "Saving..." : "Save Credit Rule"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <CustomerTabSection customer={customer} />
      </div>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default CustomerDetailsPage;
