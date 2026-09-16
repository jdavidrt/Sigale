/*
 * ============================================================
 * RETIRED — NOT PART OF THE RUNNING SYSTEM.
 * This file has zero importers and is never executed. Do not
 * import it, run it, or copy patterns from it. See
 * legacy/README.md for why it was retired and what replaced it.
 * ============================================================
 */
/*
 * EventSelector — plain <select> the organizer used to switch which event
 * every admin page/endpoint is scoped to. Lived inside OrganizerMenu's
 * slide-out panel (the fetch that populated it ran unconditionally in
 * OrganizerMenu itself, not gated behind the panel being open — see there).
 */
import { useEvent } from '../../context/EventContext';
import { useLanguage } from '../../context/LanguageContext';

export function EventSelector() {
  const { organizerEvents, selectedEventId, selectEvent } = useEvent();
  const { t } = useLanguage();

  if (organizerEvents.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 13, margin: '0 0 6px' }}>
        {t('noEventsForSelector')}
      </p>
    );
  }

  return (
    <select
      className="input"
      style={{ minHeight: 44, marginBottom: 6 }}
      value={String(selectedEventId || '')}
      onChange={(e) => selectEvent(e.target.value)}
      aria-label={t('eventSelectorLabel')}
    >
      {organizerEvents.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.name}{ev.isDemo ? ` · ${t('demoPillLabel')}` : ''}
        </option>
      ))}
    </select>
  );
}

export default EventSelector;
