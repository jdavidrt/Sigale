/*
 * OrganizerTopbar — the "Sígale / Administración" brand + EventBadge +
 * OrganizerMenu row shared by every organizer screen. Extracted from
 * AdminLayout and AdminPage's Home (previously identical, hand-duplicated
 * markup in both places) so it can also render in AdminPage.Panel's loading,
 * error and empty branches — those used to render no chrome at all, which
 * meant a stuck fetch or a "no events" misread had no menu, no selector, and
 * no way out short of a manual URL edit.
 */
import { Link } from 'react-router-dom';
import { OrganizerMenu } from './OrganizerMenu';
import { EventBadge } from './EventBadge';
import s from './OrganizerTopbar.module.css';

export function OrganizerTopbar({ onLogout }) {
  return (
    <div className={s.topbar}>
      <Link to="/admin" className={s.brand}>
        <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>Sígale</div>
        <div className={`muted ${s.subtitle}`} style={{ fontSize: 12 }}>Administración</div>
      </Link>
      <EventBadge className={s.badgeSlot} />
      <OrganizerMenu onLogout={onLogout} />
    </div>
  );
}

export default OrganizerTopbar;
