import React from "react";
import {
  FaTimes,
  FaFilePdf,
  FaPrint,
  FaCheckCircle,
  FaBuilding,
  FaUser,
  FaCreditCard,
  FaHashtag,
  FaCalendarAlt,
  FaReceipt,
  FaMoneyBillWave,
  FaExternalLinkAlt
} from "react-icons/fa";
import { downloadPaymentReceiptPDF, getPaymentReceiptPdfUrl, numberToWordsINR } from "@/utils/paymentReceiptGenerator";
import styles from "./Payments.module.css";

export default function PaymentReceiptModal({ isOpen, onClose, payment }) {
  if (!isOpen || !payment) return null;

  const numAmount = parseFloat(payment.amount || payment.paidAmount || 0);
  const formattedAmount = `₹${numAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const receiptNo = payment.paymentId ? `RCP-${payment.paymentId}` : `RCP-${payment.id || "0000"}`;
  const formattedDate = payment.transactionDate
    ? new Date(payment.transactionDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadPaymentReceiptPDF(payment);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.receiptModalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className={styles.receiptModalHeader}>
          <div className={styles.receiptModalTitleGroup}>
            <div className={styles.receiptIconCircle}>
              <FaReceipt />
            </div>
            <div>
              <h3>Official Payment Voucher</h3>
              <p>Verified Collection Record • Anjali Constructions & Materials</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* Modal Body / Paper Preview */}
        <div className={styles.receiptModalBody}>
          <div className={styles.voucherPaper}>
            {/* Voucher Header */}
            <div className={styles.voucherHeaderRow}>
              <div>
                <h2 className={styles.companyTitle}>
                  <FaBuilding style={{ display: "inline", marginRight: "8px" }} />
                  ANJALI CONSTRUCTIONS & MATERIALS
                </h2>
                <p className={styles.companySub}>
                  Premium River Sand, M-Sand, Aggregates & Building Supplies
                </p>
                <p className={styles.companyMeta}>
                  GSTIN: 37AAAAA0000A1Z5 | Ph: +91 98765 43210
                </p>
              </div>
              <div className={styles.voucherStatusBadge}>
                <FaCheckCircle />
                <span>PAID & CONFIRMED</span>
              </div>
            </div>

            <hr className={styles.divider} />

            {/* Voucher Meta Strip */}
            <div className={styles.voucherMetaStrip}>
              <div className={styles.voucherMetaItem}>
                <span className={styles.metaLabel}>Receipt Number</span>
                <span className={styles.metaValueHighlight}>{receiptNo}</span>
              </div>
              <div className={styles.voucherMetaItem}>
                <span className={styles.metaLabel}>Transaction Date</span>
                <span className={styles.metaValue}>
                  <FaCalendarAlt style={{ marginRight: "4px" }} />
                  {formattedDate}
                </span>
              </div>
              <div className={styles.voucherMetaItem}>
                <span className={styles.metaLabel}>Sales Order Ref</span>
                <span className={styles.metaValue}>
                  {payment.orderId ? `#${payment.orderId}` : "Advance Payment"}
                </span>
              </div>
            </div>

            {/* Main Info Columns */}
            <div className={styles.voucherTwoCol}>
              {/* Customer Column */}
              <div className={styles.voucherColCard}>
                <div className={styles.voucherSectionTitle}>
                  <FaUser /> Received From (Customer)
                </div>
                <div className={styles.customerNameBig}>
                  {payment.customerName || "Walk-in Customer"}
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Phone:</span>
                  <span className={styles.detailVal}>{payment.customerPhone || "N/A"}</span>
                </div>
                {payment.customerEmail && payment.customerEmail !== "N/A" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Email:</span>
                    <span className={styles.detailVal}>{payment.customerEmail}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>GSTIN:</span>
                  <span className={styles.detailVal}>{payment.customerGst || "Unregistered"}</span>
                </div>
                {payment.customerAddress && payment.customerAddress !== "N/A" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Address:</span>
                    <span className={styles.detailVal}>{payment.customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Column */}
              <div className={styles.voucherColCard}>
                <div className={styles.voucherSectionTitle}>
                  <FaCreditCard /> Payment Channel
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Payment Mode:</span>
                  <span className={styles.modeBadge}>{payment.paymentMode || "Cash"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Ref / UTR No:</span>
                  <span className={styles.detailValMono}>
                    {payment.transactionReference || "Direct Cash"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Yard / Warehouse:</span>
                  <span className={styles.detailVal}>{payment.warehouseName || "Main Yard"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Collected By:</span>
                  <span className={styles.detailVal}>
                    {payment.salesExecutiveName || "Billing Officer"}
                  </span>
                </div>
              </div>
            </div>

            {/* Big Amount Callout */}
            <div className={styles.voucherAmountBox}>
              <div className={styles.amountLeft}>
                <div className={styles.amountLabel}>AMOUNT PAID & CREDITED</div>
                <div className={styles.amountInWords}>
                  {numberToWordsINR(numAmount)}
                </div>
              </div>
              <div className={styles.amountRight}>
                <div className={styles.amountFigure}>{formattedAmount}</div>
              </div>
            </div>

            {/* Remarks / Notes */}
            {payment.remarks && (
              <div className={styles.remarksBox}>
                <strong>Remarks / Purpose:</strong> {payment.remarks}
              </div>
            )}

            {/* Proof image preview if available */}
            {payment.proofImage && (
              <div className={styles.proofPreviewBox}>
                <div className={styles.proofHeader}>
                  <span>Payment Proof Attachment</span>
                  <a
                    href={payment.proofImage}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.proofLink}
                  >
                    View Original <FaExternalLinkAlt size={10} />
                  </a>
                </div>
                <img
                  src={payment.proofImage}
                  alt="Payment Confirmation Proof"
                  className={styles.proofThumbnail}
                />
              </div>
            )}

            {/* Voucher Footer Note */}
            <div className={styles.voucherFooterNote}>
              <p>
                ✓ This receipt certifies payment received and credited against customer balance.
                Computer generated document, valid without physical signature.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={styles.receiptModalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Close
          </button>
          <div className={styles.footerActionGroup}>
            <button className={styles.btnPrint} onClick={handlePrint}>
              <FaPrint /> Print Voucher
            </button>
            <button
              className={styles.btnPrint}
              onClick={() => window.open(getPaymentReceiptPdfUrl(payment), "_blank")}
              title="Open Official PDF in New Tab"
            >
              <FaExternalLinkAlt /> Open PDF
            </button>
            <button className={styles.btnDownloadPdf} onClick={handleDownload}>
              <FaFilePdf /> Download Official PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
