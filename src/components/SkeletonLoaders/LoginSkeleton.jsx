import React from "react";
import GlobalLoader from "../Common/GlobalLoader";

export default function LoginSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        padding: "20px",
      }}
    >
      <GlobalLoader
        message="Authenticating Portal Access..."
        subtext="Anjali Constructions & Materials"
      />
    </div>
  );
}
