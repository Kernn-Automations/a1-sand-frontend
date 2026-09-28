import React from "react";
import GlobalLoader from "../Common/GlobalLoader";

export default function RouteSkeleton() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "24px 16px",
      }}
    >
      <GlobalLoader
        message="Loading Operations..."
        subtext="Anjali Constructions & Materials"
      />
    </div>
  );
}
