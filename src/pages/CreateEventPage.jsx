import { CreateEvent } from "../components/Event/CreateEvent";
import { useLanguage } from "../context/LanguageContext";
import s from "./CreateEventPage.module.css";

export const CreateEventPage = () => {
  const { t } = useLanguage();

  return (
    <div>
      <div className={s.header}>
        <h1 className={s.title}>
          <span>✨</span>
          {t("createNewEvent")}
        </h1>
        <p className={s.subtitle}>{t("setupEventDetails")}</p>
      </div>
      <CreateEvent />
    </div>
  );
};
