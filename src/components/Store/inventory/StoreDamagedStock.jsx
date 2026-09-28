import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import ErrorModal from "@/components/ErrorModal";
import Loading from "@/components/Loading";
import styles from "../../Dashboard/HomePage/HomePage.module.css";
import inventoryStyles from "../../Dashboard/Inventory/Inventory.module.css";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6";
import { Modal, Button } from "react-bootstrap";
import storeService from "../../../services/storeService";
import { handleExportPDF, handleExportExcel } from "@/utils/PDFndXLSGenerator";
import xls from "../../../images/xls-png.png";
import pdf from "../../../images/pdf-png.png";
import compressImageToUnder100KB from "../../../services/compressImageUnder100kb";

function StoreDamagedStock() {
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [damagedReports, setDamagedReports] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDamagedStock, setViewDamagedStock] = useState(false);
  const [damagedStockList, setDamagedStockList] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState(""); // Empty for all, or "pending", "approved", etc.
  
  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    quantity: 0,
    damageReason: "",
    description: ""
  });

  const [products, setProducts] = useState([]);

  // Filtered data states
  const [filteredReports, setFilteredReports] = useState([]);

  // Search Visibility states
  const [showSearch, setShowSearch] = useState({
    reportCode: false,
    product: false,
    reason: false
  });

  // Search Term states
  const [searchTerms, setSearchTerms] = useState({
    reportCode: "",
    product: "",
    reason: ""
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

  const handleViewDamagedStock = async () => {
    if (!viewDamagedStock) {
      if (!storeId) {
        alert("Store ID not found");
        return;
      }
      setStockLoading(true);
      try {
        const res = await storeService.getDamagedStock(storeId);
        if (res.success && res.data) {
          setDamagedStockList(res.data);
        }
      } catch (error) {
        console.error("Error fetching damaged stock:", error);
        alert("Failed to fetch damaged stock");
      } finally {
        setStockLoading(false);
      }
    }
    setViewDamagedStock(!viewDamagedStock);
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
            {searchKey === 'product' ? (
              <select
                value={searchTerm}
                onChange={(e) => handleSearchChange(searchKey, e.target.value)}
                style={{
                  flex: 1, padding: "2px 6px", border: "1px solid #ddd", borderRadius: "4px",
                  fontSize: "12px", minWidth: "120px", height: "28px", color: "#000", backgroundColor: "#fff",
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select Product...</option>
                {damagedProductsFilterList.map((p, idx) => (
                  <option key={idx} value={p.name || p}>{p.name || p}</option>
                ))}
              </select>
            ) : (
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
            )}
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

  // Get store ID from localStorage
  useEffect(() => {
    try {
      // Get store ID from multiple sources
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
      }
    } catch (err) {
      console.error("Unable to parse stored user data", err);
      setError("Unable to determine store information. Please re-login.");
    }
  }, []);

  // Filter list states
  const [damagedProductsFilterList, setDamagedProductsFilterList] = useState([]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
      fetchDamagedReports();
      fetchDamagedProductsList();
    }
  }, [storeId, page, limit, statusFilter]);

  const fetchDamagedProductsList = async () => {
    if (!storeId) return;
    try {
      const res = await storeService.getDamagedProducts(storeId);
      console.log("Damaged Products Response:", res);
      if (res && res.success && Array.isArray(res.data)) {
        console.log("Setting filter list from res.data:", res.data);
        setDamagedProductsFilterList(res.data);
      } else if (Array.isArray(res)) {
        setDamagedProductsFilterList(res);
      } else {
        console.warn("Unexpected response format for damaged products:", res);
        setDamagedProductsFilterList([]);
      }
    } catch (err) {
      console.error("Error fetching damaged products list:", err);
      setDamagedProductsFilterList([]);
    }
  };

  const fetchProducts = async () => {
    if (!storeId) return;
    
    try {
      const res = await storeService.getDamagedProducts(storeId);
      if (res && res.success && Array.isArray(res.data)) {
        const productsList = res.data.map(item => ({
          id: item.productId,
          name: item.name,
          code: item.SKU,
          stock: item.currentStock || 0,
          unit: item.unit || "N/A",
          price: 0 // Price not available in this endpoint, defaulting to 0
        }));
        setProducts(productsList);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  const fetchDamagedReports = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const res = await storeService.getStoreDamagedGoods(storeId, params);
      
      // Handle backend response format
      const reportsData = res.data || res.damagedGoods || res || [];
      const paginationData = res.pagination || {};
      
      // Map backend response to UI format
      const mappedReports = Array.isArray(reportsData) ? reportsData.map(report => ({
        id: report.id,
        reportCode: report.reportCode || `DAM${String(report.id).padStart(6, '0')}`,
        productId: report.productId,
        productName: report.product?.name || report.productName || "N/A",
        productSKU: report.product?.SKU || report.product?.sku || "N/A",
        quantity: report.quantity || 0,
        damageReason: report.damageReason || report.reason || "N/A",
        status: report.status || "pending",
        reportedBy: report.reportedByEmployee?.name || report.reportedBy || "N/A",
        reportedAt: report.createdAt || report.reportedAt || report.date,
        image: report.image || report.imageUrl || null
      })) : [];
      
      setDamagedReports(mappedReports);
      setTotal(paginationData.total || mappedReports.length);
      setTotalPages(paginationData.totalPages || Math.ceil((paginationData.total || mappedReports.length) / limit) || 1);
    } catch (err) {
      console.error('Error fetching damaged reports:', err);
      setError(err.response?.data?.message || err.message || "Error fetching damaged goods reports");
    } finally {
      setLoading(false);
    }
  };

  // ESC key functionality
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setShowSearch({
          reportCode: false,
          product: false,
          reason: false
        });
        setSearchTerms({
          reportCode: "",
          product: "",
          reason: ""
        });
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  // Click outside functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-search-header]')) {
        setShowSearch({
          reportCode: false,
          product: false,
          reason: false
        });
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  // Filtering Logic
  useEffect(() => {
    let filtered = damagedReports;
    if (searchTerms.reportCode) {
      filtered = filtered.filter(item => 
        item.reportCode?.toLowerCase().includes(searchTerms.reportCode.toLowerCase())
      );
    }
    if (searchTerms.product) {
      filtered = filtered.filter(item => 
        item.productName?.toLowerCase().includes(searchTerms.product.toLowerCase()) ||
        item.productSKU?.toLowerCase().includes(searchTerms.product.toLowerCase())
      );
    }
    if (searchTerms.reason) {
      filtered = filtered.filter(item => 
        item.damageReason?.toLowerCase().includes(searchTerms.reason.toLowerCase())
      );
    }
    setFilteredReports(filtered);
  }, [damagedReports, searchTerms.reportCode, searchTerms.product, searchTerms.reason]);

  const [currentStock, setCurrentStock] = useState(0);

  // ... (previous code)

  const fetchProductStock = async (productId) => {
    if (!storeId || !productId) return;
    try {
      const res = await axiosAPI.get(`/stores/${storeId}/products/${productId}/stock`);
      // Assuming response format: { success: true, stock: 100 } or just 100 or { data: 100 }
      // Adjust based on typical API response. Let's assume it returns an object with a stock property or the number directly.
      const stockVal = res.data?.stock !== undefined ? res.data.stock : (res.data !== undefined ? res.data : 0);
      setCurrentStock(Number(stockVal));
    } catch (err) {
      console.error("Error fetching real-time stock:", err);
      // Fallback to product list stock if API fails
      const product = products.find(p => p.id === productId);
      setCurrentStock(product?.stock || 0);
    }
  };

  const handleProductSelect = (productId) => {
    // productId from value is string, ensure type match if finding
    const product = products.find(p => p.id == productId); 
    setFormData({
      ...formData,
      productId: productId,
      productName: product ? product.name : ""
    });
    // Set current stock directly from the list as per new requirements
    setCurrentStock(product ? product.stock : 0);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      
      try {
        let finalFile = file;
        if (file.type.startsWith("image/")) {
          const compressedBlob = await compressImageToUnder100KB(file);
          finalFile = new File([compressedBlob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          console.log('Compressed file:', finalFile.name, finalFile.size, finalFile.type);
        }
        setImageFile(finalFile);
      } catch (error) {
        console.error("Error compressing image:", error);
        // Fallback to original file if compression fails
        setImageFile(file);
      }
    } else {
      setImageFile(null);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result); // This includes 'data:image/png;base64,...'
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validation
    if (!formData.productId) return setError('Please select a product');
    if (!formData.quantity || formData.quantity <= 0) return setError('Please enter a valid quantity');
    if (!formData.damageReason) return setError('Please select a damage reason');
    if (!formData.description) return setError('Please enter a description');
    if (!imageFile) return setError('Please select an image file');

    setLoading(true);
    setError(null);

    try {
      // 1. Convert image to Base64
      const imageBase64 = await convertToBase64(imageFile);

      // 2. Prepare Payload
      const selectedProduct = products.find(p => p.id === formData.productId);
      const estimatedValue = (selectedProduct?.price || 0) * formData.quantity;
      
      const payload = {
        storeId: storeId,
        productId: formData.productId,
        quantity: Number(formData.quantity),
        unit: selectedProduct?.unit || "N/A",
        damageReason: formData.damageReason,
        description: formData.description,
        estimatedValue: estimatedValue,
        imageBase64: imageBase64
      };

      console.log('Sending Payload:', payload);

      // 3. Send POST request (JSON)
      const response = await axiosAPI.post('/stores/damaged-goods', payload);

      console.log('Success:', response.data);
      
      alert("Damaged goods reported successfully!");
      
      // Reset
      setFormData({
        productId: "",
        productName: "",
        quantity: 0,
        damageReason: "",
        description: ""
      });
      setImageFile(null);
      setCurrentStock(0);
      setShowForm(false);
      fetchDamagedReports(); // Refresh list to show new report and potential stock update
      fetchProducts(); // Refresh products to update stock in the list if needed

    } catch (err) {
      console.error('Error reporting damaged goods:', err);
      setError(err?.response?.data?.message || err?.message || "Failed to report damaged goods");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const closeViewModal = () => {
    setShowDetailsModal(false);
    setSelectedReport(null);
  };

  const closeErrorModal = () => {
    setError(null);
  };

  // Export function
  const onExport = (type) => {
    const arr = [];
    let x = 1;
    const columns = [
      "S.No",
      "Date",
      "Report Code",
      "Product",
      "Quantity",
      "Damage Reason",
      "Status",
      "Reported By"
    ];
    const dataToExport = filteredReports.length > 0 ? filteredReports : (damagedReports || []);
    if (dataToExport && dataToExport.length > 0) {
      dataToExport.forEach((item) => {
        arr.push({
          "S.No": x++,
          "Date": item.reportedAt ? new Date(item.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : 'N/A',
          "Report Code": item.reportCode || '-',
          "Product": item.productName || '-',
          "Quantity": item.quantity || 0,
          "Damage Reason": item.damageReason || '-',
          "Status": item.status || 'pending',
          "Reported By": item.reportedBy || 'N/A'
        });
      });

      if (type === "PDF") handleExportPDF(columns, arr, "Damaged_Stock");
      else if (type === "XLS")
        handleExportExcel(columns, arr, "DamagedStock");
    } else {
      setError("Table is Empty");
    }
  };

  const mockStats = {
    thisWeek: damagedReports.filter(r => {
      const reportDate = new Date(r.reportedAt || r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length,
    thisMonth: damagedReports.filter(r => {
      const reportDate = new Date(r.reportedAt || r.createdAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return reportDate >= monthAgo;
    }).length,
    totalValue: damagedReports.reduce((sum, r) => sum + (r.estimatedValue || 0), 0),
    pendingReports: damagedReports.filter(r => r.status === 'pending').length
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Damaged Stock</h2>
        {/* Breadcrumb Navigation */}
        <p className="path">
          <span onClick={() => navigate("/store/inventory")}>Inventory</span>{" "}
          <i class="bi bi-chevron-right"></i> Damaged Stock
        </p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div className="col" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="homebtn"
            onClick={() => setShowForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', lineHeight: '1' }}
          >
            Report Damaged Stock
          </button>
          <button 
            className="homebtn"
            onClick={handleViewDamagedStock}
            disabled={stockLoading}
            style={{ 
              marginLeft: '10px',
              background: viewDamagedStock ? 'var(--primary-color)' : '#fff',
              color: viewDamagedStock ? '#fff' : 'var(--primary-color)',
              border: '1px solid var(--primary-color)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', lineHeight: '1'
            }}
          >
            {stockLoading ? 'Loading...' : (viewDamagedStock ? 'Hide Damaged Stock' : 'View Damaged Stock')}
          </button>
        </div>
      </div>

      {/* View Damaged Stock Table */}
      {viewDamagedStock && (
        <div className={styles.orderStatusCard} style={{ marginBottom: "24px" }}>
          <h4
            style={{
              margin: 0,
              marginBottom: "20px",
              fontFamily: "Poppins",
              fontWeight: 600,
              fontSize: "20px",
              color: "var(--primary-color)",
            }}
          >
            Damaged Stock List
          </h4>
          <div className="table-responsive">
            <table className="table table-bordered borderedtable" style={{ fontFamily: 'Poppins' }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Product</th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Quantity</th>
                  <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {damagedStockList.length > 0 ? (
                  damagedStockList.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: 600 }}>
                        {item.product?.name || item.productName || item.productId || "-"}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        {item.damagedQuantity || item.quantity || 0}
                      </td>
                      <td style={{ fontFamily: 'Poppins', fontSize: '13px' }}>
                        {item.unit || item.product?.unit || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center" style={{ padding: '20px', color: "#666" }}>
                      No damaged stock found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Form Modal */}
      <style>{`
        .store-damaged-modal .modal-content {
          background-color: var(--primary-light) !important;
          border: none !important;
          border-radius: 8px !important;
        }
        .store-damaged-modal .modal-header {
          background-color: var(--primary-light) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
        }
        .store-damaged-modal .modal-body {
          background-color: var(--primary-light) !important;
          border-bottom-left-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
        }
        .store-damaged-modal .inputcolumn-mdl {
          width: 460px !important;
          display: flex !important;
          align-items: center !important;
          margin-bottom: 10px !important;
        }
        .store-damaged-modal .inputcolumn-mdl label {
          width: 180px !important;
          text-align: right !important;
          padding-right: 20px !important;
          margin-bottom: 0 !important;
          flex-shrink: 0 !important;
        }
        .store-damaged-modal .inputcolumn-mdl input,
        .store-damaged-modal .inputcolumn-mdl select {
          width: 240px !important;
          flex: 0 0 240px !important;
          height: 24px !important;
        }
        .store-damaged-modal .inputcolumn-mdl textarea {
          width: 240px !important;
          flex: 0 0 240px !important;
          height: 80px !important;
          margin-left: 0 !important;
        }
        .store-damaged-modal .inputcolumn-mdl input[type="file"] {
          width: 240px !important;
          flex: 0 0 240px !important;
        }
      `}</style>
      <Modal 
        show={showForm} 
        onHide={() => {
          setShowForm(false);
          setError(null);
          // Reset form on close
          setFormData({
            productId: "",
            productName: "",
            quantity: 0,
            damageReason: "",
            description: ""
          });
          setImageFile(null);
        }} 
        size="md" 
        centered
        dialogClassName="store-damaged-modal"
        contentClassName="mdl"
      >
        <Modal.Header closeButton style={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          backgroundColor: 'var(--primary-light)',
          padding: '20px'
        }}>
          <Modal.Title className="mdl-title" style={{ 
            fontFamily: 'Poppins',
            color: 'black',
            fontSize: '24px',
            fontWeight: 500,
            paddingTop: '10px',
            marginBottom: '20px'
          }}>
            Report Damaged Stock
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ 
          padding: '20px',
          backgroundColor: 'var(--primary-light)'
        }}>
          {error && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '15px', 
              backgroundColor: '#fee', 
              border: '1px solid #fcc', 
              borderRadius: '4px',
              color: '#c33'
            }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} id="damaged-stock-form">
            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Product: <span style={{color: 'red'}}>*</span></label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Current Stock:</label>
                <input
                  type="text"
                  value={currentStock || 0}
                  readOnly
                  disabled
                  style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Quantity: <span style={{color: 'red'}}>*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Damage Reason: <span style={{color: 'red'}}>*</span></label>
                <select
                  value={formData.damageReason}
                  onChange={(e) => setFormData({ ...formData, damageReason: e.target.value })}
                  required
                >
                  <option value="">Select reason</option>
                  <option value="Expired">Expired</option>
                  <option value="Damaged Package">Damaged Package</option>
                  <option value="Spillage">Spillage</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Reason: <span style={{color: 'red'}}>*</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the reason for damage..."
                  rows="3"
                  required
                />
              </div>
            </div>

            {/* Image File Input */}
            <div className="row justify-content-center">
              <div className="col-6 inputcolumn-mdl">
                <label>Image File (Required): <span style={{color: 'red'}}>*</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  style={{ display: 'block', marginTop: '5px' }}
                />
                {imageFile && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    ✅ Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            <div className="row justify-content-center p-3">
              <div className="col-5" style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
                <button 
                  type="submit" 
                  className="submitbtn" 
                  disabled={loading}
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    // Let the form's onSubmit handle it, but ensure it works
                    const form = document.getElementById('damaged-stock-form');
                    if (form && !form.checkValidity()) {
                      form.reportValidity();
                      e.preventDefault();
                      return false;
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
                <button 
                  type="button" 
                  className="cancelbtn"
                  disabled={loading}
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                    // Reset form on cancel
                    setFormData({
                      productId: "",
                      productName: "",
                      quantity: 0,
                      damageReason: "",
                      description: ""
                    });
                    setImageFile(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Export buttons */}
      {damagedReports.length > 0 && (
        <div className="row m-0 p-3 justify-content-around">
          <div className="col-lg-5">
            <button className={inventoryStyles.xls} onClick={() => onExport("XLS")}>
              <p>Export to </p>
              <img src={xls} alt="" />
            </button>
            <button className={inventoryStyles.xls} onClick={() => onExport("PDF")}>
              <p>Export to </p>
              <img src={pdf} alt="" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Reports Table */}
      <div className={styles.orderStatusCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h4 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 600, fontSize: '20px', color: 'var(--primary-color)' }}>
            Damage Reports
          </h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ marginRight: '8px', fontFamily: 'Poppins', fontSize: '14px' }}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1); // Reset to first page when filter changes
                }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'Poppins' }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label style={{ marginRight: '8px', fontFamily: 'Poppins', fontSize: '14px' }}>Per Page:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1); // Reset to first page when limit changes
                }}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'Poppins' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered borderedtable" style={{ fontFamily: 'Poppins' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Date</th>
                {renderSearchHeader("Report Code", "reportCode", "data-report-code")}
                {renderSearchHeader("Product", "product", "data-product")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Quantity</th>
                {renderSearchHeader("Damage Reason", "reason", "data-reason")}
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Status</th>
                <th style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '13px' }}>Action</th>
              </tr>
              {(searchTerms.reportCode || searchTerms.product || searchTerms.reason) && (
                <tr>
                  <td colSpan={7} style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '0', backgroundColor: '#f8f9fa', color: '#666' }}>
                    {filteredReports.length} reports found
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: '20px' }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, i) => (
                  <tr key={report.id || i}>
                    <td>
                      {report.reportedAt 
                        ? new Date(report.reportedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : 'N/A'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{report.reportCode}</td>
                    <td>
                      {report.productName}
                      {report.productSKU && <span style={{ color: '#666', fontSize: '12px', marginLeft: '4px' }}>({report.productSKU})</span>}
                    </td>
                    <td>{report.quantity}</td>
                    <td>{report.damageReason}</td>
                    <td>
                      <span className={`badge ${
                        report.status === 'approved' ? 'bg-success' :
                        report.status === 'rejected' ? 'bg-danger' :
                        'bg-warning text-dark'
                      }`}>
                        {report.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openViewModal(report)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center" style={{ padding: '20px' }}>
                    No Damaged Goods Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontFamily: 'Poppins', color: '#666', fontSize: '14px' }}>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} reports
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                style={{ fontFamily: 'Poppins' }}
              >
                <FaArrowLeftLong style={{ marginRight: '4px' }} />
                Previous
              </button>
              <span style={{ fontFamily: 'Poppins', padding: '0 12px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || loading}
                style={{ fontFamily: 'Poppins' }}
              >
                Next
                <FaArrowRightLong style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        )}

      {/* View Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Damage Report Details</h5>
                <button type="button" className="btn-close" onClick={closeViewModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Report Code:</strong></div>
                  <div className="col-8">{selectedReport.reportCode || 'N/A'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Product:</strong></div>
                  <div className="col-8">
                    {selectedReport.productName || 'N/A'}
                    {selectedReport.productSKU && <span style={{ color: '#666', marginLeft: '8px' }}>({selectedReport.productSKU})</span>}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Quantity:</strong></div>
                  <div className="col-8">{selectedReport.quantity || '0'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Damage Reason:</strong></div>
                  <div className="col-8">{selectedReport.damageReason || selectedReport.reason || 'N/A'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Status:</strong></div>
                  <div className="col-8">
                    <span className={`badge ${
                      selectedReport.status === 'approved' ? 'bg-success' :
                      selectedReport.status === 'rejected' ? 'bg-danger' :
                      'bg-warning text-dark'
                    }`}>
                      {selectedReport.status || 'pending'}
                    </span>
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Reported By:</strong></div>
                  <div className="col-8">{selectedReport.reportedBy || 'N/A'}</div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Reported At:</strong></div>
                  <div className="col-8">
                    {selectedReport.reportedAt 
                      ? new Date(selectedReport.reportedAt).toLocaleString("en-IN")
                      : 'N/A'}
                  </div>
                </div>
                <div className="row mb-2">
                  <div className="col-4 text-muted"><strong>Image:</strong></div>
                  <div className="col-8">
                    {selectedReport.image ? (
                      <img 
                        src={selectedReport.image} 
                        alt="Damage report" 
                        style={{ 
                          width: '200px', 
                          height: '200px', 
                          objectFit: 'cover', 
                          borderRadius: '6px', 
                          border: '1px solid #eee' 
                        }} 
                      />
                    ) : (
                      <span className="text-muted">No image available</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeViewModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {loading && <Loading />}
      {error && <ErrorModal message={error} onClose={closeErrorModal} />}
    </div>
  );
}

export default StoreDamagedStock;

