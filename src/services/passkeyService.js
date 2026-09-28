import axios from "axios";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

const VITE_API = import.meta.env.VITE_API_URL || "http://localhost:8080";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Check if the current browser and operating system support WebAuthn Passkeys
 */
export const isPasskeySupported = () => {
  return browserSupportsWebAuthn();
};

/**
 * Check if a platform authenticator (TouchID, FaceID, Windows Hello, Fingerprint) is available
 */
export const checkPlatformAuthenticator = async () => {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch (err) {
    console.warn("Could not check platform authenticator availability:", err);
    return false;
  }
};

/**
 * Register the current device as a Passkey for the currently logged-in employee
 */
export const registerPasskeyOnThisDevice = async (customDeviceName = "") => {
  if (!isPasskeySupported()) {
    throw new Error("WebAuthn Passkeys are not supported on this browser or platform.");
  }

  // 1. Get registration options from backend
  const optionsRes = await axios.post(
    `${VITE_API}/auth/passkey/register-options`,
    {},
    { headers: getAuthHeaders() }
  );

  if (!optionsRes.data?.options) {
    throw new Error("Invalid registration options received from server.");
  }

  // 2. Trigger native browser authenticator (Fingerprint, TouchID, FaceID, Windows Hello)
  let attResp;
  try {
    attResp = await startRegistration({ optionsJSON: optionsRes.data.options });
  } catch (error) {
    if (error.name === "NotAllowedError") {
      throw new Error("Passkey registration was cancelled by user.");
    }
    throw error;
  }

  // 3. Send authenticator response to backend for verification and storage
  const verifyRes = await axios.post(
    `${VITE_API}/auth/passkey/register-verify`,
    {
      response: attResp,
      customDeviceName,
    },
    { headers: getAuthHeaders() }
  );

  return verifyRes.data;
};

/**
 * Perform 1-Click Biometric Login via Passkey
 * @param {string} mobile - Optional mobile number to restrict credentials
 */
export const loginWithPasskey = async (mobile = "") => {
  if (!isPasskeySupported()) {
    throw new Error("Passkeys are not supported on this browser.");
  }

  // 1. Fetch authentication options
  const optionsRes = await axios.post(`${VITE_API}/auth/passkey/login-options`, {
    mobile: mobile ? mobile.trim() : undefined,
  });

  if (!optionsRes.data?.options) {
    throw new Error("Failed to receive authentication challenge from server.");
  }

  // 2. Prompt user for biometric / passkey assertion
  let assertionResp;
  try {
    assertionResp = await startAuthentication({
      optionsJSON: optionsRes.data.options,
    });
  } catch (error) {
    if (error.name === "NotAllowedError") {
      throw new Error("Passkey sign-in cancelled or timed out.");
    }
    throw error;
  }

  // 3. Verify assertion on backend and retrieve session tokens
  const verifyRes = await axios.post(`${VITE_API}/auth/passkey/login-verify`, {
    response: assertionResp,
    mobile: mobile ? mobile.trim() : undefined,
  });

  return verifyRes.data;
};

/**
 * Fetch all registered passkeys for the logged-in employee
 */
export const fetchUserPasskeys = async () => {
  const res = await axios.get(`${VITE_API}/auth/passkey/list`, {
    headers: getAuthHeaders(),
  });
  return res.data?.passkeys || [];
};

/**
 * Delete a registered passkey
 */
export const deleteUserPasskey = async (passkeyId) => {
  const res = await axios.delete(`${VITE_API}/auth/passkey/${passkeyId}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
