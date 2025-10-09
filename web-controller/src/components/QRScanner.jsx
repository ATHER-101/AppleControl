// src/components/QRScanner.jsx
import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { decryptQRContent } from "../utils/decrypt";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(
      video,
      (result) => {
        const content = decryptQRContent(result.data);
        if (content) {
          onScan(content);
          scanner.stop();
        } else {
          setError("Invalid QR data");
        }
      },
      { preferredCamera: "environment", highlightScanRegion: true }
    );

    scanner.start()
      .then(() => setActive(true))
      .catch(() => setError("Camera access denied or unavailable."));

    return () => scanner.stop();
  }, [onScan]);

  return (
    <div className="flex flex-col items-center w-full">
      <video ref={videoRef} className="w-[300px] h-[300px] object-cover rounded-xl shadow-md" />
      <p className="mt-2 text-gray-600">
        {error ? error : active ? "Scanning QR..." : "Starting camera..."}
      </p>
    </div>
  );
}