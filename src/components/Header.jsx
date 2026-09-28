import styles from "./Login.module.css";
import acmLogo from "../images/acm-logo.png";

function Header() {
  return (
    <div className={styles.logocol} style={{ textAlign: "center", marginBottom: 20 }}>
      <img
        className={styles.logo}
        src={acmLogo}
        alt="Anjali Constructions and Materials Logo"
        style={{
          maxHeight: 70,
          width: "auto",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))",
        }}
      />
    </div>
  );
}

export default Header;
