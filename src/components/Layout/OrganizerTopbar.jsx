/*
 * OrganizerTopbar — the "Sígale / Administración" brand + EventBadge +
 * OrganizerMenu row shared by every organizer screen: AdminLayout, and
 * AdminPage.Panel in all of its branches (loading, error, empty, home), so a
 * stuck fetch or a "no events" state still has a menu and a way out.
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
