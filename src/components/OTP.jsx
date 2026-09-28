import React, { useState, useEffect, useRef } from "react";
import OtpInput from "react-otp-input";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import styles from "./Login.module.css";
import { useAuth } from "../Auth";
import {
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Loader2,
} from "lucide-react";

function OTP({
  email,
  resendOtp,
  setLogin,
  setUser,
  setRole,
  onPasskeyFallback,
  passkeyLoading,
}) {
  const { saveTokens } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timer, setTimer] = useState(30);
  const VITE_API = import.meta.env.VITE_API_URL || "http://localhost:8080";

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

  const otpInputRef = useRef(null);

  // Auto-focus on first box
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (otpInputRef.current) {
        const firstInput = otpInputRef.current.querySelector("input");
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 150);

    return () => clearTimeout(focusTimer);
  }, []);

  // 30s Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (timer > 0) return;
    setTimer(30);
    setError("");
    setOtp("");
    resendOtp();
  };

  const executeVerify = async (otpCode) => {
    if (loading) return;
    setLoading(true);
    setError("");

    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isMobileBrowser = window.innerWidth <= 768 || isMobileDevice;

    try {
      const res = await axios.post(
        `${VITE_API}/auth/verify`,
        {
          mobile: email,
          otp: otpCode,
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

      if (res.status === 200) {
        saveTokens(res.data.accessToken, res.data.refreshToken);

        const baseUserData = res.data.data?.user || res.data.data || {};
        let userPayload = {
          ...baseUserData,
          roles: res.data.roles || baseUserData.roles,
          showDivisions: res.data.showDivisions ?? baseUserData.showDivisions,
          userDivision: res.data.userDivision || baseUserData.userDivision,
        };

        try {
          const profileResponse = await axios.get(`${VITE_API}/auth/me`, {
            headers: {
              Authorization: `Bearer ${res.data.accessToken}`,
            },
          });

          const profileData =
            profileResponse.data?.data || profileResponse.data;
          if (profileData && typeof profileData === "object") {
            const normalizedProfile = profileData.user || profileData;
            const resolvedStore =
              normalizedProfile.store ||
              normalizedProfile.storeDetails ||
              normalizedProfile.assignedStore ||
              normalizedProfile.employeeStore ||
              profileData.defaultStore ||
              (Array.isArray(normalizedProfile.stores)
                ? normalizedProfile.stores[0]
                : null);

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
              showDivisions:
                typeof normalizedProfile.showDivisions === "boolean"
                  ? normalizedProfile.showDivisions
                  : userPayload.showDivisions,
              userDivision:
                normalizedProfile.userDivision || userPayload.userDivision,
              store:
                resolvedStore || normalizedProfile.store || userPayload.store,
              storeId: resolvedStoreId || userPayload.storeId,
              requiresStoreSelection,
              assignedStores,
              defaultStore,
              isStoreManager: profileData.isStoreManager || false,
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
              persistActiveStore(
                resolvedStore || userPayload.store,
                finalStoreId
              );

              if (finalStoreId) {
                localStorage.setItem("currentStoreId", finalStoreId.toString());
                localStorage.setItem(
                  "selectedStore",
                  JSON.stringify({
                    id: finalStoreId,
                    name:
                      resolvedStore?.name || userPayload.store?.name || "",
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
              localStorage.setItem(
                "currentStoreId",
                userPayload.storeId.toString()
              );
            } else {
              persistActiveStore(null, null);
            }
          }
        } catch (profileError) {
          console.error("Failed to fetch user profile details:", profileError);
          if (userPayload.store || userPayload.storeId) {
            persistActiveStore(userPayload.store, userPayload.storeId);
          } else {
            persistActiveStore(null, null);
          }
        }

        localStorage.setItem("user", JSON.stringify(userPayload));

        if (setRole) setRole(userPayload.roles);
        setUser({
          accesstoken: res.data.accessToken,
          refresh: res.data.refreshToken,
          user: userPayload,
        });
        setLogin(true);
      } else {
        throw new Error("Invalid or expired OTP");
      }
    } catch (e) {
      console.error("OTP verification failed:", e);
      const errMsg =
        e.response?.data?.message ||
        e.message ||
        "Invalid OTP. Please check the code and try again.";
      setError(errMsg);
      setOtp("");
      if (otpInputRef.current) {
        const firstInput = otpInputRef.current.querySelector("input");
        if (firstInput) firstInput.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (newOtp) => {
    const clean = newOtp.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(clean);
    if (error) setError("");

    // Auto-submit when user reaches 6 digits
    if (clean.length === 6 && !loading) {
      executeVerify(clean);
    }
  };

  const onSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (otp.length === 6 && !loading) {
      executeVerify(otp);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className={styles.otpBoxesContainer} ref={otpInputRef}>
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            numInputs={6}
            renderSeparator={<span style={{ width: "8px" }} />}
            renderInput={(inputProps) => (
              <input
                {...inputProps}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                className={styles.otpInputBox}
              />
            )}
            shouldAutoFocus={true}
          />
        </div>

        {error && (
          <div className={styles.otpErrorBanner}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.resendRow}>
          <span>Didn&apos;t receive code?</span>
          {timer > 0 ? (
            <span className={styles.resendCountdown}>Resend in {timer}s</span>
          ) : (
            <button
              type="button"
              className={styles.resendLink}
              onClick={handleResend}
            >
              Resend OTP
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className={styles.primaryButton}
        >
          {loading ? (
            <>
              <Loader2 className={styles.spinner} size={18} />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <span>Verify &amp; Sign In</span>
              <CheckCircle2 size={18} />
            </>
          )}
        </button>

        {onPasskeyFallback && (
          <>
            <div className={styles.orDivider}>
              <span>OR</span>
            </div>

            <button
              type="button"
              onClick={onPasskeyFallback}
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
                  <span>Sign in with Passkey instead</span>
                </>
              )}
            </button>
          </>
        )}
      </form>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default OTP;
