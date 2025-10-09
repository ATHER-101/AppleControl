import { useState } from "react";
import { useSocket } from "./hooks/useSocket";
import Trackpad from "./components/Trackpad";
import ConnectionPanel from "./components/ConnectionPanel";
import Keyboard from "./components/Keyboard";

export default function App() {
  const [server, setServer] = useState("http://10.200.247.173:3000");
  const [token, setToken] = useState("dev-token");

  const { socket, connected, connect } = useSocket(server, token);

  return (
    <div className="flex flex-col items-center font-sans p-4">
      <h2 className="text-xl font-semibold mb-4">Mac Remote Controller</h2>

      <ConnectionPanel
        server={server}
        setServer={setServer}
        token={token}
        setToken={setToken}
        connected={connected}
        connect={connect}
      />

      <Trackpad socket={socket} />

      <Keyboard socket={socket} />
    </div>
  );
}