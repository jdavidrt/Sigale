import s from "./EmptyStateCard.module.css";

/**
 * Page-level empty state — a glassy card centered in its container.
 * Use for "no event yet", "no tickets matching filter", etc.
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon       - Emoji string or FontAwesomeIcon element
 * @param {string}          props.title
 * @param {string}          props.description
 * @param {string}          [props.className] - Extra class for the card (e.g. opacity tweaks)
 */
export const EmptyStateCard = ({ icon, title, description, className = "" }) => (
  <div className={s.wrap}>
    <div className={`glass-elevated shadow-floating ${s.card} ${className}`}>
      <span className={s.icon}>{icon}</span>
      <h2 className={`text-heading ${s.title}`}>{title}</h2>
      <p className={`text-body ${s.description}`}>{description}</p>
    </div>
  </div>
);
