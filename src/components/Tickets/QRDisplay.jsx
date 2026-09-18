import { useRef, useCallback, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copySVGToClipboard, copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { generateTicketSVG, getEventFlyerDataURL } from "../../utils/svgTicketTemplate";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faImage, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import s from "./QRDisplay.module.css";

export const QRDisplay = ({ ticket, event, showActions = true, compact = false }) => {
  const qrRef = useRef(null);
  const ticketPreviewRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [ticketSVG, setTicketSVG] = useState("");
  const { t, language } = useLanguage();
  const qrData = generateQRData(ticket);

  useEffect(() => {
    const generatePreview = async () => {
      if (qrData && qrRef.current) {
        const svg = qrRef.current.querySelector("svg");
        if (svg) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const qrDataURL = canvas.toDataURL("image/png");
            const flyerDataURL = await getEventFlyerDataURL(event);
            setTicketSVG(generateTicketSVG(ticket, event, qrDataURL, { flyerDataURL }));
          };

          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          img.src = URL.createObjectURL(svgBlob);
        }
      }
    };

    generatePreview();
  }, [ticket, event, qrData]);

  const copyAsSVG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copySVGToClipboard(svg, ticket, event);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [ticket, event, t]);

  const copyAsPNG = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await copyPNGToClipboard(svg, ticket, event);
      setCopyStatus(success ? `✓ ${t("copiedToClipboard")}` : "✗ Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  }, [ticket, event, t]);

  const handleShare = useCallback(async () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector("svg");
      const success = await shareQR(svg, ticket, event, language);
      if (!success) {
        setCopyStatus("Share not supported");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    }
  }, [ticket, event, language]);

  return (
    <div className={s.root}>
      {/* Hidden QR for processing — only rendered once a validationHash exists
          (non-confirmed tickets have none, so we never emit an unscannable QR) */}
      {qrData && (
        <div ref={qrRef} className="hidden">
          <QRCodeSVG value={qrData} size={200} level="M" marginSize={2} />
        </div>
      )}

      {/* Ticket Preview — hidden in compact mode. The hidden QR above is still
          rendered, so Copy/Share (which rebuild the full ticket from it) work
          exactly the same; only this large visible image is dropped. */}
      {!compact && ticketSVG && (
        <div
          ref={ticketPreviewRef}
          className={s.preview}
          dangerouslySetInnerHTML={{ __html: ticketSVG }}
        />
      )}

      {/* Action Buttons */}
      {showActions && (
        <div>
          <div className={s.actionsRow}>
            {[
              { icon: faFile, label: "Copy SVG", onClick: copyAsSVG },
              { icon: faImage, label: "Copy PNG", onClick: copyAsPNG },
              { icon: faShareNodes, label: t("share"), onClick: handleShare },
            ].map(({ icon, label, onClick }) => (
              <button key={label} onClick={onClick} className={s.actionBtn}>
                <FontAwesomeIcon icon={icon} />
                {label}
              </button>
            ))}
          </div>

          {copyStatus && <p className={s.copyStatus}>{copyStatus}</p>}
        </div>
      )}
    </div>
  );
};
