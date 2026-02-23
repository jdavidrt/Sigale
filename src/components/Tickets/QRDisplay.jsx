import { useRef, useCallback, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRData } from "../../utils/qrGenerator";
import { copySVGToClipboard, copyPNGToClipboard, shareQR } from "../../utils/qrCopy";
import { generateTicketSVG } from "../../utils/svgTicketTemplate";
import { useLanguage } from "../../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faImage, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import s from "./QRDisplay.module.css";

export const QRDisplay = ({ ticket, event, showActions = true }) => {
  const qrRef = useRef(null);
  const ticketPreviewRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [ticketSVG, setTicketSVG] = useState("");
  const { t, language } = useLanguage();
  const qrData = generateQRData(ticket, event);

  useEffect(() => {
    const generatePreview = async () => {
      if (qrRef.current) {
        const svg = qrRef.current.querySelector("svg");
        if (svg) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const qrDataURL = canvas.toDataURL("image/png");
            setTicketSVG(generateTicketSVG(ticket, event, qrDataURL));
          };

          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          img.src = URL.createObjectURL(svgBlob);
        }
      }
    };

    generatePreview();
  }, [ticket, event]);

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
      {/* Hidden QR for processing */}
      <div ref={qrRef} style={{ display: "none" }}>
        <QRCodeSVG value={qrData} size={200} level="L" marginSize={2} />
      </div>

      {/* Ticket Preview */}
      {ticketSVG && (
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
            <button onClick={copyAsSVG} className={s.actionBtn}>
              <FontAwesomeIcon icon={faFile} />
              Copy SVG
            </button>
            <button onClick={copyAsPNG} className={s.actionBtn}>
              <FontAwesomeIcon icon={faImage} />
              Copy PNG
            </button>
            <button onClick={handleShare} className={s.actionBtn}>
              <FontAwesomeIcon icon={faShareNodes} />
              {t("share")}
            </button>
          </div>

          {copyStatus && <p className={s.copyStatus}>{copyStatus}</p>}
        </div>
      )}
    </div>
  );
};
