import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./DocumentAuthenticityPage.module.css";

const apiBaseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const formatCurrency = (value) => {
  const numeric = Number.parseFloat(value || 0);
  if (Number.isNaN(numeric)) return value || "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const prettifyLabel = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const renderParty = (party) => {
  if (!party) return null;

  const lines = Object.entries(party).filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (!lines.length) return null;

  return lines.map(([key, value]) => (
    <div key={key} className={styles.partyLine}>
      <strong>{prettifyLabel(key)}:</strong> {value}
    </div>
  ));
};

const renderPaymentSummary = (payments = []) => {
  if (!payments.length) return null;

  return (
    <div className={styles.metaGrid}>
      {payments.map((payment, index) => (
        <div key={`${payment.method || "payment"}-${index}`} className={styles.metric}>
          <div className={styles.metricLabel}>{payment.method || "Payment"}</div>
          <div className={styles.metricValue}>{formatCurrency(payment.amount)}</div>
          <div className={styles.metricLabel}>
            {[payment.date, payment.status, payment.transactionNumber].filter(Boolean).join(" | ")}
          </div>
          {payment.remark ? <div className={styles.metricLabel}>{payment.remark}</div> : null}
        </div>
      ))}
    </div>
  );
};

export default function DocumentAuthenticityPage() {
  const { docType, docNumber } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: "",
    payload: null,
  });

  useEffect(() => {
    let active = true;

    async function loadVerification() {
      try {
        setState({ loading: true, error: "", payload: null });
        const response = await fetch(
          `${apiBaseUrl}/public/verify/${encodeURIComponent(docType || "")}/${encodeURIComponent(docNumber || "")}`,
        );
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Unable to verify document");
        }

        if (active) {
          setState({
            loading: false,
            error: "",
            payload: data,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error: error.message || "Unable to verify document",
            payload: null,
          });
        }
      }
    }

    loadVerification();

    return () => {
      active = false;
    };
  }, [docType, docNumber]);

  if (state.loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <h2>Verifying Document</h2>
          <p>Please wait while we validate this document authenticity record.</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.payload) {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>!</div>
          <h2>Verification Failed</h2>
          <p>{state.error || "Document details could not be verified."}</p>
        </div>
      </div>
    );
  }

  const { brand, document, summary, parties, lineItems, meta } = state.payload;
  const downloads = state.payload.downloads || {};
  const verificationUrl = meta?.verificationUrl || "";
  const summaryEntries = Object.entries(summary || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  const metaEntries = Object.entries(meta || {}).filter(
    ([key, value]) =>
      key !== "payments" &&
      key !== "verificationUrl" &&
      value !== null &&
      value !== undefined &&
      value !== "",
  );
  const payments = Array.isArray(meta?.payments) ? meta.payments : [];
  const showAmountColumns = (lineItems || []).some(
    (item) => item.unitPrice !== undefined || item.amount !== undefined,
  );
  const showHsnColumn = (lineItems || []).some((item) => item.hsnCode);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.brandBar}>
          <span className={styles.dot} />
          <span>{brand?.poweredBy || "Kernn Automations"}</span>
        </div>
        <div className={styles.title}>Document Authenticity Check</div>
        <div className={styles.subtitle}>
          This document is digitally verified and traceable through the Kernn Automations authenticity service.
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.statusBar}>
            <div className={styles.statusLeft}>
              <div className={styles.badge}>✓</div>
              <div>
                <div className={styles.statusTitle}>Verified Document</div>
                <div className={styles.statusMeta}>
                  {document?.label || "Document"} authenticated successfully
                </div>
              </div>
            </div>
            <div className={styles.statusRight}>
              <div className={styles.statusTitle}>{brand?.companyName || "Kernn Automations"}</div>
              <div className={styles.statusMeta}>{document?.status || "Verified"}</div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.metaGrid}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Document Type</div>
                <div className={styles.metricValue}>{document?.label || "-"}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Document Number</div>
                <div className={styles.metricValue}>{document?.number || "-"}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Document Date</div>
                <div className={styles.metricValue}>{document?.date || "-"}</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Current Status</div>
                <div className={styles.metricValue}>{document?.status || "Verified"}</div>
              </div>
            </div>
          </div>

          {!!summaryEntries.length && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Summary</div>
              <div className={styles.metaGrid}>
                {summaryEntries.map(([key, value]) => {
                  const isMoneyKey = /amount|total|price/i.test(key);
                  return (
                    <div key={key} className={styles.metric}>
                      <div className={styles.metricLabel}>{prettifyLabel(key)}</div>
                      <div className={styles.metricValue}>
                        {isMoneyKey ? formatCurrency(value) : value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(downloads.invoicePdf || downloads.receiptPdf) && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Downloads</div>
              <div className={styles.actionRow}>
                {verificationUrl && (
                  <a
                    className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                    href={verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Verification Link
                  </a>
                )}
                {downloads.invoicePdf && (
                  <a
                    className={styles.actionButton}
                    href={downloads.invoicePdf}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Invoice PDF
                  </a>
                )}
                {downloads.receiptPdf && (
                  <a
                    className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                    href={downloads.receiptPdf}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Paper Receipt PDF
                  </a>
                )}
              </div>
            </div>
          )}

          {(parties?.from || parties?.to) && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Relevant Parties</div>
              <div className={styles.partyGrid}>
                {parties?.from && (
                  <div className={styles.partyCard}>
                    <div className={styles.partyHeading}>From</div>
                    {renderParty(parties.from)}
                  </div>
                )}
                {parties?.to && (
                  <div className={styles.partyCard}>
                    <div className={styles.partyHeading}>To</div>
                    {renderParty(parties.to)}
                  </div>
                )}
                {parties?.company && (
                  <div className={styles.partyCard}>
                    <div className={styles.partyHeading}>Company / Legal</div>
                    {renderParty(parties.company)}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Document Line Items</div>
            {!lineItems?.length ? (
              <div className={styles.empty}>No line items were attached to this verification record.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      {showHsnColumn && <th>HSN</th>}
                      <th>Qty</th>
                      <th>Unit</th>
                      {showAmountColumns && <th>Unit Price</th>}
                      {showAmountColumns && <th>Amount</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={`${item.sku || item.name || "item"}-${index}`}>
                        <td>{item.name || "-"}</td>
                        <td>{item.sku || "-"}</td>
                        {showHsnColumn && <td>{item.hsnCode || "-"}</td>}
                        <td>{item.quantity ?? "-"}</td>
                        <td>{item.unit || "-"}</td>
                        {showAmountColumns && <td>{item.unitPrice ? formatCurrency(item.unitPrice) : "-"}</td>}
                        {showAmountColumns && <td>{item.amount ? formatCurrency(item.amount) : "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!!metaEntries.length && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Verification Metadata</div>
              <div className={styles.metaGrid}>
                {metaEntries.map(([key, value]) => (
                  <div key={key} className={styles.metric}>
                    <div className={styles.metricLabel}>{prettifyLabel(key)}</div>
                    <div className={styles.metricValue}>{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!payments.length && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Payment Trail</div>
              {renderPaymentSummary(payments)}
            </div>
          )}

          <div className={styles.footer}>
            Powered by {brand?.poweredBy || "Kernn Automations"} | Secure authenticity verification
          </div>
        </div>
      </div>
    </div>
  );
}
