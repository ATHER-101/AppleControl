// src/components/QRScanner.jsx
import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { decryptStages } from "../utils/decrypt";

/**
 * QRScanner component
 * - scans QR codes via camera (qr-scanner)
 * - shows step-by-step decryption/debug info on-screen
 * - calls onScan({ server, token }) when decryption and parsing succeed
 *
 * Usage:
 * <QRScanner onScan={({server, token}) => { ... }} />
 */

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const [stages, setStages] = useState(null); // will hold the decryptStages output
  const [lastRaw, setLastRaw] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    scannerRef.current = new QrScanner(
      video,
      (result) => {
        // result.data is the string content from QR
        const raw = result?.data;
        setLastRaw(raw);

        // Decrypt step-by-step. Uses VITE_ENCRYPTION_KEY from env inside decryptStages
        const r = decryptStages(raw);
        setStages(r);

        if (r && !r.error && r.server && r.token) {
          // success — notify parent
          onScan({ server: r.server, token: r.token });
          // stop the scanner to prevent repeat scans
          scannerRef.current.stop();
        } else {
          setError(r.error || "Invalid QR data");
        }
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        // optional: specify maxScansPerSecond: 5
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

  const renderStageRow = (label, value, monospace = false) => (
    <div className="py-1 flex gap-3 items-start">
      <div style={{ width: 140, color: "#9AA4B2", fontSize: 13 }}>{label}</div>
      <div style={{ fontFamily: monospace ? "monospace" : "inherit", fontSize: 13, wordBreak: "break-all" }}>
        {value === null || value === undefined ? <span style={{ color: "#777" }}>—</span> : value}
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 320, height: 320, borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>
            {active ? "Scanning QR..." : "Starting camera..."}
          </div>
          <div style={{ color: "#6B7280", fontSize: 13 }}>
            {error ? <span style={{ color: "#E11D48" }}>{error}</span> : "Point camera at the QR shown by the Mac app"}
          </div>
        </div>
      </div>

      {/* --- Step-by-step debug panel --- */}
      <div style={{ marginTop: 18, background: "#0f1724", color: "#E6EEF3", padding: 12, borderRadius: 8, fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Debug: QR → Decryption Steps</div>

        {renderStageRow("1) Raw QR string", stages?.raw ?? lastRaw ?? "(not scanned yet)", true)}
        {renderStageRow("2) Format valid (has '.')", stages ? String(stages.hasDot) : "—")}
        {renderStageRow("3) Ciphertext (base64)", stages?.cipherText ? `${stages.cipherText.slice(0, 80)}${stages.cipherText.length > 80 ? "…" : ""}` : "—", true)}
        {renderStageRow("4) IV (base64)", stages?.ivBase64 ?? "—", true)}
        {renderStageRow("5) IV (hex)", stages?.ivHex ?? "—", true)}
        {renderStageRow("6) Key (hex, debug only)", stages?.keyHex ? `${stages.keyHex.slice(0, 40)}${stages.keyHex.length > 40 ? "…" : ""}` : "—", true)}
        {renderStageRow("7) Decrypted plaintext (utf8)", stages?.decryptedUtf8 ?? "—")}
        {renderStageRow("8) Parsed JSON", stages?.parsedJSON ? JSON.stringify(stages.parsedJSON, null, 2) : "—", true)}
        {renderStageRow("9) Server URL", stages?.server ?? "—")}
        {renderStageRow("10) Token", stages?.token ?? "—")}
        {stages?.error && (
          <div style={{ marginTop: 8, color: "#FCA5A5", fontWeight: 600 }}>
            Error: {stages.error}
          </div>
        )}

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              // copy final server:token if available
              if (stages?.server && stages?.token) {
                navigator.clipboard?.writeText(`${stages.server}|${stages.token}`);
                alert("Copied server|token to clipboard");
              } else if (stages?.raw) {
                navigator.clipboard?.writeText(stages.raw);
                alert("Copied raw QR value to clipboard");
              } else {
                alert("Nothing to copy yet");
              }
            }}
            style={{ padding: "8px 12px", borderRadius: 6, background: "#0EA5A4", color: "white", border: "none", cursor: "pointer" }}
          >
            Copy useful value
          </button>

          <button
            onClick={() => {
              // if there was a failure due to decryption, allow manual retry
              setStages(null);
              setError(null);
              scannerRef.current?.start().catch(() => {});
            }}
            style={{ padding: "8px 12px", borderRadius: 6, background: "#374151", color: "white", border: "none", cursor: "pointer" }}
          >
            Reset / Retry
          </button>
        </div>
      </div>
    </div>
  );
}