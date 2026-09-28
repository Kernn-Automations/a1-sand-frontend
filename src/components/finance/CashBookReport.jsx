import React, { useEffect, useMemo, useState } from "react";
import storeService from "@/services/storeService";
import { formatDateIN, formatDateTimeIN } from "@/utils/dateFormat";
import { useNavigate } from "react-router-dom";

const currency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const defaultFromDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const cardStyle = {
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(244,248,255,0.96))",
  border: "1px solid rgba(28, 67, 136, 0.08)",
  borderRadius: "20px",
  boxShadow: "0 14px 40px rgba(16, 24, 40, 0.08)",
};

const pillStyle = (active) => ({
  borderRadius: "999px",
  padding: "10px 16px",
  border: active ? "1px solid #0f5bd8" : "1px solid #d8e2f2",
  background: active ? "#eef5ff" : "#fff",
  color: active ? "#0f5bd8" : "#28446b",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 180ms ease",
});

export default function CashBookReport({
  mode = "store",
  bookType = "cash",
  storeId = null,
  stores = [],
  title = "Cash Book",
  subtitle = "Track cash in, cash out, and running balance with one clean ledger.",
}) {
  const isBankBook = bookType === "bank";
  const breadcrumbLabel = isBankBook ? "Bank Book" : "Cash Book";
  const balanceLabel = isBankBook ? "Bank" : "Cash";
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(todayDate);
  const [direction, setDirection] = useState("all");
  const [selectedStoreId, setSelectedStoreId] = useState(
    mode === "admin" ? "all" : String(storeId || ""),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const navigate = useNavigate();

  const resolvedStoreId =
    mode === "store"
      ? Number(storeId || localStorage.getItem("currentStoreId") || 0)
      : null;

  const loadCashBook = async () => {
    try {
      setLoading(true);
      setError("");
      let response;

      if (mode === "store") {
        response = await (
          isBankBook
            ? storeService.getStoreBankBook
            : storeService.getStoreCashBook
        )(resolvedStoreId, {
          fromDate,
          toDate,
          direction,
        });
      } else {
        const params = {
          fromDate,
          toDate,
          direction,
        };
        if (selectedStoreId && selectedStoreId !== "all") {
          params.storeId = selectedStoreId;
        }
        response = await (
          isBankBook
            ? storeService.getGroupBankBook
            : storeService.getGroupCashBook
        )(params);
      }

      if (!response?.success) {
        throw new Error(
          response?.message ||
            `Failed to load ${isBankBook ? "bank" : "cash"} book`,
        );
      }

      setPayload(response.data || null);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || loadError.message);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "store" && !resolvedStoreId) return;
    loadCashBook();
  }, [mode, resolvedStoreId]);

  const entries = payload?.entries || [];
  const summary = payload?.summary || {
    openingBalance: 0,
    totalIn: 0,
    totalOut: 0,
    closingBalance: 0,
    entryCount: 0,
    storeCount: 0,
  };

  const exportCsv = () => {
    if (!entries.length) return;

    const rows = entries.map((entry) => ({
      dateTime: formatDateTimeIN(entry.eventAt),
      store: entry.storeName || "-",
      source: entry.sourceLabel || "-",
      customer: entry.customerName || "-",
      employee: entry.employeeName || "-",
      reference: entry.referenceNumber || "-",
      note: entry.note || "-",
      direction: entry.direction === "in" ? "IN" : "OUT",
      amount: Number(entry.amount || 0).toFixed(2),
      openingBalance: Number(entry.openingBalance || 0).toFixed(2),
      closingBalance: Number(entry.closingBalance || 0).toFixed(2),
    }));

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      mode === "store"
        ? `store-${bookType}-book-${fromDate}-to-${toDate}.csv`
        : `all-stores-${bookType}-book-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Opening Balance",
        value: currency(summary.openingBalance),
        color: "#1d4ed8",
      },
      {
        label: `${balanceLabel} In`,
        value: currency(summary.totalIn),
        color: "#16a34a",
      },
      {
        label: `${balanceLabel} Out`,
        value: currency(summary.totalOut),
        color: "#dc2626",
      },
      {
        label: "Closing Balance",
        value: currency(summary.closingBalance),
        color: "#7c3aed",
      },
    ],
    [balanceLabel, summary],
  );

  return (
    <div style={{ padding: "20px 18px 36px" }}>
      <div style={{ ...cardStyle, padding: "24px", marginBottom: "22px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#0f5bd8",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              {isBankBook ? "Bank Book And Report" : "Cash Book And Report"}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "999px",
                padding: "8px 12px",
                border: "1px solid #dbe7fb",
                background: "#f8fbff",
                color: "#5f7091",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              <span
                onClick={() => navigate("/store/sales")}
                style={{ cursor: "pointer" }}
              >
                Sales
              </span>
              <span style={{ opacity: 0.6 }}>{">"}</span>
              <span style={{ color: "#0f5bd8" }}>{breadcrumbLabel}</span>
            </div>
            <h2 style={{ margin: 0, color: "#0d2347", fontWeight: 800 }}>
              {title}
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                color: "#5f7091",
                maxWidth: "720px",
                lineHeight: 1.55,
              }}
            >
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            className="homebtn"
            onClick={exportCsv}
            disabled={!entries.length}
            style={{ opacity: entries.length ? 1 : 0.55 }}
          >
            Export CSV
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              mode === "admin"
                ? "repeat(auto-fit, minmax(180px, 1fr))"
                : "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div>
            <label
              style={{
                fontWeight: 700,
                color: "#17345f",
                marginBottom: "8px",
                display: "block",
              }}
            >
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #d5def0",
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontWeight: 700,
                color: "#17345f",
                marginBottom: "8px",
                display: "block",
              }}
            >
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #d5def0",
              }}
            />
          </div>
          {mode === "admin" && (
            <div>
              <label
                style={{
                  fontWeight: 700,
                  color: "#17345f",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Store
              </label>
              <select
                value={selectedStoreId}
                onChange={(event) => setSelectedStoreId(event.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #d5def0",
                }}
              >
                <option value="all">All Accessible Stores</option>
                {(stores || []).map((storeOption) => (
                  <option key={storeOption.id} value={storeOption.id}>
                    {storeOption.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              style={{
                fontWeight: 700,
                color: "#17345f",
                marginBottom: "8px",
                display: "block",
              }}
            >
              Direction
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["all", "in", "out"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDirection(value)}
                  style={pillStyle(direction === value)}
                >
                  {value === "all"
                    ? "All"
                    : value === "in"
                      ? `${balanceLabel} In`
                      : `${balanceLabel} Out`}
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "flex-end",
            }}
          >
            <button type="button" className="homebtn" onClick={loadCashBook}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            ...cardStyle,
            padding: "20px",
            color: "#b42318",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        {summaryCards.map((card) => (
          <div key={card.label} style={{ ...cardStyle, padding: "18px 20px" }}>
            <div
              style={{ color: "#61728f", fontWeight: 700, fontSize: "13px" }}
            >
              {card.label}
            </div>
            <div
              style={{
                color: card.color,
                fontWeight: 900,
                fontSize: "28px",
                marginTop: "10px",
              }}
            >
              {loading ? "..." : card.value}
            </div>
          </div>
        ))}
      </div>

      {mode === "admin" && payload?.storeSummaries?.length ? (
        <div style={{ ...cardStyle, padding: "20px", marginBottom: "22px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0, color: "#0d2347", fontWeight: 800 }}>
              Store-Level Snapshot
            </h3>
            <div style={{ color: "#61728f", fontWeight: 700 }}>
              {payload.storeSummaries.length} store(s)
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#eef4ff" }}>
                  {[
                    "Store",
                    "Opening",
                    "Cash In",
                    "Cash Out",
                    "Closing",
                    "Entries",
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        color: "#17345f",
                        fontSize: "13px",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payload.storeSummaries.map((item) => (
                  <tr
                    key={item.storeId}
                    style={{ borderTop: "1px solid #e8eef8" }}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                      {item.storeName}
                      <div
                        style={{
                          color: "#6f7f9c",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {item.storeCode}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {currency(item.openingBalance)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      {currency(item.totalIn)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      {currency(item.totalOut)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#7c3aed",
                        fontWeight: 700,
                      }}
                    >
                      {currency(item.closingBalance)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>{item.entryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div style={{ ...cardStyle, padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: "#0d2347", fontWeight: 800 }}>
              Cash Ledger Entries
            </h3>
            <div style={{ color: "#64748b", marginTop: "6px" }}>
              Running balance is shown per store ledger. Date format: DD/MM/YYYY
              HH:mm
            </div>
          </div>
          <div style={{ color: "#17345f", fontWeight: 700 }}>
            {summary.entryCount || 0} entries
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1180px",
            }}
          >
            <thead>
              <tr style={{ background: "#eff5ff" }}>
                {[
                  "Date & Time",
                  ...(mode === "admin" ? ["Store"] : []),
                  "Source",
                  "Reference",
                  "Customer",
                  "Handled By",
                  "Remarks",
                  "Direction",
                  "Amount",
                  "Opening",
                  "Closing",
                ].map((label) => (
                  <th
                    key={label}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      color: "#17345f",
                      fontSize: "13px",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={mode === "admin" ? 11 : 10}
                    style={{
                      textAlign: "center",
                      padding: "28px",
                      color: "#64748b",
                    }}
                  >
                    No cash book entries found for this filter.
                  </td>
                </tr>
              ) : null}

              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderTop: "1px solid #e9eef7" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                    {formatDateTimeIN(entry.eventAt)}
                    <div
                      style={{
                        color: "#7a8ca8",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      {formatDateIN(entry.eventDate)}
                    </div>
                  </td>
                  {mode === "admin" ? (
                    <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                      {entry.storeName}
                      <div style={{ color: "#7a8ca8", fontSize: "12px" }}>
                        {entry.storeCode || "-"}
                      </div>
                    </td>
                  ) : null}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 800, color: "#153055" }}>
                      {entry.sourceLabel}
                    </div>
                    <div style={{ color: "#7a8ca8", fontSize: "12px" }}>
                      {entry.sourceType}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                    {entry.referenceNumber || "-"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {entry.customerName || "-"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {entry.employeeName || "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      color: "#5f7091",
                      maxWidth: "220px",
                    }}
                  >
                    {entry.note || "-"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "6px 10px",
                        fontWeight: 800,
                        color: entry.direction === "in" ? "#166534" : "#b42318",
                        background:
                          entry.direction === "in" ? "#dcfce7" : "#fee4e2",
                      }}
                    >
                      {entry.direction === "in" ? "Cash In" : "Cash Out"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      color: entry.direction === "in" ? "#16a34a" : "#dc2626",
                      fontWeight: 900,
                    }}
                  >
                    {entry.direction === "in" ? "+" : "-"}
                    {currency(entry.amount).replace("Rs.", "Rs. ")}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                    {currency(entry.openingBalance)}
                  </td>
                  <td
                    style={{
                      padding: "12px 14px",
                      fontWeight: 900,
                      color: "#0f5bd8",
                    }}
                  >
                    {currency(entry.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
