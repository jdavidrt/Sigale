import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";
import { ValidationResult } from "./ValidationResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faStop, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

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
          stream.getTracks().forEach(track => track.stop());
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
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Control Buttons */}
      {!autoStart && (
        <div className="flex gap-2 justify-center">
          {!isScanning ? (
            <button
              onClick={handleStartScanning}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-white rounded-xl font-bold shadow-lg"
            >
              <FontAwesomeIcon icon={faCamera} />
              <span>Start Scanning</span>
            </button>
          ) : (
            <button
              onClick={handleStopScanning}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold"
            >
              <FontAwesomeIcon icon={faStop} />
              <span>Stop Scanning</span>
            </button>
          )}
        </div>
      )}

      {/* Scanner Container - Super Clean */}
      {isScanning && (
        <div className="glass-clean" style={{ borderRadius: '20px', padding: '6px', overflow: 'hidden' }}>
          <div id="qr-reader" style={{ borderRadius: '16px', overflow: 'hidden', border: 'none' }}></div>
          <div style={{ padding: '8px', textAlign: 'center' }}>
            <p className="text-label" style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>
              Position the QR code within the frame
            </p>
          </div>
        </div>
      )}

      {/* Validation Result - In Modal or Overlay Pattern */}
      {scanResult && <ValidationResult result={scanResult} onClose={() => setScanResult(null)} />}

      {/* High-Density Instructions Overlay-style */}
      {!isScanning && !scanResult && (
        <div className="glass-clean" style={{ borderRadius: '20px', padding: '12px' }}>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faInfoCircle} className="color-primary" style={{ fontSize: '14px' }} />
            <h3 className="text-label" style={{ opacity: 1, margin: 0, fontSize: '14px' }}>📱 How to Use</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              "Click 'Start Scanning' to activate camera",
              "Position the ticket QR code in frame",
              "System validates and checks in automatically",
              "Duplicates are detected and rejected"
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '5px', background: 'rgba(117,139,253,0.1)', color: '#758BFD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <p className="text-body" style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
