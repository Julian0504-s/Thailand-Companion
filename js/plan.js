// Reiseplan: Flüge, Unterkünfte, Transport und Aktivitäten als Zeitleiste,
// inkl. Bordkarten-Scan (IATA-BCBP-Barcode über die BarcodeDetector-API).
(() => {
  'use strict';
  const { $, $$, h, store, uid, toast } = window.TC;

  const AIRPORTS = {
    BKK: 'Bangkok Suvarnabhumi', DMK: 'Bangkok Don Mueang', HKT: 'Phuket', CNX: 'Chiang Mai',
    CEI: 'Chiang Rai', KBV: 'Krabi', USM: 'Koh Samui', URT: 'Surat Thani', HDY: 'Hat Yai',
    UTP: 'Pattaya U-Tapao', TDX: 'Trat', NST: 'Nakhon Si Thammarat', UTH: 'Udon Thani',
    KKC: 'Khon Kaen', UBP: 'Ubon Ratchathani', HHQ: 'Hua Hin', TST: 'Trang', NNT: 'Nan',
    VIE: 'Wien', SZG: 'Salzburg', INN: 'Innsbruck', GRZ: 'Graz', LNZ: 'Linz', MUC: 'München',
    FRA: 'Frankfurt', ZRH: 'Zürich', IST: 'Istanbul', DOH: 'Doha', DXB: 'Dubai', AUH: 'Abu Dhabi',
    SIN: 'Singapur', KUL: 'Kuala Lumpur', HKG: 'Hongkong', CMB: 'Colombo', DEL: 'Delhi'
  };
  const AIRLINES = {
    TG: 'Thai Airways', PG: 'Bangkok Airways', FD: 'Thai AirAsia', DD: 'Nok Air', SL: 'Thai Lion Air',
    VZ: 'Thai Vietjet', OS: 'Austrian', LH: 'Lufthansa', LX: 'Swiss', QR: 'Qatar Airways',
    EK: 'Emirates', EY: 'Etihad', TK: 'Turkish Airlines', SQ: 'Singapore Airlines', CX: 'Cathay Pacific',
    AK: 'AirAsia', MH: 'Malaysia Airlines', UL: 'SriLankan', AI: 'Air India', EW: 'Eurowings'
  };

  const TYPES = {
    flight: { icon: '✈️', label: 'Flug', plural: 'Flüge' },
    hotel: { icon: '🏨', label: 'Unterkunft', plural: 'Unterkünfte' },
    transport: { icon: '🚌', label: 'Transport', plural: 'Transport' },
    activity: { icon: '🎟️', label: 'Aktivität', plural: 'Aktivitäten' }
  };
  const TRANSPORT_ICONS = {
    'Bus': '🚌', 'Minivan': '🚐', 'Zug': '🚆', 'Fähre / Boot': '⛴️',
    'Transfer': '🚗', 'Taxi / Grab': '🚕', 'Sonstiges': '🧭'
  };

  const FIELDS = {
    flight: [
      { row: [{ k: 'flightNo', label: 'Flugnummer', req: true, ph: 'TG 921', upper: true }, { k: 'date', label: 'Datum', type: 'date', req: true }] },
      { k: 'airline', label: 'Airline', ph: 'wird bei bekannter Flugnummer ergänzt' },
      { row: [{ k: 'from', label: 'Von (Code)', ph: 'VIE', upper: true }, { k: 'to', label: 'Nach (Code)', ph: 'BKK', upper: true }] },
      { row: [{ k: 'depTime', label: 'Abflug', type: 'time' }, { k: 'arrTime', label: 'Ankunft', type: 'time' }] },
      { row: [{ k: 'pnr', label: 'Buchungscode', upper: true }, { k: 'seat', label: 'Sitz', upper: true }] },
      { row: [{ k: 'terminal', label: 'Terminal / Gate' }, { k: 'passenger', label: 'Passagier' }] },
      { k: 'notes', label: 'Notizen', type: 'textarea', ph: 'Gepäck, Check-in, Umstieg…' }
    ],
    hotel: [
      { k: 'name', label: 'Name der Unterkunft', req: true },
      { k: 'city', label: 'Ort', ph: 'z. B. Krabi' },
      { row: [{ k: 'date', label: 'Check-in', type: 'date', req: true }, { k: 'endDate', label: 'Check-out', type: 'date' }] },
      { k: 'address', label: 'Adresse (gern auch auf Thai – zum Zeigen für Fahrer)', type: 'textarea', rows: 2 },
      { k: 'phone', label: 'Telefon', type: 'tel' },
      { k: 'ref', label: 'Buchungsnummer' },
      { k: 'url', label: 'Link zur Buchung', type: 'url', ph: 'https://…' },
      { k: 'notes', label: 'Notizen', type: 'textarea' }
    ],
    transport: [
      { k: 'kind', label: 'Art', type: 'select', options: Object.keys(TRANSPORT_ICONS) },
      { row: [{ k: 'from', label: 'Von', req: true }, { k: 'to', label: 'Nach', req: true }] },
      { row: [{ k: 'date', label: 'Datum', type: 'date', req: true }, { k: 'time', label: 'Abfahrt', type: 'time' }] },
      { k: 'provider', label: 'Anbieter', ph: 'z. B. 12Go, Lomprayah' },
      { k: 'ref', label: 'Buchungsnummer' },
      { k: 'meeting', label: 'Treffpunkt / Abholung' },
      { k: 'url', label: 'Link zum Ticket', type: 'url', ph: 'https://…' },
      { k: 'notes', label: 'Notizen', type: 'textarea' }
    ],
    activity: [
      { k: 'title', label: 'Was?', req: true, ph: 'z. B. Kochkurs, Inselhopping' },
      { k: 'place', label: 'Ort / Treffpunkt' },
      { row: [{ k: 'date', label: 'Datum', type: 'date', req: true }, { k: 'time', label: 'Uhrzeit', type: 'time' }] },
      { k: 'ref', label: 'Buchungsnummer' },
      { k: 'url', label: 'Link', type: 'url', ph: 'https://…' },
      { k: 'notes', label: 'Notizen', type: 'textarea' }
    ]
  };

  // ---------- Daten ----------
  let bookings = store.get('bookings', null);
  if (!bookings) {
    // Übernahme der Stationen aus der ersten App-Version
    bookings = store.get('plan', []).map((s) => ({
      id: s.id, type: 'hotel', name: s.stay || s.place, city: s.stay ? s.place : '',
      date: s.from, endDate: s.to || '', notes: s.notes || ''
    }));
    store.set('bookings', bookings);
  }
  const save = () => store.set('bookings', bookings);

  const localISO = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const todayISO = () => localISO(new Date());
  const fmtDay = (iso, opts) => new Date(iso + 'T00:00').toLocaleDateString('de-AT', opts || { weekday: 'short', day: 'numeric', month: 'short' });
  const nightsOf = (b) => (b.endDate ? Math.round((new Date(b.endDate + 'T00:00') - new Date(b.date + 'T00:00')) / 86400000) : 0);
  const startTime = (b) => b.depTime || b.time || (b.type === 'hotel' ? '14:00' : '');
  const sortKey = (b) => b.date + 'T' + (startTime(b) || '12:00');
  const endDateOf = (b) => (b.type === 'hotel' && b.endDate) ? b.endDate : b.date;
  const isPast = (b) => endDateOf(b) < todayISO();
  const airportName = (code) => AIRPORTS[(code || '').toUpperCase()] || '';
  const flightKey = (no) => (no || '').replace(/\s+/g, '').toUpperCase();

  function titleOf(b) {
    if (b.type === 'flight') return `${b.flightNo}${b.from && b.to ? ' · ' + b.from + ' → ' + b.to : ''}`;
    if (b.type === 'hotel') return b.name;
    if (b.type === 'transport') return `${b.from} → ${b.to}`;
    return b.title;
  }
  function iconOf(b) {
    return b.type === 'transport' ? (TRANSPORT_ICONS[b.kind] || '🚌') : TYPES[b.type].icon;
  }

  // ---------- Darstellung ----------
  let filter = store.get('planFilter', 'all');
  let showPast = false;

  function copyChip(label, value) {
    if (!value) return null;
    return h('button', {
      class: 'info-chip', type: 'button', title: 'Antippen zum Kopieren',
      onclick: () => {
        if (navigator.clipboard) navigator.clipboard.writeText(value).then(() => toast(label + ' kopiert'), () => {});
      }
    }, h('small', { text: label }), value);
  }
  const linkBtn = (text, href) => h('a', { class: 'btn small', href, target: '_blank', rel: 'noopener' }, text);
  const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

  function card(b) {
    const past = isPast(b);
    const today = todayISO();
    const now = b.type === 'hotel' ? (b.date <= today && today <= endDateOf(b)) : b.date === today;
    const meta = [];
    let main, sub = [], chips = [], actions = [];

    if (b.type === 'flight') {
      meta.push(b.flightNo, b.airline);
      main = h('div', { class: 'route' },
        h('div', {}, h('b', { text: b.from || '—' }), h('small', { text: airportName(b.from) })),
        h('span', { class: 'route-arrow', text: '✈' }),
        h('div', {}, h('b', { text: b.to || '—' }), h('small', { text: airportName(b.to) }))
      );
      if (b.depTime || b.arrTime) {
        const nextDay = b.depTime && b.arrTime && b.arrTime < b.depTime ? ' (+1)' : '';
        sub.push(`🕑 ${b.depTime || '?'} → ${b.arrTime || '?'}${nextDay} (Ortszeit)`);
      }
      chips = [copyChip('Buchung', b.pnr), copyChip('Sitz', b.seat), copyChip('Terminal/Gate', b.terminal), copyChip('Passagier', b.passenger)];
      actions.push(linkBtn('📡 Flugstatus', 'https://www.flightradar24.com/data/flights/' + flightKey(b.flightNo).toLowerCase()));
    } else if (b.type === 'hotel') {
      const n = nightsOf(b);
      meta.push(b.city);
      main = h('div', { class: 'card-title', text: b.name });
      sub.push(`Check-in ${fmtDay(b.date)}${b.endDate ? ' → Check-out ' + fmtDay(b.endDate) : ''}${n ? ` · ${n} ${n === 1 ? 'Nacht' : 'Nächte'}` : ''}`);
      if (b.address) sub.push('📍 ' + b.address);
      chips = [copyChip('Buchung', b.ref)];
      actions.push(linkBtn('🗺 Karte', mapsUrl(b.address || [b.name, b.city].filter(Boolean).join(', '))));
      if (b.phone) actions.push(h('a', { class: 'btn small', href: 'tel:' + b.phone.replace(/[^\d+]/g, '') }, '📞 Anrufen'));
      actions.push(h('button', { class: 'btn small', type: 'button', onclick: () => showForDriver(b) }, '🚕 Fahrer zeigen'));
      if (b.url) actions.push(linkBtn('🔗 Buchung', b.url));
    } else if (b.type === 'transport') {
      meta.push(b.kind, b.provider);
      main = h('div', { class: 'card-title', text: `${b.from} → ${b.to}` });
      if (b.time) sub.push('🕑 Abfahrt ' + b.time);
      if (b.meeting) sub.push('📍 ' + b.meeting);
      chips = [copyChip('Buchung', b.ref)];
      if (b.meeting) actions.push(linkBtn('🗺 Treffpunkt', mapsUrl(b.meeting)));
      if (b.url) actions.push(linkBtn('🎫 Ticket', b.url));
    } else {
      main = h('div', { class: 'card-title', text: b.title });
      if (b.time) sub.push('🕑 ' + b.time);
      if (b.place) sub.push('📍 ' + b.place);
      chips = [copyChip('Buchung', b.ref)];
      if (b.place) actions.push(linkBtn('🗺 Karte', mapsUrl(b.place)));
      if (b.url) actions.push(linkBtn('🔗 Link', b.url));
    }

    return h('div', { class: `card booking ${b.type}${past ? ' past' : ''}${now ? ' now' : ''}` },
      h('div', { class: 'booking-meta' },
        h('span', { class: 'booking-icon', text: iconOf(b) }),
        h('span', { text: [TYPES[b.type].label, ...meta].filter(Boolean).join(' · ') }),
        now ? h('span', { class: 'now-badge', text: b.type === 'hotel' ? 'Aktuell' : 'Heute' }) : null,
        h('button', { class: 'mini-btn', type: 'button', 'aria-label': 'Bearbeiten', onclick: () => openForm(b.type, b) }, '✎'),
        h('button', {
          class: 'mini-btn', type: 'button', 'aria-label': 'Löschen',
          onclick: () => {
            if (!confirm(`„${titleOf(b)}“ löschen?`)) return;
            bookings = bookings.filter((x) => x.id !== b.id); save(); render();
          }
        }, '🗑')
      ),
      main,
      sub.map((t) => h('div', { class: 'booking-sub', text: t })),
      chips.some(Boolean) ? h('div', { class: 'chip-row' }, chips) : null,
      b.notes ? h('div', { class: 'stop-notes', text: b.notes }) : null,
      actions.length ? h('div', { class: 'booking-actions' }, actions) : null
    );
  }

  function renderFilter() {
    const counts = {};
    for (const b of bookings) counts[b.type] = (counts[b.type] || 0) + 1;
    const opts = [['all', 'Alle', bookings.length], ...Object.entries(TYPES).map(([k, t]) => [k, t.icon + ' ' + t.plural, counts[k] || 0])];
    $('#plan-filter').replaceChildren(...opts.map(([k, label, n]) => h('button', {
      class: 'chip alt', type: 'button', role: 'tab', 'aria-selected': String(filter === k),
      onclick: () => { filter = k; store.set('planFilter', k); render(); }
    }, `${label} (${n})`)));
  }

  function render() {
    bookings.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    renderFilter();
    const filtered = bookings.filter((b) => filter === 'all' || b.type === filter);
    const pastCount = filtered.filter(isPast).length;
    const visible = filtered.filter((b) => showPast || !isPast(b));
    const toggle = $('#plan-past-toggle');
    toggle.hidden = pastCount === 0;
    toggle.textContent = showPast ? 'Vergangene ausblenden' : `Vergangene anzeigen (${pastCount})`;

    const list = $('#plan-list');
    if (!visible.length) {
      list.replaceChildren(h('div', { class: 'card empty' },
        h('span', { class: 'big', text: '🗺️' }),
        bookings.length ? 'Keine kommenden Einträge in dieser Ansicht.' : 'Noch nichts geplant. Füge oben Flüge, Unterkünfte, Transport oder Aktivitäten hinzu – oder scanne eine Bordkarte.'));
    } else {
      const today = todayISO();
      const tomorrow = localISO(new Date(Date.now() + 86400000));
      const out = [];
      let lastDay = null;
      for (const b of visible) {
        if (b.date !== lastDay) {
          lastDay = b.date;
          const rel = b.date === today ? 'Heute · ' : b.date === tomorrow ? 'Morgen · ' : '';
          out.push(h('div', { class: 'day-head', text: rel + fmtDay(b.date, { weekday: 'long', day: 'numeric', month: 'long' }) }));
        }
        out.push(card(b));
      }
      list.replaceChildren(...out);
    }
    renderNextUp();
  }

  // "Als Nächstes" auf der Startseite
  function renderNextUp() {
    const box = $('#next-up');
    const upcoming = bookings.filter((b) => !isPast(b)).slice(0, 3);
    if (!upcoming.length) { box.replaceChildren(); return; }
    box.replaceChildren(h('div', { class: 'card' },
      h('h2', { text: 'Als Nächstes' }),
      h('div', { class: 'next-list' }, upcoming.map((b) => h('button', {
        class: 'next-item', type: 'button',
        onclick: () => { history.replaceState(null, '', '#plan'); $('.tabbar [data-tab="plan"]').click(); }
      },
        h('span', { class: 'booking-icon', text: iconOf(b) }),
        h('span', { class: 'next-text' },
          h('b', { text: titleOf(b) }),
          h('small', { text: fmtDay(b.date) + (startTime(b) && b.type !== 'hotel' ? ', ' + startTime(b) : '') })
        )
      )))
    ));
  }

  // ---------- Formular ----------
  const dlg = $('#booking-dialog');
  let editing = null; // { type, id }

  function fieldEl(f, data) {
    const id = 'bf-' + f.k;
    const val = data[f.k] || '';
    let input;
    if (f.type === 'textarea') input = h('textarea', { id, rows: f.rows || 3, placeholder: f.ph });
    else if (f.type === 'select') input = h('select', { id }, f.options.map((o) => h('option', { value: o, text: o })));
    else input = h('input', { id, type: f.type || 'text', placeholder: f.ph, autocomplete: 'off', required: f.req, autocapitalize: f.upper ? 'characters' : null });
    input.value = val || (f.type === 'select' ? f.options[0] : '');
    return h('label', {}, f.label + (f.req ? ' *' : ''), input);
  }

  function openForm(type, data) {
    editing = { type, id: data && data.id };
    $('#booking-title').textContent = (data && data.id ? 'Bearbeiten: ' : 'Neu: ') + TYPES[type].label;
    const d = { ...(data || {}) };
    if (!d.date) {
      const trip = store.get('trip', {});
      const last = bookings.filter((b) => !isPast(b)).slice(-1)[0];
      d.date = last ? endDateOf(last) : (trip.start || '').slice(0, 10);
    }
    $('#booking-fields').replaceChildren(...FIELDS[type].map((f) => (f.row
      ? h('div', { class: 'two-col' }, f.row.map((x) => fieldEl(x, d)))
      : fieldEl(f, d))));
    dlg.showModal();
  }

  const allFields = (type) => FIELDS[type].flatMap((f) => f.row || [f]);

  $('#booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const { type, id } = editing;
    const data = { type };
    for (const f of allFields(type)) {
      let v = $('#bf-' + f.k).value.trim();
      if (f.upper) v = v.toUpperCase();
      data[f.k] = v;
    }
    if (type === 'hotel' && data.endDate && data.endDate < data.date) { toast('Check-out liegt vor Check-in'); return; }
    if (type === 'flight') {
      data.flightNo = data.flightNo.replace(/^([A-Z0-9]{2})\s*0*(\d)/, '$1 $2');
      if (!data.airline) data.airline = AIRLINES[data.flightNo.slice(0, 2)] || '';
    }
    if (id) Object.assign(bookings.find((b) => b.id === id), data);
    else bookings.push({ id: uid(), ...data });
    save(); render(); dlg.close();
    toast('Gespeichert');
  });
  $('#booking-cancel').addEventListener('click', () => dlg.close());
  for (const b of $$('[data-add]')) b.addEventListener('click', () => openForm(b.dataset.add, null));
  $('#plan-past-toggle').addEventListener('click', () => { showPast = !showPast; render(); });

  // ---------- Fahrer-Ansicht ----------
  function showForDriver(b) {
    $('#show-label').textContent = 'กรุณาพาไปที่ · Bitte bringen Sie mich zu:';
    $('#show-name').textContent = b.name;
    $('#show-text').textContent = [b.address, b.city, b.phone ? '☎ ' + b.phone : ''].filter(Boolean).join('\n');
    $('#show-dialog').showModal();
  }
  $('#show-close').addEventListener('click', () => $('#show-dialog').close());

  // ---------- Bordkarte (IATA BCBP) ----------
  function julianToISO(jd) {
    const n = parseInt(jd, 10);
    if (!(n >= 1 && n <= 366)) return '';
    const now = new Date();
    let d = new Date(now.getFullYear(), 0, n);
    if (d < new Date(now.getTime() - 60 * 86400000)) d = new Date(now.getFullYear() + 1, 0, n);
    return localISO(d);
  }

  function parseBCBP(raw) {
    raw = (raw || '').replace(/\r?\n/g, '');
    if (!/^M[1-4]/.test(raw) || raw.length < 60) return null;
    const legsCount = Number(raw[1]);
    const passenger = raw.slice(2, 22).trim();
    const legs = [];
    let pos = 23;
    const take = (len) => { const v = raw.substr(pos, len); pos += len; return v; };
    for (let i = 0; i < legsCount && raw.length >= pos + 37; i++) {
      const pnr = take(7).trim(), from = take(3).trim(), to = take(3).trim();
      const carrier = take(3).trim(), number = take(5).trim(), jd = take(3);
      take(1); // Beförderungsklasse
      const seat = take(4).trim().replace(/^0+/, '');
      take(5); take(1); // Check-in-Nummer, Status
      const varSize = parseInt(take(2), 16) || 0;
      pos += varSize; // variabler Teil überspringen
      if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) break;
      legs.push({
        type: 'flight',
        flightNo: `${carrier} ${number.replace(/^0+/, '')}`,
        airline: AIRLINES[carrier] || '',
        from, to, date: julianToISO(jd), pnr, seat, passenger,
        depTime: '', arrTime: '', terminal: '', notes: ''
      });
    }
    return legs.length ? legs : null;
  }

  function addScannedLegs(legs) {
    let added = 0, updated = 0;
    for (const leg of legs) {
      const existing = bookings.find((b) => b.type === 'flight' && flightKey(b.flightNo) === flightKey(leg.flightNo)
        && b.date === leg.date && (!b.passenger || b.passenger === leg.passenger));
      if (existing) {
        for (const k of ['pnr', 'seat', 'passenger', 'from', 'to', 'airline']) if (leg[k]) existing[k] = leg[k];
        updated++;
      } else { bookings.push({ id: uid(), ...leg }); added++; }
    }
    save(); render();
    const last = bookings.find((b) => b.type === 'flight' && flightKey(b.flightNo) === flightKey(legs[0].flightNo) && b.date === legs[0].date);
    toast(added ? `${added} Flug${added > 1 ? 'e' : ''} hinzugefügt – Uhrzeiten ergänzen` : `${updated} Flug aktualisiert`);
    if (legs.length === 1 && last) openForm('flight', last);
  }

  // Scanner
  const scanDlg = $('#scan-dialog');
  const video = $('#scan-video');
  let stream = null, detector = null, scanning = false;

  async function getDetector() {
    if (detector) return detector;
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const formats = ['pdf417', 'aztec', 'qr_code', 'data_matrix'].filter((f) => supported.includes(f));
    detector = new window.BarcodeDetector({ formats });
    return detector;
  }

  function stopCamera() {
    scanning = false;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    video.srcObject = null;
  }

  function handleCodes(codes) {
    for (const c of codes) {
      const legs = parseBCBP(c.rawValue);
      if (legs) { stopCamera(); scanDlg.close(); addScannedLegs(legs); return true; }
    }
    if (codes.length) $('#scan-status').textContent = 'Code erkannt, aber keine Bordkarte. Anderen Code versuchen.';
    return false;
  }

  async function loop() {
    if (!scanning) return;
    try {
      if (video.readyState >= 2 && handleCodes(await detector.detect(video))) return;
    } catch (e) { /* nächster Versuch */ }
    setTimeout(loop, 250);
  }

  $('#scan-start').addEventListener('click', async () => {
    if (!('BarcodeDetector' in window)) {
      alert('Scannen wird von diesem Browser nicht unterstützt. Am Android-Handy funktioniert es in Chrome. Du kannst den Flug aber manuell eintragen.');
      openForm('flight', null);
      return;
    }
    $('#scan-status').textContent = 'Barcode der Bordkarte (QR, Aztec oder PDF417) ins Bild halten.';
    scanDlg.showModal();
    try {
      await getDetector();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 } } });
      video.srcObject = stream;
      await video.play();
      scanning = true;
      loop();
    } catch (e) {
      $('#scan-status').textContent = 'Kamera nicht verfügbar. Wähle stattdessen einen Screenshot der Bordkarte.';
    }
  });

  $('#scan-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const d = await getDetector();
      const img = await createImageBitmap(file);
      const codes = await d.detect(img);
      if (!handleCodes(codes) && !codes.length) $('#scan-status').textContent = 'Kein Barcode im Bild gefunden. Ausschnitt mit dem Barcode größer machen.';
    } catch (err) {
      $('#scan-status').textContent = 'Bild konnte nicht gelesen werden.';
    }
  });

  $('#scan-cancel').addEventListener('click', () => { stopCamera(); scanDlg.close(); });
  scanDlg.addEventListener('close', stopCamera);

  // Für Tests und Datensicherung
  window.TC.parseBCBP = parseBCBP;

  render();
  setInterval(render, 10 * 60 * 1000);
})();
