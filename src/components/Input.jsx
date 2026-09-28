import { useState } from "react";
import styles from "./Login.module.css";
import axios from "axios";
import OTP from "./OTP";
import Loading from "./Loading";
import ErrorModal from "./ErrorModal";
import { useAuth } from "../Auth";
import { KeyRound, Smartphone, Fingerprint, Sparkles, ShieldCheck } from "lucide-react";
import { loginWithPasskey, isPasskeySupported } from "../services/passkeyService";

function Input({ setLogin, setUser, setRole }) {
  const { saveTokens } = useAuth();
  const [loginMode, setLoginMode] = useState("passkey"); // "passkey" | "otp"
  const [email, setEmail] = useState(""); // mobile number
  const [ontap, setOntap] = useState(false);
  const [res, setRes] = useState();
  const [resp, setResp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [smsNotice, setSmsNotice] = useState("");

  const VITE_API = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const onMobileChange = (e) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setEmail(onlyNums);
  };

  // 🔑 1-Click Biometric Passkey Login (WebAuthn / FIDO2)
  const onPasskeySubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!isPasskeySupported()) {
      setError("Passkeys are not supported on this browser. Please use Mobile OTP.");
      setIsModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const response = await loginWithPasskey(email);

      if (response && response.accessToken) {
        // Save tokens
        saveTokens(response.accessToken, response.refreshToken);

        const baseUserData = response.data?.user || response.data || {};
        let userPayload = {
          ...baseUserData,
          roles: response.roles || baseUserData.roles,
          showDivisions: false,
          userDivision: response.division || baseUserData.userDivision,
        };

        // Fetch user profile
        try {
          const profileResponse = await axios.get(`${VITE_API}/auth/me`, {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          });

          const profileData =
            profileResponse.data?.data || profileResponse.data;
          if (profileData && typeof profileData === "object") {
            const normalizedProfile = profileData.user || profileData;
            const resolvedStore =
              normalizedProfile.store ||
              normalizedProfile.storeDetails ||
              profileData.defaultStore ||
              (Array.isArray(normalizedProfile.stores)
                ? normalizedProfile.stores[0]
                : null);

            const resolvedStoreId =
              normalizedProfile.storeId ||
              normalizedProfile.store_id ||
              resolvedStore?.id;

            userPayload = {
              ...userPayload,
              ...normalizedProfile,
              roles: normalizedProfile.roles || userPayload.roles,
              showDivisions: false,
              store: resolvedStore || userPayload.store,
              storeId: resolvedStoreId || userPayload.storeId,
              isStoreManager: profileData.isStoreManager || false,
              isStoreEmployee: profileData.isStoreEmployee || false,
            };
          }
        } catch (profileErr) {
          console.warn("Could not fetch profile details:", profileErr);
        }

        const userId = userPayload.id || userPayload.employeeId;
        if (userId) {
          localStorage.setItem(`passkey_registered_${userId}`, "true");
        }

        localStorage.setItem("user", JSON.stringify(userPayload));
        if (setRole) setRole(userPayload.roles);
        setUser(userPayload);
        setLogin(true);
      } else {
        setError("Passkey sign-in failed. Please try again or use Mobile OTP.");
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Passkey login error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Passkey authentication failed. Please use Mobile OTP.";
      setError(msg);
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 📲 Standard Mobile OTP Login
  const onOtpSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!email || email.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      setIsModalOpen(true);
      return;
    }

    setOntap(true);
    setResp(true);
    setLoading(true);
    setSmsNotice("");

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isMobileBrowser = window.innerWidth <= 768 || isMobileDevice;

    try {
      const response = await axios.post(
        `${VITE_API}/auth/login`,
        {
          mobile: email,
          allowMobile: true,
          deviceType: isMobileBrowser ? "mobile" : "web",
        },
        {
          headers: {
            "X-Allow-Mobile": "true",
            "X-Device-Type": isMobileBrowser ? "mobile" : "web",
          },
        }
      );

      setRes(response.data);
      if (response.status === 200) {
        setLoading(false);
        setResp(true);
        if (response.data?.smsDisabled) {
          setSmsNotice(response.data.message);
        }
      } else {
        setResp(false);
        setOntap(false);
      }
    } catch (e) {
      setOntap(false);
      setError(e.response?.data?.message || "Server error");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className={styles.inputbox}>
        <div className={styles.wel}>
          <h1>Welcome!</h1>
        </div>

        {/* Login Method Toggle Tabs */}
        {!ontap && (
          <div
            style={{
              display: "flex",
              backgroundColor: "#f1f5f9",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "20px",
              maxWidth: "350px",
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setLoginMode("passkey");
                setOntap(false);
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: loginMode === "passkey" ? "#ffffff" : "transparent",
                color: loginMode === "passkey" ? "#ea580c" : "#64748b",
                fontWeight: loginMode === "passkey" ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow:
                  loginMode === "passkey"
                    ? "0 2px 4px rgba(0,0,0,0.06)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              <KeyRound size={15} />
              <span>Passkey (Instant)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode("otp");
                setOntap(false);
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: loginMode === "otp" ? "#ffffff" : "transparent",
                color: loginMode === "otp" ? "#ea580c" : "#64748b",
                fontWeight: loginMode === "otp" ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow:
                  loginMode === "otp"
                    ? "0 2px 4px rgba(0,0,0,0.06)"
                    : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Smartphone size={15} />
              <span>Mobile OTP</span>
            </button>
          </div>
        )}

        <div className={styles.inputContainer}>
          {/* 🔑 MODE 1: FIDO2 WEBAUTHN PASSKEY LOGIN */}
          {loginMode === "passkey" && (
            <form onSubmit={onPasskeySubmit}>
              <p className={styles.p}>
                Sign in instantly with your Fingerprint, Face ID, or Screen Lock
              </p>

              <label className={styles.label}>
                Registered Mobile (Optional)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                onChange={onMobileChange}
                value={email}
                className={styles.input}
                placeholder="10-digit mobile (or leave blank)"
              />

              <div
                style={{
                  maxWidth: "350px",
                  padding: "12px 14px",
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Fingerprint size={24} color="#ea580c" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "12px", color: "#9a3412", lineHeight: 1.4 }}>
                  <strong>Instant & Zero-Cost:</strong> Click below to verify
                  using your device biometrics (Windows Hello, Touch ID, Face ID,
                  or Fingerprint).
                </div>
              </div>

              {!loading && (
                <button
                  type="submit"
                  className={styles.sendbutton}
                  style={{
                    marginTop: "8px",
                    marginBottom: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Fingerprint size={18} />
                  <span>Sign In with Passkey</span>
                </button>
              )}

              <div
                style={{
                  maxWidth: "350px",
                  textAlign: "center",
                  marginBottom: "40px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setLoginMode("otp")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ea580c",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  First time on this device? Log in with Mobile OTP &rarr;
                </button>
              </div>
            </form>
          )}

          {/* 📲 MODE 2: MOBILE OTP LOGIN */}
          {loginMode === "otp" && (
            <>
              {!ontap && (
                <form onSubmit={onOtpSubmit}>
                  <p className={styles.p}>Login via One-Time Password</p>
                  <label className={styles.label}>Mobile number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    onChange={onMobileChange}
                    value={email}
                    className={styles.input}
                    placeholder="10-digit mobile"
                    required
                  />

                  {!loading && (
                    <button
                      type="submit"
                      className={styles.sendbutton}
                      style={{ marginTop: "12px", marginBottom: "18px" }}
                    >
                      Send OTP
                    </button>
                  )}

                  <div style={{ maxWidth: "350px", textAlign: "center", marginBottom: "40px" }}>
                    <button
                      type="button"
                      onClick={() => setLoginMode("passkey")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ea580c",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      &larr; Switch back to Passkey Login
                    </button>
                  </div>
                </form>
              )}

              {ontap && !loading && resp && (
                <>
                  {smsNotice && (
                    <div
                      style={{
                        maxWidth: "350px",
                        marginBottom: "16px",
                        padding: "10px 14px",
                        backgroundColor: "#fff7ed",
                        border: "1px solid #fed7aa",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#c2410c",
                        lineHeight: 1.4,
                      }}
                    >
                      {smsNotice}
                    </div>
                  )}
                  <OTP
                    email={email}
                    resendOtp={onOtpSubmit}
                    setLogin={setLogin}
                    setUser={setUser}
                    setRole={setRole}
                  />
                </>
              )}
            </>
          )}

          {loading && (
            <div className={styles.loadingdiv}>
              <Loading />
            </div>
          )}
        </div>

        {isModalOpen && (
          <ErrorModal
            isOpen={isModalOpen}
            message={error}
            onClose={closeModal}
          />
        )}
      </div>
    </>
  );
}

export default Input;
