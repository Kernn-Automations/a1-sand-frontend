import React from "react";

const pageVars = {
  "--page-bg": "radial-gradient(circle at top left, #fff5ea 0%, #ffffff 40%, #eef4fb 100%)",
  "--panel-bg": "#ffffff",
  "--panel-border": "rgba(18, 63, 122, 0.12)",
  "--primary": "#123f7a",
  "--accent": "#d96b1d",
  "--text-main": "#172033",
  "--text-soft": "#5f6b85",
  "--soft-block": "rgba(18, 63, 122, 0.05)",
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
  maxWidth: "980px",
  background: "var(--panel-bg)",
  border: "1px solid var(--panel-border)",
  borderRadius: "28px",
  padding: "30px",
  boxShadow: "var(--shadow)",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "52px",
};

const logoBoxStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "88px",
  height: "88px",
  borderRadius: "24px",
  background: "var(--soft-block)",
  color: "var(--primary)",
  fontWeight: 800,
  fontSize: "1.6rem",
};

const centerStyle = {
  maxWidth: "640px",
  margin: "0 auto",
  textAlign: "center",
};

const codeStyle = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(217, 107, 29, 0.1)",
  color: "var(--accent)",
  fontWeight: 800,
  letterSpacing: "0.12em",
  fontSize: "0.82rem",
  marginBottom: "20px",
};

const headingStyle = {
  margin: "0 0 16px",
  fontSize: "clamp(2.2rem, 3vw, 3.4rem)",
  lineHeight: 1.08,
  fontWeight: 800,
  color: "var(--text-main)",
};

const copyStyle = {
  margin: "0 auto 28px",
  color: "var(--text-soft)",
  lineHeight: 1.75,
  fontSize: "1.05rem",
  maxWidth: "58ch",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "14px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "190px",
  padding: "14px 22px",
  borderRadius: "16px",
  border: "none",
  background: "var(--primary)",
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: "#fff",
  color: "var(--text-main)",
  border: "1px solid rgba(18, 63, 122, 0.14)",
};

export default function NotFoundPage() {
  return (
    <div style={shellStyle}>
      <div style={panelStyle}>
        <div style={topRowStyle}>
          <div style={logoBoxStyle}>FB</div>
          <div style={{ ...logoBoxStyle, width: "96px", fontSize: "1.15rem" }}>
            404
          </div>
        </div>

        <div style={centerStyle}>
          <div style={codeStyle}>PAGE NOT FOUND</div>
          <h1 style={headingStyle}>This page does not exist anymore.</h1>
          <p style={copyStyle}>
            The link may be broken, the page may have moved, or the address may
            have been entered incorrectly. Let&apos;s get you back to a working
            route.
          </p>

          <div style={actionsStyle}>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Go to Login
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => {
                window.history.back();
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
