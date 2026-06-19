import { io } from "socket.io-client";

const URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:3001`
  : window.location.origin;

const socket = io(URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

socket.on("connect", () => {
  console.log("[Socket] Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[Socket] Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("[Socket] Connection error:", err.message);
});

export default socket;
