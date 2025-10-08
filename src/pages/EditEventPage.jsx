import { CreateEvent } from "../components/Event/CreateEvent";
import { useLanguage } from "../context/LanguageContext";

export const EditEventPage = () => {
  const { t } = useLanguage();

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <span>✏️</span>
          {t("editEventTitle")}
        </h1>
        <p className="text-gray-600">{t("updateEventDetails")}</p>
      </div>
      <CreateEvent isEditing={true} />
    </div>
  );
};
