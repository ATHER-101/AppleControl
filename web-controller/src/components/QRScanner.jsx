"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const [scannedResult, setScannedResult] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    scannerRef.current = new QrScanner(
      video,
      (result) => {
        setScannedResult(result.data);
        onScan?.(result.data);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        maxScansPerSecond: 5,
      }
    );

    scannerRef.current
      .start()
      .then(() => setActive(true))
      .catch((err) => {
        console.error("Camera start error:", err);
        setError("Camera access denied or unavailable.");
      });

    return () => {
      scannerRef.current?.stop();
      scannerRef.current = null;
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-80 h-80 rounded-xl overflow-hidden shadow-md">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 border-4 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
      </div>

      <p className="text-gray-600">
        {error
          ? error
          : active
          ? "Scanning QR..."
          : "Starting camera..."}
      </p>

      {scannedResult && (
        <div className="flex flex-col w-80 gap-2">
          <input
            type="text"
            value={scannedResult}
            readOnly
            className="w-full p-2 border border-gray-300 rounded-lg text-center text-lg font-mono"
          />
        </div>
      )}
    </div>
  );
}