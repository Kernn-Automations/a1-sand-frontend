import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ErrorModal from "@/components/ErrorModal";
import erpReportsService, {
  REPORT_CATEGORIES,
  REPORT_TYPES,
} from "@/services/erpReportsService";
import feedsLogo from "../../../images/logo-bg.png";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronRight,
  Database,
  Download,
  Filter,
  LayoutGrid,
  Search,
  Store,
} from "lucide-react";

const css = `
  .erp-page * { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
  .erp-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(0,49,118,0.05), transparent 28%),
      linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
    padding: 0 0 36px;
    color: #10213f;
  }
  .erp-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 28px 0;
    font-size: 12px;
    color: #64748b;
  }
  .erp-breadcrumb-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .erp-breadcrumb-link:hover { color: #003176; }
  .erp-header {
    padding: 12px 28px 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }
  .erp-title h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #0f172a;
  }
  .erp-title p {
    margin: 6px 0 0;
    font-size: 14px;
    color: #5f6f8f;
  }
  .erp-filters {
    margin: 18px 28px 0;
    background: rgba(255,255,255,0.88);
    border: 1px solid rgba(148,163,184,0.2);
    border-radius: 22px;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }
  .erp-filters-top {
    padding: 20px 22px;
    display: grid;
    grid-template-columns: repeat(5, minmax(180px, 1fr));
    gap: 14px;
    align-items: end;
  }
  .erp-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .erp-field label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: #64748b;
  }
  .erp-input, .erp-select {
    width: 100%;
    min-height: 44px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .erp-input:focus, .erp-select:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
  }
  .erp-filter-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .erp-btn {
    min-height: 44px;
    border-radius: 12px;
    border: 1px solid transparent;
    padding: 0 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .erp-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .erp-btn:disabled { opacity: .6; cursor: not-allowed; }
  .erp-btn-primary {
    background: linear-gradient(135deg, #003176, #1d4ed8);
    color: #fff;
    box-shadow: 0 10px 20px rgba(0,49,118,0.18);
  }
  .erp-btn-secondary {
    background: #fff;
    color: #334155;
    border-color: #cbd5e1;
  }
  .erp-store-panel {
    border-top: 1px solid rgba(148,163,184,0.18);
    padding: 18px 22px 22px;
    background: linear-gradient(180deg, rgba(248,250,252,0.95), rgba(241,245,249,0.95));
  }
  .erp-store-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .erp-store-head-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .erp-store-head-title h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
  }
  .erp-store-head-title p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }
  .erp-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .erp-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(37,99,235,0.08);
    color: #1d4ed8;
    border: 1px solid rgba(37,99,235,0.12);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 700;
  }
  .erp-store-search {
    position: relative;
    max-width: 360px;
    width: 100%;
  }
  .erp-store-search svg {
    position: absolute;
    top: 12px;
    left: 12px;
    color: #94a3b8;
  }
  .erp-store-search input {
    padding-left: 38px;
  }
  .erp-store-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    max-height: 280px;
    overflow: auto;
    padding-right: 4px;
  }
  .erp-store-card {
    background: #fff;
    border: 1px solid #dbe4f0;
    border-radius: 16px;
    padding: 12px 14px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
    min-height: 86px;
    cursor: pointer;
    transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
  }
  .erp-store-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 10px 24px rgba(37,99,235,0.08);
    transform: translateY(-1px);
  }
  .erp-store-card.active {
    border-color: #2563eb;
    background: linear-gradient(180deg, #eff6ff, #ffffff);
    box-shadow: 0 12px 24px rgba(37,99,235,0.12);
  }
  .erp-store-card input { margin-top: 4px; }
  .erp-store-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .erp-store-info strong { font-size: 14px; color: #0f172a; }
  .erp-store-info span { font-size: 12px; color: #64748b; }
  .erp-summary-grid {
    margin: 20px 28px 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .erp-summary-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(148,163,184,0.18);
    box-shadow: 0 12px 30px rgba(15,23,42,0.06);
    padding: 16px 18px;
    position: relative;
    overflow: hidden;
  }
  .erp-summary-card::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    border-radius: 18px 0 0 18px;
    background: linear-gradient(180deg, #2563eb, #22c55e);
  }
  .erp-summary-card[data-tone="currency"]::before {
    background: linear-gradient(180deg, #16a34a, #10b981);
  }
  .erp-summary-card[data-tone="percent"]::before {
    background: linear-gradient(180deg, #7c3aed, #a855f7);
  }
  .erp-summary-card[data-tone="number"]::before {
    background: linear-gradient(180deg, #2563eb, #06b6d4);
  }
  .erp-summary-card[data-tone="text"]::before {
    background: linear-gradient(180deg, #f59e0b, #f97316);
  }
  .erp-summary-card label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .erp-summary-card strong {
    font-size: 28px;
    line-height: 1.1;
    color: #0f172a;
    display: block;
  }
  .erp-results {
    margin: 20px 28px 0;
    background: #fff;
    border-radius: 22px;
    border: 1px solid rgba(148,163,184,0.2);
    box-shadow: 0 18px 40px rgba(15,23,42,0.06);
    overflow: hidden;
  }
  .erp-results-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 18px 20px;
    border-bottom: 1px solid #e5edf6;
    background: linear-gradient(180deg, rgba(239,246,255,0.65), rgba(255,255,255,1));
  }
  .erp-results-head h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
  }
  .erp-results-head p {
    margin: 6px 0 0;
    font-size: 13px;
    color: #64748b;
  }
  .erp-badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .erp-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: rgba(15,23,42,0.05);
    color: #334155;
  }
  .erp-badge.category-sales { background: rgba(37,99,235,0.1); color: #1d4ed8; }
  .erp-badge.category-inventory { background: rgba(6,182,212,0.12); color: #0f766e; }
  .erp-badge.category-finance { background: rgba(34,197,94,0.12); color: #15803d; }
  .erp-badge.category-target { background: rgba(124,58,237,0.12); color: #6d28d9; }
  .erp-badge.category-returns { background: rgba(245,158,11,0.14); color: #b45309; }
  .erp-badge.category-damage { background: rgba(239,68,68,0.12); color: #b91c1c; }
  .erp-badge.category-assets { background: rgba(168,85,247,0.12); color: #7e22ce; }
  .erp-badge.type-pill { background: rgba(15,23,42,0.08); color: #334155; }
  .erp-badge.row-pill { background: rgba(2,132,199,0.1); color: #0369a1; }
  .erp-results-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .erp-btn-export {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 800;
  }
  .erp-table-wrap {
    overflow: auto;
    max-height: calc(100vh - 290px);
  }
  .erp-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 980px;
  }
  .erp-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: linear-gradient(180deg, #f8fbff, #eef4ff);
    padding: 12px 14px;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
    border-bottom: 1px solid #dbe4f0;
    text-align: left;
  }
  .erp-table thead th.col-currency {
    background: linear-gradient(180deg, #ecfdf5, #dcfce7);
    color: #166534;
  }
  .erp-table thead th.col-percent {
    background: linear-gradient(180deg, #f5f3ff, #ede9fe);
    color: #6d28d9;
  }
  .erp-table thead th.col-number {
    background: linear-gradient(180deg, #eff6ff, #dbeafe);
    color: #1d4ed8;
  }
  .erp-table thead th.col-text {
    background: linear-gradient(180deg, #fff7ed, #ffedd5);
    color: #c2410c;
  }
  .erp-table tbody td {
    padding: 12px 14px;
    font-size: 13px;
    color: #1e293b;
    border-bottom: 1px solid #edf2f7;
    vertical-align: top;
  }
  .erp-table tbody tr:hover { background: #f8fbff; }
  .erp-cell {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 26px;
    max-width: 100%;
  }
  .erp-cell.currency {
    color: #166534;
    font-weight: 700;
  }
  .erp-cell.percent {
    color: #6d28d9;
    font-weight: 700;
  }
  .erp-cell.number {
    color: #1d4ed8;
    font-weight: 700;
  }
  .erp-cell.direction-up {
    color: #15803d;
    font-weight: 800;
  }
  .erp-cell.direction-down {
    color: #b91c1c;
    font-weight: 800;
  }
  .erp-cell.direction-flat {
    color: #475569;
    font-weight: 700;
  }
  .erp-direction-icon {
    flex: 0 0 auto;
  }
  .erp-cell.text-muted {
    color: #64748b;
  }
  .erp-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .erp-status.completed, .erp-status.approved, .erp-status.active, .erp-status.stock_received {
    background: rgba(34,197,94,0.14);
    color: #15803d;
  }
  .erp-status.pending, .erp-status.scheduled, .erp-status.paused {
    background: rgba(245,158,11,0.15);
    color: #b45309;
  }
  .erp-status.cancelled, .erp-status.rejected, .erp-status.expired, .erp-status.locked {
    background: rgba(239,68,68,0.14);
    color: #b91c1c;
  }
  .erp-status.draft, .erp-status.archived {
    background: rgba(148,163,184,0.18);
    color: #475569;
  }
  .erp-code {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    font-weight: 700;
  }
  .erp-empty {
    margin: 20px 28px 0;
    background: #fff;
    border: 1px dashed #cbd5e1;
    color: #64748b;
    border-radius: 20px;
    padding: 44px 20px;
    text-align: center;
  }
  .erp-loader {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(241,245,249,0.84);
    backdrop-filter: blur(7px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .erp-loader-card {
    background: #fff;
    border-radius: 24px;
    padding: 30px 34px;
    min-width: 320px;
    box-shadow: 0 18px 50px rgba(15,23,42,0.15);
    border: 1px solid rgba(148,163,184,0.22);
    text-align: center;
  }
  .erp-loader-card strong {
    display: block;
    font-size: 18px;
    color: #0f172a;
    margin-bottom: 8px;
  }
  .erp-loader-card span {
    display: block;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 14px;
  }
  .erp-loader-bar {
    height: 5px;
    border-radius: 999px;
    overflow: hidden;
    background: #e2e8f0;
  }
  .erp-loader-bar::after {
    content: "";
    display: block;
    width: 34%;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #003176, #2563eb, #22c55e);
    animation: erp-loading 1.2s ease-in-out infinite;
  }
  @keyframes erp-loading {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(320%); }
  }
  @media (max-width: 1100px) {
    .erp-filters-top { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
  }
  @media (max-width: 768px) {
    .erp-breadcrumb, .erp-header { padding-left: 16px; padding-right: 16px; }
    .erp-filters, .erp-summary-grid, .erp-results, .erp-empty { margin-left: 16px; margin-right: 16px; }
    .erp-filters-top { grid-template-columns: 1fr; }
    .erp-store-grid { grid-template-columns: 1fr; }
  }
`;

