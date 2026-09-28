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
    <div className={styles.cont}>
      {!login && (
        <div className={styles.logincontainer}>
          <Header />
          {sessionConflictMessage && (
            <div
              style={{
                width: "100%",
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "13px",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              {sessionConflictMessage}
            </div>
          )}
          <Input setLogin={setLogin} setUser={setUser} />
          <Footer />
        </div>
      )}
    </div>
  );
}

export default Login;
