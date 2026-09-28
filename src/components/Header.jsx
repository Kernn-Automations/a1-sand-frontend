import styles from "./Login.module.css";
import acmLogo from "../images/acm-logo.png";

function Header() {
  return (
    <div className={styles.logoHeader}>
      <img
        className={styles.logo}
        src={acmLogo}
        alt="Anjali Constructions and Materials Logo"
      />
    </div>
  );
}

export default Header;
