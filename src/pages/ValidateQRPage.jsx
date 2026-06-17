import { QRScanner } from "../components/Scanner/QRScanner";
import { useLanguage } from "../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import s from "./ValidateQRPage.module.css";

export const ValidateQRPage = () => {
  const { t } = useLanguage();

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={`glass-elevated shadow-floating ${s.mainCard}`}>
          {/* Header */}
          <div className={s.cardHeader}>
            <div className={s.cardHeaderRow}>
              <div className="icon-box">
                <FontAwesomeIcon icon={faQrcode} className="icon-box-icon-lg" />
              </div>
              <h1 className={s.cardTitle}>{t("checkInValidation")}</h1>
            </div>
            <p className={s.cardSubtitle}>{t("scanQRValidate")}</p>
          </div>

          {/* Scanner */}
          <div className={s.scannerArea}>
            <QRScanner autoStart={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
