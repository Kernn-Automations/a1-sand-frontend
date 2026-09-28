import React from "react";
import acmLogo from "../../../images/acm-logo.png";

function Logo({ size = 38, showBorder = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        border: showBorder ? "1px solid #e2e8f0" : "none",
        overflow: "hidden",
        flexShrink: 0,
        padding: 2,
      }}
    >
      <img
        src={acmLogo}
        alt="Anjali Constructions and Materials Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export default Logo;