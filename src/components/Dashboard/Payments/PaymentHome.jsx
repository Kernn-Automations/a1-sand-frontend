import React, { useEffect, useState, useMemo } from "react";
import {
  FaMoneyBillWave,
  FaReceipt,
  FaFilePdf,
  FaEye,
  FaSearch,
  FaSync,
  FaCalendarAlt,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaShieldAlt,
  FaBuilding,
  FaCheckCircle,
  FaArrowRight,
  FaDownload,
  FaExchangeAlt
} from "react-icons/fa";
import { useAuth } from "@/Auth";
import PaymentReceiptModal from "./PaymentReceiptModal";
import { downloadPaymentReceiptPDF } from "@/utils/paymentReceiptGenerator";
import styles from "./Payments.module.css";

export default function PaymentHome({ navigate }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Selected payment for Receipt Voucher Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Paid Payments
  const fetchPaidPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only fetch Approved / Paid payments
      const res = await axiosAPI.get("/payment-requests", {
        params: {
          status: "Approved",
          limit: 100,
        },
      });

      let items = [];
      if (res.data?.payments && Array.isArray(res.data.payments)) {
        // Direct flattened payment list from our enhanced backend
        items = res.data.payments;
      } else if (res.data?.salesOrders && Array.isArray(res.data.salesOrders)) {
        // Fallback: extract from salesOrders
        res.data.salesOrders.forEach((so) => {
          if (so.paymentRequests && Array.isArray(so.paymentRequests)) {
            so.paymentRequests.forEach((pr) => {
              if (!pr.status || pr.status === "Approved") {
                items.push({
                  id: pr.id,
                  paymentId: pr.paymentId,
                  amount: parseFloat(pr.amount || 0),
                  paidAmount: parseFloat(pr.amount || 0),
                  paymentMode: pr.paymentMode,
                  transactionReference: pr.transactionReference,
                  transactionDate: pr.transactionDate || pr.createdAt,
                  status: pr.status || "Approved",
                  transactionStatus: pr.transactionStatus || "Completed",
                  remarks: pr.remarks,
                  proofImage: pr.proofImage,
                  createdAt: pr.createdAt,
                  orderId: so.orderId,
                  orderAmount: so.totalAmount,
                  pendingAmount: so.pendingAmount,
                  orderStatus: so.orderStatus,
                  customerName: so.customer?.name || "N/A",
                  customerPhone: so.customer?.phone || "N/A",
                  customerEmail: so.customer?.email || "N/A",
                  customerGst: so.customer?.gstNumber || "N/A",
                  customerAddress: so.customer?.address || "N/A",
                  warehouseName: so.warehouse?.name || "Main Yard",
                  salesExecutiveName: so.salesExecutive?.name || "Billing Officer",
                });
              }
            });
          }
        });
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.transactionDate || b.createdAt) - new Date(a.transactionDate || a.createdAt));
      setPayments(items);
    } catch (err) {
      console.error("Error fetching paid payments:", err);
      setError(err?.response?.data?.message || "Failed to load paid payment transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidPayments();
  }, []);

  // Filter Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cust = (p.customerName || "").toLowerCase();
        const phone = (p.customerPhone || "").toLowerCase();
        const rcp = (p.paymentId || p.id || "").toString().toLowerCase();
        const ord = (p.orderId || "").toString().toLowerCase();
        const ref = (p.transactionReference || "").toLowerCase();
        const mode = (p.paymentMode || "").toLowerCase();

        const match =
          cust.includes(q) ||
          phone.includes(q) ||
          rcp.includes(q) ||
          ord.includes(q) ||
          ref.includes(q) ||
          mode.includes(q);

        if (!match) return false;
      }

      // 2. Mode filter
      if (modeFilter !== "all") {
        if ((p.paymentMode || "").toLowerCase() !== modeFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Date filter
      if (dateFilter !== "all") {
        const itemDate = new Date(p.transactionDate || p.createdAt);
        const now = new Date();

        if (dateFilter === "today") {
          const isToday =
            itemDate.getDate() === now.getDate() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === "this_month") {
          const isThisMonth =
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        }
      }

      return true;
    });
  }, [payments, searchQuery, modeFilter, dateFilter]);

  // Real-time KPI calculations
  const kpis = useMemo(() => {
    const totalCollections = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount || p.paidAmount || 0),
      0
    );

    const now = new Date();
    const thisMonthCollections = payments
      .filter((p) => {
        const d = new Date(p.transactionDate || p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + parseFloat(p.amount || p.paidAmount || 0), 0);

    const modes = new Set(payments.map((p) => p.paymentMode || "Cash"));

    return {
      totalCollections,
      totalCount: payments.length,
      thisMonthCollections,
      activeModesCount: modes.size,
    };
  }, [payments]);

  // Open voucher modal
  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Direct PDF download
  const handleDownloadPDF = (payment) => {
    downloadPaymentReceiptPDF(payment);
  };

  return (
    <div className={styles.paymentsWrapper}>
      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <FaShieldAlt /> Anjali Constructions Collections Desk
          </div>
          <h1 className={styles.heroTitle}>
            <FaMoneyBillWave /> Payments & Receipts Hub
          </h1>
          <p className={styles.heroDesc}>
            Real-time verified collections, instant branded PDF receipt generation, and customer payment records.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            className={styles.actionBtnPrimary}
            onClick={() => navigate("/payments/payment-reports")}
          >
            <FaFileInvoiceDollar /> Reports & Audits
          </button>
          <button
            className={styles.actionBtnSecondary}
            onClick={() => navigate("/payments/payment-approvals")}
          >
            <FaCheckCircle /> Approvals Queue
          </button>
          <button
            className={styles.actionBtnSecondary}
            onClick={() => navigate("/payments/credit-notes")}
          >
            <FaExchangeAlt /> Credit Notes
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconTeal}`}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Paid Collections</span>
            <span className={styles.kpiValue}>
              ₹{kpis.totalCollections.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={styles.kpiSub}>Verified receipts credited</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconEmerald}`}>
            <FaReceipt />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Paid Receipts</span>
            <span className={styles.kpiValue}>{kpis.totalCount} Receipts</span>
            <span className={styles.kpiSub}>100% Confirmed transactions</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconIndigo}`}>
            <FaCalendarAlt />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Collections This Month</span>
            <span className={styles.kpiValue}>
              ₹{kpis.thisMonthCollections.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={styles.kpiSub}>Current billing cycle</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconAmber}`}>
            <FaCreditCard />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Active Channels</span>
            <span className={styles.kpiValue}>{kpis.activeModesCount} Payment Modes</span>
            <span className={styles.kpiSub}>Cash, UPI, NEFT & RTGS</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Refresh */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by customer, order #, receipt #, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI / Online</option>
            <option value="bank transfer">Bank Transfer (NEFT/RTGS)</option>
            <option value="cheque">Cheque</option>
          </select>

          <select
            className={styles.filterSelect}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Transactions</option>
            <option value="today">Today's Collections</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.refreshBtn}
            onClick={fetchPaidPayments}
            title="Refresh Transactions"
          >
            <FaSync className={loading ? "fa-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ borderRadius: "10px", marginBottom: "20px" }}>
          <strong>Error Loading Payments:</strong> {error}
        </div>
      )}

      {/* Content: Loading, Table, Mobile Cards, or Empty State */}
      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading confirmed payment records...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className={styles.emptyStateContainer}>
          <FaReceipt className={styles.emptyStateIcon} />
          <div className={styles.emptyStateTitle}>No Paid Payments Found</div>
          <p className={styles.emptyStateSubtitle}>
            {searchQuery || modeFilter !== "all" || dateFilter !== "all"
              ? "No transactions match your current search and filter criteria. Try resetting filters."
              : "There are no approved payment receipts in the system yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeaderStrip}>
              <div className={styles.tableHeaderTitle}>
                <FaReceipt /> Verified Payment Receipts
                <span className={styles.tableHeaderCount}>{filteredPayments.length}</span>
              </div>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.modernTable}>
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Customer / Client</th>
                    <th>Order Ref</th>
                    <th>Payment Mode</th>
                    <th>UTR / Reference</th>
                    <th>Date & Time</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const receiptNo = p.paymentId ? `RCP-${p.paymentId}` : `RCP-${p.id || "0000"}`;
                    const formattedDate = p.transactionDate
                      ? new Date(p.transactionDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A";
                    const numAmount = parseFloat(p.amount || p.paidAmount || 0);

                    return (
                      <tr key={p.id || p.paymentId}>
                        <td>
                          <span className={styles.receiptNoBadge}>{receiptNo}</span>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            <span className={styles.customerName}>{p.customerName || "Customer"}</span>
                            <span className={styles.customerPhone}>{p.customerPhone || "N/A"}</span>
                          </div>
                        </td>
                        <td>
                          {p.orderId ? (
                            <span className={styles.orderRefLink}>#{p.orderId}</span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>Direct</span>
                          )}
                        </td>
                        <td>
                          <span className={styles.modeBadge}>
                            <FaCreditCard size={11} /> {p.paymentMode || "Cash"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                            {p.transactionReference || "Cash Desk"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                            {formattedDate}
                          </span>
                        </td>
                        <td>
                          <span className={styles.amountCell}>
                            ₹{numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td>
                          <span className={styles.statusBadgePaid}>
                            <FaCheckCircle size={10} /> Paid
                          </span>
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              className={styles.btnActionDownload}
                              onClick={() => handleDownloadPDF(p)}
                              title="Download Official Receipt PDF"
                            >
                              <FaDownload /> Receipt PDF
                            </button>
                            <button
                              className={styles.btnActionView}
                              onClick={() => handleViewReceipt(p)}
                              title="View Payment Voucher"
                            >
                              <FaEye /> Voucher
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid (Visible on <= 768px) */}
          <div className={styles.mobileCardsGrid}>
            {filteredPayments.map((p) => {
              const receiptNo = p.paymentId ? `RCP-${p.paymentId}` : `RCP-${p.id || "0000"}`;
              const formattedDate = p.transactionDate
                ? new Date(p.transactionDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A";
              const numAmount = parseFloat(p.amount || p.paidAmount || 0);

              return (
                <div key={p.id || p.paymentId} className={styles.mobilePaymentCard}>
                  <div className={styles.mobileCardTop}>
                    <div>
                      <div className={styles.receiptNoBadge}>{receiptNo}</div>
                      <div className={styles.mobileCardCustomer} style={{ marginTop: "6px" }}>
                        {p.customerName || "Customer"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {p.customerPhone || ""}
                      </div>
                    </div>
                    <div>
                      <div className={styles.mobileCardAmount}>
                        ₹{numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ textAlign: "right", marginTop: "4px" }}>
                        <span className={styles.statusBadgePaid}>
                          <FaCheckCircle size={9} /> Paid
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.mobileCardMid}>
                    <div className={styles.mobileMetaRow}>
                      <span className={styles.mobileMetaLabel}>Order Ref</span>
                      <span className={styles.mobileMetaValue}>
                        {p.orderId ? `#${p.orderId}` : "Advance Payment"}
                      </span>
                    </div>
                    <div className={styles.mobileMetaRow}>
                      <span className={styles.mobileMetaLabel}>Payment Mode</span>
                      <span className={styles.mobileMetaValue}>{p.paymentMode || "Cash"}</span>
                    </div>
                    <div className={styles.mobileMetaRow}>
                      <span className={styles.mobileMetaLabel}>Reference / UTR</span>
                      <span className={styles.mobileMetaValue} style={{ fontFamily: "monospace" }}>
                        {p.transactionReference || "Direct"}
                      </span>
                    </div>
                    <div className={styles.mobileMetaRow}>
                      <span className={styles.mobileMetaLabel}>Date</span>
                      <span className={styles.mobileMetaValue}>{formattedDate}</span>
                    </div>
                  </div>

                  <div className={styles.mobileCardActions}>
                    <button
                      className={styles.btnActionDownload}
                      onClick={() => handleDownloadPDF(p)}
                    >
                      <FaDownload /> Download PDF
                    </button>
                    <button
                      className={styles.btnActionView}
                      onClick={() => handleViewReceipt(p)}
                    >
                      <FaEye /> View Voucher
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Official Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payment={selectedPayment}
      />
    </div>
  );
}
