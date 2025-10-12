import { useEffect, useState } from "react";
import { useSocket } from "./hooks/useSocket";
// import QRScanner from "./components/QRScanner";
import Trackpad from "./components/Trackpad";
import Keyboard from "./components/Keyboard";
import ConnectionPanel from "./components/ConnectionPanel";
import TicketVerifier from "./components/QRScanner";

// 🧠 Log Collector (works on mobile)
// function useScreenLogs() {
//   const [logs, setLogs] = useState([]);

//   useEffect(() => {
//     const addLog = (type, ...args) => {
//       const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
//       setLogs(prev => [...prev.slice(-50), `[${type}] ${msg}`]);
//     };

//     const origLog = console.log;
//     const origErr = console.error;

//     console.log = (...args) => {
//       origLog(...args);
//       addLog("LOG", ...args);
//     };

//     console.error = (...args) => {
//       origErr(...args);
//       addLog("ERR", ...args);
//     };

//     return () => {
//       console.log = origLog;
//       console.error = origErr;
//     };
//   }, []);

//   return logs;
// }

// export default function App() {
//   const [server, setServer] = useState(null);
//   const [token, setToken] = useState(null);
//   const [mode, setMode] = useState("scan");
//   const [view, setView] = useState("trackpad");
//   const [showLogs, setShowLogs] = useState(true);

//   const { socket, connected, connect, error, setError } = useSocket(server, token);
//   const logs = useScreenLogs();

//   const handleScan = ({ server, token }) => {
//     console.log("📡 Scanned QR:", { server, token });
//     setServer(server);
//     setToken(token);
//     setMode("control");
//   };

//   const handleConnect = () => {
//     console.log("🔗 Connecting to", server);
//     setError(null);
//     connect();
//   };

//   const handleDisconnect = () => {
//     console.log("❌ Disconnecting...");
//     socket?.disconnect();
//   };

//   if (mode === "scan") {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen text-center">
//         <h1 className="text-2xl font-semibold mb-6">Scan to Connect</h1>
//         <QRScanner onScan={handleScan} />

//         {showLogs && (
//           <div className="fixed bottom-2 w-full max-h-48 overflow-auto bg-black/70 text-green-400 text-xs p-2 rounded-t-lg font-mono">
//             {logs.map((l, i) => (
//               <div key={i}>{l}</div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col items-center justify-start min-h-screen p-4">
//       <h2 className="text-xl font-semibold mb-2">Remote Controller</h2>

//       <ConnectionPanel
//         connected={connected}
//         onConnect={handleConnect}
//         onDisconnect={handleDisconnect}
//       />

//       {error && <p className="text-red-500 text-sm">{error}</p>}

//       {connected ? (
//         <>
//           <div className="mt-4 flex gap-2">
//             <button
//               onClick={() => setView("trackpad")}
//               className={`px-4 py-2 rounded-xl ${
//                 view === "trackpad" ? "bg-blue-600 text-white" : "bg-gray-200"
//               }`}
//             >
//               Trackpad
//             </button>
//             <button
//               onClick={() => setView("keyboard")}
//               className={`px-4 py-2 rounded-xl ${
//                 view === "keyboard" ? "bg-blue-600 text-white" : "bg-gray-200"
//               }`}
//             >
//               Keyboard
//             </button>
//           </div>

//           {view === "trackpad" && <Trackpad socket={socket} />}
//           {view === "keyboard" && <Keyboard socket={socket} />}
//         </>
//       ) : (
//         <p className="text-gray-500 mt-4">Not connected.</p>
//       )}

//       {/* 🧰 Toggle Logs */}
//       <button
//         onClick={() => setShowLogs(!showLogs)}
//         className="fixed bottom-2 right-2 bg-gray-800 text-white px-3 py-1 rounded-lg text-xs"
//       >
//         {showLogs ? "Hide Logs" : "Show Logs"}
//       </button>

//       {showLogs && (
//         <div className="fixed bottom-10 w-full max-h-48 overflow-auto bg-black/70 text-green-400 text-xs p-2 rounded-t-lg font-mono">
//           {logs.map((l, i) => (
//             <div key={i}>{l}</div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import React from 'react'

function App() {
  return (
    <TicketVerifier/>
  )
}

export default App