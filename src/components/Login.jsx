import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import Input from "./Input";
import styles from "./Login.module.css";
import { Fingerprint, Truck, ShieldCheck, Sparkles, Layers } from "lucide-react";

function Login() {
  const [login, setLogin] = useState(false);
  const [user, setUser] = useState({});
  const [sessionConflictMessage, setSessionConflictMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conflictReason = params.get("reason");
    const storedMessage = localStorage.getItem("sessionConflictMessage");

    if (conflictReason === "duplicate-session" || storedMessage) {
      setSessionConflictMessage(
        storedMessage ||
          "Duplicate session detected. This account was opened in another browser. Please log in again."
      );
      localStorage.removeItem("sessionConflictMessage");
    }
  }, []);

  useEffect(() => {
    if (login) {
      localStorage.setItem("activeView", "admin");
      localStorage.setItem(
        "selectedDivision",
        JSON.stringify({ id: 1, name: "Anjali Constructions" })
      );
      navigate("/", { replace: true });
    }
  }, [login, navigate]);

  return (
    <div className={styles.pageWrapper}>
      {/* Left Showcase Panel (Visible on Desktop >= 1024px) */}
      <div className={styles.showcasePanel}>
        <div className={styles.showcaseGlow} />

        <div className={styles.showcaseHeader}>
          <div className={styles.brandBadge}>
            <Sparkles size={14} color="#fb923c" />
            <span>ACM ENTERPRISE PORTAL</span>
          </div>
          <h1 className={styles.showcaseTitle}>
            Next-Generation Operations &amp; <span>Materials Management</span>
          </h1>
          <p className={styles.showcaseDesc}>
            Unified digital operations for dispatch, delivery challans, materials
            tracking, and secure biometric authentication.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconBox}>
              <Fingerprint size={22} />
            </div>
            <div className={styles.featureText}>
              <h4>FIDO2 Biometric Passkeys</h4>
              <p>
                Sign in instantly using Touch ID, Face ID, or Windows Hello.
                Fast, secure, and independent of SMS delays.
              </p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconBox}>
              <Truck size={22} />
            </div>
            <div className={styles.featureText}>
              <h4>Real-Time Materials &amp; Dispatch</h4>
              <p>
                Live monitoring of sand, aggregates, and automatic QR-code
                authenticated delivery challans.
              </p>
            </div>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIconBox}>
              <Layers size={22} />
            </div>
            <div className={styles.featureText}>
              <h4>Role-Based Workspaces</h4>
              <p>
                Instant synchronized access tailored for drivers, supervisors,
                scale operators, and management.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.showcaseFooter}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={16} color="#fb923c" />
            <span>End-to-End Enterprise Encryption</span>
          </div>
          <span>v2.4 Production</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <Header />

          {sessionConflictMessage && (
            <div className={styles.conflictBanner}>
              {sessionConflictMessage}
            </div>
          )}

          <div className={styles.authCard}>
            <Input setLogin={setLogin} setUser={setUser} />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Login;
