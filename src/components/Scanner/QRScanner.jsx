import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { useLanguage } from "../../context/LanguageContext";
import { parseQRData } from "../../utils/qrGenerator";
import { checkInWindowStatus } from "../../utils/timeFormat";
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
  const { event, eventId } = useEvent();
  const { t } = useLanguage();
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
      setScanResult({ success: false, message: t("qrInvalidFormat"), type: "invalid" });
      return;
    }

    // M1: Reject QR codes whose embedded eventId doesn't match the currently
    // loaded event. Only enforced when BOTH sides have an id — legacy QR codes
    // (generated before M1 shipped) don't carry one and should still scan.
    if (qrData.eventId && eventId && qrData.eventId !== eventId) {
      setScanResult({
        success: false,
        message: t("ticketForDifferentEvent"),
        type: "wrong_event",
        qrData,
      });
      return;
    }

    // H5: warn if the scan is outside the event-date window. Rehearsals and
    // teardown happen legitimately, so we confirm rather than block hard.
    const windowStatus = checkInWindowStatus(event);
    if (windowStatus.status === "early" || windowStatus.status === "late") {
      const days = String(Math.abs(windowStatus.daysDiff));
      const key = windowStatus.status === "early" ? "checkInEarlyWarning" : "checkInLateWarning";
      const label = t(key).replace("{days}", days);
      if (!globalThis.confirm(label)) {
        setScanResult({
          success: false,
          message: t("checkInCancelledOutsideWindow"),
          type: "invalid",
        });
        return;
      }
    }

    const ticket = tickets.find((tk) => tk.validationHash === qrData.hash);
    if (!ticket) {
      setScanResult({ success: false, message: t("ticketNotFoundInDb"), type: "not_found", qrData });
      return;
    }

    if (ticket.checkedIn) {
      setScanResult({ success: false, isDuplicate: true, message: t("alreadyCheckedInMessage"), type: "duplicate", ticket });
      return;
    }

    // Race-aware: checkInTicket re-reads fresh storage and rejects if
    // another tab checked the ticket in between our render and this call.
    const result = checkInTicket(ticket.ticketId);
    if (result.ok) {
      setScanResult({ success: true, message: t("checkInSuccessful"), type: "success", ticket: result.ticket });
    } else if (result.reason === "already-checked-in") {
      setScanResult({ success: false, isDuplicate: true, message: t("alreadyCheckedInMessage"), type: "duplicate", ticket: result.ticket });
    } else if (result.reason === "write-failed") {
      setScanResult({ success: false, message: t("checkInSaveFailed"), type: "invalid" });
    } else {
      setScanResult({ success: false, message: t("ticketNotFoundInDb"), type: "not_found", qrData });
    }
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
            <span>{t("stopCamera")}</span>
          </button>
        </div>
      )}

      {/* Permission denied */}
      {permissionDenied && (
        <div className={`glass-clean ${s.permissionError}`}>
          <p>{t("cameraPermissionDenied")}</p>
        </div>
      )}

      {/* Scanner viewport */}
      {isScanning && (
        <div className={`glass-clean ${s.scannerContainer}`}>
          <div id="qr-reader" className={s.scannerViewport} />
          <p className={s.scannerHint}>{t("positionQRCode")}</p>
        </div>
      )}

      {/* Validation result */}
      {scanResult && (
        <ValidationResult result={scanResult} onClose={handleScanAnother} />
      )}

    </div>
  );
};
