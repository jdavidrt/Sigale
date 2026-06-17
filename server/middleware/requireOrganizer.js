/*
 * requireOrganizer — per-request credential check (locked decision #5:
 * no JWT/session). Reads HTTP Basic credentials, bcrypt-compares the
 * password against the organizers row. HTTPS-only in production so the
 * header isn't exposed. Attach to every /api/admin/* route.
 */
import bcrypt from 'bcryptjs';
import pool from '../db.js';

/** Parse a Basic auth header into { username, password } or null. */
function parseBasic(header) {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const i = decoded.indexOf(':');
    if (i < 0) return null;
    return { username: decoded.slice(0, i), password: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

export async function requireOrganizer(req, res, next) {
  const creds = parseBasic(req.headers.authorization);
  if (!creds) {
    return res.status(401).json({ message: 'Credenciales requeridas' });
  }
  try {
    const [[organizer]] = await pool.query(
      'SELECT id, username, passwordHash FROM organizers WHERE username = ? LIMIT 1',
      [creds.username],
    );
    if (!organizer || !(await bcrypt.compare(creds.password, organizer.passwordHash))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    req.organizer = { id: organizer.id, username: organizer.username };
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export default requireOrganizer;
