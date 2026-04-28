import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import s from "./StatCell.module.css";

/**
 * Labeled stat cell for dashboard summary grids.
 *
 * @param {object}   props
 * @param {object}   props.icon          - FontAwesome icon definition
 * @param {string}   props.label         - Caption above the value
 * @param {React.ReactNode} props.value  - The numeric/text value to display
 * @param {string}   [props.subtext]     - Optional small line below the value
 * @param {"primary"|"success"|"secondary"} [props.variant="primary"] -
 *   Color applied to both the icon and the value
 */
export const StatCell = ({ icon, label, value, subtext, variant = "primary" }) => (
  <div className={s.statCell}>
    <div className={s.statIconRow}>
      <FontAwesomeIcon icon={icon} className={`${s.statIcon} ${s[`statIcon--${variant}`]}`} />
      <p className={s.statLabel}>{label}</p>
    </div>
    <p className={`${s.statValue} ${s[`statValue--${variant}`]}`}>{value}</p>
    {subtext && <p className={s.statSubtext}>{subtext}</p>}
  </div>
);
