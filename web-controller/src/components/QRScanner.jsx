import { useEffect, useRef, useState, useCallback } from "react";
import QrScanner from "qr-scanner";
import { decryptStages } from "../utils/decrypt";

export default function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const [stages, setStages] = useState(null);
  const [lastRaw, setLastRaw] = useState(null);
  const [status, setStatus] = useState("init"); // init | starting | scanning | error | restarting

  /** Start the scanner safely (with retry) */
  const startScanner = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setStatus("starting");
      setError(null);

      // Cleanup old scanner if exists
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.destroy?.();
        scannerRef.current = null;
      }

      // Initialize
      const scanner = new QrScanner(
        video,
        (result) => {
          const raw = result?.data;
          setLastRaw(raw);

          const r = decryptStages(raw);
          setStages(r);

          if (r && !r.error && r.server && r.token) {
            onScan({ server: r.server, token: r.token });
            scanner.stop(); // stop after success
            setActive(false);
            setStatus("done");
          } else {
            setError(r.error || "Invalid QR data");
          }
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          maxScansPerSecond: 5,
        }
      );

      scannerRef.current = scanner;

      await scanner.start();
      setActive(true);
      setStatus("scanning");

      // Listen for unexpected stop (some devices stop streams)
      scanner._active = true;
      const checkActive = setInterval(() => {
        if (!scanner._active && video.readyState < 2) {
          console.warn("⚠️ Scanner stopped unexpectedly — restarting...");
          setStatus("restarting");
          clearInterval(checkActive);
          startScanner(); // auto restart
        }
      }, 3000);

      // Cleanup when unmounting
      return () => clearInterval(checkActive);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or unavailable.");
      setStatus("error");
      setActive(false);
    }
  }, [onScan]);

  /** Stop scanner manually */
  const stopScanner = useCallback(async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.destroy?.();
    } catch (e) {
      console.warn("Stop error:", e);
    } finally {
      setActive(false);
    }
  }, []);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, [startScanner, stopScanner]);

  /** UI helper */
  const renderStageRow = (label, value, mono = false) => (
    <div className="py-1 flex gap-3 items-start">
      <div style={{ width: 140, color: "#9AA4B2", fontSize: 13 }}>{label}</div>
      <div style={{ fontFamily: mono ? "monospace" : "inherit", fontSize: 13, wordBreak: "break-all" }}>
        {value === null || value === undefined ? (
          <span style={{ color: "#777" }}>—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            position: "relative",
          }}
        >
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {status === "restarting" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              Restarting camera…
            </div>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>
            {status === "starting"
              ? "Starting camera..."
              : status === "scanning"
              ? "Scanning QR..."
              : status === "error"
              ? "Camera Error"
              : status === "restarting"
              ? "Restarting..."
              : "Idle"}
          </div>
          <div style={{ color: "#6B7280", fontSize: 13 }}>
            {error ? <span style={{ color: "#E11D48" }}>{error}</span> : "Point camera at the QR shown by the Mac app"}
          </div>
        </div>
      </div>

      {/* --- Debug Info --- */}
      <div style={{ marginTop: 18, background: "#0f1724", color: "#E6EEF3", padding: 12, borderRadius: 8, fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Debug: QR → Decryption Steps</div>

        {renderStageRow("1) Raw QR string", stages?.raw ?? lastRaw ?? "(not scanned yet)", true)}
        {renderStageRow("2) Format valid", stages ? String(stages.hasDot) : "—")}
        {renderStageRow("3) Ciphertext (base64)", stages?.cipherText ? `${stages.cipherText.slice(0, 80)}${stages.cipherText.length > 80 ? "…" : ""}` : "—", true)}
        {renderStageRow("4) IV (base64)", stages?.ivBase64 ?? "—", true)}
        {renderStageRow("5) IV (hex)", stages?.ivHex ?? "—", true)}
        {renderStageRow("6) Key (hex)", stages?.keyHex ? `${stages.keyHex.slice(0, 40)}…` : "—", true)}
        {renderStageRow("7) Decrypted plaintext", stages?.decryptedUtf8 ?? "—")}
        {renderStageRow("8) Parsed JSON", stages?.parsedJSON ? JSON.stringify(stages.parsedJSON, null, 2) : "—", true)}
        {renderStageRow("9) Server URL", stages?.server ?? "—")}
        {renderStageRow("10) Token", stages?.token ?? "—")}
        {stages?.error && (
          <div style={{ marginTop: 8, color: "#FCA5A5", fontWeight: 600 }}>Error: {stages.error}</div>
        )}

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            onClick={() => {
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
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              background: "#0EA5A4",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Copy value
          </button>

          <button
            onClick={() => {
              setStages(null);
              setError(null);
              startScanner();
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              background: "#374151",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Restart Scanner
          </button>
        </div>
      </div>
    </div>
  );
}