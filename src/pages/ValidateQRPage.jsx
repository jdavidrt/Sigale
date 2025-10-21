import { QRScanner } from "../components/Scanner/QRScanner";
import { useLanguage } from "../context/LanguageContext";

export const ValidateQRPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen px-4 md:px-6 py-6">
      {/* Decorative circles */}
      <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.03] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.04] pointer-events-none" />

      {/* Main Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-[#1a1152] to-[#0a0620] rounded-3xl p-6 md:p-8 border border-[#758BFD] border-opacity-20 shadow-2xl">
          {/* Page Title */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎫</span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFEDD8]" style={{ margin: '0' }}>
                {t("checkInValidation")}
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#BEADFF] opacity-80">
              {t("scanQRValidate")}
            </p>
          </div>

          {/* Scanner - Always Active */}
          <div>
            <QRScanner autoStart={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
