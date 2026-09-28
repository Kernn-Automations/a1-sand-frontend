import styles from "./Footer.module.css";

function Footer() {
  return (
    <footer className={styles.footcontainer}>
      <div className={styles.footer}>
        <div className={styles.p1}>
          <a href="#">Terms</a>
          <span className={styles.pipe}>•</span>
          <a href="#">Privacy</a>
          <span className={styles.pipe}>•</span>
          <a href="#">Refunds</a>
          <span className={styles.pipe}>•</span>
          <a href="#">Contact</a>
        </div>
        <div className={styles.divider} />
        <p className={styles.pwd}>
          Powered by{" "}
          <span className={styles.bnd}>
            <a target="_blank" rel="noopener noreferrer" href="https://kernn.ai/">
              KERNN
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;