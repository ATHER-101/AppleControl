import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import Overlay from "../components/Overlay";
import ConnectionPanel from "../components/ConnectionPanel";
import { useSocket } from "../hooks/useSocket";

/**
 * ScannerPage:
 * - uses camera to scan QR (JSON)
 * - shows scanned JSON in input
 * - Connect button triggers socket connect
 * - on successful connect -> navigate to /control
 */
export default function ScannerPage() {
    const videoEl = useRef(null);
    const qrBoxEl = useRef(null);
    const scannerRef = useRef(null);
    const [qrOn, setQrOn] = useState(true);
    const [scannedResult, setScannedResult] = useState("");
    const [scanData, setScanData] = useState(null);
    const [scanError, setScanError] = useState(null);

    const navigate = useNavigate();

    // server and token are extracted from scanData
    const serverUrl = scanData ? buildServerUrl(scanData.ip, scanData.port) : null;
    const token = scanData ? scanData.secret : null;

    const { socket, connected, connect, disconnect, error, setError } = useSocket(serverUrl, token);

    // start the QR scanner
    useEffect(() => {
        const video = videoEl.current;
        if (!video) return;

        if (!scannerRef.current) {
            scannerRef.current = new QrScanner(
                video,
                (result) => {
                    // result is QrScanner result object, with .data
                    const text = result?.data ?? "";
                    setScannedResult(text);
                    setScanError(null);

                    // try parse JSON
                    try {
                        const parsed = JSON.parse(text);
                        // basic validation
                        if (parsed.ip && parsed.port && parsed.secret) {
                            setScanData(parsed);
                        } else {
                            setScanData(null);
                        }
                    } catch (e) {
                        setScanData(null);
                        // not JSON, keep raw text
                    }
                },
                {
                    onDecodeError: (err) => {
                        // ignore decode errors to avoid noise
                    },
                    preferredCamera: "environment",
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                    overlay: qrBoxEl.current || undefined,
                }
            );

            scannerRef.current
                .start()
                .then(() => setQrOn(true))
                .catch((err) => {
                    console.error("camera start failed", err);
                    setQrOn(false);
                    setScanError("Camera access blocked or not available");
                });
        }

        return () => {
            scannerRef.current?.stop();
            scannerRef.current = null;
        };
    }, []);

    // When socket connects, redirect to /control
    useEffect(() => {
        if (connected) {
            // navigate to control and pass nothing — control page will read socket via shared hook props.
            navigate("/control");
        }
    }, [connected, navigate]);

    const onConnectClick = () => {
        if (!scanData) {
            setError?.("No valid scan data parsed. Scan must be JSON with ip/port/secret");
            return;
        }
        const serverUrl = `http://${scanData.ip}:${scanData.port}`;
        connect(serverUrl, scanData.secret);
    };

    const onDisconnectClick = () => {
        disconnect();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-xl font-semibold mb-3">Scan to Connect</h2>

                <div className="relative w-full pb-[56%] overflow-hidden rounded-lg bg-black">
                    <video ref={videoEl} className="absolute top-0 left-0 w-full h-full object-cover" />
                    <div ref={qrBoxEl}><Overlay /></div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Scanned Data</label>
                    <input
                        type="text"
                        value={scannedResult}
                        readOnly
                        className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                    {scanData ? (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                            <div><strong>IP:</strong> {scanData.ip}</div>
                            <div><strong>Port:</strong> {scanData.port}</div>
                            <div><strong>Secret:</strong> {scanData.secret}</div>
                        </div>
                    ) : (
                        <div className="mt-2 text-xs text-gray-500">Scan must be JSON with `ip`, `port`, `secret` to enable Connect.</div>
                    )}
                </div>

                <ConnectionPanel
                    connected={connected}
                    onConnect={onConnectClick}
                    onDisconnect={onDisconnectClick}
                />

                {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
                {scanError && <div className="mt-3 text-sm text-red-600">{scanError}</div>}
            </div>
        </div>
    );
}

// helper: build server url
function buildServerUrl(ip, port) {
    if (!ip) return null;
    const p = port || 3000;
    // prefer http protocol for socket.io
    return `http://${ip}:${p}`;
}