import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useTickets } from "../../context/TicketContext";
import { parseQRData } from "../../utils/qrGenerator";
import { ValidationResult } from "./ValidationResult";

export const QRScanner = () => {
  const { tickets, checkInTicket } = useTickets();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

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
        scannerRef.current
          .clear()
          .then(() => {
            scannerRef.current = null;
          })
          .catch((error) => {
            console.error("Error clearing scanner:", error);
          });
      }
    };
  }, [isScanning]);

  const onScanSuccess = (decodedText) => {
    // Stop scanning after successful scan
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
      setIsScanning(false);
    }

    const qrData = parseQRData(decodedText);

    if (!qrData || !qrData.hash) {
      setScanResult({
        success: false,
        message: "Invalid QR code format",
        type: "invalid",
      });
      return;
    }

    const ticket = tickets.find((t) => t.validationHash === qrData.hash);

    if (!ticket) {
      setScanResult({
        success: false,
        message: "Ticket not found in database",
        type: "not_found",
        qrData,
      });
      return;
    }

    if (ticket.checkedIn) {
      setScanResult({
        success: false,
        isDuplicate: true,
        message: "This ticket has already been checked in",
        type: "duplicate",
        ticket,
      });
      return;
    }

    // Valid ticket - check in
    checkInTicket(ticket.ticketId);
    setScanResult({
      success: true,
      message: "Check-in successful!",
      type: "success",
      ticket,
    });
  };

  const onScanError = (error) => {
    // Ignore scan errors (happens frequently during scanning)
    // Only log actual errors, not "No QR code found"
    if (!error.includes("NotFoundException")) {
      console.warn("Scan error:", error);
    }
  };

  const handleStartScanning = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => {
          scannerRef.current = null;
        })
        .catch(console.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <div className="flex gap-4 justify-center">
        {!isScanning ? (
          <button
            onClick={handleStartScanning}
            className="px-6 py-3 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] hover:opacity-90 text-[#FFEDD8] rounded-lg transition-opacity font-bold border border-[#BEADFF] border-opacity-30"
          >
            📷 Start Scanning
          </button>
        ) : (
          <button
            onClick={handleStopScanning}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-[#FFEDD8] rounded-lg transition-colors font-bold"
          >
            ⏹️ Stop Scanning
          </button>
        )}
      </div>

      {/* Scanner Container */}
      {isScanning && (
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#758BFD] border-opacity-30">
          <div id="qr-reader" className="overflow-hidden rounded-lg"></div>
          <p className="text-center text-sm text-[#BEADFF] mt-4">
            Position the QR code within the frame
          </p>
        </div>
      )}

      {/* Validation Result */}
      {scanResult && <ValidationResult result={scanResult} onClose={() => setScanResult(null)} />}

      {/* Instructions */}
      {!isScanning && !scanResult && (
        <div className="bg-[#2a2a2a] rounded-xl p-8 border border-[#758BFD] border-opacity-30">
          <h3 className="text-xl font-bold text-[#FFEDD8] mb-4">📱 How to Use</h3>
          <ol className="space-y-3 text-[#BEADFF]">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#758BFD] bg-opacity-30 text-[#758BFD] rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Click "Start Scanning" to activate the camera</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#758BFD] bg-opacity-30 text-[#758BFD] rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Position the ticket QR code within the scanning frame</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#758BFD] bg-opacity-30 text-[#758BFD] rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                The system will automatically validate and check in the ticket
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#758BFD] bg-opacity-30 text-[#758BFD] rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>Duplicate scans will be detected and rejected</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
