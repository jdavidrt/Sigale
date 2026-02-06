import { CreateEvent } from "../components/Event/CreateEvent";
import { useLanguage } from "../context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

export const EditEventPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen px-2 py-4 md:px-6">
      <style>{`
        /* Glass & Density System */
        .glass-clean {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-elevated {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* Typography */
        .text-heading {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.1;
          color: #E2D1B9;
          margin: 0;
        }
        .text-body {
          font-size: 18px;
          font-weight: 400;
          line-height: 1.1;
          color: #BEADFF;
          margin: 0;
        }

        .shadow-floating {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10);
        }
      `}</style>

      {/* Decorative background elements */}
      <div className="fixed top-[700px] left-[50px] w-[160px] h-[160px] rounded-full bg-[#758BFD] opacity-[0.02] pointer-events-none" />
      <div className="fixed top-[200px] right-[-50px] w-[200px] h-[200px] rounded-full bg-[#BEADFF] opacity-[0.03] pointer-events-none" />

      <div className="max-w-2xl mx-auto">
        {/* Page Header - Compact Glass Style */}
        <div className="glass-elevated shadow-floating" style={{ borderRadius: '24px', padding: '6px', marginBottom: '6px' }}>
          <div style={{ padding: '12px 16px', borderRadius: '20px', background: 'rgba(117, 139, 253, 0.08)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #758BFD, #BEADFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faPenToSquare} style={{ color: 'white', fontSize: '14px' }} />
              </div>
              <h1 className="text-heading" style={{ fontSize: '24px' }}>
                {t("editEventTitle")}
              </h1>
            </div>
            <p className="text-body" style={{ fontSize: '14px', opacity: 0.7 }}>
              {t("updateEventDetails")}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <CreateEvent isEditing={true} />
      </div>
    </div>
  );
};
