import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * useSocket(serverUrl, token)
 * - serverUrl: something like "http://10.200.252.56:3000"
 * - token: authentication token (secret)
 */
export function useSocket(serverUrl, token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    if (!serverUrl || !token) {
      setError("Missing server or token");
      return;
    }

    // If we already have a socket, disconnect first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setError(null);
    try {
      const s = io(serverUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 3,
        timeout: 5000,
      });

      s.on("connect", () => {
        socketRef.current = s;
        setSocket(s);
        setConnected(true);
        setError(null);
      });

      s.on("disconnect", (reason) => {
        setConnected(false);
      });

      s.on("connect_error", (err) => {
        setError(err?.message || "connect_error");
        setConnected(false);
      });

      // store ref
      socketRef.current = s;
    } catch (err) {
      setError(err.message || "failed to connect");
      setConnected(false);
    }
  }, [serverUrl, token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
  }, []);

  // cleanup when unmounting
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket, connected, connect, disconnect, error, setError };
}