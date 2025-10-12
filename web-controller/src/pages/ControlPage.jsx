import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Trackpad from "../components/Trackpad";
import Keyboard from "../components/Keyboard";
import ConnectionPanel from "../components/ConnectionPanel";
import { useSocket } from "../hooks/useSocket";

/**
 * ControlPage:
 * - expects window.__LAST_SCAN__ = { ip, port, secret } set by ScannerPage prior to navigation
 * - uses useSocket to connect (if not connected) and passes socket to Trackpad and Keyboard
 */
export default function ControlPage() {
  const navigate = useNavigate();

  // read last scan from global - ScannerPage sets this right before navigate
  const scan = window.__LAST_SCAN__ || null;
  const serverUrl = scan ? `http://${scan.ip}:${scan.port}` : null;
  const token = scan ? scan.secret : null;

  const { socket, connected, connect, disconnect, error } = useSocket(serverUrl, token);

  useEffect(() => {
    // If we have no scan info, redirect back to scanner
    if (!scan) {
      navigate("/", { replace: true });
      return;
    }

    // If not connected, attempt connect automatically
    if (!connected) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan]);

  // If disconnected and no server info redirect back
  useEffect(() => {
    if (!scan) navigate("/", { replace: true });
  }, [scan, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Remote Control</h1>
          <ConnectionPanel
            connected={connected}
            onConnect={() => connect()}
            onDisconnect={() => disconnect()}
          />
        </header>

        <main>
          <Trackpad socket={socket} />
          <Keyboard socket={socket} />
        </main>

        {error && <div className="mt-4 text-sm text-red-600">Socket error: {error}</div>}
      </div>
    </div>
  );
}