import styles from "./Login.module.css";
import acmLogo from "../images/acm-logo.png";

function Header() {
  return (
    <div className={styles.headerLogoWrapper}>
      <img
        className={styles.headerLogo}
        src={acmLogo}
        alt="Anjali Constructions and Materials Logo"
      />
    </div>
  );
}

export default Header;
