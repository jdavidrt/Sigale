import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableCells, faTableList } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../../context/LanguageContext";
import s from "./TicketsViewToggle.module.css";

/**
 * Segment control: [Cards | Table]. Caller owns the selected value (we pair
 * it with `useLocalStorageValue` in TicketsPage so the choice persists).
 *
 * @param {object} props
 * @param {"cards"|"table"} props.value
 * @param {(next: "cards"|"table") => void} props.onChange
 */
export const TicketsViewToggle = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className={s.segment} role="group" aria-label="View mode">
      <button
        type="button"
        className={s.option}
        aria-pressed={value === "cards"}
        onClick={() => onChange("cards")}
      >
        <FontAwesomeIcon icon={faTableCells} />
        {t("viewCards")}
      </button>
      <button
        type="button"
        className={s.option}
        aria-pressed={value === "table"}
        onClick={() => onChange("table")}
      >
        <FontAwesomeIcon icon={faTableList} />
        {t("viewTable")}
      </button>
    </div>
  );
};
