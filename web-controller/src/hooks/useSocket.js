// src/hooks/useSocket.js
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export function useSocket(server, token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = () => {
    if (!server || !token) {
      setError("Missing server or token");
      return;
    }

    if (socket) socket.disconnect();
    setError(null);

    const s = io(server, { auth: { token } });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) => {
      setError(err.message);
      setConnected(false);
    });

    setSocket(s);
  };

  useEffect(() => () => socket?.disconnect(), [socket]);

  return { socket, connected, connect, error, setError };
}