import { useState } from "react";
import styles from "./Login.module.css";
import axios from "axios";
import OTP from "./OTP";
import ErrorModal from "./ErrorModal";
import { useAuth } from "../Auth";
import {
  Fingerprint,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Loader2,
} from "lucide-react";
import { loginWithPasskey, isPasskeySupported } from "../services/passkeyService";

const persistActiveStore = (storeInfo, fallbackId) => {
  if (!storeInfo && !fallbackId) {
    localStorage.removeItem("activeStore");
    return;
  }

  const resolvedId =
    storeInfo?.id ||
    storeInfo?.storeId ||
    storeInfo?.store_id ||
    storeInfo?.assignedStoreId ||
    fallbackId ||
    null;

  if (!resolvedId) {
    localStorage.removeItem("activeStore");
    return;
  }

  const payload = {
    id: resolvedId,
    name: storeInfo?.name || storeInfo?.storeName || storeInfo?.title || "",
    code: storeInfo?.storeCode || storeInfo?.code || "",
    type: storeInfo?.storeType || storeInfo?.type || "",
  };

  localStorage.setItem("activeStore", JSON.stringify(payload));
};

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
        setOntap(false);
        setResp(false);
      }
    } catch (e) {
      setOntap(false);
      setResp(false);
      setError(e.response?.data?.message || "Failed to send OTP. Please check server.");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Instant FIDO2 Biometric Passkey Login
  const onPasskeySubmit = async () => {
    if (!isPasskeySupported()) {
      setError("Biometric Passkeys are not supported on this browser. Please use Mobile OTP.");
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

          const profileData = profileResponse.data?.data || profileResponse.data;
          if (profileData && typeof profileData === "object") {
            const normalizedProfile = profileData.user || profileData;
            const resolvedStore =
              normalizedProfile.store ||
              normalizedProfile.storeDetails ||
              normalizedProfile.assignedStore ||
              normalizedProfile.employeeStore ||
              profileData.defaultStore ||
              (Array.isArray(normalizedProfile.stores) ? normalizedProfile.stores[0] : null);

            const resolvedStoreId =
              normalizedProfile.storeId ||
              normalizedProfile.store_id ||
              normalizedProfile.assignedStoreId ||
              resolvedStore?.id ||
              resolvedStore?.storeId ||
              resolvedStore?.store_id;

            const requiresStoreSelection =
              profileData.requiresStoreSelection === true ||
              profileData.storeSelectionRequired === true;
            const assignedStores = profileData.assignedStores || [];
            const defaultStore = profileData.defaultStore;

            userPayload = {
              ...userPayload,
              ...normalizedProfile,
              roles: normalizedProfile.roles || userPayload.roles,
              showDivisions: false,
              userDivision: normalizedProfile.userDivision || userPayload.userDivision,
              store: resolvedStore || normalizedProfile.store || userPayload.store,
              storeId: resolvedStoreId || userPayload.storeId,
              requiresStoreSelection,
              assignedStores,
              defaultStore,
              isStoreManager: profileData.isStoreManager || false,
              isStoreEmployee: profileData.isStoreEmployee || false,
            };

            localStorage.setItem(
              "authMeData",
              JSON.stringify({
                requiresStoreSelection,
                assignedStores,
                defaultStore,
                isStoreManager: profileData.isStoreManager || false,
              })
            );

            if (resolvedStore || resolvedStoreId) {
              const finalStoreId = resolvedStoreId;
              persistActiveStore(resolvedStore || userPayload.store, finalStoreId);

              if (finalStoreId) {
                localStorage.setItem("currentStoreId", finalStoreId.toString());
                localStorage.setItem(
                  "selectedStore",
                  JSON.stringify({
                    id: finalStoreId,
                    name: resolvedStore?.name || userPayload.store?.name || "",
                    storeCode:
                      resolvedStore?.storeCode ||
                      resolvedStore?.code ||
                      userPayload.store?.storeCode ||
                      userPayload.store?.code ||
                      "",
                  })
                );
              }
            } else if (userPayload.storeId) {
              persistActiveStore(userPayload.store, userPayload.storeId);
              localStorage.setItem("currentStoreId", userPayload.storeId.toString());
            } else {
              persistActiveStore(null, null);
            }
          }
        } catch (profileErr) {
          console.warn("Could not fetch profile details:", profileErr);
          if (userPayload.store || userPayload.storeId) {
            persistActiveStore(userPayload.store, userPayload.storeId);
          } else {
            persistActiveStore(null, null);
          }
        }

        const userId = userPayload.id || userPayload.employeeId;
        if (userId) {
          localStorage.setItem(`passkey_registered_${userId}`, "true");
        }

        localStorage.setItem("user", JSON.stringify(userPayload));
        if (setRole) setRole(userPayload.roles);
        setUser({
          accesstoken: response.accessToken,
          refresh: response.refreshToken,
          user: userPayload,
        });
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
      {!ontap && (
        <>
          <div className={styles.titleArea}>
            <div className={styles.welcomeBadge}>
              <Sparkles size={13} />
              <span>SECURE ACCESS</span>
            </div>
            <h2 className={styles.mainTitle}>Sign In to ACM</h2>
            <p className={styles.subTitle}>
              Enter your registered mobile number or use your biometric passkey
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Registered Mobile Number</label>
              <div className={styles.phoneInputWrapper}>
                <div className={styles.countryCode}>
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  onChange={onChange}
                  value={mobile}
                  className={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || passkeyLoading || mobile.length !== 10}
              className={styles.primaryButton}
            >
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} size={18} />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className={styles.orDivider}>
              <span>OR</span>
            </div>

            <button
              type="button"
              onClick={onPasskeySubmit}
              disabled={loading || passkeyLoading}
              className={styles.passkeyButton}
            >
              {passkeyLoading ? (
                <>
                  <Loader2 className={styles.spinner} size={18} color="#ea580c" />
                  <span>Verifying Passkey...</span>
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
              <span>End-to-end encrypted 256-bit authentication</span>
            </div>
          </form>
        </>
      )}

      {ontap && resp && (
        <div className={styles.otpWrapper}>
          <div className={styles.titleArea}>
            <div className={styles.welcomeBadge}>
              <KeyRound size={13} />
              <span>SECURITY CODE</span>
            </div>
            <h2 className={styles.mainTitle}>Verify One-Time Password</h2>
            <p className={styles.subTitle}>
              Enter the 6-digit code sent to your mobile
            </p>
          </div>

          <div className={styles.otpTargetBox}>
            <div className={styles.otpTargetPhone}>
              <Smartphone size={16} color="#ea580c" />
              <span>+91 {mobile}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOntap(false);
                setResp(false);
              }}
              className={styles.changePhoneBtn}
            >
              Change
            </button>
          </div>

          {smsNotice && (
            <div className={styles.smsNoticeBanner}>
              {smsNotice}
            </div>
          )}

          <OTP
            email={mobile}
            resendOtp={onSubmit}
            setLogin={setLogin}
            setUser={setUser}
            setRole={setRole}
            onPasskeyFallback={onPasskeySubmit}
            passkeyLoading={passkeyLoading}
          />
        </div>
      )}

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default Input;
