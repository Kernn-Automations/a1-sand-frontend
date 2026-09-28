import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import Input from "./Input";
import styles from "./Login.module.css";

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
    <>
      <div className={`container-fluid ${styles.cont}`}>
        {!login && (
          <>
            <div className={styles.logincontainer}>
              <Header />
              <main className={styles.formWrapper}>
                {sessionConflictMessage && (
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 520,
                      margin: "0 auto 18px",
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: "rgba(201, 45, 58, 0.10)",
                      border: "1px solid rgba(201, 45, 58, 0.22)",
                      color: "#8b1e2d",
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    {sessionConflictMessage}
                  </div>
                )}
                <Input setLogin={setLogin} setUser={setUser} />
              </main>
              <Footer />
            </div>
          </>
        )}

      </div>
    </>
  );
}

export default Login;
