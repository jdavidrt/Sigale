import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketSimple, faTriangleExclamation, faSearch, faFilter } from "@fortawesome/free-solid-svg-icons";
import { useEvent } from "../context/EventContext";
import { useTickets } from "../context/TicketContext";
import { useLanguage } from "../context/LanguageContext";
import { useDialog } from "../context/DialogContext";
import { useLocalStorageValue } from "../hooks/useLocalStorageValue";
import { TicketCard } from "../components/Tickets/TicketCard";
import { TicketTable } from "../components/Tickets/TicketTable";
import { TicketsViewToggle } from "../components/Tickets/TicketsViewToggle";
import { CSVPanel } from "../components/Tickets/CSVPanel";
import { EmptyStateCard } from "../components/ui/EmptyStateCard";
import s from "./TicketsPage.module.css";
import btn from "../components/Common/Button.module.css";

/**
 * "Type DELETE to confirm" body for the destructive bulk-delete modal.
 * Lives here (not in src/components/ui) because it's the only consumer
 * and the typed-confirm pattern hasn't earned a generic primitive yet.
 */
const TypedConfirmBody = ({ count, requiredWord, t, onConfirm, onCancel }) => {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toUpperCase() === requiredWord;

  return (
    <>
      <h2 className={s.confirmTitle}>
        {t("deleteAllTitle")}
      </h2>
      <p className={s.confirmBody}>
        {t("deleteAllBody").replace("{count}", count)}
      </p>
      <input
        type="text"
        autoFocus
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={t("deleteAllInputPlaceholder")}
        className={s.confirmInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches) onConfirm();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className={s.confirmActions}>
        <button type="button" className={`${btn.btn} ${btn.secondary} ${btn.md}`} onClick={onCancel}>
          {t("cancel")}
        </button>
        <button
          type="button"
          className={`${btn.btn} ${btn.danger} ${btn.md}`}
          onClick={onConfirm}
          disabled={!matches}
        >
          {t("delete")}
        </button>
      </div>
    </>
  );
};

export const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { event } = useEvent();
  const { tickets, searchTickets, clearAllTickets } = useTickets();
  const { t } = useLanguage();
  const { openCustom, notify } = useDialog();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  // Persisted view preference: "cards" (default) or "table". One key per device,
  // stored under "sigale-tickets-view" via the small useLocalStorageValue hook.
  const [view, setView] = useLocalStorageValue("sigale-tickets-view", "cards");

  useEffect(() => {
    const typeFromUrl = searchParams.get("type");
    if (typeFromUrl) setSelectedType(typeFromUrl);
  }, [searchParams]);

  const searchedTickets = searchTickets(searchQuery);
  const filteredTickets = selectedType === "all"
    ? searchedTickets
    : searchedTickets.filter((ticket) => ticket.ticketType === selectedType);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setSelectedType(newType);
    if (newType === "all") setSearchParams({});
    else setSearchParams({ type: newType });
  };

  // H1: a hard-coded password in a static bundle is not access control — anyone
  // can read it with DevTools. Two-step typed-DELETE confirmation instead.
  // Operators needing real access control should deploy behind an auth'd proxy.
  const handleClearAllTickets = () => {
    if (tickets.length === 0) return;
    openCustom((close) => (
      <TypedConfirmBody
        count={tickets.length}
        requiredWord={t("deleteAllConfirmWord")}
        t={t}
        onCancel={close}
        onConfirm={() => {
          close();
          clearAllTickets();
          notify({ message: t("deleteAllSuccess"), tone: "success" });
        }}
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
              <FontAwesomeIcon icon={faTicketSimple} className="icon-box-icon" />
            </div>
            <h1 className={s.pageTitle}>{t("allTickets")}</h1>
          </div>
          <div className={`glass-clean ${s.countBadge}`}>
            {filteredTickets.length}
          </div>
        </div>

        {/* Filters + view toggle */}
        <div className={s.filtersRow}>
          <div className={s.searchWrapper}>
            <FontAwesomeIcon icon={faSearch} className={s.searchIcon} />
            <input
              type="text"
              className={`glass-clean ${s.searchInput}`}
              placeholder={t("searchTickets")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={s.filterWrapper}>
            <FontAwesomeIcon icon={faFilter} className={s.filterIcon} />
            <select
              value={selectedType}
              onChange={handleTypeChange}
              className={`glass-clean ${s.filterSelect}`}
            >
              <option value="all">{t("ticketType")}: {t("filterAll")}</option>
              {event.ticketTypes && Object.keys(event.ticketTypes).map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <TicketsViewToggle value={view} onChange={setView} />
        </div>

        {/* Tickets — table view always renders (it owns the paste toolbar even
            with zero matches); cards view shows an empty state when no matches. */}
        {view === "table" ? (
          <>
            <TicketTable tickets={filteredTickets} />
            {tickets.length > 0 && (
              <div className={s.resetRow}>
                <button onClick={handleClearAllTickets} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
                  🗑️ {t("clearAllTickets") || "Delete All Tickets"}
                </button>
              </div>
            )}
          </>
        ) : filteredTickets.length === 0 ? (
          <div className={`glass-elevated ${s.emptyState}`}>
            <FontAwesomeIcon icon={faTicketSimple} className={`color-primary ${s.emptyStateIcon}`} />
            <h2 className={`text-heading ${s.emptyStateHeading}`}>{t("noTickets")}</h2>
            <p className="text-body">{t("noTicketsDesc")}</p>
          </div>
        ) : (
          <>
            <div className={s.ticketGrid}>
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.ticketId} ticket={ticket} />
              ))}
            </div>

            {tickets.length > 0 && (
              <div className={s.resetRow}>
                <button onClick={handleClearAllTickets} className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
                  🗑️ {t("clearAllTickets") || "Delete All Tickets"}
                </button>
              </div>
            )}
          </>
        )}

        {/* CSV Panel */}
        <CSVPanel filteredTickets={filteredTickets} />
      </div>
    </div>
  );
};
