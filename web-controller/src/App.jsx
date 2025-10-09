// src/App.jsx
import { useState } from "react";
import { useSocket } from "./hooks/useSocket";
import QRScanner from "./components/QRScanner";
import Trackpad from "./components/Trackpad";
import Keyboard from "./components/Keyboard";
import ConnectionPanel from "./components/ConnectionPanel";

export default function App() {
  const [server, setServer] = useState(null);
  const [token, setToken] = useState(null);
  const [mode, setMode] = useState("scan");
  const [view, setView] = useState("trackpad");

  const { socket, connected, connect, error, setError } = useSocket(server, token);

  const handleScan = ({ server, token }) => {
    setServer(server);
    setToken(token);
    setMode("control");
  };

  const handleConnect = () => {
    setError(null);
    connect();
  };

  const handleDisconnect = () => socket?.disconnect();

  if (mode === "scan") {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-semibold mb-6">Scan to Connect</h1>
        <QRScanner onScan={handleScan} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4">
      <h2 className="text-xl font-semibold mb-2">Remote Controller</h2>

      <ConnectionPanel
        connected={connected}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {connected ? (
        <>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setView("trackpad")}
              className={`px-4 py-2 rounded-xl ${
                view === "trackpad" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              Trackpad
            </button>
            <button
              onClick={() => setView("keyboard")}
              className={`px-4 py-2 rounded-xl ${
                view === "keyboard" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              Keyboard
            </button>
          </div>

          {view === "trackpad" && <Trackpad socket={socket} />}
          {view === "keyboard" && <Keyboard socket={socket} />}
        </>
      ) : (
        <p className="text-gray-500 mt-4">Not connected.</p>
      )}
    </div>
  );
}