// Kalender-Export: einzelne Buchung in Google Kalender oder als .ics, mehrere als .ics-Datei.
(() => {
  'use strict';
  const { $, h, toast } = window.TC;

  // Zeitzonen der Abflug-/Ankunftsorte (Uhrzeiten werden als Ortszeit eingegeben)
  const TZ = {
    VIE: 'Europe/Vienna', SZG: 'Europe/Vienna', INN: 'Europe/Vienna', GRZ: 'Europe/Vienna', LNZ: 'Europe/Vienna',
    MUC: 'Europe/Berlin', FRA: 'Europe/Berlin', ZRH: 'Europe/Zurich', IST: 'Europe/Istanbul',
    DOH: 'Asia/Qatar', DXB: 'Asia/Dubai', AUH: 'Asia/Dubai', SIN: 'Asia/Singapore', KUL: 'Asia/Kuala_Lumpur',
    HKG: 'Asia/Hong_Kong', CMB: 'Asia/Colombo', DEL: 'Asia/Kolkata'
  };
  const THAI = 'Asia/Bangkok';
  const tzOf = (code) => TZ[(code || '').toUpperCase()] || THAI;

  // Ortszeit in einer Zeitzone -> UTC-Date
  function toUTC(date, time, tz) {
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    let off = window.TC.zoneOffsetMin(tz, new Date(guess));
    off = window.TC.zoneOffsetMin(tz, new Date(guess - off * 60000));
    return new Date(guess - off * 60000);
  }
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = (iso) => iso.replace(/-/g, '');

  const lines = (...xs) => xs.filter(Boolean).join('\n');

  function eventOf(b) {
    const P = window.TC.plan;
    let title, location = '', details = '', start, end, allDay = false;
    if (b.type === 'flight') {
      title = `✈️ ${b.flightNo} ${b.from || ''} → ${b.to || ''}`.trim();
      location = [P.airportName(b.from), b.from].filter(Boolean).join(' ');
      details = lines(b.airline, b.pnr && 'Buchungscode: ' + b.pnr, b.seat && 'Sitz: ' + b.seat,
        b.terminal && 'Terminal/Gate: ' + b.terminal, b.passenger && 'Passagier: ' + b.passenger,
        'Flugstatus: https://www.flightradar24.com/data/flights/' + b.flightNo.replace(/\s+/g, '').toLowerCase(), b.notes);
      if (b.depTime) {
        start = toUTC(b.date, b.depTime, tzOf(b.from));
        if (b.arrTime) {
          const arrDate = b.arrTime < b.depTime ? addDays(b.date, 1) : b.date;
          end = toUTC(arrDate, b.arrTime, tzOf(b.to));
          if (end <= start) end = new Date(start.getTime() + 3600000);
        } else end = new Date(start.getTime() + 2 * 3600000);
      } else { allDay = true; start = b.date; end = addDays(b.date, 1); }
    } else if (b.type === 'hotel') {
      title = `🏨 ${b.name}`;
      location = b.address || [b.name, b.city].filter(Boolean).join(', ');
      details = lines(b.city, b.checkinTime && 'Check-in ab ' + b.checkinTime, b.checkoutTime && 'Check-out bis ' + b.checkoutTime,
        b.phone && 'Telefon: ' + b.phone, b.ref && 'Buchungsnummer: ' + b.ref, b.url, b.notes);
      start = toUTC(b.date, b.checkinTime || '14:00', THAI);
      end = toUTC(b.endDate || addDays(b.date, 1), b.checkoutTime || '12:00', THAI);
      if (end <= start) end = new Date(start.getTime() + 3600000);
    } else if (b.type === 'transport') {
      title = `${P.iconOf(b)} ${b.kind || 'Transport'}: ${b.from} → ${b.to}`;
      location = b.meeting || b.from;
      details = lines(b.provider, b.ref && 'Buchungsnummer: ' + b.ref, b.url, b.notes);
      if (b.time) { start = toUTC(b.date, b.time, THAI); end = new Date(start.getTime() + 2 * 3600000); }
      else { allDay = true; start = b.date; end = addDays(b.date, 1); }
    } else {
      title = `🎟️ ${b.title}`;
      location = b.place || '';
      details = lines(b.ref && 'Buchungsnummer: ' + b.ref, b.url, b.notes);
      if (b.time) { start = toUTC(b.date, b.time, THAI); end = new Date(start.getTime() + 2 * 3600000); }
      else { allDay = true; start = b.date; end = addDays(b.date, 1); }
    }
    return { uid: b.id + '@thailand-companion', title, location, details, start, end, allDay, alarm: b.type === 'flight' };
  }

  function googleUrl(ev) {
    const dates = ev.allDay
      ? `${dateStamp(ev.start)}/${dateStamp(ev.end)}`
      : `${utcStamp(ev.start)}/${utcStamp(ev.end)}`;
    const q = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates, details: ev.details, location: ev.location });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }

  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  // Zeilen nach RFC 5545 auf 75 Bytes falten
  function fold(line) {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const out = [];
    let cur = '', len = 0;
    for (const ch of line) {
      const l = new TextEncoder().encode(ch).length;
      if (len + l > (out.length ? 74 : 75)) { out.push(cur); cur = ''; len = 0; }
      cur += ch; len += l;
    }
    out.push(cur);
    return out.join('\r\n ');
  }
  function ics(events) {
    const now = utcStamp(new Date());
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Thailand Companion//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const ev of events) {
      out.push('BEGIN:VEVENT', 'UID:' + ev.uid, 'DTSTAMP:' + now);
      if (ev.allDay) out.push('DTSTART;VALUE=DATE:' + dateStamp(ev.start), 'DTEND;VALUE=DATE:' + dateStamp(ev.end));
      else out.push('DTSTART:' + utcStamp(ev.start), 'DTEND:' + utcStamp(ev.end));
      out.push('SUMMARY:' + esc(ev.title));
      if (ev.location) out.push('LOCATION:' + esc(ev.location));
      if (ev.details) out.push('DESCRIPTION:' + esc(ev.details));
      if (ev.alarm) out.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(ev.title), 'TRIGGER:-PT3H', 'END:VALARM');
      out.push('END:VEVENT');
    }
    out.push('END:VCALENDAR');
    return out.map(fold).join('\r\n') + '\r\n';
  }

  async function saveIcs(text, filename) {
    const file = new File([text], filename, { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: filename }); return; } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const a = h('a', { href: URL.createObjectURL(file), download: filename });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const slug = (s) => (s || 'termin').normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'termin';

  // ---------- Einzelne Buchung ----------
  const one = $('#cal-dialog');
  let oneBooking = null;
  function openFor(b) {
    oneBooking = b;
    const ev = eventOf(b);
    $('#cal-title').textContent = ev.title;
    const when = ev.allDay
      ? new Date(ev.start + 'T00:00').toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' (ganztägig)'
      : ev.start.toLocaleString('de-AT', { timeZone: THAI, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' Thai-Zeit';
    $('#cal-when').textContent = when;
    $('#cal-google').href = googleUrl(ev);
    one.showModal();
  }
  $('#cal-ics').addEventListener('click', () => {
    if (!oneBooking) return;
    saveIcs(ics([eventOf(oneBooking)]), slug(window.TC.plan.titleOf(oneBooking)) + '.ics');
  });
  $('#cal-close').addEventListener('click', () => one.close());

  // ---------- Mehrere Buchungen ----------
  const multi = $('#cal-multi-dialog');
  function openMulti() {
    const P = window.TC.plan;
    const list = P.all();
    if (!list.length) { toast('Noch keine Buchungen'); return; }
    $('#cal-multi-list').replaceChildren(...list.map((b) => h('label', { class: 'check-row' },
      h('input', { type: 'checkbox', value: b.id, checked: !P.isPast(b) }),
      h('span', { class: 'booking-icon', text: P.iconOf(b) }),
      h('span', { class: 'check-text' }, h('b', { text: P.titleOf(b) }), h('small', { text: P.fmtDay(b.date) }))
    )));
    multi.showModal();
  }
  $('#cal-multi-all').addEventListener('click', () => {
    const boxes = [...$('#cal-multi-list').querySelectorAll('input')];
    const on = boxes.some((x) => !x.checked);
    boxes.forEach((x) => { x.checked = on; });
  });
  $('#cal-multi-export').addEventListener('click', () => {
    const ids = new Set([...$('#cal-multi-list').querySelectorAll('input:checked')].map((x) => x.value));
    const sel = window.TC.plan.all().filter((b) => ids.has(b.id));
    if (!sel.length) { toast('Nichts ausgewählt'); return; }
    saveIcs(ics(sel.map(eventOf)), 'thailand-reise.ics');
    multi.close();
  });
  $('#cal-multi-close').addEventListener('click', () => multi.close());

  window.TC.calendar = { openFor, openMulti, eventOf, ics, googleUrl };
})();
