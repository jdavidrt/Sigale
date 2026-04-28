import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Icon + label row used above form inputs throughout the app.
 * Inputs themselves vary (text / two-col / select with chevron) so we
 * intentionally only encapsulate the label row, not the input itself.
 *
 * Relies on the existing global `.label-icon` utility class and accepts
 * the caller's CSS module class for the label text — keeps existing
 * type ramp + spacing intact across forms.
 *
 * @param {object} props
 * @param {object} props.icon       - FontAwesome icon definition
 * @param {string} props.children   - Label text
 * @param {string} props.rowClass   - CSS module class for the row container
 * @param {string} props.textClass  - CSS module class for the label element
 * @param {string} [props.htmlFor]  - Optional `for` attribute to wire to an input id
 */
export const FieldLabel = ({ icon, children, rowClass, textClass, htmlFor }) => (
  <div className={rowClass}>
    <FontAwesomeIcon icon={icon} className="label-icon" />
    <label className={textClass} htmlFor={htmlFor}>{children}</label>
  </div>
);
