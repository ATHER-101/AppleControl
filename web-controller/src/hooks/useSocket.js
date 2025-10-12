import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Dynamic socket hook that supports manual connect/disconnect.
 */
export function useSocket(initialServer = null, initialToken = null) {
  const [server, setServer] = useState(initialServer);
  const [token, setToken] = useState(initialToken);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  const connect = (serverUrl = server, authToken = token) => {
    if (!serverUrl || !authToken) {
      setError("Missing server or token");
      return;
    }

    // Clean up old socket if any
    socketRef.current?.disconnect();

    const s = io(serverUrl, {
      auth: { token: authToken },
      transports: ["websocket"],
      reconnection: true,
    });

    s.on("connect", () => {
      console.log("✅ Connected to", serverUrl);
      setConnected(true);
      setError(null);
    });

    s.on("disconnect", () => {
      console.log("⚠️ Disconnected");
      setConnected(false);
    });

    s.on("connect_error", (err) => {
      console.error("❌ Connection error:", err.message);
      setError(err.message);
      setConnected(false);
    });

    socketRef.current = s;
    setSocket(s);
    setServer(serverUrl);
    setToken(authToken);
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      console.log("🔌 Socket disconnected manually");
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => socketRef.current?.disconnect();
  }, []);

  return { socket, connected, connect, disconnect, error, setError };
}