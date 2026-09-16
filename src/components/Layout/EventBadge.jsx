/*
 * EventBadge — shows which event the organizer is currently scoped to, and
 * (when there's more than one to choose from) doubles as the switcher. Lives
 * in OrganizerTopbar (between the brand and the Menu button) and inside
 * OrganizerMenu's slide-out panel — same component, same sheet, so there is
 * exactly one switcher UI instead of the old plain <select> plus this.
 *
 * Gated on data (organizerEvents.length > 1), not on isSuperAdmin() — that
 * role check is dead in production today (Phase 2 roles aren't deployed), so
 * gating on it would hide the switcher for every organizer regardless of how
 * many events they actually have.
 */
import { useEvent } from '../../context/EventContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import { Ic } from '../ui/Ic';
import { parseLocalDate } from '../../utils/timeFormat';
import s from './EventBadge.module.css';

function EventThumb({ event }) {
  return (
    <span className={s.thumb}>
      {event.flyerImageUrl ? (
        <img className={s.thumbImg} src={event.flyerImageUrl} alt="" />
      ) : (
        <Ic n="ticket" s={18} />
      )}
    </span>
  );
}

function EventSwitcherSheet({ events, currentId, onSelect, t }) {
  return (
    <div className="modal-light">
      <h2 className={s.sheetTitle}>{t('switchEvent')}</h2>
      <div className={s.sheetList}>
        {events.map((ev) => {
          const isCurrent = String(ev.id) === String(currentId);
          return (
            <button
              key={ev.id}
              type="button"
              className={s.sheetRow}
              aria-current={isCurrent}
              onClick={() => onSelect(ev.id)}
            >
              <EventThumb event={ev} />
              <span className={s.sheetInfo}>
                <span className={s.sheetName}>
                  {ev.name}
                  {ev.isDemo ? ` · ${t('demoPillLabel')}` : ''}
                </span>
                {ev.date && (
                  <span className={s.sheetDate}>
                    {parseLocalDate(ev.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </span>
              {isCurrent && <Ic n="check" s={18} className={s.sheetCheck} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EventBadge({ className }) {
  const { organizerEvents, selectedEventId, selectEvent } = useEvent();
  const { t } = useLanguage();
  const { openCustom } = useDialog();

  const current = organizerEvents.find((e) => String(e.id) === String(selectedEventId));
  if (!current) return null;

  const canSwitch = organizerEvents.length > 1;

  const openSwitcher = () => {
    openCustom((close) => (
      <EventSwitcherSheet
        events={organizerEvents}
        currentId={selectedEventId}
        onSelect={(id) => { selectEvent(id); close(); }}
        t={t}
      />
    ));
  };

  return (
    <button
      type="button"
      className={className ? `${s.trigger} ${className}` : s.trigger}
      disabled={!canSwitch}
      onClick={canSwitch ? openSwitcher : undefined}
      aria-label={canSwitch ? t('switchEvent') : `${t('currentEvent')}: ${current.name}`}
    >
      <EventThumb event={current} />
      <span className={s.name}>{current.name}</span>
      {canSwitch && <Ic n="chevD" s={16} className={s.chev} />}
    </button>
  );
}

export default EventBadge;
