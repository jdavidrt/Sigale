import { formatTo12Hour } from './timeFormat';
import { generateTicketSVG } from './svgTicketTemplate';
import { svgToPngBlob, writePngBlobToClipboard, sharePngBlob } from './qrCopy';

/* ============================================================
   Guest-pass image + share helpers.
   Guest passes have no validationHash/QR by design (they're a
   manual name+ID roster) — the shared image reuses the ticket
   template's `guest` variant: type badge instead of QR, type
   label instead of price, no pola line.
   ============================================================ */

/* The image itself is Spanish-only, like the ticket SVG. */
export const GUEST_TYPE_LABEL_ES = {
  artist: 'Artista',
  crew: 'Crew',
  courtesy: 'Invitadx',
};

/** Map a guest pass to the ticket-shaped object the SVG template expects. */
const buildGuestSvg = (pass, event) => {
  const typeLabel = GUEST_TYPE_LABEL_ES[pass.type] || pass.type;
  const ticketLike = {
    buyerName: pass.holderName,
    ticketType: pass.band, // renders as the small uppercase top-right label
    ticketId: `PASE-${pass.id}`,
    folio: String(pass.id),
  };
  return generateTicketSVG(ticketLike, event, null, {
    guest: { typeLabel, band: pass.band },
  });
};

/** Locale-aware share message — mirrors buildShareMessage in qrCopy.js
    (manual YYYY-MM-DD split so the date doesn't flip a day in -05:00),
    but with no price and no QR wording. */
const buildGuestPassShareMessage = (pass, event, language) => {
  const [year, month, day] = event.date.split('-');
  const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const formattedDate = eventDate.toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  const formattedTime = formatTo12Hour(event.entranceTime);
  const firstName = (pass.holderName || '').split(' ')[0];
  const typeLabel = GUEST_TYPE_LABEL_ES[pass.type] || pass.type;

  if (language === 'es') {
    return `✦ ${event.name} ✦

Hola ${firstName},
Tu acceso de cortesía está confirmado.

✦ Detalles
▸ Banda: ${pass.band}
▸ Tipo de acceso: ${typeLabel}
▸ Documento: ${pass.holderIdNumber}
▸ Lugar: ${event.venue}
▸ Dirección: ${event.address}
▸ Fecha: ${formattedDate}
▸ Apertura de puertas: ${formattedTime}

Presenta este pase con tu documento en la entrada.
✦ ¡Nos vemos pronto! ✦`;
  }

  return `✦ ${event.name} ✦

Hi ${firstName},
Your courtesy pass is confirmed.

✦ Details
▸ Band: ${pass.band}
▸ Pass type: ${typeLabel}
▸ ID number: ${pass.holderIdNumber}
▸ Venue: ${event.venue}
▸ Address: ${event.address}
▸ Date: ${formattedDate}
▸ Doors open: ${formattedTime}

Present this pass with your ID at the entrance.
✦ See you soon! ✦`;
};

/**
 * Render the guest-pass image and copy it to the clipboard as PNG.
 *
 * @returns {Promise<boolean>}
 */
export const copyGuestPassPNG = async (pass, event) => {
  try {
    const svg = buildGuestSvg(pass, event);
    const blob = await svgToPngBlob(svg);
    if (!blob) return false;
    return await writePngBlobToClipboard(blob);
  } catch (error) {
    console.error('Error copying guest pass PNG:', error);
    return false;
  }
};

/**
 * Share the guest-pass image as a PNG file via the Web Share API.
 *
 * @returns {Promise<boolean>}
 */
export const shareGuestPass = async (pass, event, language = 'es') => {
  try {
    const svg = buildGuestSvg(pass, event);
    const blob = await svgToPngBlob(svg);
    if (!blob) return false;

    return await sharePngBlob(blob, {
      fileName: `acceso-${pass.id}.png`,
      title: `Acceso - ${event.name}`,
      text: buildGuestPassShareMessage(pass, event, language),
    });
  } catch (error) {
    console.error('Error sharing guest pass:', error);
    return false;
  }
};