const CATEGORY_TO_TYPES = {
  [REPORT_CATEGORIES.sales]: [
    REPORT_TYPES.summary,
    REPORT_TYPES.comparison,
    REPORT_TYPES.leaderboard,
    REPORT_TYPES.trend,
  ],
  [REPORT_CATEGORIES.inventory]: [
    REPORT_TYPES.stockSummary,
    REPORT_TYPES.stockMovement,
  ],
  [REPORT_CATEGORIES.finance]: [
    REPORT_TYPES.profitability,
    REPORT_TYPES.paymentAnalysis,
  ],
  [REPORT_CATEGORIES.target]: [REPORT_TYPES.targetVsAchievement],
  [REPORT_CATEGORIES.returns]: [
    REPORT_TYPES.returnSummary,
    REPORT_TYPES.returnRegister,
  ],
  [REPORT_CATEGORIES.damage]: [
    REPORT_TYPES.damageSummary,
    REPORT_TYPES.damageRegister,
  ],
  [REPORT_CATEGORIES.assets]: [
    REPORT_TYPES.assetSummary,
    REPORT_TYPES.assetRegister,
  ],
};

function toISODateInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function prettifyKey(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function slugifyFileName(value) {
  return (
    String(value || "erp-report")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "erp-report"
  );
}

function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = reject;
    image.src = src;
  });
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === "") return "-";

  if (
    type === "currency" &&
    typeof Number(value) === "number" &&
    !Number.isNaN(Number(value))
  ) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  if (
    type === "percent" &&
    typeof Number(value) === "number" &&
    !Number.isNaN(Number(value))
  ) {
    return `${Number(value).toFixed(2)}%`;
  }

  if (
    type === "number" &&
    typeof Number(value) === "number" &&
    !Number.isNaN(Number(value))
  ) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  return String(value);
}

