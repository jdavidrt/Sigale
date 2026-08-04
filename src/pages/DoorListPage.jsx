import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useLanguage } from "../context/LanguageContext";
import { admin } from "../api/admin";
import { guestPasses } from "../api/guestPasses";
import { parseLocalDate } from "../utils/timeFormat";
import { EmptyStateCard } from "../components/ui/EmptyStateCard";
import s from "./DoorListPage.module.css";
import btn from "../components/Common/Button.module.css";

const TYPE_LABEL_KEY = {
  artist: "guestPassTypeArtist",
  crew: "guestPassTypeCrew",
  courtesy: "guestPassTypeCourtesy",
};

// Preferred order for the per-band type sub-groups on the printed roster.
const TYPE_ORDER = ["artist", "crew", "courtesy"];

// Case-insensitive, accent-tolerant name sort for door lookup.
const byName = (a, b) =>
  (a.holderName || "").localeCompare(b.holderName || "", "es", { sensitivity: "base" });

/**
 * The printable document. Rendered twice — once as the on-screen preview
 * (inside #root) and once inside the body-level print portal — from the same
 * component, so the preview is a faithful copy of what will print. Styled as
 * a white paper sheet in both places (see DoorListPage.module.css).
 */
function DoorListSheets({ event, paid, guestGroups, guestCount, t, language }) {
  const dateLabel = event?.eventDate
    ? parseLocalDate(event.eventDate).toLocaleDateString(
        language === "en" ? "en-US" : "es-CO",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" },
      )
    : "";
  const meta = [dateLabel, event?.venue].filter(Boolean).join(" · ");

  return (
    <div className={s.sheet}>
      {/* ── Paid attendees ─────────────────────────────────────── */}
      <section className={s.section}>
        <header className={s.docHead}>
          <h1 className={s.docTitle}>{event?.name || ""}</h1>
          {meta && <p className={s.docMeta}>{meta}</p>}
        </header>

        <h2 className={s.listTitle}>
          {t("doorListPaidTitle")} <span className={s.count}>({paid.length})</span>
        </h2>

        {paid.length === 0 ? (
          <p className={s.empty}>{t("doorListNoPaid")}</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.checkCol}>{" "}</th>
                <th className={s.numCol}>#</th>
                <th>{t("doorListName")}</th>
                <th>{t("doorListId")}</th>
                <th className={s.orderCol}>{t("doorListOrder")}</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((r, i) => (
                <tr key={r.id}>
                  <td className={s.checkCell}><span className={s.box} /></td>
                  <td className={s.numCol}>{i + 1}</td>
                  <td>{r.holderName || "—"}</td>
                  <td>{r.holderIdNumber || "—"}</td>
                  <td className={s.orderCol}>{r.orderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Artists / guests / crew (new page when printed) ─────── */}
      <section className={`${s.section} ${s.pageBreak}`}>
        <h2 className={s.listTitle}>
          {t("doorListGuestsTitle")} <span className={s.count}>({guestCount})</span>
        </h2>

        {guestCount === 0 ? (
          <p className={s.empty}>{t("doorListNoGuests")}</p>
        ) : (
          guestGroups.map(([band, typeGroups]) => (
            <div key={band} className={s.group}>
              <h3 className={s.bandHead}>{band}</h3>
              {typeGroups.map(({ type, rows }) => (
                <div key={type} className={s.typeGroup}>
                  <h4 className={s.typeHead}>
                    {t(TYPE_LABEL_KEY[type] || "guestPassTypeCourtesy")}{" "}
                    <span className={s.count}>({rows.length})</span>
                  </h4>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th className={s.checkCol}>{" "}</th>
                        <th className={s.numCol}>#</th>
                        <th>{t("doorListName")}</th>
                        <th>{t("doorListId")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={r.id}>
                          <td className={s.checkCell}><span className={s.box} /></td>
                          <td className={s.numCol}>{i + 1}</td>
                          <td>{r.holderName || "—"}</td>
                          <td>{r.holderIdNumber || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export const DoorListPage = () => {
  const { event } = useEvent();
  const { t, language } = useLanguage();

  const [paid, setPaid] = useState([]);
  const [guests, setGuests] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'error' | 'ready'

  const load = useCallback(async () => {
    if (!event?.id) return;
    setStatus("loading");
    try {
      const [tickets, gp] = await Promise.all([
        admin.listTickets("confirmed", event.id), // paid = confirmed rows only
        guestPasses.list(event.id),
      ]);
      setPaid(Array.isArray(tickets) ? tickets : []);
      setGuests(Array.isArray(gp) ? gp : []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [event?.id]);

  useEffect(() => { load(); }, [load]);

  // Flag the body only while this page is mounted, so the print rules that
  // hide the app chrome (in DoorListPage.module.css) can never affect any
  // other route's printing.
  useEffect(() => {
    document.body.classList.add("door-print-mode");
    return () => document.body.classList.remove("door-print-mode");
  }, []);

  const sortedPaid = useMemo(() => [...paid].sort(byName), [paid]);

  // Group guests by band (alpha), then sub-group each band by pass type
  // (artist → crew → courtesy), names alpha within each type sub-group.
  // Shape: [ [band, [ { type, rows[] }, ... ] ], ... ]
  const guestGroups = useMemo(() => {
    const byBand = new Map();
    for (const g of guests) {
      const band = g.band || "—";
      if (!byBand.has(band)) byBand.set(band, []);
      byBand.get(band).push(g);
    }
    const bands = Array.from(byBand.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "es", { sensitivity: "base" }),
    );
    return bands.map(([band, bandRows]) => {
      const byType = new Map();
      for (const r of bandRows) {
        const type = r.type || "courtesy";
        if (!byType.has(type)) byType.set(type, []);
        byType.get(type).push(r);
      }
      // Known types first in the preferred order, then any unexpected ones.
      const orderedTypes = [
        ...TYPE_ORDER.filter((tp) => byType.has(tp)),
        ...Array.from(byType.keys()).filter((tp) => !TYPE_ORDER.includes(tp)),
      ];
      const typeGroups = orderedTypes.map((type) => {
        const rows = byType.get(type);
        rows.sort(byName);
        return { type, rows };
      });
      return [band, typeGroups];
    });
  }, [guests]);

  if (!event) {
    return (
      <EmptyStateCard
        icon={<FontAwesomeIcon icon={faTriangleExclamation} className="color-primary" />}
        title={t("noEvent")}
        description={t("noEventDesc")}
      />
    );
  }

  const sheets = (
    <DoorListSheets
      event={event}
      paid={sortedPaid}
      guestGroups={guestGroups}
      guestCount={guests.length}
      t={t}
      language={language}
    />
  );

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div>
          <h1 className={s.pageTitle}>{t("doorListTitle")}</h1>
          <p className={s.hint}>{t("doorListHint")}</p>
        </div>
        <button
          type="button"
          className={`${btn.btn} ${btn.primary} ${btn.md}`}
          onClick={() => window.print()}
        >
          <FontAwesomeIcon icon={faPrint} />
          {t("doorListPrintBtn")}
        </button>
      </div>

      {status === "loading" && <p className={s.state}>{t("loading")}…</p>}

      {status === "error" && (
        <div className={s.state}>
          <p>{t("error")}</p>
          <button type="button" className={`${btn.btn} ${btn.secondary} ${btn.md}`} onClick={load}>
            {language === "en" ? "Retry" : "Reintentar"}
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {/* On-screen preview (inside #root — hidden while printing). */}
          <div className={s.preview}>{sheets}</div>

          {/* Body-level portal — the only thing browser print renders. */}
          {createPortal(<div id="door-print-root">{sheets}</div>, document.body)}
        </>
      )}
    </div>
  );
};

export default DoorListPage;
