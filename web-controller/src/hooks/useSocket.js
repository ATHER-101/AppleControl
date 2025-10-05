import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(server, token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = () => {
    if (socket) socket.disconnect();
    const s = io(server, { auth: { token } });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) => alert("Connection failed: " + err.message));

    setSocket(s);
  };

  useEffect(() => {
    return () => socket?.disconnect();
  }, [socket]);

  return { socket, connected, connect };
}