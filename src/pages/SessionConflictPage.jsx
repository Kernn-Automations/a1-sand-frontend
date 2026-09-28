import React from "react";

const pageVars = {
  "--page-bg": "linear-gradient(135deg, #f6f1e8 0%, #fdfaf3 45%, #eef4fb 100%)",
  "--panel-bg": "#ffffff",
  "--panel-border": "rgba(19, 63, 122, 0.12)",
  "--primary": "#123f7a",
  "--accent": "#d96b1d",
  "--text-main": "#172033",
  "--text-soft": "#5f6b85",
  "--shadow": "0 24px 60px rgba(18, 63, 122, 0.12)",
};

const shellStyle = {
  ...pageVars,
  minHeight: "100vh",
  background: "var(--page-bg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 20px",
};

const panelStyle = {
  width: "100%",
  maxWidth: "920px",
  background: "var(--panel-bg)",
  border: "1px solid var(--panel-border)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "var(--shadow)",
};

const brandRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "48px",
  gap: "16px",
  flexWrap: "wrap",
};

const brandBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 18px",
  borderRadius: "18px",
  border: "1px solid rgba(18, 63, 122, 0.14)",
  background: "rgba(255,255,255,0.9)",
  color: "var(--primary)",
  fontWeight: 700,
  fontSize: "1.05rem",
};

const contentWrapStyle = {
  maxWidth: "640px",
  margin: "0 auto",
  textAlign: "center",
};

const headingStyle = {
  margin: "0 0 14px",
  fontSize: "clamp(2rem, 3vw, 3rem)",
  lineHeight: 1.1,
  color: "var(--text-main)",
  fontWeight: 800,
};

const subTextStyle = {
  margin: "0 auto 18px",
  color: "var(--text-soft)",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  maxWidth: "58ch",
};

const messageCardStyle = {
  margin: "28px auto 24px",
  padding: "18px 20px",
  borderRadius: "18px",
  background: "rgba(217, 107, 29, 0.08)",
  border: "1px solid rgba(217, 107, 29, 0.18)",
  color: "var(--text-main)",
  textAlign: "left",
  lineHeight: 1.7,
};

const listStyle = {
  margin: "22px auto 30px",
  padding: 0,
  listStyle: "none",
  textAlign: "left",
  color: "var(--text-main)",
  lineHeight: 1.8,
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "220px",
  padding: "14px 22px",
  borderRadius: "16px",
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  boxShadow: "0 16px 32px rgba(217, 107, 29, 0.28)",
};

export default function SessionConflictPage() {
  const storedMessage =
    localStorage.getItem("sessionConflictMessage") ||
    "Duplicate session detected. Your account is active in another browser now.";

  const handleLoginRedirect = () => {
    localStorage.removeItem("sessionConflictMessage");
    window.location.href = "/login";
  };

  return (
    <div style={shellStyle}>
      <div style={panelStyle}>
        <div style={brandRowStyle}>
          <div style={brandBadgeStyle}>Feed Bazaar</div>
          <div style={{ ...brandBadgeStyle, fontWeight: 600 }}>Session Guard</div>
        </div>

        <div style={contentWrapStyle}>
          <h1 style={headingStyle}>Duplicate Session Detected</h1>
          <p style={subTextStyle}>
            This browser session has been signed out because the same account was
            used to log in from another browser.
          </p>

          <div style={messageCardStyle}>{storedMessage}</div>

          <ul style={listStyle}>
            <li>1. The newest browser login stays active.</li>
            <li>2. Tabs in the same browser keep working as one session.</li>
            <li>3. The older browser must log in again to continue.</li>
          </ul>

          <button type="button" style={buttonStyle} onClick={handleLoginRedirect}>
            Click here to login
          </button>
        </div>
      </div>
    </div>
  );
}
