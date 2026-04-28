// ─── ICS export helpers ───────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, '0');
}

/** 'YYYY-MM-DD' + 'HH:MM' → '20260416T143000' (floating local time) */
function toICSDateTime(dateStr, timeStr) {
  const date = dateStr.replace(/-/g, '');
  const time = timeStr ? timeStr.replace(':', '') + '00' : '000000';
  return `${date}T${time}`;
}

/** Add minutes to a date+time and return ICS datetime string */
function addMinutes(dateStr, timeStr, minutes) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi]    = (timeStr || '00:00').split(':').map(Number);
  const dt = new Date(y, mo - 1, d, h, mi + minutes);
  return (
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
  );
}

/** Escape special chars per RFC 5545 */
function esc(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g,  '\\;')
    .replace(/,/g,  '\\,')
    .replace(/\n/g, '\\n');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a VCALENDAR string from one or more meeting objects.
 * Each meeting: { id, title, date, time, duration, description }
 */
export function generateICS(meetings) {
  const now = new Date();
  const dtstamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const events = meetings
    .filter((m) => m.date) // skip meetings without a date
    .map((m) => {
      const start = toICSDateTime(m.date, m.time);
      const end   = addMinutes(m.date, m.time, m.duration || 60);
      const lines = [
        'BEGIN:VEVENT',
        `UID:${m.id}@gestion-proyectos`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${esc(m.title)}`,
      ];
      if (m.description) lines.push(`DESCRIPTION:${esc(m.description)}`);
      lines.push('END:VEVENT');
      return lines.join('\r\n');
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestión de Proyectos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Generate ICS and trigger a browser download */
export function downloadICS(meetings, filename = 'reuniones.ics') {
  const content = generateICS(Array.isArray(meetings) ? meetings : [meetings]);
  const blob    = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