function getColumnTone(column) {
  const key = String(column?.key || "").toLowerCase();
  if (column?.type) return column.type;
  if (
    key.includes("amount") ||
    key.includes("sales") ||
    key.includes("profit") ||
    key.includes("value") ||
    key.includes("refund") ||
    key.includes("loss")
  ) {
    return "currency";
  }
  if (
    key.includes("percent") ||
    key.includes("margin") ||
    key.includes("growth")
  ) {
    return "percent";
  }
  if (
    key.includes("qty") ||
    key.includes("quantity") ||
    key.includes("count") ||
    key.includes("stock") ||
    key === "sno" ||
    key.includes("bags")
  ) {
    return "number";
  }
  return "text";
}

function isDirectionalMetric(column) {
  const key = String(column?.key || "").toLowerCase();
  return (
    key.includes("change") ||
    key.includes("growth") ||
    key.includes("delta") ||
    key.includes("variance") ||
    key.includes("difference") ||
    key.includes("increase") ||
    key.includes("decrease")
  );
}

function formatExportCell(value, column) {
  const key = String(column?.key || "").toLowerCase();
  const normalized =
    value === null || value === undefined || value === "" ? "-" : value;

  if (key.includes("status")) return String(normalized);
  if (key.includes("code") || key.includes("reference") || key === "sku") {
    return String(normalized);
  }

  return formatValue(normalized, getColumnTone(column));
}

