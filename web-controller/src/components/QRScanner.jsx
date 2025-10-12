import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import Overlay from "./Overlay";

const TicketVerifier = () => {
  const scanner = useRef(null);
  const videoEl = useRef(null);
  const qrBoxEl = useRef(null);

  const [qrOn, setQrOn] = useState(true);
  const [scannedResult, setScannedResult] = useState("");

  const onScanSuccess = (result) => {
    setScannedResult(result?.data || "");
    setVerificationResult(null);
  };

  const onScanFail = (err) => {
    console.warn(err);
  };

  useEffect(() => {
    const videoElement = videoEl.current;

    if (videoElement && !scanner.current) {
      scanner.current = new QrScanner(videoElement, onScanSuccess, {
        onDecodeError: onScanFail,
        preferredCamera: "environment",
        highlightScanRegion: false,
        highlightCodeOutline: false,
        overlay: qrBoxEl.current || undefined,
      });

      scanner.current
        .start()
        .then(() => setQrOn(true))
        .catch(() => setQrOn(false));
    }

    return () => {
      scanner.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!qrOn) {
      alert("Camera access blocked. Please allow it in browser settings.");
    }
  }, [qrOn]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
        {/* QR Scanner Box */}
        <div
          className="relative w-full pb-[100%] overflow-hidden rounded-lg bg-black"
        >
          <video
            ref={videoEl}
            className="absolute top-0 left-0 w-full h-full object-cover"
          ></video>
          <Overlay />
        </div>

        {/* Scanned Data */}
        {scannedResult && (
          <>
            <input
              type="text"
              value={scannedResult}
              readOnly
              className="mt-4 w-full border border-gray-300 rounded-lg p-2 text-lg"
            />
            <button
              onClick={verifyTicket}
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Verify Ticket
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketVerifier;