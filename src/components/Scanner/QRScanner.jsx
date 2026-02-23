import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";
import { ValidationResult } from "./ValidationResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faStop, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import s from "./QRScanner.module.css";
import btn from "../Common/Button.module.css";

export const QRScanner = ({ autoStart = false }) => {
  const { tickets, checkInTicket } = useTickets();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const scannerRef = useRef(null);
  const permissionCheckedRef = useRef(false);

  useEffect(() => {
    if (autoStart && !permissionCheckedRef.current) {
      permissionCheckedRef.current = true;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          setPermissionGranted(true);
          setIsScanning(true);
        })
        .catch((error) => {
          console.error("Camera permission denied:", error);
          setPermissionGranted(false);
        });
    }
  }, [autoStart]);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );
      scanner.render(onScanSuccess, onScanError);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().then(() => { scannerRef.current = null; }).catch(console.error);
      }
    };
  }, [isScanning]);

  const onScanSuccess = (decodedText) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
      setIsScanning(false);
    }

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
    if (!error.includes("NotFoundException")) console.warn("Scan error:", error);
  };

  const handleStartScanning = () => { setScanResult(null); setIsScanning(true); };
  const handleStopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) scannerRef.current.clear().then(() => { scannerRef.current = null; }).catch(console.error);
  };

  const steps = [
    "Click 'Start Scanning' to activate camera",
    "Position the ticket QR code in frame",
    "System validates and checks in automatically",
    "Duplicates are detected and rejected",
  ];

  return (
    <div className={s.root}>
      {/* Control Buttons */}
      {!autoStart && (
        <div className={s.controls}>
          {!isScanning ? (
            <button onClick={handleStartScanning} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
              <FontAwesomeIcon icon={faCamera} />
              <span>Start Scanning</span>
            </button>
          ) : (
            <button onClick={handleStopScanning} className={`${btn.btn} ${btn.danger} ${btn.lg}`}>
              <FontAwesomeIcon icon={faStop} />
              <span>Stop Scanning</span>
            </button>
          )}
        </div>
      )}

      {/* Scanner Viewport */}
      {isScanning && (
        <div className={`glass-clean ${s.scannerContainer}`}>
          <div id="qr-reader" className={s.scannerViewport} />
          <p className={s.scannerHint}>Position the QR code within the frame</p>
        </div>
      )}

      {/* Validation Result */}
      {scanResult && <ValidationResult result={scanResult} onClose={() => setScanResult(null)} />}

      {/* Instructions Panel */}
      {!isScanning && !scanResult && (
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
