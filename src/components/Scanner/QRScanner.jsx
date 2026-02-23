import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";
import { ValidationResult } from "./ValidationResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStop } from "@fortawesome/free-solid-svg-icons";
import s from "./QRScanner.module.css";
import btn from "../Common/Button.module.css";

const GRANT_KEY   = "sigale-camera-granted";
const markGranted = () => localStorage.setItem(GRANT_KEY, "1");

const SCAN_CONFIG = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

export const QRScanner = ({ autoStart = false }) => {
  const { tickets, checkInTicket } = useTickets();
  const [scanResult, setScanResult]             = useState(null);
  const [isScanning, setIsScanning]             = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const scannerRef = useRef(null);
  const pendingRef = useRef(false);

  // ── Core: start the scanner (div must already be in DOM) ───────
  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;

    const qr = new Html5Qrcode("qr-reader");

    try {
      await qr.start(
        { facingMode: { exact: "environment" } },
        SCAN_CONFIG,
        onScanSuccess,
        onScanError
      );
    } catch {
      try {
        await qr.start(
          { facingMode: "environment" },
          SCAN_CONFIG,
          onScanSuccess,
          onScanError
        );
      } catch (err2) {
        const msg = String(err2).toLowerCase();
        if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
          setPermissionDenied(true);
        } else {
          console.error("Camera start failed:", err2);
        }
        setIsScanning(false);
        return;
      }
    }

    scannerRef.current = qr;
    markGranted();
    setPermissionDenied(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop ───────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try { await scannerRef.current.stop(); } catch { /* ignore */ }
    scannerRef.current = null;
    setIsScanning(false);
  }, []);

  // ── Auto-start on mount — always try immediately ───────────────
  useEffect(() => {
    if (!autoStart) return;
    // Show the viewport div, then start scanner once it's in the DOM
    setIsScanning(true);
    pendingRef.current = true;
  }, [autoStart]);

  // ── When viewport div enters DOM, kick off the scanner ─────────
  useEffect(() => {
    if (isScanning && pendingRef.current && !scannerRef.current) {
      pendingRef.current = false;
      startScanner();
    }
  }, [isScanning, startScanner]);

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

  // ── Restart after showing a result ────────────────────────────
  const handleScanAnother = () => {
    setScanResult(null);
    setIsScanning(true);
    pendingRef.current = true;
  };

  const handleStop = () => stopScanner();

  return (
    <div className={s.root}>

      {/* Stop button — only visible while camera is active */}
      {isScanning && !scanResult && (
        <div className={s.controls}>
          <button onClick={handleStop} className={`${btn.btn} ${btn.danger} ${btn.lg}`}>
            <FontAwesomeIcon icon={faStop} />
            <span>Stop Camera</span>
          </button>
        </div>
      )}

      {/* Permission denied */}
      {permissionDenied && (
        <div className={`glass-clean ${s.permissionError}`}>
          <p>Camera access was denied. Please allow camera permission in your browser settings and reload the page.</p>
        </div>
      )}

      {/* Scanner viewport */}
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

    </div>
  );
};
