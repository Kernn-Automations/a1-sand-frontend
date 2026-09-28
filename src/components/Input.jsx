import React, { useState } from "react";
import styles from "./Login.module.css";
import axios from "axios";
import OTP from "./OTP";
import Loading from "./Loading";
import ErrorModal from "./ErrorModal";
import { useAuth } from "../Auth";
import { Fingerprint, ShieldCheck, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { loginWithPasskey, isPasskeySupported } from "../services/passkeyService";

function Input({ setLogin, setUser, setRole }) {
  const { saveTokens } = useAuth();
  const [mobile, setMobile] = useState("");
  const [ontap, setOntap] = useState(false);
  const [resp, setResp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [smsNotice, setSmsNotice] = useState("");

  const VITE_API = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const onMobileChange = (e) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setMobile(onlyNums);
  };

  // 📲 Send Mobile OTP
  const onSendOtpSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!mobile || mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      setIsModalOpen(true);
      return;
    }

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

      if (response.status === 200) {
        setOntap(true);
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
      setError(e.response?.data?.message || "Failed to send OTP. Please try again.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Instant 1-Touch Passkey Login (WebAuthn / FIDO2)
  const onPasskeySubmit = async () => {
    if (!isPasskeySupported()) {
      setError("Passkeys are not supported on this browser or platform. Please use Mobile OTP.");
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

        // Fetch detailed user profile
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
        "Passkey authentication failed. Please sign in with Mobile OTP.";
      setError(msg);
      setIsModalOpen(true);
    } finally {
      setPasskeyLoading(false);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className={styles.authCard}>
      {!ontap ? (
        <>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Welcome</h1>
            <p className={styles.subtitle}>
              Sign in to Anjali Constructions & Materials
            </p>
          </div>

          <form onSubmit={onSendOtpSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Mobile Number</label>
              <div className={styles.phoneInputWrapper}>
                <span className={styles.countryCode}>🇮🇳 +91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  onChange={onMobileChange}
                  value={mobile}
                  className={styles.phoneInput}
                  placeholder="Enter 10-digit mobile"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || passkeyLoading}
              className={styles.primaryButton}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Clean OR Divider */}
          <div className={styles.divider}>
            <span>OR</span>
          </div>

          {/* 1-Click Passkey Button */}
          <button
            type="button"
            onClick={onPasskeySubmit}
            disabled={loading || passkeyLoading}
            className={styles.passkeyButton}
          >
            {passkeyLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" color="#ea580c" />
                <span>Verifying Biometrics...</span>
              </>
            ) : (
              <>
                <Fingerprint size={20} color="#ea580c" />
                <span>Sign in with Passkey</span>
              </>
            )}
          </button>

          <div className={styles.securityNote}>
            <ShieldCheck size={14} color="#16a34a" />
            <span>FIDO2 WebAuthn & 256-bit SSL Protected</span>
          </div>
        </>
      ) : (
        /* OTP Verification Screen */
        <div className={styles.otpWrapper}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Enter Verification Code</h1>
            <p className={styles.subtitle}>
              We sent a 6-digit code to your registered mobile
            </p>
          </div>

          <div className={styles.otpTargetInfo}>
            <span className={styles.otpTargetText}>
              📱 +91 {mobile}
            </span>
            <button
              type="button"
              onClick={() => {
                setOntap(false);
                setResp(false);
              }}
              className={styles.editMobileLink}
            >
              Change
            </button>
          </div>

          {smsNotice && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#c2410c",
                lineHeight: 1.4,
              }}
            >
              {smsNotice}
            </div>
          )}

          <OTP
            email={mobile}
            resendOtp={onSendOtpSubmit}
            setLogin={setLogin}
            setUser={setUser}
            setRole={setRole}
          />

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <button
            type="button"
            onClick={onPasskeySubmit}
            disabled={passkeyLoading}
            className={styles.passkeyButton}
          >
            {passkeyLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" color="#ea580c" />
                <span>Verifying Biometrics...</span>
              </>
            ) : (
              <>
                <Fingerprint size={20} color="#ea580c" />
                <span>Sign in with Passkey Instead</span>
              </>
            )}
          </button>
        </div>
      )}

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default Input;
