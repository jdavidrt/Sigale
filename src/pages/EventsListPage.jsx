/*
 * EventsListPage — /  (public root landing, multi-event)
 * Replaces the pre-2.0 "single active event" landing: shows every
 * published event as a card grid; tapping one goes to its own /:slug.
 * Mobile-first single column, grid at wider breakpoints (module CSS).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Screen } from '../components/ui/Screen';
import { Ic } from '../components/ui/Ic';
import { EmptyStateCard } from '../components/ui/EmptyStateCard';
import { useLanguage } from '../context/LanguageContext';
import { eventsApi } from '../api/events';
import { parseLocalDate } from '../utils/timeFormat';
import s from './EventsListPage.module.css';

export function EventsListPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    eventsApi
      .list()
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setEvents([]);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen seed={1} density={34}>
      <div className={s.scroll}>
        <div className={s.header}>
          <div className={`serif ${s.wordmark}`}>Sígale</div>
          <div className={`serif ${s.title}`}>{t('eventsListTitle')}</div>
        </div>

        {events === null ? (
          <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>{t('loading')}…</p>
        ) : events.length === 0 ? (
          <EmptyStateCard
            icon={<Ic n="sparkle" s={40} />}
            title={t('eventsListTitle')}
            description={loadError ? t('error') : t('eventsListEmpty')}
          />
        ) : (
          <div className={s.grid}>
            {events.map((event) => (
              <Link key={event.id} to={`/${event.slug}`} className={`card ${s.card}`}>
                <div className={s.flyerWrap}>
                  {event.flyerImageUrl ? (
                    <img className={s.flyer} src={event.flyerImageUrl} alt="" />
                  ) : (
                    <div className={s.flyerFallback}><Ic n="ticket" s={36} /></div>
                  )}
                  {event.isDemo && (
                    <span className={`chip ${s.demoPill}`}>{t('demoPillLabel')}</span>
                  )}
                </div>
                <div className={s.body}>
                  <div className={`serif ${s.name}`}>{event.name}</div>
                  <div className={s.meta}>
                    {event.date && (
                      <span className="muted" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Ic n="cal" s={13} /> {parseLocalDate(event.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {event.venue && (
                      <span className="muted" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Ic n="pin" s={13} /> {event.venue}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

export default EventsListPage;
