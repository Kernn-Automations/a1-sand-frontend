import { io } from "socket.io-client";
import authService from "./authService";

const resolveSocketBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL;

  if (!configured || configured === "/api") {
    return window.location.origin;
  }

  return configured.replace(/\/api\/?$/, "");
};

export const connectStoreNotificationSocket = ({ storeIds = [], onNotification }) => {
  const { accessToken } = authService.getTokens();
  const normalizedStoreIds = Array.isArray(storeIds)
    ? storeIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (!accessToken || !normalizedStoreIds.length) return null;

  const socket = io(`${resolveSocketBaseUrl()}/store-notifications`, {
    path: "/socket.io",
    transports: ["polling", "websocket"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1500,
    timeout: 20000,
    autoConnect: true,
    auth: { token: accessToken },
  });

  socket.on("connect", () => {
    socket.emit("subscribe_store_notifications", normalizedStoreIds);
  });

  if (typeof onNotification === "function") {
    socket.on("store_notification", onNotification);
  }

  socket.on("connect_error", (error) => {
    console.warn(
      "Store notification socket connection warning:",
      error?.message || "Unable to connect",
    );
  });

  return socket;
};

