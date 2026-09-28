import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../Dashboard/Purchases/Purchases.module.css";
import { FaUserCheck, FaUserClock, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import storeService from "../../../services/storeService";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Modal, Button } from "react-bootstrap";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";

export default function CustomersList() {
  const navigate = useNavigate();
  const [pageNo, setPageNo] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [pincodeHint, setPincodeHint] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    farmerName: "",
    mobile: "",
    phoneNo: "",
    email: "",
    village: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    noOfCows: "",
    noOfBuffaloes: "",
  });

  // Header Search States
  const [showSearch, setShowSearch] = useState({
    code: false,
    name: false,
    mobile: false,
    createdBy: false
  });

  const [searchTerms, setSearchTerms] = useState({
    code: "",
    name: "",
    mobile: "",
    createdBy: ""
  });

  const toggleSearch = (key) => {
    setShowSearch(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = k === key ? !prev[k] : false;
      });
      return next;
    });
  };

  const handleSearchChange = (key, value) => {
    setSearchTerms(prev => ({ ...prev, [key]: value }));
  };

  const clearSearch = (key) => {
    setSearchTerms(prev => ({ ...prev, [key]: "" }));
  };

  const renderSearchHeader = (label, searchKey, dataAttr) => {
    const isSearching = showSearch[searchKey];
    const searchTerm = searchTerms[searchKey];

    return (
      <th
        onClick={() => toggleSearch(searchKey)}
        style={{ cursor: "pointer", position: "relative", fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}
        data-search-header="true"
        {...{ [dataAttr]: true }}
      >
        {isSearching ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(searchKey, e.target.value)}
              style={{
                flex: 1, padding: "2px 6px", border: "1px solid #ddd", borderRadius: "4px",
                fontSize: "12px", minWidth: "120px", height: "28px", color: "#000", backgroundColor: "#fff",
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={(e) => { e.stopPropagation(); clearSearch(searchKey); }}
                style={{
                  padding: "4px 8px", border: "1px solid #dc3545", borderRadius: "4px",
                  background: "#dc3545", color: "#fff", cursor: "pointer", fontSize: "12px",
                  fontWeight: "bold", minWidth: "24px", height: "28px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            )}
          </div>
        ) : (
          <>{label}</>
        )}
      </th>
    );
  };

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close header search if clicked outside
      if (!event.target.closest('[data-search-header]')) {
        setShowSearch({
          code: false,
          name: false,
          mobile: false
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
          code: false,
          name: false,
          mobile: false
        });
        setSearchTerms({
          code: "",
          name: "",
          mobile: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

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

  const toUpperText = (value) =>
    String(value || "").replace(/\s\s+/g, " ").toUpperCase();

  const setEditField = (field, value) => {
    const nextValue =
      field === "mobile" || field === "phoneNo"
        ? String(value || "").replace(/\D/g, "").slice(0, 10)
        : field === "pincode"
          ? String(value || "").replace(/\D/g, "").slice(0, 6)
          : field === "noOfCows" || field === "noOfBuffaloes"
            ? String(value || "").replace(/\D/g, "")
            : toUpperText(value);

    setEditForm((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const openError = (message) => {
    setError(message);
    setIsModalOpen(true);
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
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

      const params = {
        page: pageNo,
        limit: limit,
      };

      const response = await storeService.getStoreCustomers(storeId, params);

      if (response.success && response.data) {
        setCustomers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotal(response.pagination.total || 0);
        }
      } else {
        setError(response.message || "Failed to fetch customers");
        setIsModalOpen(true);
        setCustomers([]);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err.message || "Failed to fetch customers. Please try again.");
      setIsModalOpen(true);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerForEdit = async (customerId) => {
    const storeId = getStoreId();
    if (!storeId) {
      openError("Store not selected. Please select a store first.");
      return;
    }

    try {
      setEditingCustomerId(customerId);
      setLookupLoading(false);
      setPincodeHint("");
      const response = await storeService.getStoreCustomerById(storeId, customerId);
      const customer = response.data || response.customer || response;

      setEditForm({
        name: customer.name || "",
        farmerName: customer.farmerName || "",
        mobile: customer.mobile || "",
        phoneNo: customer.phoneNo || "",
        email: customer.email || "",
        village: customer.village || customer.villageName || "",
        area: customer.area || "",
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
        address: customer.address || "",
        noOfCows: customer.noOfCows != null ? String(customer.noOfCows) : "",
        noOfBuffaloes:
          customer.noOfBuffaloes != null ? String(customer.noOfBuffaloes) : "",
      });
      setIsEditOpen(true);
    } catch (err) {
      console.error("Error loading customer for edit:", err);
      openError(err.message || "Failed to load customer details");
    }
  };

  const applyPincodeAutofill = async (pincodeValue) => {
    const storeId = getStoreId();
    if (!storeId || !pincodeValue || pincodeValue.length !== 6) {
      setPincodeHint("");
      return;
    }

    try {
      setLookupLoading(true);
      const response = await storeService.lookupStoreCustomerPincode(
        storeId,
        pincodeValue,
      );
      const autofill = response?.data?.autofill;

      if (autofill) {
        setEditForm((prev) => ({
          ...prev,
          area: autofill.area || "",
          city: autofill.city || "",
          state: autofill.state || "",
        }));
        setPincodeHint(
          [autofill.area, autofill.city, autofill.state].filter(Boolean).join(", "),
        );
      } else {
        setPincodeHint("No local autofill match found for this pincode.");
      }
    } catch (err) {
      console.error("Error looking up pincode:", err);
      setPincodeHint("Pincode lookup is not available right now.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveCustomer = async () => {
    const storeId = getStoreId();
    if (!storeId || !editingCustomerId) {
      openError("Store or customer is missing");
      return;
    }

    try {
      setSavingCustomer(true);
      const payload = {
        name: editForm.name,
        farmerName: editForm.farmerName,
        mobile: editForm.mobile,
        phoneNo: editForm.phoneNo,
        email: editForm.email,
        village: editForm.village,
        area: editForm.area,
        city: editForm.city,
        state: editForm.state,
        pincode: editForm.pincode,
        address: editForm.address,
        noOfCows: editForm.noOfCows,
        noOfBuffaloes: editForm.noOfBuffaloes,
      };

      await storeService.updateStoreCustomer(storeId, editingCustomerId, payload);
      setIsEditOpen(false);
      setSuccessMessage("CUSTOMER UPDATED SUCCESSFULLY");
      setIsSuccessOpen(true);
      await fetchCustomers();
    } catch (err) {
      console.error("Error updating customer:", err);
      openError(err.message || "Failed to update customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  // Memoized filtered customers for header search
  const displayCustomers = React.useMemo(() => {
    let filtered = customers;

    if (searchTerms.code) {
      filtered = filtered.filter(customer => {
        const code = (customer.customerCode || `CUST${customer.id}`).toLowerCase();
        return code.includes(searchTerms.code.toLowerCase());
      });
    }

    if (searchTerms.name) {
      filtered = filtered.filter(customer => {
        const name = (customer.name || customer.farmerName || customer.label || customer.customerName || '').toLowerCase();
        return name.includes(searchTerms.name.toLowerCase());
      });
    }

    if (searchTerms.mobile) {
      filtered = filtered.filter(customer => {
        const mobile = (customer.mobile || customer.phone || customer.phoneNo || '').toLowerCase();
        return mobile.includes(searchTerms.mobile.toLowerCase());
      });
    }

    if (searchTerms.createdBy) {
      filtered = filtered.filter(customer => {
        const creator = (customer.createdByEmployee?.name || '').toLowerCase();
        return creator.includes(searchTerms.createdBy.toLowerCase());
      });
    }

    return filtered;
  }, [customers, searchTerms]);

  // Fetch customers when page or limit changes
  useEffect(() => {
    fetchCustomers();
  }, [pageNo, limit]);

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingCustomerId(null);
    setLookupLoading(false);
    setPincodeHint("");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Customers List", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Define rows
    const rows = displayCustomers.map((customer, index) => {
      const actualIndex = (pageNo - 1) * limit + index + 1;
      return [
        actualIndex,
        customer.customerCode || `CUST${customer.id}`,
        customer.name || customer.farmerName || customer.label || customer.customerName || 'N/A',
        customer.mobile || customer.phone || customer.phoneNo || 'N/A',
        `Rs. ${customer.totalPurchases?.toLocaleString('en-IN') || '0'}`,
        customer.createdByEmployee?.name || 'N/A'
      ];
    });

    // Generate table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }, // Primary blue color
    });

    doc.save("customers_list.pdf");
  };

  const exportToExcel = () => {
    // Format data for Excel
    const dataToExport = displayCustomers.map((customer, index) => {
      const actualIndex = (pageNo - 1) * limit + index + 1;
      return {
        "S.No": actualIndex,
        "Customer Code": customer.customerCode || `CUST${customer.id}`,
        "Name": customer.name || customer.farmerName || customer.label || customer.customerName || 'N/A',
        "Mobile": customer.mobile || customer.phone || customer.phoneNo || 'N/A',
        "Total Purchases": customer.totalPurchases || 0,
        "Created By": customer.createdByEmployee?.name || 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customers_list.xlsx");
  };

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/customers")}>Customers</span>{" "}
        <i className="bi bi-chevron-right"></i> Customers List
      </p>

      <div className="row m-0 p-3">
        <div className="col-12">
          <div className="row m-0 mb-3 justify-content-between align-items-center">
            {/* Export Buttons */}
            <div className="col-auto d-flex gap-2">
              <button 
                className={styles.xls} 
                onClick={exportToExcel}
                disabled={customers.length === 0}
              >
                <p>Export to </p>
                <img src={xls} alt="" />
              </button>
              <button 
                className={styles.xls} 
                onClick={exportToPDF}
                disabled={customers.length === 0}
              >
                <p>Export to </p>
                <img src={pdf} alt="" />
              </button>
            </div>

            <div className={`${styles.entity} col-auto`} style={{ marginRight: 0 }}>
              <label htmlFor="">Entity :</label>
              <select
                name=""
                id=""
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <table className={`table table-bordered borderedtable`}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>S.No</th>
                {renderSearchHeader("Customer Code", "code", "data-code-header")}
                {renderSearchHeader("Name", "name", "data-name-header")}
                {renderSearchHeader("Mobile", "mobile", "data-mobile-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Total Purchases</th>
                {renderSearchHeader("Created By", "createdBy", "data-created-header")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
              {(searchTerms.code || searchTerms.name || searchTerms.mobile || searchTerms.createdBy) && (
                <tr>
                  <td colSpan="7" style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {displayCustomers.length} customers found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loading />
                  </td>
                </tr>
              ) : displayCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                    NO DATA FOUND
                  </td>
                </tr>
              ) : (
                displayCustomers.map((customer, index) => {
                  const actualIndex = (pageNo - 1) * limit + index + 1;
                  return (
                    <tr
                      key={customer.id}
                      className="animated-row"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td>{actualIndex}</td>
                      <td>{customer.customerCode || `CUST${customer.id}`}</td>
                      <td>{customer.name || customer.farmerName || customer.label || customer.customerName || 'N/A'}</td>
                      <td>{customer.mobile || customer.phone || customer.phoneNo || 'N/A'}</td>
                      <td>₹{customer.totalPurchases?.toLocaleString('en-IN') || '0'}</td>
                      <td>{customer.createdByEmployee?.name || 'N/A'}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/store/customers/${customer.id}`)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => loadCustomerForEdit(customer.id)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="row m-0 p-0 pt-3 justify-content-between align-items-center">
            <div className={`col-6 m-0 p-0`}>
              <p style={{ margin: 0, fontFamily: 'Poppins', fontSize: '14px', color: '#666' }}>
                Showing {customers.length > 0 ? (pageNo - 1) * limit + 1 : 0} to {Math.min(pageNo * limit, total)} of {total} customers
              </p>
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo > 1 && (
                <button onClick={() => setPageNo(pageNo - 1)} disabled={loading}>
                  <span>
                    <FaArrowLeftLong />
                  </span>{" "}
                  Previous
                </button>
              )}
            </div>
            <div className={`col-2 m-0 p-0 ${styles.buttonbox}`}>
              {pageNo < totalPages && (
                <button onClick={() => setPageNo(pageNo + 1)} disabled={loading}>
                  Next{" "}
                  <span>
                    <FaArrowRightLong />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={isEditOpen} onHide={closeEditModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            {[
              ["name", "NAME"],
              ["farmerName", "FARMER NAME"],
              ["mobile", "MOBILE"],
              ["phoneNo", "PHONE NO"],
              ["email", "EMAIL"],
              ["village", "VILLAGE"],
              ["area", "AREA"],
              ["city", "CITY"],
              ["state", "STATE"],
              ["pincode", "PINCODE"],
            ].map(([field, label]) => (
              <div className="col-md-6" key={field}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Poppins",
                    fontWeight: 600,
                    marginBottom: "6px",
                    fontSize: "13px",
                  }}
                >
                  {label}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm[field]}
                  onChange={(e) => setEditField(field, e.target.value)}
                  onBlur={
                    field === "pincode"
                      ? () => applyPincodeAutofill(editForm.pincode)
                      : undefined
                  }
                  placeholder={`ENTER ${label}`}
                />
              </div>
            ))}

            <div className="col-md-6">
              <label style={{ display: "block", fontFamily: "Poppins", fontWeight: 600, marginBottom: "6px", fontSize: "13px" }}>
                NUMBER OF COWS
              </label>
              <input
                type="text"
                className="form-control"
                value={editForm.noOfCows}
                onChange={(e) => setEditField("noOfCows", e.target.value)}
                placeholder="ENTER NUMBER OF COWS"
              />
            </div>

            <div className="col-md-6">
              <label style={{ display: "block", fontFamily: "Poppins", fontWeight: 600, marginBottom: "6px", fontSize: "13px" }}>
                NUMBER OF BUFFALOES
              </label>
              <input
                type="text"
                className="form-control"
                value={editForm.noOfBuffaloes}
                onChange={(e) => setEditField("noOfBuffaloes", e.target.value)}
                placeholder="ENTER NUMBER OF BUFFALOES"
              />
            </div>

            <div className="col-12">
              <label style={{ display: "block", fontFamily: "Poppins", fontWeight: 600, marginBottom: "6px", fontSize: "13px" }}>
                ADDRESS
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={editForm.address}
                onChange={(e) => setEditField("address", e.target.value)}
                placeholder="ENTER ADDRESS"
              />
            </div>

            <div className="col-12">
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontFamily: "Poppins",
                  fontSize: "13px",
                  color: "#475569",
                }}
              >
                <strong style={{ color: "#0f172a" }}>PINCODE AUTOFILL</strong>
                <div style={{ marginTop: "4px" }}>
                  Enter a 6-digit pincode to try local autofill for AREA, CITY, and STATE. Autofilled values remain editable.
                </div>
                {lookupLoading ? (
                  <div style={{ marginTop: "8px", color: "#2563eb" }}>Looking up pincode...</div>
                ) : pincodeHint ? (
                  <div style={{ marginTop: "8px", color: "#047857" }}>{pincodeHint}</div>
                ) : null}
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEditModal} disabled={savingCustomer}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveCustomer} disabled={savingCustomer}>
            {savingCustomer ? "Saving..." : "Save Customer"}
          </Button>
        </Modal.Footer>
      </Modal>

      <SuccessModal
        isOpen={isSuccessOpen}
        message={successMessage}
        onClose={() => {
          setIsSuccessOpen(false);
          setSuccessMessage("");
        }}
      />

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={closeModal}
        />
      )}
    </>
  );
}

