import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";
import { ValidationResult } from "./ValidationResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faStop, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import s from "./QRScanner.module.css";
import btn from "../Common/Button.module.css";

const GRANT_KEY       = "sigale-camera-granted";
const wasGranted      = () => localStorage.getItem(GRANT_KEY) === "1";
const markGranted     = () => localStorage.setItem(GRANT_KEY, "1");

const BACK_CAMERA     = { facingMode: { exact: "environment" } };
const BACK_FALLBACK   = { facingMode: "environment" };
const SCAN_CONFIG     = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

export const QRScanner = ({ autoStart = false }) => {
  const { tickets, checkInTicket } = useTickets();
  const [scanResult, setScanResult]       = useState(null);
  const [isScanning, setIsScanning]       = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const scannerRef  = useRef(null);
  const startedRef  = useRef(false);

  // ── Start back camera ──────────────────────────────────────────
  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;

    const qr = new Html5Qrcode("qr-reader");

    const tryStart = async (constraint) => {
      await qr.start(constraint, SCAN_CONFIG, onScanSuccess, onScanError);
      scannerRef.current = qr;
      markGranted();
      setPermissionDenied(false);
      setIsScanning(true);
    };

    try {
      await tryStart(BACK_CAMERA);
    } catch {
      try {
        await tryStart(BACK_FALLBACK);
      } catch (err) {
        scannerRef.current = null;
        const msg = String(err).toLowerCase();
        if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
          setPermissionDenied(true);
        } else {
          console.error("Camera start failed:", err);
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-start if permission was previously granted ────────────
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    if (!wasGranted()) return; // first visit — wait for user tap
    startedRef.current = true;
    startScanner();
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

  // ── Scan handlers ──────────────────────────────────────────────
  const onScanSuccess = (decodedText) => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => { scannerRef.current = null; }).catch(() => {});
    }
    setIsScanning(false);

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
  };

  const onScanError = (error) => {
    if (!String(error).includes("NotFoundException")) console.warn("Scan error:", error);
  };

  const handleStart = () => {
    setScanResult(null);
    startedRef.current = true;
    startScanner();
  };

  const handleStop = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanAnother = () => {
    setScanResult(null);
    startedRef.current = true;
    startScanner();
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

      {/* Permission denied message */}
      {permissionDenied && (
        <div className={`glass-clean ${s.permissionError}`}>
          <p>Camera access was denied. Please allow camera permission in your browser settings and reload the page.</p>
        </div>
      )}

      {/* Scanner Viewport — kept in DOM while scanning so Html5Qrcode has its target */}
      <div style={{ display: isScanning ? "block" : "none" }} className={`glass-clean ${s.scannerContainer}`}>
        <div id="qr-reader" className={s.scannerViewport} />
        <p className={s.scannerHint}>Position the QR code within the frame</p>
      </div>

      {/* Validation Result */}
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