function formatPdfValue(value, type = "text") {
  if (value === null || value === undefined || value === "") return "-";

  const numericValue = Number(value);

  if (type === "currency" && !Number.isNaN(numericValue)) {
    return `INR ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue)}`;
  }

  if (type === "percent" && !Number.isNaN(numericValue)) {
    return `${numericValue.toFixed(2)}%`;
  }

  if (type === "number" && !Number.isNaN(numericValue)) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  return String(value)
    .replace(/₹/g, "INR ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPdfCell(value, column) {
  const key = String(column?.key || "").toLowerCase();
  const normalized =
    value === null || value === undefined || value === "" ? "-" : value;

  if (key.includes("status")) return String(normalized);
  if (key.includes("code") || key.includes("reference") || key === "sku") {
    return String(normalized);
  }

  return formatPdfValue(normalized, getColumnTone(column));
}

function renderCell(value, column) {
  const key = String(column?.key || "").toLowerCase();
  const tone = getColumnTone(column);
  const normalized =
    value === null || value === undefined || value === "" ? "-" : value;
  const numericValue = Number(value);

  if (key.includes("status")) {
    const status = String(normalized).toLowerCase().replace(/\s+/g, "_");
    return <span className={`erp-status ${status}`}>{String(normalized)}</span>;
  }

  if (key.includes("code") || key.includes("reference") || key === "sku") {
    return <span className="erp-code">{String(normalized)}</span>;
  }

  if (
    normalized !== "-" &&
    isDirectionalMetric(column) &&
    !Number.isNaN(numericValue)
  ) {
    const directionClass =
      numericValue > 0
        ? "direction-up"
        : numericValue < 0
          ? "direction-down"
          : "direction-flat";

    return (
      <span className={`erp-cell ${tone} ${directionClass}`}>
        {numericValue > 0 && (
          <ArrowUpRight size={15} className="erp-direction-icon" />
        )}
        {numericValue < 0 && (
          <ArrowDownRight size={15} className="erp-direction-icon" />
        )}
        {formatValue(normalized, tone)}
      </span>
    );
  }

  return (
    <span
      className={`erp-cell ${tone}${normalized === "-" ? " text-muted" : ""}`}
    >
      {formatValue(normalized, tone)}
    </span>
  );
}

function ErpReports({ navigate }) {
  const today = useMemo(() => new Date(), []);
  const defaultTo = useMemo(() => toISODateInputValue(today), [today]);
  const defaultFrom = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return toISODateInputValue(date);
  }, [today]);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORIES.sales);
  const [reportType, setReportType] = useState(REPORT_TYPES.summary);
  const [availableStores, setAvailableStores] = useState([]);
  const [storeSearch, setStoreSearch] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const reportTypeOptions = CATEGORY_TO_TYPES[reportCategory] || [];

  useEffect(() => {
    if (!reportTypeOptions.includes(reportType)) {
      setReportType(reportTypeOptions[0] || "");
    }
  }, [reportCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;

    async function loadStores() {
      try {
        setStoresLoading(true);
        const response = await erpReportsService.getAvailableStores();
        if (!mounted) return;

        if (!response.success) {
          setError(response.message || "Failed to load stores");
          setIsErrorOpen(true);
          return;
        }

        setAvailableStores(response.data || []);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.message || "Failed to load stores");
        setIsErrorOpen(true);
      } finally {
        if (mounted) setStoresLoading(false);
      }
    }

    loadStores();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleStores = useMemo(() => {
    const query = storeSearch.trim().toLowerCase();
    if (!query) return availableStores;
    return availableStores.filter((store) =>
      [store.name, store.storeCode, String(store.id)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [availableStores, storeSearch]);

  const selectedStoreNames = useMemo(
    () =>
      availableStores
        .filter((store) => selectedStoreIds.includes(store.id))
        .map((store) => `${store.name} (${store.storeCode || store.id})`),
    [availableStores, selectedStoreIds],
  );

  const exportColumns = useMemo(
    () =>
      (report?.columns || []).map((column) => ({
        key: column.key,
        label: column.label || prettifyKey(column.key),
        type: column.type || getColumnTone(column),
      })),
    [report],
  );

  const exportRows = useMemo(
    () =>
      (report?.rows || []).map((row) =>
        exportColumns.reduce((acc, column) => {
          acc[column.label] = formatExportCell(row[column.key], column);
          return acc;
        }, {}),
      ),
    [report, exportColumns],
  );

  const toggleStore = (storeId) => {
    setSelectedStoreIds((previous) =>
      previous.includes(storeId)
        ? previous.filter((id) => id !== storeId)
        : [...previous, storeId],
    );
  };

  const toggleVisibleStores = () => {
    const visibleIds = visibleStores.map((store) => store.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((storeId) => selectedStoreIds.includes(storeId));

    if (allVisibleSelected) {
      setSelectedStoreIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id)),
      );
      return;
    }

    setSelectedStoreIds((previous) => [
      ...new Set([...previous, ...visibleIds]),
    ]);
  };

  const closeError = () => setIsErrorOpen(false);

  const exportFileBase = useMemo(() => {
    const title = report?.title || "ERP Report";
    const fromPart = fromDate || "from";
    const toPart = toDate || "to";
    return `${slugifyFileName(title)}-${fromPart}-to-${toPart}`;
  }, [report, fromDate, toDate]);

  const runReport = async () => {
    try {
      if (!fromDate || !toDate) {
        setError("Please choose both From Date and To Date.");
        setIsErrorOpen(true);
        return;
      }

      if (new Date(fromDate) > new Date(toDate)) {
        setError("From Date cannot be after To Date.");
        setIsErrorOpen(true);
        return;
      }

      if (!reportCategory || !reportType) {
        setError("Please choose a report category and type.");
        setIsErrorOpen(true);
        return;
      }

      setLoading(true);
      const response = await erpReportsService.getErpReport({
        fromDate,
        toDate,
        reportCategory,
        reportType,
        storeIds: selectedStoreIds,
      });

      if (!response.success) {
        setError(response.message || "Failed to load ERP report");
        setIsErrorOpen(true);
        return;
      }

      setReport(response.data?.data || response.data || null);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load ERP report");
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setReportCategory(REPORT_CATEGORIES.sales);
    setReportType(REPORT_TYPES.summary);
    setStoreSearch("");
    setSelectedStoreIds([]);
    setReport(null);
  };

  const exportToExcel = () => {
    if (!report || !exportColumns.length) return;

    try {
      setExportingExcel(true);
      const workbook = XLSX.utils.book_new();

      const overviewRows = [
        ["ERP Report", report.title || "ERP Report"],
        ["Subtitle", report.subtitle || "-"],
        ["Category", prettifyKey(report.reportCategory || reportCategory)],
        ["Type", prettifyKey(report.reportType || reportType)],
        ["From Date", fromDate || "-"],
        ["To Date", toDate || "-"],
        [
          "Selected Stores",
          selectedStoreNames.length
            ? selectedStoreNames.join(", ")
            : "All accessible stores",
        ],
        ["Rows", report.rowCount || report.rows?.length || 0],
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet(overviewRows),
        "Overview",
      );

      if ((report.summary || []).length > 0) {
        const summaryRows = [
          ["Label", "Value"],
          ...report.summary.map((item) => [
            item.label,
            formatValue(item.value, item.type || "text"),
          ]),
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet(summaryRows),
          "Summary",
        );
      }

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(exportRows),
        "Report Data",
      );

      XLSX.writeFile(workbook, `${exportFileBase}.xlsx`);
    } catch (exportError) {
      setError(exportError?.message || "Failed to export ERP report to Excel");
      setIsErrorOpen(true);
    } finally {
      setExportingExcel(false);
    }
  };

  const exportToPdf = async () => {
    if (!report || !exportColumns.length) return;

    try {
      setExportingPdf(true);

      let logoBase64 = null;
      try {
        logoBase64 = await loadImageAsDataUrl(feedsLogo);
      } catch (logoError) {
        console.warn(
          "ERP report PDF export: logo could not be loaded.",
          logoError,
        );
      }

      const doc = new jsPDF("l", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const brandBlue = [0, 49, 118];
      const brandGreen = [22, 163, 74];
      const lightBlue = [239, 246, 255];
      const lineGray = [226, 232, 240];

      doc.setFillColor(...brandBlue);
      doc.rect(0, 0, pageWidth, 78, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text(report.title || "ERP Report", margin, 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(report.subtitle || "ERP report export", margin, 62);

      doc.setTextColor(17, 24, 39);
      doc.setFillColor(...lightBlue);
      doc.roundedRect(margin, 96, pageWidth - margin * 2, 74, 12, 12, "F");
      doc.setDrawColor(...lineGray);
      doc.roundedRect(margin, 96, pageWidth - margin * 2, 74, 12, 12, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(
        `Category: ${prettifyKey(report.reportCategory || reportCategory)}`,
        margin + 18,
        122,
      );
      doc.text(
        `Type: ${prettifyKey(report.reportType || reportType)}`,
        margin + 280,
        122,
      );
      doc.text(
        `Rows: ${report.rowCount || report.rows?.length || 0}`,
        margin + 520,
        122,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Date range: ${fromDate || "-"} to ${toDate || "-"}`,
        margin + 18,
        146,
      );
      doc.text(
        `Stores: ${selectedStoreNames.length ? selectedStoreNames.join(", ") : "All accessible stores"}`,
        margin + 280,
        146,
      );

      if ((report.summary || []).length > 0) {
        autoTable(doc, {
          startY: 186,
          margin: { left: margin, right: margin },
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 6 },
          headStyles: { fillColor: brandGreen, textColor: 255 },
          head: [["Summary", "Value"]],
          body: report.summary.map((item) => [
            item.label,
            formatPdfValue(item.value, item.type || "text"),
          ]),
        });
      }

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 186) + 16,
        margin: { left: margin, right: margin, bottom: 56 },
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 5, overflow: "linebreak" },
        headStyles: { fillColor: brandBlue, textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        head: [exportColumns.map((column) => column.label)],
        body: (report.rows || []).map((row) =>
          exportColumns.map((column) => formatPdfCell(row[column.key], column)),
        ),
        didDrawPage: () => {
          const footerY = pageHeight - 28;
          doc.setDrawColor(...lineGray);
          doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `Generated on ${new Date().toLocaleString("en-IN")}`,
            margin,
            footerY,
          );
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
            pageWidth - margin - 36,
            footerY,
          );
          if (logoBase64) {
            doc.addImage(
              logoBase64,
              "PNG",
              pageWidth / 2 - 34,
              pageHeight - 36,
              68,
              16,
            );
          }
        },
      });

      doc.save(`${exportFileBase}.pdf`);
    } catch (exportError) {
      setError(exportError?.message || "Failed to export ERP report to PDF");
      setIsErrorOpen(true);
    } finally {
      setExportingPdf(false);
    }
  };

  const hasRows = Boolean(report?.rows?.length);

  return (
    <>
      <style>{css}</style>

      <div className="erp-page">
        {loading && (
          <div className="erp-loader">
            <div className="erp-loader-card">
              <strong>Building ERP report</strong>
              <span>
                Pulling data, shaping summaries, and preparing the table.
              </span>
              <div className="erp-loader-bar" />
            </div>
          </div>
        )}

        <div className="erp-breadcrumb">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate("/reports")}
          >
            <LayoutGrid size={13} /> Reports
          </span>
          <ChevronRight size={12} />
          <span>ERP Reports</span>
        </div>

        <div className="erp-header">
          <div className="erp-title">
            <h1>ERP Reports</h1>
            <p>
              Sales, inventory, finance, targets, returns, damages, and asset
              reports from one workspace.
            </p>
          </div>
        </div>

        <div className="erp-filters">
          <div className="erp-filters-top">
            <div className="erp-field">
              <label htmlFor="erpFrom">
                <Calendar
                  size={12}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                From Date
              </label>
              <input
                id="erpFrom"
                className="erp-input"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>

            <div className="erp-field">
              <label htmlFor="erpTo">
                <Calendar
                  size={12}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                To Date
              </label>
              <input
                id="erpTo"
                className="erp-input"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>

            <div className="erp-field">
              <label htmlFor="erpCategory">
                <Database
                  size={12}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                Report Category
              </label>
              <select
                id="erpCategory"
                className="erp-select"
                value={reportCategory}
                onChange={(event) => setReportCategory(event.target.value)}
              >
                {Object.values(REPORT_CATEGORIES).map((category) => (
                  <option key={category} value={category}>
                    {prettifyKey(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-field">
              <label htmlFor="erpType">
                <Filter
                  size={12}
                  style={{ marginRight: 6, verticalAlign: "middle" }}
                />
                Report Type
              </label>
              <select
                id="erpType"
                className="erp-select"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                {reportTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {prettifyKey(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="erp-filter-actions">
              <button
                className="erp-btn erp-btn-primary"
                onClick={runReport}
                disabled={loading || storesLoading}
              >
                <BarChart3 size={16} /> Generate Report
              </button>
              <button
                className="erp-btn erp-btn-secondary"
                onClick={resetFilters}
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="erp-store-panel">
            <div className="erp-store-head">
              <div className="erp-store-head-title">
                <h3>Store Filter</h3>
                <p>
                  Leave this empty to run the report across all stores you can
                  access.
                </p>
              </div>

              <div className="erp-chip-row">
                <span className="erp-chip">
                  <Store size={13} /> Accessible: {availableStores.length}
                </span>
                <span className="erp-chip">
                  Selected: {selectedStoreIds.length || "All"}
                </span>
                <button
                  type="button"
                  className="erp-btn erp-btn-secondary"
                  style={{ minHeight: 34, padding: "0 12px", fontSize: 12 }}
                  onClick={toggleVisibleStores}
                  disabled={storesLoading || visibleStores.length === 0}
                >
                  {visibleStores.length > 0 &&
                  visibleStores.every((store) =>
                    selectedStoreIds.includes(store.id),
                  )
                    ? "Clear Visible"
                    : "Select Visible"}
                </button>
              </div>
            </div>

            <div className="erp-store-search">
              <Search size={16} />
              <input
                className="erp-input"
                type="text"
                placeholder="Search by store name, code, or id"
                value={storeSearch}
                onChange={(event) => setStoreSearch(event.target.value)}
              />
            </div>

            <div style={{ height: 12 }} />

            <div className="erp-store-grid">
              {visibleStores.map((store) => {
                const checked = selectedStoreIds.includes(store.id);
                return (
                  <label
                    key={store.id}
                    className={`erp-store-card${checked ? " active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStore(store.id)}
                    />
                    <div className="erp-store-info">
                      <strong>{store.name}</strong>
                      <span>Code: {store.storeCode || "-"}</span>
                      <span>Store Id: {store.id}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {selectedStoreNames.length > 0 && (
              <div style={{ marginTop: 14 }} className="erp-chip-row">
                {selectedStoreNames.slice(0, 10).map((name) => (
                  <span key={name} className="erp-chip">
                    {name}
                  </span>
                ))}
                {selectedStoreNames.length > 10 && (
                  <span className="erp-chip">
                    +{selectedStoreNames.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {report?.summary?.length > 0 && (
          <div className="erp-summary-grid">
            {report.summary.map((item) => (
              <div
                key={item.label}
                className="erp-summary-card"
                data-tone={item.type || "text"}
              >
                <label>{item.label}</label>
                <strong>{formatValue(item.value, item.type)}</strong>
              </div>
            ))}
          </div>
        )}

        {report && (
          <div className="erp-results">
            <div className="erp-results-head">
              <div>
                <h3>{report.title || "ERP Report"}</h3>
                <p>
                  {report.subtitle ||
                    "Report data for the selected ERP filters."}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <div className="erp-results-actions">
                  <button
                    className="erp-btn erp-btn-secondary erp-btn-export"
                    onClick={exportToExcel}
                    disabled={
                      !exportColumns.length || exportingExcel || exportingPdf
                    }
                  >
                    <Download size={14} />
                    {exportingExcel ? "Exporting Excel..." : "Export Excel"}
                  </button>
                  <button
                    className="erp-btn erp-btn-primary erp-btn-export"
                    onClick={exportToPdf}
                    disabled={
                      !exportColumns.length || exportingPdf || exportingExcel
                    }
                  >
                    <Download size={14} />
                    {exportingPdf ? "Exporting PDF..." : "Export PDF"}
                  </button>
                </div>

                <div className="erp-badge-row">
                  <span
                    className={`erp-badge category-${report.reportCategory || reportCategory}`}
                  >
                    Category:{" "}
                    {prettifyKey(report.reportCategory || reportCategory)}
                  </span>
                  <span className="erp-badge type-pill">
                    Type: {prettifyKey(report.reportType || reportType)}
                  </span>
                  <span className="erp-badge row-pill">
                    Rows: {report.rowCount || report.rows?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {hasRows ? (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead>
                    <tr>
                      {(report.columns || []).map((column) => (
                        <th
                          key={column.key}
                          className={`col-${getColumnTone(column)}`}
                        >
                          {column.label || prettifyKey(column.key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, index) => (
                      <tr key={row.id || row.code || row.sNo || index}>
                        {(report.columns || []).map((column) => (
                          <td key={column.key}>
                            {renderCell(row[column.key], column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="erp-empty"
                style={{ margin: 0, border: "none", borderRadius: 0 }}
              >
                No rows matched the selected filters.
              </div>
            )}
          </div>
        )}

        {!report && !loading && (
          <div className="erp-empty">
            <strong
              style={{ display: "block", marginBottom: 8, color: "#0f172a" }}
            >
              Generate an ERP report
            </strong>
            Pick a category, report type, optional stores, and date range to
            load the data.
          </div>
        )}
      </div>

      {isErrorOpen && (
        <ErrorModal isOpen={isErrorOpen} message={error} onClose={closeError} />
      )}
    </>
  );
}

export default ErpReports;
