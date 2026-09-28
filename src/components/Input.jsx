import { useState } from "react";
import styles from "./Login.module.css";
import axios from "axios";
import OTP from "./OTP";
import Loading from "./Loading";
import ErrorModal from "./ErrorModal";
import { useAuth } from "../Auth";
import { Fingerprint } from "lucide-react";
import { loginWithPasskey, isPasskeySupported } from "../services/passkeyService";

function Input({ setLogin, setUser, setRole }) {
  const { saveTokens } = useAuth();
  const [mobile, setMobile] = useState("");
  const [ontap, setOntap] = useState(false);
  const [res, setRes] = useState();
  const [resp, setResp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [smsNotice, setSmsNotice] = useState("");

  const VITE_API = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const onChange = (e) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setMobile(onlyNums);
  };

  const onSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!mobile || mobile.length !== 10) {
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
          mobile,
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

  // 🔑 Instant Passkey Login (WebAuthn / Biometrics)
  const onPasskeySubmit = async () => {
    if (!isPasskeySupported()) {
      setError("Passkeys are not supported on this browser. Please use Mobile OTP.");
      setIsModalOpen(true);
      return;
    }

    setPasskeyLoading(true);

    try {
      const response = await loginWithPasskey(mobile);

      if (response && response.accessToken) {
        saveTokens(response.accessToken, response.refreshToken);

        const baseUserData = response.data?.user || response.data || {};
        let userPayload = {
          ...baseUserData,
          roles: response.roles || baseUserData.roles,
          showDivisions: false,
          userDivision: response.division || baseUserData.userDivision,
        };

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
      setPasskeyLoading(false);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className={styles.inputbox}>
        <div className={styles.wel}>
          <h1>Welcome!</h1>
        </div>

        <div className={styles.inputContainer}>
          <form onSubmit={onSubmit}>
            <p className={styles.p}>Login to continue</p>
            <label className={styles.label}>Mobile number</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              onChange={onChange}
              value={mobile}
              className={styles.input}
              placeholder="10-digit mobile"
              required
            />

            {!ontap && (
              <>
                <button
                  type="submit"
                  disabled={loading || passkeyLoading}
                  className={styles.sendbutton}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>

                <div className={styles.orDivider}>
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  onClick={onPasskeySubmit}
                  disabled={loading || passkeyLoading}
                  className={styles.passkeybutton}
                >
                  <Fingerprint size={18} />
                  <span>{passkeyLoading ? "Verifying..." : "Sign in with Passkey"}</span>
                </button>
              </>
            )}
          </form>

          {loading && (
            <div className={styles.loadingdiv}>
              <Loading />
            </div>
          )}

          {ontap && !loading && resp && (
            <>
              {smsNotice && (
                <div
                  style={{
                    maxWidth: 350,
                    margin: "0 auto 14px",
                    padding: "10px 14px",
                    backgroundColor: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#c2410c",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  {smsNotice}
                </div>
              )}
              <div style={{ marginBottom: 12, textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setOntap(false);
                    setResp(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary-color, #ea580c)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  &larr; Change mobile number
                </button>
              </div>
              <OTP
                email={mobile}
                resendOtp={onSubmit}
                setLogin={setLogin}
                setUser={setUser}
                setRole={setRole}
              />
            </>
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
