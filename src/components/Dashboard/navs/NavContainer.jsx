import { useState, useEffect } from "react";
import Logo from "./Logo";
import NavBg from "./NavBg";
import styles from "./NavContainer.module.css";

function NavContainer({ hover, setTab, tab, role, dept, closeMobileMenu }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {!isMobile && (
        <div
          className={styles.logo}
          style={{
            height: 64,
            padding: hover ? "0 16px" : "0",
            display: "flex",
            alignItems: "center",
            justifyContent: hover ? "flex-start" : "center",
            gap: 12,
            borderBottom: "1px solid #f1f5f9",
            transition: "all 0.2s ease",
            boxSizing: "border-box",
          }}
        >
          <Logo size={38} />
          {hover && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                Anjali
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#ea580c",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Constructions
              </span>
            </div>
          )}
        </div>
      )}
      <NavBg
        hover={hover}
        setTab={setTab}
        tab={tab}
        closeMobileMenu={closeMobileMenu}
      />
    </div>
  );
}

export default NavContainer;

