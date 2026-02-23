import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";
import { ValidationResult } from "./ValidationResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faStop, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import s from "./QRScanner.module.css";
import btn from "../Common/Button.module.css";

const GRANT_KEY   = "sigale-camera-granted";
const wasGranted  = () => localStorage.getItem(GRANT_KEY) === "1";
const markGranted = () => localStorage.setItem(GRANT_KEY, "1");

const SCAN_CONFIG = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

export const QRScanner = ({ autoStart = false }) => {
  const { tickets, checkInTicket } = useTickets();
  const [scanResult, setScanResult]         = useState(null);
  const [isScanning, setIsScanning]         = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // scannerRef holds the Html5Qrcode instance
  const scannerRef  = useRef(null);
  // pendingStart: true when we want to start but are waiting for the div to mount
  const pendingRef  = useRef(false);
  const autoInitRef = useRef(false);

  // ── Attempt to start — div must be in the DOM ──────────────────
  const startScanner = useCallback(async () => {
    // If already running, do nothing
    if (scannerRef.current) return;

    // Instantiate — the "qr-reader" div must exist in DOM at this point
    const qr = new Html5Qrcode("qr-reader");

    const tryStart = async (constraint) => {
      await qr.start(constraint, SCAN_CONFIG, onScanSuccess, onScanError);
    };

    try {
      // Try exact back camera first, fall back to preference, then any environment
      await tryStart({ facingMode: { exact: "environment" } });
    } catch {
      try {
        await tryStart({ facingMode: "environment" });
      } catch (err2) {
        const msg = String(err2).toLowerCase();
        if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
          setPermissionDenied(true);
        } else {
          console.error("Camera start failed:", err2);
        }
        return;
      }
    }

    scannerRef.current = qr;
    markGranted();
    setPermissionDenied(false);
    setIsScanning(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop ───────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try { await scannerRef.current.stop(); } catch { /* ignore */ }
    scannerRef.current = null;
    setIsScanning(false);
  }, []);

  // ── When isScanning flips to true the div becomes visible ──────
  // We use an effect that fires after the DOM update
  useEffect(() => {
    if (pendingRef.current && isScanning === false && !scannerRef.current) {
      // "showScanner" state just became true (we're about to render the div),
      // but we need one more render cycle for the div to be in the DOM.
      // Instead, we control this via the "showViewport" state below.
    }
  }, [isScanning]);

  // ── Auto-start on mount if previously granted ──────────────────
  useEffect(() => {
    if (!autoStart || autoInitRef.current) return;
    if (!wasGranted()) return;
    autoInitRef.current = true;
    // Use a short timeout so the component fully mounts and the div is in the DOM
    const t = setTimeout(() => startScanner(), 100);
    return () => clearTimeout(t);
  }, [autoStart, startScanner]);

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  // ── Scan result handlers ───────────────────────────────────────
  function onScanSuccess(decodedText) {
    stopScanner();

    const qrData = parseQRData(decodedText);
    if (!qrData || !qrData.hash) {
      setScanResult({ success: false, message: "Invalid QR code format", type: "invalid" });
      return;
    }

    const ticket = tickets.find((t) => t.validationHash === qrData.hash);
    if (!ticket) {
      setScanResult({ success: false, message: "Ticket not found in database", type: "not_found", qrData });
      return;
    }

    if (ticket.checkedIn) {
      setScanResult({ success: false, isDuplicate: true, message: "This ticket has already been checked in", type: "duplicate", ticket });
      return;
    }

    checkInTicket(ticket.ticketId);
    setScanResult({ success: true, message: "Check-in successful!", type: "success", ticket });
  }

  function onScanError(error) {
    if (!String(error).includes("NotFoundException")) console.warn("Scan error:", error);
  }

  // ── Button handlers ────────────────────────────────────────────
  const handleStart = () => {
    setScanResult(null);
    // Reveal the viewport div first, then start on next tick
    setIsScanning(true);
    pendingRef.current = true;
  };

  // Effect: when isScanning becomes true and we have a pending start,
  // the div is now in the DOM — kick off the scanner
  useEffect(() => {
    if (isScanning && pendingRef.current && !scannerRef.current) {
      pendingRef.current = false;
      startScanner();
    }
  }, [isScanning, startScanner]);

  const handleStop = () => {
    stopScanner();
  };

  const handleScanAnother = () => {
    setScanResult(null);
    setIsScanning(true);
    pendingRef.current = true;
  };

  const steps = [
    "Tap 'Start Scanning' to activate camera",
    "Position the ticket QR code in frame",
    "System validates and checks in automatically",
    "Duplicates are detected and rejected",
  ];

  return (
    <div className={s.root}>

      {/* Control buttons */}
      <div className={s.controls}>
        {!isScanning ? (
          <button onClick={handleStart} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
            <FontAwesomeIcon icon={faCamera} />
            <span>Start Scanning</span>
          </button>
        ) : (
          <button onClick={handleStop} className={`${btn.btn} ${btn.danger} ${btn.lg}`}>
            <FontAwesomeIcon icon={faStop} />
            <span>Stop Scanning</span>
          </button>
        )}
      </div>

      {/* Permission denied */}
      {permissionDenied && (
        <div className={`glass-clean ${s.permissionError}`}>
          <p>Camera access was denied. Please allow camera permission in your browser settings and reload the page.</p>
        </div>
      )}

      {/* Scanner viewport — only mounted when scanning so Html5Qrcode can find the div */}
      {isScanning && (
        <div className={`glass-clean ${s.scannerContainer}`}>
          <div id="qr-reader" className={s.scannerViewport} />
          <p className={s.scannerHint}>Position the QR code within the frame</p>
        </div>
      )}

      {/* Validation result */}
      {scanResult && (
        <ValidationResult result={scanResult} onClose={handleScanAnother} />
      )}

      {/* Instructions */}
      {!isScanning && !scanResult && !permissionDenied && (
        <div className={`glass-clean ${s.instructionsPanel}`}>
          <div className={s.instructionsHeader}>
            <FontAwesomeIcon icon={faInfoCircle} className="color-primary" />
            <h3 className={s.instructionsTitle}>How to Use</h3>
          </div>
          <div className={s.instructionsList}>
            {steps.map((text, i) => (
              <div key={i} className={s.instructionItem}>
                <div className={s.stepNumber}>{i + 1}</div>
                <p className={s.stepText}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
