import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import storeService from "@/services/storeService";

const cardStyle = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  border: "1px solid #dbeafe",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const groups = [
  [
    "Inventory",
    [
      "ledger_rows",
      "opening_stock",
      "closing_stock",
      "damaged_goods",
      "stock_transfers",
    ],
  ],
  ["Sales And Payments", ["store_invoices", "payment_updates"]],
  [
    "Store Setup",
    ["price_updates", "product_status_updates", "customers", "villages"],
  ],
  ["Finance And Assets", ["expenditures", "assets"]],
];

const text = (v) => String(v ?? "").trim();
const num = (v) => Number(v || 0);
const rowError = (i, msg) => new Error(`Row ${i + 2}: ${msg}`);

const config = {
  ledger_rows: {
    label: "Ledger Rows",
    color: "#1d4ed8",
    desc: "Backdated stock movements for stock in, stock out, and reset.",
    columns:
      "storeCode, productSku, transactionType(stockin/stockout/adjustment), quantity, recordedAt, referenceId, remarks, unitPrice, totalPrice",
    file: (m) =>
      m
        ? "admin_multi_store_ledger_import_template.xlsx"
        : "store_ledger_import_template.xlsx",
    sheet: "LedgerRows",
    sample: (a, b) => [
      {
        storeCode: a,
        productSku: "27%",
        transactionType: "adjustment",
        quantity: 120,
        recordedAt: "2026-03-01T09:00",
        referenceId: "OPENING-2026-03-01",
        remarks: "Opening stock reset",
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        storeCode: b,
        productSku: "Gouri",
        transactionType: "stockin",
        quantity: 25,
        recordedAt: "2026-03-02T11:30",
        referenceId: "IMPORT-LEDGER-2",
        remarks: "Backdated stock receipt",
        unitPrice: 1450,
        totalPrice: 36250,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["productSku", "Product SKU"],
      ["transactionType", "stockin, stockout, adjustment"],
      ["quantity", "Positive value"],
      ["recordedAt", "YYYY-MM-DDTHH:mm"],
    ],
    parse: (row, i, storeCode) => {
      const productSku = text(
        row.productSku || row.productSKU || row.sku || row.SKU,
      );
      const transactionType = text(row.transactionType).toLowerCase();
      const quantity = num(row.quantity);
      const rowStoreCode = text(row.storeCode || storeCode);
      const recordedAt = text(row.recordedAt);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      if (!["stockin", "stockout", "adjustment"].includes(transactionType))
        throw rowError(i, "invalid transactionType.");
      if (!Number.isFinite(quantity))
        throw rowError(i, "quantity must be numeric.");
      if (!recordedAt) throw rowError(i, "recordedAt is required.");
      return {
        storeCode: rowStoreCode,
        productSku,
        transactionType,
        quantity,
        recordedAt,
        referenceId: text(row.referenceId || `excel-${Date.now()}-${i}`),
        remarks: text(row.remarks) || null,
        unitPrice: num(row.unitPrice),
        totalPrice: num(row.totalPrice),
      };
    },
  },
  opening_stock: {
    label: "Opening Stock",
    color: "#0f766e",
    desc: "Fast setup import for new stores. Each row becomes an opening adjustment.",
    columns:
      "storeCode, productSku, quantity, recordedAt, referenceId, remarks, unitPrice, totalPrice",
    file: (m) =>
      m
        ? "admin_multi_store_opening_stock_template.xlsx"
        : "store_opening_stock_template.xlsx",
    sheet: "OpeningStock",
    sample: (a, b) => [
      {
        storeCode: a,
        productSku: "20%",
        quantity: 60,
        recordedAt: "2026-03-01T09:00",
        referenceId: "OPEN-20-001",
        remarks: "Opening stock for FB-20%",
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        storeCode: b,
        productSku: "Gouri",
        quantity: 45,
        recordedAt: "2026-03-01T09:00",
        referenceId: "OPEN-GOURI-001",
        remarks: "Opening stock for Gouri",
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["productSku", "Product SKU"],
      ["quantity", "Opening quantity"],
      ["recordedAt", "YYYY-MM-DDTHH:mm"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const productSku = text(row.productSku || row.SKU);
      const quantity = num(row.quantity);
      const recordedAt = text(row.recordedAt);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      if (!Number.isFinite(quantity))
        throw rowError(i, "quantity must be numeric.");
      if (!recordedAt) throw rowError(i, "recordedAt is required.");
      return {
        storeCode: rowStoreCode,
        productSku,
        quantity,
        recordedAt,
        referenceId: text(row.referenceId || `OPENING-${i + 1}`),
        remarks: text(row.remarks) || "Opening stock import",
        unitPrice: num(row.unitPrice),
        totalPrice: num(row.totalPrice),
      };
    },
  },
  closing_stock: {
    label: "Closing Stock",
    color: "#9f1239",
    desc: "Set the exact closing balance for products on a selected recorded date. Each row becomes an exact-balance adjustment.",
    columns:
      "storeCode, productSku, quantity, recordedAt, referenceId, remarks, unitPrice, totalPrice",
    file: (m) =>
      m
        ? "admin_multi_store_closing_stock_template.xlsx"
        : "store_closing_stock_template.xlsx",
    sheet: "ClosingStock",
    sample: (a, b) => [
      {
        storeCode: a,
        productSku: "20%",
        quantity: 60,
        recordedAt: "2026-03-31T18:00",
        referenceId: "CLOSE-20-001",
        remarks: "Closing stock for March end",
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        storeCode: b,
        productSku: "Gouri",
        quantity: 45,
        recordedAt: "2026-03-31T18:00",
        referenceId: "CLOSE-GOURI-001",
        remarks: "Closing stock for March end",
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["productSku", "Product SKU"],
      ["quantity", "Exact closing balance at recordedAt"],
      ["recordedAt", "YYYY-MM-DDTHH:mm"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const productSku = text(row.productSku || row.SKU);
      const quantity = num(row.quantity);
      const recordedAt = text(row.recordedAt);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      if (!Number.isFinite(quantity))
        throw rowError(i, "quantity must be numeric.");
      if (!recordedAt) throw rowError(i, "recordedAt is required.");
      return {
        storeCode: rowStoreCode,
        productSku,
        quantity,
        recordedAt,
        referenceId: text(row.referenceId || `CLOSING-${i + 1}`),
        remarks: text(row.remarks) || "Closing stock import",
        unitPrice: num(row.unitPrice),
        totalPrice: num(row.totalPrice),
      };
    },
  },
  store_invoices: {
    label: "Store Invoices",
    color: "#7c3aed",
    desc: "Backdated invoice upload with customer, payment, and item rows.",
    columns:
      "invoiceRef, storeCode, recordedAt, customerMobile, farmerName, village, paymentMethod, paymentAmount, transactionNumber, notes, productSku, quantity, unitPrice, discountAmount, taxAmount, finalAmount",
    file: (m) =>
      m
        ? "admin_multi_store_invoice_import_template.xlsx"
        : "store_invoice_import_template.xlsx",
    sheet: "StoreInvoices",
    sample: (a, b) => [
      {
        invoiceRef: "INV-GRP-001",
        storeCode: a,
        recordedAt: "05-03-2026",
        customerMobile: "9876543210",
        farmerName: "Ramesh Patel",
        village: "Anand",
        paymentMethod: "cash",
        paymentAmount: 35400,
        transactionNumber: "",
        notes: "Imported invoice",
        productSku: "27%",
        quantity: 20,
        unitPrice: 1500,
        discountAmount: 0,
        taxAmount: 2400,
        finalAmount: 32400,
      },
      {
        invoiceRef: "INV-GRP-002",
        storeCode: b,
        recordedAt: "05-03-2026",
        customerMobile: "9988776655",
        farmerName: "Suresh Rao",
        village: "Koduru",
        paymentMethod: "bank",
        paymentAmount: 3360,
        transactionNumber: "UTR123456",
        notes: "Imported second invoice",
        productSku: "Gouri",
        quantity: 2,
        unitPrice: 1500,
        discountAmount: 0,
        taxAmount: 360,
        finalAmount: 3360,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["invoiceRef", "Use the same reference for all rows of one invoice"],
      ["storeCode", "Store code"],
      ["recordedAt", "DD-MM-YYYY"],
      ["farmerName", "Farmer name only"],
      ["productSku", "Product SKU"],
      ["invoiceNumber", "Auto-generated by system during import"],
    ],
    parse: (row, i, storeCode) => {
      const invoiceRef = text(row.invoiceRef || row.invoiceNumber);
      const productSku = text(
        row.productSku || row.productSKU || row.sku || row.SKU,
      );
      const quantity = num(row.quantity);
      const recordedAt = text(row.recordedAt);
      const rowStoreCode = text(row.storeCode || storeCode);
      if (!invoiceRef) throw rowError(i, "invoiceRef is required.");
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      if (!Number.isFinite(quantity) || quantity <= 0)
        throw rowError(i, "quantity must be positive.");
      if (!recordedAt) throw rowError(i, "recordedAt is required.");
      return {
        invoiceRef,
        storeCode: rowStoreCode,
        recordedAt,
        customerMobile: text(row.customerMobile),
        farmerName: text(row.farmerName),
        village: text(row.village),
        paymentMethod: text(row.paymentMethod || "cash").toLowerCase(),
        paymentAmount: num(row.paymentAmount),
        transactionNumber: text(row.transactionNumber),
        notes: text(row.notes),
        productSku,
        quantity,
        unitPrice: num(row.unitPrice),
        discountAmount: num(row.discountAmount),
        taxAmount: num(row.taxAmount),
        finalAmount: num(row.finalAmount),
      };
    },
  },
  payment_updates: {
    label: "Payment Updates",
    color: "#ea580c",
    desc: "Update invoice payments with UTR, amount, and settlement status.",
    columns:
      "storeCode, invoiceNumber, transactionDate, paymentMethod, amount, transactionNumber, status, remarks",
    file: (m) =>
      m
        ? "admin_multi_store_payment_updates_template.xlsx"
        : "store_payment_updates_template.xlsx",
    sheet: "PaymentUpdates",
    sample: (a, b) => [
      {
        storeCode: a,
        invoiceNumber: "STORE-INV-IMPORT-001",
        transactionDate: "2026-03-05T10:45",
        paymentMethod: "bank",
        amount: 32400,
        transactionNumber: "UTR-900001",
        status: "completed",
        remarks: "Bank payment collected",
      },
      {
        storeCode: b,
        invoiceNumber: "STORE-INV-IMPORT-002",
        transactionDate: "2026-03-05T11:30",
        paymentMethod: "cash",
        amount: 3360,
        transactionNumber: "",
        status: "completed",
        remarks: "Cash settled at counter",
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["invoiceNumber", "Existing invoice number"],
      ["transactionDate", "YYYY-MM-DDTHH:mm"],
      ["paymentMethod", "cash or bank"],
      ["amount", "Numeric amount"],
    ],
    parse: (row, i, storeCode) => {
      const invoiceNumber = text(row.invoiceNumber);
      if (!invoiceNumber) throw rowError(i, "invoiceNumber is required.");
      return {
        storeCode: text(row.storeCode || storeCode),
        invoiceNumber,
        transactionDate: text(row.transactionDate || row.recordedAt),
        paymentMethod: text(row.paymentMethod || "bank").toLowerCase(),
        amount: num(row.amount),
        transactionNumber: text(row.transactionNumber),
        status: text(row.status || "completed").toLowerCase(),
        remarks: text(row.remarks),
      };
    },
  },
  price_updates: {
    label: "Store Product Prices",
    color: "#059669",
    desc: "Bulk update store selling price, purchase price, and minimum stock.",
    columns:
      "storeCode, productSku, customPrice, purchasePrice, minStockLevel, isEnabled, isActive",
    file: (m) =>
      m
        ? "admin_multi_store_price_updates_template.xlsx"
        : "store_price_updates_template.xlsx",
    sheet: "PriceUpdates",
    sample: (a, b) => [
      {
        storeCode: a,
        productSku: "27%",
        customPrice: 1750,
        purchasePrice: 1600,
        minStockLevel: 10,
        isEnabled: true,
        isActive: true,
      },
      {
        storeCode: b,
        productSku: "Gouri",
        customPrice: 1900,
        purchasePrice: 1750,
        minStockLevel: 8,
        isEnabled: true,
        isActive: true,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["productSku", "Product SKU"],
      ["customPrice", "Selling price"],
      ["purchasePrice", "Purchase price"],
      ["minStockLevel", "Low-stock threshold"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const productSku = text(row.productSku || row.SKU);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      return {
        storeCode: rowStoreCode,
        productSku,
        customPrice: row.customPrice ?? row.sellingPrice ?? row.unitPrice ?? "",
        purchasePrice: row.purchasePrice ?? "",
        minStockLevel: row.minStockLevel ?? "",
        isEnabled: row.isEnabled ?? "",
        isActive: row.isActive ?? "",
      };
    },
  },
  product_status_updates: {
    label: "Product Status",
    color: "#0f766e",
    desc: "Bulk enable, disable, or deactivate products per store.",
    columns: "storeCode, productSku, isEnabled, isActive, minStockLevel",
    file: (m) =>
      m
        ? "admin_multi_store_product_status_template.xlsx"
        : "store_product_status_template.xlsx",
    sheet: "ProductStatus",
    sample: (a, b) => [
      {
        storeCode: a,
        productSku: "27%",
        isEnabled: true,
        isActive: true,
        minStockLevel: 12,
      },
      {
        storeCode: b,
        productSku: "20(Yellow)",
        isEnabled: false,
        isActive: true,
        minStockLevel: 0,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["productSku", "Product SKU"],
      ["isEnabled", "true/false"],
      ["isActive", "true/false"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const productSku = text(row.productSku || row.SKU);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      return {
        storeCode: rowStoreCode,
        productSku,
        isEnabled: row.isEnabled ?? "",
        isActive: row.isActive ?? "",
        minStockLevel: row.minStockLevel ?? "",
      };
    },
  },
  customers: {
    label: "Customers",
    color: "#2563eb",
    desc: "Create or update store customers in bulk.",
    columns:
      "storeCode, customerCode, customerName, farmerName, mobile, phoneNo, village, isActive",
    file: (m) =>
      m
        ? "admin_multi_store_customers_template.xlsx"
        : "store_customers_template.xlsx",
    sheet: "Customers",
    sample: (a, b) => [
      {
        storeCode: a,
        customerCode: "",
        customerName: "Ramesh Patel",
        farmerName: "Ramesh Patel",
        mobile: "9876543210",
        phoneNo: "",
        village: "Anand",
        isActive: true,
      },
      {
        storeCode: b,
        customerCode: "",
        customerName: "Suresh Rao",
        farmerName: "Suresh Rao",
        mobile: "9988776655",
        phoneNo: "",
        village: "Koduru",
        isActive: true,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["customerCode", "Optional"],
      ["customerName", "Optional"],
      ["farmerName", "Optional"],
      ["mobile", "Optional"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      return {
        storeCode: rowStoreCode,
        customerCode: text(row.customerCode),
        customerName: text(row.customerName || row.name),
        farmerName: text(row.farmerName),
        mobile: text(row.mobile || row.customerMobile),
        phoneNo: text(row.phoneNo),
        village: text(row.village),
        isActive: row.isActive ?? "",
      };
    },
  },
  villages: {
    label: "Villages",
    color: "#9333ea",
    desc: "Bulk create or reactivate village master data for stores.",
    columns: "storeCode, villageName, isActive",
    file: (m) =>
      m
        ? "admin_multi_store_villages_template.xlsx"
        : "store_villages_template.xlsx",
    sheet: "Villages",
    sample: (a, b) => [
      { storeCode: a, villageName: "Koduru", isActive: true },
      { storeCode: b, villageName: "Anand", isActive: true },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["villageName", "Village name"],
      ["isActive", "true/false"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const villageName = text(row.villageName || row.village);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!villageName) throw rowError(i, "villageName is required.");
      return {
        storeCode: rowStoreCode,
        villageName,
        isActive: row.isActive ?? "",
      };
    },
  },
  expenditures: {
    label: "Expenditures",
    color: "#b45309",
    desc: "Bulk monthly expenditure entry for store finance reconciliation.",
    columns:
      "storeCode, month, year, staffSalary, powerBill, maintenance, rent, loadingCharges, unloadingCharges, notes",
    file: (m) =>
      m
        ? "admin_multi_store_expenditures_template.xlsx"
        : "store_expenditures_template.xlsx",
    sheet: "Expenditures",
    sample: (a, b) => [
      {
        storeCode: a,
        month: 3,
        year: 2026,
        staffSalary: 25000,
        powerBill: 3800,
        maintenance: 1200,
        rent: 10000,
        loadingCharges: 1500,
        unloadingCharges: 800,
        notes: "March operating expenses",
      },
      {
        storeCode: b,
        month: 3,
        year: 2026,
        staffSalary: 22000,
        powerBill: 3200,
        maintenance: 900,
        rent: 8500,
        loadingCharges: 1200,
        unloadingCharges: 700,
        notes: "March operating expenses",
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["month", "1-12 or month name"],
      ["year", "Four-digit year"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!text(row.month) || !text(row.year))
        throw rowError(i, "month and year are required.");
      return {
        storeCode: rowStoreCode,
        month: row.month,
        year: row.year,
        staffSalary: num(row.staffSalary),
        powerBill: num(row.powerBill),
        maintenance: num(row.maintenance),
        rent: num(row.rent),
        loadingCharges: num(row.loadingCharges),
        unloadingCharges: num(row.unloadingCharges),
        notes: text(row.notes),
      };
    },
  },
  assets: {
    label: "Assets",
    color: "#475569",
    desc: "Bulk create store asset requests such as furniture and devices.",
    columns:
      "storeCode, assetDate, itemName, quantity, value, tax, notes, status",
    file: (m) =>
      m
        ? "admin_multi_store_assets_template.xlsx"
        : "store_assets_template.xlsx",
    sheet: "Assets",
    sample: (a, b) => [
      {
        storeCode: a,
        assetDate: "2026-03-10",
        itemName: "Printer",
        quantity: 1,
        value: 8500,
        tax: 1530,
        notes: "Counter printer",
        status: "pending",
      },
      {
        storeCode: b,
        assetDate: "2026-03-11",
        itemName: "Plastic Chairs",
        quantity: 6,
        value: 900,
        tax: 972,
        notes: "Customer seating",
        status: "pending",
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["assetDate", "YYYY-MM-DD"],
      ["itemName", "Asset name"],
      ["quantity", "Positive number"],
      ["value", "Per-item value"],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const itemName = text(row.itemName);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!text(row.assetDate)) throw rowError(i, "assetDate is required.");
      if (!itemName) throw rowError(i, "itemName is required.");
      if (!num(row.quantity) || !num(row.value))
        throw rowError(i, "quantity and value are required.");
      return {
        storeCode: rowStoreCode,
        assetDate: text(row.assetDate),
        itemName,
        quantity: num(row.quantity),
        value: num(row.value),
        tax: num(row.tax),
        notes: text(row.notes),
        status: text(row.status || "pending").toLowerCase(),
      };
    },
  },
  damaged_goods: {
    label: "Damaged Goods",
    color: "#dc2626",
    desc: "Bulk report damaged stock and log the stock-out impact in the ledger.",
    columns:
      "storeCode, productSku, quantity, damageReason, description, estimatedValue, recordedAt, remarks, unitPrice, totalPrice",
    file: (m) =>
      m
        ? "admin_multi_store_damaged_goods_template.xlsx"
        : "store_damaged_goods_template.xlsx",
    sheet: "DamagedGoods",
    sample: (a, b) => [
      {
        storeCode: a,
        productSku: "27%",
        quantity: 2,
        damageReason: "broken",
        description: "Torn bags after handling",
        estimatedValue: 3000,
        recordedAt: "2026-03-06T12:00",
        remarks: "Imported damaged bags",
        unitPrice: 1500,
        totalPrice: 3000,
      },
      {
        storeCode: b,
        productSku: "Gouri",
        quantity: 1,
        damageReason: "spoiled",
        description: "Moisture exposure",
        estimatedValue: 1500,
        recordedAt: "2026-03-06T13:00",
        remarks: "Imported spoilage",
        unitPrice: 1500,
        totalPrice: 1500,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["storeCode", "Store code"],
      ["productSku", "Product SKU"],
      ["quantity", "Positive quantity"],
      [
        "damageReason",
        "expired, broken, spoiled, defective, damaged_package, spillage, contamination, other",
      ],
    ],
    parse: (row, i, storeCode) => {
      const rowStoreCode = text(row.storeCode || storeCode);
      const productSku = text(row.productSku || row.SKU);
      if (!rowStoreCode) throw rowError(i, "storeCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      if (!Number.isFinite(num(row.quantity)))
        throw rowError(i, "quantity must be numeric.");
      if (!text(row.recordedAt)) throw rowError(i, "recordedAt is required.");
      return {
        storeCode: rowStoreCode,
        productSku,
        quantity: num(row.quantity),
        damageReason: text(row.damageReason || "other"),
        description: text(row.description),
        estimatedValue: num(row.estimatedValue),
        recordedAt: text(row.recordedAt),
        remarks: text(row.remarks),
        unitPrice: num(row.unitPrice),
        totalPrice: num(row.totalPrice),
      };
    },
  },
  stock_transfers: {
    label: "Stock Transfers",
    color: "#0f172a",
    desc: "Bulk create pending store-to-store transfer requests.",
    columns:
      "fromStoreCode, toStoreCode, productSku, quantity, recordedAt, remarks, unitPrice, totalPrice",
    file: () => "admin_multi_store_stock_transfers_template.xlsx",
    sheet: "StockTransfers",
    sample: (a, b) => [
      {
        fromStoreCode: a,
        toStoreCode: b,
        productSku: "27%",
        quantity: 5,
        recordedAt: "2026-03-08T10:00",
        remarks: "Urgent stock rebalance",
        unitPrice: 1750,
        totalPrice: 8750,
      },
      {
        fromStoreCode: b,
        toStoreCode: a,
        productSku: "Gouri",
        quantity: 3,
        recordedAt: "2026-03-08T11:00",
        remarks: "Counter demand support",
        unitPrice: 1900,
        totalPrice: 5700,
      },
    ],
    instructions: [
      ["Column", "Notes"],
      ["fromStoreCode", "Source store code"],
      ["toStoreCode", "Destination store code"],
      ["productSku", "Product SKU"],
      ["quantity", "Positive quantity"],
      ["recordedAt", "YYYY-MM-DDTHH:mm"],
    ],
    parse: (row, i) => {
      const fromStoreCode = text(row.fromStoreCode);
      const toStoreCode = text(row.toStoreCode);
      const productSku = text(row.productSku || row.SKU);
      if (!fromStoreCode) throw rowError(i, "fromStoreCode is required.");
      if (!toStoreCode) throw rowError(i, "toStoreCode is required.");
      if (!productSku) throw rowError(i, "productSku is required.");
      if (!Number.isFinite(num(row.quantity)))
        throw rowError(i, "quantity must be numeric.");
      if (!text(row.recordedAt)) throw rowError(i, "recordedAt is required.");
      return {
        fromStoreCode,
        toStoreCode,
        productSku,
        quantity: num(row.quantity),
        recordedAt: text(row.recordedAt),
        remarks: text(row.remarks),
        unitPrice: num(row.unitPrice),
        totalPrice: num(row.totalPrice),
      };
    },
  },
};

const groupLabel = (type) =>
  groups.find((g) => g[1].includes(type))?.[0] || "Import";

export default function StoreImportPanel({
  storeCode = "",
  allowMultiStore = false,
  onImportSuccess,
  title,
  description,
}) {
  const [importType, setImportType] = useState("ledger_rows");
  const [importing, setImporting] = useState(false);
  const [revertingImportId, setRevertingImportId] = useState(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [pendingImportRows, setPendingImportRows] = useState([]);
  const [pendingImportFileName, setPendingImportFileName] = useState("");
  const [validationSummary, setValidationSummary] = useState("");
  const [importHistory, setImportHistory] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [allowNegativeLedgerOnImport, setAllowNegativeLedgerOnImport] =
    useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolverRef = useRef(null);

  const active = config[importType];
  const helperText = useMemo(
    () =>
      allowMultiStore
        ? `${active.desc} This admin import can process many stores in a single file.`
        : `${active.desc} Use the selected store code or keep the template storeCode column unchanged.`,
    [active.desc, allowMultiStore],
  );

  const negativeQuantityRows = useMemo(
    () =>
      pendingImportRows
        .map((row, index) => ({
          rowNumber: index + 2,
          quantity: Number(row.quantity),
          productSku: row.productSku || row.SKU || "-",
          storeCode:
            row.storeCode || row.fromStoreCode || row.toStoreCode || "-",
        }))
        .filter((row) => Number.isFinite(row.quantity) && row.quantity < 0),
    [pendingImportRows],
  );

  const promptUserConfirmation = ({
    title,
    message,
    confirmLabel = "Continue",
    cancelLabel = "Cancel",
    tone = "warning",
  }) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmDialog({
        title,
        message,
        confirmLabel,
        cancelLabel,
        tone,
      });
    });

  const resolveConfirmation = (value) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(value);
      confirmResolverRef.current = null;
    }
    setConfirmDialog(null);
  };

  useEffect(() => {
    if (!confirmDialog) return undefined;

    const originalTitle = document.title;
    const updateTitle = () => {
      document.title = document.hidden
        ? "Action Required | Feed Bazaar"
        : originalTitle;
    };

    updateTitle();
    document.addEventListener("visibilitychange", updateTitle);

    return () => {
      document.removeEventListener("visibilitychange", updateTitle);
      document.title = originalTitle;
    };
  }, [confirmDialog]);

  const confirmNegativeImportProceed = async (actionLabel) => {
    if (!negativeQuantityRows.length) return true;
    const preview = negativeQuantityRows
      .slice(0, 8)
      .map(
        (row) =>
          `Row ${row.rowNumber}: ${row.storeCode} / ${row.productSku} / ${row.quantity}`,
      )
      .join("\n");
    return promptUserConfirmation({
      title: "Negative Quantity Detected",
      message: `Negative stock quantities were detected in this import.\n\n${preview}${negativeQuantityRows.length > 8 ? `\n...and ${negativeQuantityRows.length - 8} more row(s)` : ""}\n\nDo you want to continue and ${actionLabel}?`,
      confirmLabel: "Continue",
      cancelLabel: "Cancel",
      tone: "warning",
    });
  };

  const confirmNegativeLedgerOverride = (errorData, actionLabel) => {
    const errorDetails = errorData?.errorDetails || {};
    const lines = [
      errorData?.message || "This import would make ledger stock go negative.",
      errorDetails.productSku ? `Product SKU: ${errorDetails.productSku}` : "",
      errorDetails.productId != null
        ? `Product ID: ${errorDetails.productId}`
        : "",
      errorDetails.referenceId ? `Reference: ${errorDetails.referenceId}` : "",
      errorDetails.recordedAt ? `Recorded At: ${errorDetails.recordedAt}` : "",
      Number.isFinite(errorDetails.runningBalance)
        ? `Running Balance After Entry: ${errorDetails.runningBalance}`
        : "",
      "",
      `Do you want to continue and ${actionLabel} anyway?`,
    ].filter(Boolean);

    return promptUserConfirmation({
      title: "Ledger Will Go Negative",
      message: lines.join("\n"),
      confirmLabel: "Proceed Anyway",
      cancelLabel: "Cancel",
      tone: "danger",
    });
  };

  const statusStyles = {
    queued: { background: "#e0f2fe", color: "#075985", label: "Queued" },
    processing: {
      background: "#ede9fe",
      color: "#6d28d9",
      label: "Processing",
    },
    success: { background: "#dcfce7", color: "#166534", label: "Success" },
    failed: { background: "#fee2e2", color: "#b91c1c", label: "Failed" },
    reverted: { background: "#ede9fe", color: "#6d28d9", label: "Reverted" },
  };

  const loadImportHistory = async () => {
    const selectedStoreId =
      Number(localStorage.getItem("currentStoreId") || 0) || undefined;
    const response = await storeService.getStoreImportHistory({
      storeId: allowMultiStore ? undefined : selectedStoreId,
      limit: 6,
    });
    if (response?.success) {
      setImportHistory(Array.isArray(response.data) ? response.data : []);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadHistorySafely = async () => {
      try {
        const selectedStoreId =
          Number(localStorage.getItem("currentStoreId") || 0) || undefined;
        const response = await storeService.getStoreImportHistory({
          storeId: allowMultiStore ? undefined : selectedStoreId,
          limit: 6,
        });
        if (mounted && response?.success) {
          setImportHistory(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.warn("Failed to load import history:", err.message);
      }
    };

    loadHistorySafely();
    return () => {
      mounted = false;
    };
  }, [allowMultiStore]);

  useEffect(() => {
    if (
      !Array.isArray(importHistory) ||
      !importHistory.some((entry) =>
        ["queued", "processing"].includes(entry.importStatus),
      )
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadImportHistory().catch(() => null);
    }, 45000);

    return () => window.clearInterval(intervalId);
  }, [importHistory]);

  const downloadExcelTemplate = () => {
    const a = storeCode || "STORE039";
    const b = allowMultiStore ? "STORE040" : a;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(active.sample(a, b)),
      active.sheet,
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Required Format"], ...active.instructions]),
      "Instructions",
    );
    XLSX.writeFile(wb, active.file(allowMultiStore));
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: "",
        raw: false,
      });
      if (!rows.length)
        throw new Error("The uploaded file does not contain any data rows.");
      const parsed = rows.map((row, index) =>
        active.parse(row, index, storeCode),
      );
      setPendingImportRows(parsed);
      setPendingImportFileName(file.name || "import.xlsx");
      setValidationSummary("");
      setAllowNegativeLedgerOnImport(true);
      setShowImportPreview(true);
    } catch (err) {
      setError(err.message || "Failed to parse import file.");
      setShowErrorModal(true);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportRows.length) return;
    if (!(await confirmNegativeImportProceed("import these rows"))) return;
    try {
      setImporting(true);
      let response;
      try {
        response = await storeService.importStoreLedgerRows({
          rows: pendingImportRows,
          referenceType: "ExcelLedgerImport",
          importType,
          allowNegativeLedger: allowNegativeLedgerOnImport,
        });
      } catch (err) {
        const errorData = err.response?.data || {};
        if (
          errorData?.errorCode === "NEGATIVE_LEDGER" &&
          (await confirmNegativeLedgerOverride(errorData, "import these rows"))
        ) {
          response = await storeService.importStoreLedgerRows({
            rows: pendingImportRows,
            referenceType: "ExcelLedgerImport",
            importType,
            allowNegativeLedger: true,
          });
        } else {
          throw err;
        }
      }
      if (!response.success)
        throw new Error(response.message || "Import failed.");
      setSuccess(
        `${active.label} import started for ${pendingImportRows.length} row(s). ETA: ${response?.data?.etaLabel || "a few seconds"}. Please check Recent Import History for live progress.`,
      );
      setShowSuccessModal(true);
      setShowImportPreview(false);
      setPendingImportRows([]);
      setPendingImportFileName("");
      setValidationSummary("");
      setAllowNegativeLedgerOnImport(true);
      await loadImportHistory().catch(() => null);
      if (onImportSuccess) await onImportSuccess();
    } catch (err) {
      const errorData = err.response?.data || {};
      const errorDetails = errorData.errorDetails || {};
      const detailedErrorMessage =
        errorDetails && (errorDetails.productId || errorDetails.productSku)
          ? [
              errorData.message || err.message || "Import failed.",
              errorDetails.productSku
                ? `Product SKU: ${errorDetails.productSku}`
                : "",
              errorDetails.productId
                ? `Product: ${errorDetails.productId}`
                : "",
              errorDetails.referenceId
                ? `Reference: ${errorDetails.referenceId}`
                : "",
              errorDetails.recordedAt
                ? `Recorded At: ${errorDetails.recordedAt}`
                : "",
              Number.isFinite(errorDetails.runningBalance)
                ? `Running Balance After Entry: ${errorDetails.runningBalance}`
                : "",
            ]
              .filter(Boolean)
              .join("\n")
          : err.message || "Import failed.";
      setError(detailedErrorMessage);
      setShowErrorModal(true);
    } finally {
      setImporting(false);
    }
  };

  const handleValidateImport = async () => {
    if (!pendingImportRows.length) return;
    if (!(await confirmNegativeImportProceed("validate these rows"))) return;
    try {
      setImporting(true);
      let response;
      try {
        response = await storeService.validateStoreImportRows({
          rows: pendingImportRows,
          referenceType: "ExcelLedgerImport",
          importType,
          allowNegativeLedger: allowNegativeLedgerOnImport,
        });
      } catch (err) {
        const errorData = err.response?.data || {};
        if (
          errorData?.errorCode === "NEGATIVE_LEDGER" &&
          (await confirmNegativeLedgerOverride(
            errorData,
            "validate these rows",
          ))
        ) {
          response = await storeService.validateStoreImportRows({
            rows: pendingImportRows,
            referenceType: "ExcelLedgerImport",
            importType,
            allowNegativeLedger: true,
          });
        } else {
          throw err;
        }
      }
      const importedRows =
        response?.data?.importedRows || pendingImportRows.length;
      setValidationSummary(
        `Validation passed. ${importedRows} row(s) are ready to import.`,
      );
    } catch (err) {
      const errorData = err.response?.data || {};
      const invalidRows = Array.isArray(errorData?.errorDetails?.invalidRows)
        ? errorData.errorDetails.invalidRows
        : [];
      const invalidRowMessage = invalidRows.length
        ? `\n\nInvalid Rows:\n${invalidRows
            .slice(0, 20)
            .map(
              (entry) =>
                `Row ${entry.row}: ${entry.storeCode || entry.storeId || "Unknown store"}`,
            )
            .join(
              "\n",
            )}${invalidRows.length > 20 ? `\n...and ${invalidRows.length - 20} more` : ""}`
        : "";
      setError(
        `${errorData.message || err.message || "Validation failed."}${invalidRowMessage}`,
      );
      setShowErrorModal(true);
    } finally {
      setImporting(false);
    }
  };

  const handleRevertImport = async (entry) => {
    if (!entry?.id || revertingImportId) return;
    const confirmed = await promptUserConfirmation({
      title: "Revert Import Batch",
      message: `Revert this ${entry.importType || "import"} batch? This will remove only the imported rows from this batch and rebuild affected stock summaries.`,
      confirmLabel: "Revert Import",
      cancelLabel: "Keep Import",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      setRevertingImportId(entry.id);
      const response = await storeService.revertStoreImport(entry.id);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to revert import.");
      }
      setSuccess(response.message || "Import reverted successfully.");
      setShowSuccessModal(true);
      await loadImportHistory().catch(() => null);
      if (onImportSuccess) await onImportSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to revert import.",
      );
      setShowErrorModal(true);
    } finally {
      setRevertingImportId(null);
    }
  };

  const historyRowsForView = (entry) => {
    if (!entry) return [];
    if (
      Array.isArray(entry.request_body?.rows) &&
      entry.request_body.rows.length
    ) {
      return entry.request_body.rows;
    }
    if (
      Array.isArray(entry.attemptedRowsPreview) &&
      entry.attemptedRowsPreview.length
    ) {
      return entry.attemptedRowsPreview;
    }
    if (
      Array.isArray(entry.response_body?.data?.previewRecords) &&
      entry.response_body.data.previewRecords.length
    ) {
      return entry.response_body.data.previewRecords;
    }
    return [];
  };

  return (
    <>
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 840 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.16)",
                color: "#1d4ed8",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {allowMultiStore ? "Admin Import Center" : "Store Import Center"}
            </div>
            <h5 style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
              {title ||
                (allowMultiStore
                  ? "Import Many Stores From One File"
                  : "Import Store Data From Excel / CSV")}
            </h5>
            <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>
              {description || helperText}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              {[
                "Supports: `.xlsx`, `.xls`, `.csv`",
                "Matching: Store codes and SKUs",
                "Workflow: Parse, preview, import",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: "#fff",
                    border: "1px solid #dbeafe",
                    fontSize: 13,
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, minWidth: 300 }}>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              style={{
                minWidth: 220,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#fff",
                fontWeight: 700,
              }}
            >
              {groups.map(([label, options]) => (
                <optgroup key={label} label={label}>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {config[option].label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              Download Template
            </button>
            <label
              style={{
                display: "grid",
                gap: 8,
                cursor: importing ? "not-allowed" : "pointer",
                opacity: importing ? 0.7 : 1,
                padding: 18,
                borderRadius: 18,
                border: "1px dashed #60a5fa",
                background:
                  "linear-gradient(180deg, rgba(239,246,255,0.96) 0%, rgba(255,255,255,0.98) 100%)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                {importing ? "Preparing Preview..." : "Upload Excel / CSV"}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Review exact rows before import.
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,text/csv"
                onChange={handleImportFile}
                disabled={importing}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "minmax(260px, 320px) 1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "#0f172a",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "4px 10px",
                borderRadius: 999,
                background: active.color,
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              {groupLabel(importType)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{active.label}</div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                opacity: 0.85,
                marginTop: 8,
              }}
            >
              {active.desc}
            </div>
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 18,
              background: "rgba(255,255,255,0.88)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
              Active template format
            </div>
            <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.6 }}>
              {active.columns}
            </div>
            {pendingImportRows.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#1d4ed8" }}>
                Parsed preview ready: {pendingImportRows.length} row(s) from{" "}
                {pendingImportFileName}
              </div>
            )}
            {validationSummary && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#15803d",
                  fontWeight: 700,
                }}
              >
                {validationSummary}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            background: "#fff",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            Recent Import History
          </div>
          {importHistory.length === 0 ? (
            <div style={{ fontSize: 12, color: "#64748b" }}>
              No recent imports recorded yet for this view.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {importHistory.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "grid",
                    gap: 4,
                    padding: 12,
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>
                      {entry.employee_name || "Unknown user"}
                    </strong>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#0f172a" }}>
                      Type:{" "}
                      {entry.importType ||
                        entry.request_body?.importType ||
                        "ledger_rows"}{" "}
                      | Rows:{" "}
                      {entry.rowCount ||
                        entry.importedRows ||
                        entry.response_body?.importedRows ||
                        entry.request_body?.rows?.length ||
                        0}
                      {entry.progress?.completedRows != null
                        ? ` | Done: ${entry.progress.completedRows}`
                        : ""}
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        ...(statusStyles[entry.importStatus] || {
                          background: "#e2e8f0",
                          color: "#334155",
                          label: entry.importStatus || "Unknown",
                        }),
                      }}
                    >
                      {statusStyles[entry.importStatus]?.label ||
                        entry.importStatus ||
                        "Unknown"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {entry.response_body?.message ||
                      entry.error_message ||
                      "Import processed"}
                  </div>
                  {(entry.importStatus === "queued" ||
                    entry.importStatus === "processing") && (
                    <div style={{ fontSize: 12, color: "#1d4ed8" }}>
                      {entry.progress?.completedRows || 0} /{" "}
                      {entry.progress?.totalRows || entry.rowCount || 0} row(s)
                      completed
                      {entry.progress?.lastProcessedRow
                        ? ` | Last row: ${entry.progress.lastProcessedRow}`
                        : ""}
                      {entry.etaLabel ? ` | ETA: ${entry.etaLabel}` : ""}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: entry.isRevertible ? "#166534" : "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      {entry.importStatus === "reverted"
                        ? `Reverted rows: ${entry.revertedRows || 0}`
                        : entry.isRevertible
                          ? "Revert available for this batch"
                          : "Automatic revert is available only for ledger, opening stock, and closing stock imports"}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryEntry(entry)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid #1d4ed8",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 700,
                          minWidth: 90,
                        }}
                      >
                        View
                      </button>
                      {entry.isRevertible && (
                        <button
                          type="button"
                          onClick={() => handleRevertImport(entry)}
                          disabled={Boolean(revertingImportId)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "none",
                            background:
                              revertingImportId === entry.id
                                ? "#94a3b8"
                                : "#dc2626",
                            color: "#fff",
                            fontWeight: 700,
                            minWidth: 120,
                          }}
                        >
                          {revertingImportId === entry.id
                            ? "Reverting..."
                            : "Revert Import"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showImportPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "min(1240px, 100%)",
              maxHeight: "90vh",
              borderRadius: 24,
              padding: 22,
              overflow: "hidden",
              boxShadow: "0 28px 70px rgba(0,0,0,0.24)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                marginBottom: 14,
                flex: "0 0 auto",
              }}
            >
              <h5 style={{ margin: 0, fontWeight: 800 }}>Import Preview</h5>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                File: {pendingImportFileName} | Type: {importType} | Rows:{" "}
                {pendingImportRows.length}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                These exact rows will be sent to the backend after you click
                Import.
              </div>
              {negativeQuantityRows.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 12,
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    color: "#9a3412",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Warning: {negativeQuantityRows.length} row(s) contain negative
                  quantity values. You will be asked to confirm before
                  validate/import.
                </div>
              )}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e3a8a",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={allowNegativeLedgerOnImport}
                  onChange={(event) =>
                    setAllowNegativeLedgerOnImport(event.target.checked)
                  }
                />
                Allow this import to continue even if the running stock balance
                goes negative. We can correct that later in Manage Stock.
              </label>
            </div>
            <div
              style={{
                overflow: "auto",
                flex: "1 1 auto",
                minHeight: 0,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
            >
              <table
                className="table"
                style={{ marginBottom: 0, fontSize: 12 }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f8fafc",
                    zIndex: 1,
                  }}
                >
                  <tr>
                    {Object.keys(pendingImportRows[0] || {}).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingImportRows.map((row, index) => (
                    <tr
                      key={`${index}-${row.referenceId || row.invoiceNumber || row.productSku || "row"}`}
                    >
                      {Object.keys(pendingImportRows[0] || {}).map((key) => (
                        <td key={key}>{String(row[key] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 16,
                flex: "0 0 auto",
                paddingTop: 4,
                borderTop: "1px solid #e5e7eb",
                background: "#fff",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowImportPreview(false);
                  setPendingImportRows([]);
                  setPendingImportFileName("");
                  setAllowNegativeLedgerOnImport(true);
                }}
                disabled={importing}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleValidateImport}
                disabled={importing}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "1px solid #1d4ed8",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 700,
                }}
              >
                {importing ? "Validating..." : "Validate"}
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "#16a34a",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "min(640px, 100%)",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 28px 70px rgba(0,0,0,0.24)",
              border: `1px solid ${
                confirmDialog.tone === "danger" ? "#fecaca" : "#fed7aa"
              }`,
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                background:
                  confirmDialog.tone === "danger" ? "#fef2f2" : "#fff7ed",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color:
                    confirmDialog.tone === "danger" ? "#991b1b" : "#9a3412",
                }}
              >
                {confirmDialog.title}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Please review and choose how to continue.
              </div>
            </div>
            <div style={{ padding: 22 }}>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "inherit",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#0f172a",
                }}
              >
                {confirmDialog.message}
              </pre>
              <div
                style={{
                  marginTop: 20,
                  padding: 12,
                  borderRadius: 12,
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                This confirmation stays inside the app, so the browser cannot
                suppress it if you switch tabs and come back.
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 20,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => resolveConfirmation(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#334155",
                    fontWeight: 700,
                  }}
                >
                  {confirmDialog.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => resolveConfirmation(true)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 12,
                    border: "none",
                    background:
                      confirmDialog.tone === "danger" ? "#dc2626" : "#d97706",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedHistoryEntry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              width: "min(1240px, 100%)",
              maxHeight: "88vh",
              borderRadius: 24,
              padding: 22,
              overflow: "hidden",
              boxShadow: "0 28px 70px rgba(0,0,0,0.24)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                marginBottom: 14,
                flexWrap: "wrap",
                flex: "0 0 auto",
              }}
            >
              <div>
                <h5 style={{ margin: 0, fontWeight: 800 }}>
                  Import History Details
                </h5>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  Type: {selectedHistoryEntry.importType || "ledger_rows"} |
                  Status:{" "}
                  {statusStyles[selectedHistoryEntry.importStatus]?.label ||
                    selectedHistoryEntry.importStatus ||
                    "Unknown"}{" "}
                  | Rows: {selectedHistoryEntry.rowCount || 0}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Imported: {selectedHistoryEntry.importedRows || 0}{" "}
                  {selectedHistoryEntry.importStatus === "reverted"
                    ? `| Reverted: ${selectedHistoryEntry.revertedRows || 0}`
                    : ""}
                </div>
                {(selectedHistoryEntry.importStatus === "queued" ||
                  selectedHistoryEntry.importStatus === "processing") && (
                  <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 4 }}>
                    Progress:{" "}
                    {selectedHistoryEntry.progress?.completedRows || 0} /{" "}
                    {selectedHistoryEntry.progress?.totalRows ||
                      selectedHistoryEntry.rowCount ||
                      0}
                    {selectedHistoryEntry.progress?.lastProcessedRow
                      ? ` | Last row: ${selectedHistoryEntry.progress.lastProcessedRow}`
                      : ""}
                    {selectedHistoryEntry.etaLabel
                      ? ` | ETA: ${selectedHistoryEntry.etaLabel}`
                      : ""}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryEntry(null)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
              {selectedHistoryEntry.response_body?.message ||
                selectedHistoryEntry.error_message ||
                "Import processed"}
            </div>

            {Array.isArray(selectedHistoryEntry.invalidRows) &&
              selectedHistoryEntry.invalidRows.length > 0 && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: 12,
                    borderRadius: 14,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#991b1b",
                      marginBottom: 8,
                    }}
                  >
                    Invalid / Failed Rows
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 4,
                      fontSize: 12,
                      color: "#7f1d1d",
                    }}
                  >
                    {selectedHistoryEntry.invalidRows.map((row, index) => (
                      <div
                        key={`${row.row}-${row.storeCode || row.storeId || index}`}
                      >
                        Row {row.row}:{" "}
                        {row.storeCode || row.storeId || "Unknown store"}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div
              style={{
                overflow: "auto",
                flex: "1 1 auto",
                minHeight: 0,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
            >
              {historyRowsForView(selectedHistoryEntry).length ? (
                <table
                  className="table"
                  style={{ marginBottom: 0, fontSize: 12 }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#f8fafc",
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      {Object.keys(
                        historyRowsForView(selectedHistoryEntry)[0] || {},
                      ).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyRowsForView(selectedHistoryEntry).map(
                      (row, index) => (
                        <tr
                          key={`${index}-${row.referenceId || row.invoiceRef || row.productSku || "history-row"}`}
                        >
                          {Object.keys(
                            historyRowsForView(selectedHistoryEntry)[0] || {},
                          ).map((key) => (
                            <td key={key}>{String(row[key] ?? "")}</td>
                          ))}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 20, fontSize: 12, color: "#64748b" }}>
                  No row preview is available for this history record.
                </div>
              )}
            </div>
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
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </>
  );
}
