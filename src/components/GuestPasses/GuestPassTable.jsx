import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaste, faCircleCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../../context/LanguageContext";
import { parseTicketRows } from "../../utils/ticketPasteParser";
import { guestPasses } from "../../api/guestPasses";
import { GuestPassTableRow } from "./GuestPassTableRow";
import s from "./GuestPassTable.module.css";
import btn from "../Common/Button.module.css";

const TYPES = ["artist", "crew", "courtesy"];
const TYPE_LABEL_KEY = {
  artist: "guestPassTypeArtist",
  crew: "guestPassTypeCrew",
  courtesy: "guestPassTypeCourtesy",
};

/**
 * Editable spreadsheet view of guest passes with paste-to-add support.
 *
 * Paste flow:
 *   1. Organizer picks a default band + type in the toolbar.
 *   2. Clicks "Pegar lista" -> reads clipboard text.
 *   3. parseTicketRows() splits each line into {name, id} (same generic
 *      extractor the ticket table uses — TSV-aware, handles "C.C." /
 *      "Nombre:" prefixes).
 *   4. The parsed rows are bulk-inserted under the chosen band + type via
 *      POST /api/admin/guest-passes/bulk.
 */
export const GuestPassTable = ({ eventId, rows, bandOptions, onChanged }) => {
  const { t } = useLanguage();

  const [defaultBand, setDefaultBand] = useState(() => bandOptions[0] ?? "");
  const [defaultType, setDefaultType] = useState("artist");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null); // { tone: 'success'|'error', text }

  // Keep the default-band select in sync if the event's lineup changes
  // while the table is mounted.
  if (defaultBand && bandOptions.length > 0 && !bandOptions.includes(defaultBand) && bandOptions[0]) {
    setDefaultBand(bandOptions[0]);
  }

  const showBanner = (tone, text) => {
    setBanner({ tone, text });
    setTimeout(() => setBanner(null), 6000);
  };

  const handlePaste = async () => {
    if (!defaultBand.trim()) {
      showBanner("error", t("selectBandFirst"));
      return;
    }

    let text;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      showBanner("error", t("pasteFailed"));
      return;
    }

    const parsed = parseTicketRows(text);
    if (parsed.length === 0) {
      showBanner("error", t("pasteEmpty"));
      return;
    }

    const totalCandidateRows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean).length;
    const ignoredRows = Math.max(0, totalCandidateRows - parsed.length);

    setBusy(true);
    try {
      const result = await guestPasses.bulkCreate({
        eventId,
        band: defaultBand.trim(),
        type: defaultType,
        entries: parsed.map(({ name, id }) => ({ holderName: name, holderIdNumber: id })),
      });
      const parts = [t("pasteResultAdded").replace("{n}", result.inserted)];
      if (ignoredRows > 0) parts.push(t("pasteResultIgnored").replace("{n}", ignoredRows));
      showBanner("success", parts.join(" · "));
      onChanged();
    } catch (err) {
      showBanner("error", err.message || t("pasteFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`glass-elevated ${s.panel}`}>
      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarLeft}>
          <div className={s.picker}>
            <label className={s.pickerLabel} htmlFor="default-band-select">{t("guestPassBand")}</label>
            {bandOptions.length > 0 ? (
              <select
                id="default-band-select"
                className={s.pickerSelect}
                value={defaultBand}
                onChange={(e) => setDefaultBand(e.target.value)}
              >
                {bandOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            ) : (
              <input
                id="default-band-select"
                className={s.pickerInput}
                type="text"
                value={defaultBand}
                onChange={(e) => setDefaultBand(e.target.value)}
                maxLength={160}
              />
            )}
          </div>
          <div className={s.picker}>
            <label className={s.pickerLabel} htmlFor="default-type-select">{t("guestPassType")}</label>
            <select
              id="default-type-select"
              className={s.pickerSelect}
              value={defaultType}
              onChange={(e) => setDefaultType(e.target.value)}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>{t(TYPE_LABEL_KEY[type])}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={s.toolbarRight}>
          <button
            type="button"
            onClick={handlePaste}
            disabled={busy || !defaultBand.trim()}
            className={`${btn.btn} ${btn.primary} ${btn.md}`}
          >
            <FontAwesomeIcon icon={faPaste} />
            {busy ? "…" : t("pasteGuestPasses")}
          </button>
        </div>
      </div>

      <p className={s.hint}>{t("pasteGuestPassesHint")}</p>

      {/* Result banner */}
      {banner && (
        <div className={s.resultBanner} data-tone={banner.tone} role="status">
          <FontAwesomeIcon icon={banner.tone === "success" ? faCircleCheck : faTriangleExclamation} />
          <span>{banner.text}</span>
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className={s.empty}>{t("noGuestPasses")}</div>
      ) : (
        <div className={s.scrollWrap}>
          <div className={s.table} role="table">
            <div className={s.headerCell} aria-hidden="true"></div>
            <div className={s.headerCell}>{t("guestPassBand")}</div>
            <div className={s.headerCell}>{t("guestPassHolderName")}</div>
            <div className={s.headerCell}>{t("guestPassHolderId")}</div>
            <div className={s.headerCell}>{t("guestPassType")}</div>
            <div className={s.headerCell}>{t("colActions")}</div>

            {rows.map((pass) => (
              <GuestPassTableRow key={pass.id} pass={pass} bandOptions={bandOptions} onChanged={onChanged} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
