import { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faPlus, faTriangleExclamation, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useLanguage } from "../context/LanguageContext";
import { useDialog } from "../context/DialogContext";
import { guestPasses } from "../api/guestPasses";
import { GuestPassTable } from "../components/GuestPasses/GuestPassTable";
import { GuestPassCard } from "../components/GuestPasses/GuestPassCard";
import { TicketsViewToggle } from "../components/Tickets/TicketsViewToggle";
import { EmptyStateCard } from "../components/ui/EmptyStateCard";
import { useLocalStorageValue } from "../hooks/useLocalStorageValue";
import s from "./GuestPassesPage.module.css";
import btn from "../components/Common/Button.module.css";

const TYPES = ["artist", "crew", "courtesy"];
const TYPE_LABEL_KEY = {
  artist: "guestPassTypeArtist",
  crew: "guestPassTypeCrew",
  courtesy: "guestPassTypeCourtesy",
};

/** Single-entry add/edit form, rendered inside the shared Modal via
    openCustom. Pass `pass` to edit an existing guest pass in place. */
const GuestPassForm = ({ eventId, bandOptions, pass = null, onSaved, onCancel }) => {
  const { t } = useLanguage();
  const { notify } = useDialog();

  const [band, setBand] = useState(pass?.band ?? (bandOptions[0] ?? ""));
  const [holderName, setHolderName] = useState(pass?.holderName ?? "");
  const [holderIdNumber, setHolderIdNumber] = useState(pass?.holderIdNumber ?? "");
  const [type, setType] = useState(pass?.type ?? "artist");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!band.trim() || !holderName.trim() || !holderIdNumber.trim()) {
      setError(t("guestPassNameInvalid"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        band: band.trim(),
        holderName: holderName.trim(),
        holderIdNumber: holderIdNumber.trim(),
        type,
      };
      if (pass) {
        await guestPasses.update(pass.id, payload);
        notify({ message: t("guestPassUpdatedToast"), tone: "success" });
      } else {
        await guestPasses.create({ eventId, ...payload });
        notify({ message: t("guestPassAdded"), tone: "success" });
      }
      onSaved();
    } catch (err) {
      setError(err.message || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className={s.formTitle}>{pass ? t("editGuestPassTitle") : t("addArtistBtn")}</h2>

      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="gp-band">{t("guestPassBand")}</label>
        {bandOptions.length > 0 ? (
          <select id="gp-band" value={band} onChange={(e) => setBand(e.target.value)}>
            {!bandOptions.includes(band) && <option value={band}>{band}</option>}
            {bandOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        ) : (
          <input id="gp-band" type="text" value={band} onChange={(e) => setBand(e.target.value)} maxLength={160} />
        )}
      </div>

      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="gp-name">{t("guestPassHolderName")}</label>
        <input
          id="gp-name"
          type="text"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          maxLength={160}
        />
      </div>

      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="gp-id">{t("guestPassHolderId")}</label>
        <input
          id="gp-id"
          type="text"
          value={holderIdNumber}
          onChange={(e) => setHolderIdNumber(e.target.value)}
          maxLength={40}
        />
      </div>

      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="gp-type">{t("guestPassType")}</label>
        <select id="gp-type" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((v) => (
            <option key={v} value={v}>{t(TYPE_LABEL_KEY[v])}</option>
          ))}
        </select>
      </div>

      {error && <p className={s.formError}>{error}</p>}

      <div className={s.formActions}>
        <button type="button" className={`${btn.btn} ${btn.secondary} ${btn.md}`} onClick={onCancel}>
          {t("cancel")}
        </button>
        <button type="submit" className={`${btn.btn} ${btn.primary} ${btn.md}`} disabled={submitting}>
          {!pass && <FontAwesomeIcon icon={faPlus} />}
          {submitting ? "…" : (pass ? t("saveChanges") : t("addArtistBtn"))}
        </button>
      </div>
    </form>
  );
};

export const GuestPassesPage = () => {
  const { event } = useEvent();
  const { t } = useLanguage();
  const { openCustom } = useDialog();

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'error' | 'ready'
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useLocalStorageValue("sigale-guest-passes-view", "cards");

  const bandOptions = useMemo(() => event?.artists ?? [], [event]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.holderName.toLowerCase().includes(q) ||
        r.holderIdNumber.toLowerCase().includes(q) ||
        r.band.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const load = useCallback(async () => {
    if (!event?.id) return;
    setStatus("loading");
    try {
      const data = await guestPasses.list(event.id);
      setRows(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [event?.id]);

  useEffect(() => { load(); }, [load]);

  const bandSummary = useMemo(() => {
    const byBand = new Map();
    for (const row of rows) {
      if (!byBand.has(row.band)) byBand.set(row.band, { total: 0, artist: 0, crew: 0, courtesy: 0 });
      const entry = byBand.get(row.band);
      entry.total += 1;
      entry[row.type] += 1;
    }
    return Array.from(byBand.entries());
  }, [rows]);

  const openAddModal = () => {
    openCustom((close) => (
      <GuestPassForm
        eventId={event.id}
        bandOptions={bandOptions}
        onSaved={() => { load(); close(); }}
        onCancel={close}
      />
    ));
  };

  const openEditModal = (pass) => {
    openCustom((close) => (
      <GuestPassForm
        eventId={event.id}
        bandOptions={bandOptions}
        pass={pass}
        onSaved={() => { load(); close(); }}
        onCancel={close}
      />
    ));
  };

  if (!event) {
    return (
      <EmptyStateCard
        icon={<FontAwesomeIcon icon={faTriangleExclamation} className="color-primary" />}
        title={t("noEvent")}
        description={t("noEventDesc")}
      />
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        {/* Header */}
        <div className={`glass-elevated ${s.headerRow}`}>
          <div className={s.headerLeft}>
            <div className="icon-box">
              <FontAwesomeIcon icon={faUsers} className="icon-box-icon" />
            </div>
            <h1 className={s.pageTitle}>{t("guestPassesTitle")}</h1>
          </div>
          <div className={s.headerRight}>
            <div className={`glass-clean ${s.countBadge}`}>{filteredRows.length}</div>
            <button type="button" className={`${btn.btn} ${btn.orange} ${btn.md}`} onClick={openAddModal}>
              <FontAwesomeIcon icon={faPlus} />
              {t("addArtistBtn")}
            </button>
          </div>
        </div>

        {/* Per-band summary */}
        {bandSummary.length > 0 && (
          <div className={s.summaryRow}>
            {bandSummary.map(([band, counts]) => (
              <div key={band} className={`glass-clean ${s.bandChip}`}>
                <div className={s.bandChipName}>{band} — {counts.total}</div>
                <div className={s.bandChipBreakdown}>
                  {counts.artist} {t("guestPassTypeArtist")} · {counts.crew} {t("guestPassTypeCrew")} · {counts.courtesy} {t("guestPassTypeCourtesy")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search + view toggle */}
        <div className={s.filtersRow}>
          <div className={s.searchWrapper}>
            <FontAwesomeIcon icon={faSearch} className={s.searchIcon} />
            <input
              type="text"
              className={`glass-clean ${s.searchInput}`}
              placeholder={t("searchGuestPasses")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <TicketsViewToggle value={view} onChange={setView} />
        </div>

        {/* Listing — table always renders (it owns the paste toolbar) */}
        {status === "error" ? (
          <div className={`glass-elevated ${s.emptyState}`}>
            <p className="text-body">{t("error")}</p>
            <button type="button" className={`${btn.btn} ${btn.secondary} ${btn.md}`} onClick={load}>
              Reintentar
            </button>
          </div>
        ) : view === "table" ? (
          <GuestPassTable eventId={event.id} rows={filteredRows} bandOptions={bandOptions} onChanged={load} />
        ) : filteredRows.length === 0 ? (
          <div className={`glass-elevated ${s.emptyState}`}>
            <p className="text-body">{t("noGuestPasses")}</p>
          </div>
        ) : (
          <div className={s.cardGrid}>
            {filteredRows.map((pass) => (
              <GuestPassCard key={pass.id} pass={pass} onEdit={openEditModal} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestPassesPage;
