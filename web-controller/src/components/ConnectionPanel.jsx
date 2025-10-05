export default function ConnectionPanel({ server, setServer, token, setToken, connected, connect }) {
  return (
    <div className="w-full flex flex-col items-center mb-4">
      <input
        value={server}
        onChange={(e) => setServer(e.target.value)}
        placeholder="Server (e.g., http://192.168.1.55:5000)"
        className="w-4/5 p-2 mb-2 border rounded-md"
      />
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Pair token"
        className="w-4/5 p-2 mb-2 border rounded-md"
      />
      <button
        onClick={connect}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
      >
        {connected ? "Reconnect" : "Connect"}
      </button>
      <p className={`mt-2 ${connected ? "text-green-500" : "text-red-500"}`}>
        {connected ? "Connected" : "Disconnected"}
      </p>
    </div>
  );
}