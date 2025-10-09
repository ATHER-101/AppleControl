// src/components/QRScanner.jsx
import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { decryptQRContent } from "../utils/decrypt";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const [lastRaw, setLastRaw] = useState(null);
  const [decoded, setDecoded] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    scannerRef.current = new QrScanner(video, (result) => {
      const raw = result.data;
      setLastRaw(raw);

      const content = decryptQRContent(raw);
      setDecoded(content);

      if (content) {
        onScan(content);
        scannerRef.current.stop();
      } else {
        setError("Invalid QR data");
      }
    }, { preferredCamera: "environment", highlightScanRegion: true });

    scannerRef.current.start()
      .then(() => setActive(true))
      .catch(() => setError("Camera access denied or unavailable."));

    return () => scannerRef.current?.stop();
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-2">
      <video ref={videoRef} className="w-[300px] h-[300px] object-cover rounded-xl shadow-md" />
      <p>{error ? error : active ? "Scanning QR..." : "Starting camera..."}</p>
      <pre style={{ fontSize: 12, background: "#111", color: "#0f0", padding: 8, borderRadius: 6, overflowX: "auto" }}>
        <div>Raw: {lastRaw}</div>
        <div>Decoded: {decoded ? JSON.stringify(decoded, null, 2) : "—"}</div>
      </pre>
    </div>
  );
}