import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Convert number to Indian Currency Words (INR)
 */
export function numberToWordsINR(num) {
  if (num === null || num === undefined || isNaN(num)) return "Zero Rupees Only";
  const n = Math.floor(Math.abs(Number(num)));
  if (n === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(val) {
    if (val < 20) return a[val];
    const tens = b[Math.floor(val / 10)];
    const unit = a[val % 10];
    return unit ? `${tens} ${unit}` : tens;
  }

  function convertGroup(val) {
    let str = "";
    if (val >= 100) {
      str += `${a[Math.floor(val / 100)]} Hundred `;
      val %= 100;
    }
    if (val > 0) {
      str += inWords(val) + " ";
    }
    return str.trim();
  }

  const crore = Math.floor(n / 10000000);
  const remainderCrore = n % 10000000;
  const lakh = Math.floor(remainderCrore / 100000);
  const remainderLakh = remainderCrore % 100000;
  const thousand = Math.floor(remainderLakh / 1000);
  const remainderThousand = remainderLakh % 1000;

  let out = "";
  if (crore > 0) out += `${convertGroup(crore)} Crore `;
  if (lakh > 0) out += `${convertGroup(lakh)} Lakh `;
  if (thousand > 0) out += `${convertGroup(thousand)} Thousand `;
  if (remainderThousand > 0) out += `${convertGroup(remainderThousand)} `;

  return `${out.trim()} Rupees Only`;
}

/**
 * Get direct URL for the official server-side Payment Receipt PDF template
 */
export function getPaymentReceiptPdfUrl(payment) {
  if (!payment) return "#";
  const payId = typeof payment === "object" ? (payment.id || payment.paymentId) : payment;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  return `${API_URL}/sales-orders/payment-receipt/${payId}/pdf`;
}

/**
 * Download official Payment Receipt PDF
 * Uses the exact official template implemented in Sales Orders (rendered via EJS & Playwright)
 */
export async function downloadPaymentReceiptPDF(payment) {
  if (!payment) return false;

  const payId = typeof payment === "object" ? (payment.id || payment.paymentId) : payment;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("accessToken");

  try {
    const res = await fetch(`${API_URL}/sales-orders/payment-receipt/${payId}/pdf`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PaymentReceipt-RCP-${payId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.warn("Falling back to client-side vector receipt generator:", err);
    generateClientReceiptFallback(payment);
    return true;
  }
}

/**
 * Client-side vector fallback generator (used only if server connection is completely offline)
 */
function generateClientReceiptFallback(payment) {
  if (!payment) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [15, 23, 42];
  const accentColor = [13, 148, 136];
  const emeraldColor = [22, 163, 74];
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // Brand Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ANJALI CONSTRUCTIONS & MATERIALS", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Premium River Sand, M-Sand, Aggregates & Building Supplies", 14, 19);
  doc.text("GSTIN: 37AAAAA0000A1Z5 | Contact: +91 98765 43210", 14, 25);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 62, 7, 48, 18, 2, 2, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAYMENT RECEIPT", pageWidth - 38, 14, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(...emeraldColor);
  doc.text("● CONFIRMED & PAID", pageWidth - 38, 20, { align: "center" });

  let y = 42;
  const receiptNo = payment.paymentId ? `RCP-${payment.paymentId}` : `RCP-${payment.id || "0000"}`;
  const receiptDate = payment.transactionDate
    ? new Date(payment.transactionDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text("RECEIPT NO:", 20, y + 8);
  doc.text("DATE & TIME:", 75, y + 8);
  doc.text("SALES ORDER REF:", 130, y + 8);

  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.text(receiptNo, 20, y + 14);
  doc.text(receiptDate, 75, y + 14);
  doc.text(payment.orderId ? `#${payment.orderId}` : "Direct Advance", 130, y + 14);

  y += 28;
  const colWidth = (pageWidth - 34) / 2;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, colWidth, 34, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text("RECEIVED FROM (CUSTOMER)", 20, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text(payment.customerName || "Customer", 20, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.text(`Phone: ${payment.customerPhone || "N/A"}`, 20, y + 20);
  doc.text(`GSTIN: ${payment.customerGst || "Unregistered"}`, 20, y + 26);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + colWidth + 6, y, colWidth, 34, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text("PAYMENT CHANNEL", 20 + colWidth + 6, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text("Mode:", 20 + colWidth + 6, y + 14);
  doc.text("Ref / UTR:", 20 + colWidth + 6, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(payment.paymentMode || "Cash", 50 + colWidth + 6, y + 14);
  doc.text(payment.transactionReference || "Cash", 50 + colWidth + 6, y + 20);

  y += 40;
  const numAmount = parseFloat(payment.amount || payment.paidAmount || 0);
  const formattedAmount = `Rs. ${numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  autoTable(doc, {
    startY: y,
    head: [["SL", "DESCRIPTION", "MODE", "TRANSACTION REF", "AMOUNT"]],
    body: [
      [
        "1",
        payment.orderId ? `Payment for Sales Order #${payment.orderId}` : "Advance / Direct Payment",
        payment.paymentMode || "Cash",
        payment.transactionReference || "N/A",
        formattedAmount,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8.5 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, finalY, pageWidth - 28, 20, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...emeraldColor);
  doc.text("TOTAL PAYMENT RECEIVED:", 20, finalY + 7);
  doc.setFontSize(13);
  doc.text(formattedAmount, pageWidth - 20, finalY + 8, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(numberToWordsINR(numAmount), 20, finalY + 15);

  const cleanId = (payment.paymentId || payment.id || "receipt").toString().replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`PaymentReceipt-RCP-${cleanId}.pdf`);
}
