// src/components/ConnectionPanel.jsx
export default function ConnectionPanel({ connected, onConnect, onDisconnect }) {
  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      {!connected ? (
        <button
          onClick={onConnect}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
        >
          Connect
        </button>
      ) : (
        <button
          onClick={onDisconnect}
          className="px-5 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700"
        >
          Disconnect
        </button>
      )}
      <p className={`text-sm ${connected ? "text-green-500" : "text-red-500"}`}>
        {connected ? "Connected" : "Disconnected"}
      </p>
    </div>
  );
}