// Import von Buchungsbestätigungen (PDF, Bild, Text oder über "Teilen" aus anderen Apps).
// Die Erkennung arbeitet mit Mustern – Ergebnisse werden immer zur Kontrolle angezeigt.
(() => {
  'use strict';
  const { $, $$, h, toast } = window.TC;

  // ---------- Datum & Uhrzeit ----------
  const MONTHS = {
    jan: 1, januar: 1, january: 1, 'jän': 1, 'jänner': 1, feb: 2, februar: 2, february: 2,
    mar: 3, 'mär': 3, 'märz': 3, maerz: 3, march: 3, apr: 4, april: 4, mai: 5, may: 5,
    jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, oct: 10, october: 10,
    nov: 11, november: 11, dez: 12, dezember: 12, dec: 12, december: 12
  };
  const MON = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
  const pad = (n) => String(n).padStart(2, '0');

  function inferYear(m, d) {
    const now = new Date();
    let y = now.getFullYear();
    if (new Date(y, m - 1, d) < new Date(now.getTime() - 60 * 86400000)) y++;
    return y;
  }
  function mkDate(y, m, d) {
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
    if (!y) y = inferYear(m, d);
    else if (y < 100) y += 2000;
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  const DATE_PATTERNS = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/, (x) => mkDate(+x[1], +x[2], +x[3])],
    [/\b(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})\b/, (x) => mkDate(+x[3], +x[2], +x[1])],
    [new RegExp(`\\b(\\d{1,2})\\.?\\s*(${MON})\\.?,?\\s*(\\d{4})?(?![\\d:])`, 'i'), (x) => mkDate(x[3] ? +x[3] : 0, MONTHS[x[2].toLowerCase()], +x[1])],
    [new RegExp(`\\b(${MON})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b,?\\s*(\\d{4})?`, 'i'), (x) => mkDate(x[3] ? +x[3] : 0, MONTHS[x[1].toLowerCase()], +x[2])],
    [new RegExp(`\\b(\\d{2})(${MON})(\\d{2})?\\b`, 'i'), (x) => mkDate(x[3] ? +x[3] : 0, MONTHS[x[2].toLowerCase()], +x[1])]
  ];
  // Erstes Datum im Text (frühester Treffer aller Muster)
  function findDate(s) {
    let best = null;
    for (const [re, fn] of DATE_PATTERNS) {
      const x = re.exec(s);
      if (!x) continue;
      const v = fn(x);
      if (v && (!best || x.index < best.index)) best = { index: x.index, value: v, end: x.index + x[0].length };
    }
    return best;
  }
  function findTimes(s) {
    const out = [];
    const re = /\b(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?|uhr)?(?![\d.])|\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/gi;
    let x;
    while ((x = re.exec(s))) {
      let hh = +(x[1] || x[4]), mm = x[2] ? +x[2] : 0;
      const ap = (x[3] || x[5] || '').toLowerCase().replace(/\./g, '');
      if (x[2] && !ap && s[x.index + x[1].length] === '.') continue; // 11.12 ist eher ein Datum
      if (ap === 'pm' && hh < 12) hh += 12;
      if (ap === 'am' && hh === 12) hh = 0;
      if (hh > 23 || mm > 59) continue;
      out.push({ index: x.index, value: `${pad(hh)}:${pad(mm)}` });
    }
    return out;
  }

  // ---------- Unterkunft ----------
  const CI = /check-?\s?in|anreise|arrival|einchecken/gi;
  const CO = /check-?\s?out|abreise|auschecken/gi;
  const PLACES = ['Bangkok', 'Chiang Mai', 'Chiang Rai', 'Phuket', 'Patong', 'Kata', 'Karon', 'Krabi', 'Ao Nang', 'Railay',
    'Koh Phi Phi', 'Phi Phi', 'Koh Lanta', 'Koh Samui', 'Koh Phangan', 'Koh Tao', 'Koh Chang', 'Koh Lipe', 'Koh Yao',
    'Khao Lak', 'Khao Sok', 'Pattaya', 'Hua Hin', 'Ayutthaya', 'Kanchanaburi', 'Sukhothai', 'Pai', 'Chiang Dao',
    'Udon Thani', 'Khon Kaen', 'Surat Thani', 'Trang', 'Hat Yai', 'Nan', 'Lampang', 'Mae Hong Son', 'Koh Kood', 'Koh Mak'];

  function windowAfter(text, re, stopRe) {
    const hits = [];
    re.lastIndex = 0;
    let x;
    while ((x = re.exec(text))) {
      const startIdx = x.index + x[0].length;
      let w = text.slice(startIdx, startIdx + 180);
      stopRe.lastIndex = 0;
      const stop = stopRe.exec(w);
      if (stop) w = w.slice(0, stop.index);
      hits.push(w);
    }
    return hits;
  }
  function dateAndTime(text, re, stopRe) {
    for (const w of windowAfter(text, re, stopRe)) {
      const d = findDate(w);
      if (d) {
        const t = findTimes(w).find((tt) => tt.index >= d.end || tt.index < d.index);
        return { date: d.value, time: t ? t.value : '' };
      }
    }
    return null;
  }
  const lineAfter = (text, re) => {
    const x = re.exec(text);
    if (!x) return '';
    const rest = text.slice(x.index + x[0].length);
    const first = rest.split('\n')[0].trim();
    return first || (rest.split('\n')[1] || '').trim();
  };

  function parseHotel(text) {
    CI.lastIndex = 0; CO.lastIndex = 0;
    if (!CI.test(text) || !CO.test(text)) return null;
    const ci = dateAndTime(text, CI, new RegExp(CO.source, 'gi'));
    const co = dateAndTime(text, CO, new RegExp(CI.source, 'gi'));
    if (!ci) return null;
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Adresse
    let address = '';
    const addrIdx = lines.findIndex((l) => /^(?:hotel |property |unterkunfts?)?(?:address|adresse|anschrift)\b/i.test(l));
    if (addrIdx >= 0) {
      address = lines[addrIdx].replace(/^(?:hotel |property |unterkunfts?)?(?:address|adresse|anschrift)\s*[:：]?\s*/i, '');
      if (!address) address = lines[addrIdx + 1] || '';
      const next = lines[addrIdx + (lines[addrIdx].replace(/^[^:：]*[:：]?/, '').trim() ? 1 : 2)] || '';
      if (next && /thailand|\b\d{5}\b/i.test(next) && !/[:：]/.test(next) && !address.includes(next)) address += ', ' + next;
    } else {
      address = lines.find((l) => /thailand/i.test(l) && /\d/.test(l) && l.length < 160) || '';
    }

    // Name
    let name = '';
    const nameRes = [
      /(?:property name|hotel name|name der unterkunft|unterkunftsname)\s*[:：]?\s*(.+)/i,
      /(?:your|ihre) (?:booking|reservation|buchung|reservierung) (?:in der unterkunft|in der|at|in|bei|im|für|for) (.+?)(?: (?:is|ist|wurde) (?:confirmed|bestätigt)|[.!\n])/i,
      /^(?:property|hotel|unterkunft)\s*[:：]\s*(.+)/im
    ];
    for (const re of nameRes) { const x = re.exec(text); if (x && x[1].trim().length > 1) { name = x[1].trim(); break; } }
    if (!name && addrIdx > 0) {
      const prev = lines[addrIdx - 1];
      if (prev.length < 70 && !/[:：]/.test(prev)) name = prev;
    }
    if (!name) {
      // letzte "Titelzeile" vor dem ersten Check-in (z. B. Airbnb)
      const ciLine = lines.findIndex((l) => new RegExp(CI.source, 'i').test(l));
      const cand = lines.slice(0, Math.max(0, ciLine)).filter((l) => l.length > 3 && l.length < 70 && !/[:：!?.]|confirm|bestätig|reserv|buchung|booking/i.test(l));
      if (cand.length) name = cand[cand.length - 1];
    }
    name = name.replace(/\s{2,}/g, ' ').slice(0, 90);

    // Telefon: bevorzugt thailändische Nummern
    let phone = '';
    const thai = /(?:\+66|0066)[\s\-()]*\d[\d\s\-()]{6,14}\d/.exec(text);
    if (thai) phone = thai[0];
    else {
      const x = /(?:phone|telefon|telephone|tel\.?|contact number|kontaktnummer)[^\d+\n]{0,30}(\+?\d[\d\s\-()]{7,16}\d)/i.exec(text);
      if (x) phone = x[1];
    }
    phone = phone.replace(/\s{2,}/g, ' ').trim();

    const refX = /(?:booking (?:id|number|no\.?|reference)|confirmation (?:number|no\.?|code)|reservation (?:number|no\.?|id|code)|buchungsnummer|bestätigungsnummer|reservierungsnummer|buchungs-?id|itinerary (?:number|no\.?))\s*[:：#]?\s*([A-Z0-9][A-Z0-9.\-]{3,})/i.exec(text);
    const pin = /\bpin(?:[- ]?code)?\s*[:：]?\s*(\d{4,6})\b/i.exec(text);

    const hay = address + '\n' + name + '\n' + text;
    const city = PLACES.find((p) => new RegExp('\\b' + p.replace(/ /g, '\\s+') + '\\b', 'i').test(hay)) || '';

    return {
      type: 'hotel', name, city, address: address.slice(0, 200), phone,
      date: ci.date, checkinTime: ci.time,
      endDate: co ? co.date : '', checkoutTime: co ? co.time : '',
      ref: refX ? refX[1] : '', notes: pin ? 'PIN: ' + pin[1] : ''
    };
  }

  // ---------- Flüge (Text aus E-Ticket / Bestätigung) ----------
  const NOT_AIRPORTS = new Set(['THB', 'EUR', 'USD', 'PNR', 'PDF', 'VAT', 'MWST', 'TAX', 'FEE', 'ADT', 'CHD', 'INF', 'OK', 'NON', 'REF', 'CLASS', 'ECO', 'BAG', 'KG', 'PCS', 'MR', 'MRS', 'MS']);
  function parseFlights(text) {
    const P = window.TC.plan;
    const out = [];
    const seen = new Set();
    const re = /\b([A-Z]{2}|[A-Z]\d|\d[A-Z])\s?(\d{2,4})\b/g;
    let x;
    while ((x = re.exec(text))) {
      const carrier = x[1], num = String(+x[2]);
      const before = text.slice(Math.max(0, x.index - 25), x.index);
      if (!P.AIRLINES[carrier] && !/flug|flight/i.test(before)) continue;
      const key = carrier + num;
      if (seen.has(key)) continue;
      const after = text.slice(x.index + x[0].length, x.index + x[0].length + 260);
      const back = text.slice(Math.max(0, x.index - 160), x.index);
      const codes = [];
      for (const part of [after, back]) {
        const cre = /\(([A-Z]{3})\)|\b([A-Z]{3})\b/g;
        let c;
        while ((c = cre.exec(part)) && codes.length < 2) {
          const code = c[1] || c[2];
          if (NOT_AIRPORTS.has(code) || codes.includes(code)) continue;
          if (c[1] || P.AIRPORTS[code]) codes.push(code);
        }
        if (codes.length >= 2) break;
      }
      const d = findDate(after) || findDate(back);
      if (!d) continue;
      // Uhrzeiten nach dem Datum bzw. nach der Flugnummer
      const times = findTimes(after).map((t) => t.value);
      seen.add(key);
      out.push({
        type: 'flight', flightNo: `${carrier} ${num}`, airline: P.AIRLINES[carrier] || '',
        from: codes[0] || '', to: codes[1] || '', date: d.value,
        depTime: times[0] || '', arrTime: times[1] || '', pnr: '', seat: '', terminal: '', passenger: '', notes: ''
      });
    }
    const pnr = /(?:booking (?:reference|code|number|no\.?)|buchungs(?:code|nummer|referenz)|\bpnr\b|reservation code|record locator|confirmation code|filekey)\s*[:：#]?\s*([A-Z0-9]{6})\b/i.exec(text);
    if (pnr) out.forEach((f) => { f.pnr = pnr[1].toUpperCase(); });
    return out;
  }

  window.TC.parse = { findDate, findTimes, parseHotel, parseFlights };

  // ---------- Dateien analysieren ----------
  async function detector() {
    if (!('BarcodeDetector' in window)) return null;
    const supported = await window.BarcodeDetector.getSupportedFormats();
    return new window.BarcodeDetector({ formats: ['pdf417', 'aztec', 'qr_code', 'data_matrix'].filter((f) => supported.includes(f)) });
  }
  async function barcodeLegs(sources) {
    const det = await detector().catch(() => null);
    if (!det) return [];
    const legs = [];
    for (const src of sources) {
      try {
        for (const c of await det.detect(src)) {
          const l = window.TC.plan.parseBCBP(c.rawValue);
          if (l) legs.push(...l);
        }
      } catch (e) { /* nächste Quelle */ }
    }
    return legs;
  }

  async function analyse({ files = [], text = '', url = '', title = '' }) {
    const F = window.TC.files;
    let all = [title, text, url].filter(Boolean).join('\n');
    const images = [];
    for (const f of files) {
      try {
        if (F.isPdf(f)) {
          all += '\n' + await F.pdfText(f);
          if ('BarcodeDetector' in window) images.push(...await F.pdfCanvases(f));
        } else if (F.isImage(f)) {
          images.push(await createImageBitmap(f));
        } else if ((f.type || '').startsWith('text/') || /\.(txt|eml|html?)$/i.test(f.name)) {
          all += '\n' + (await f.text()).replace(/<[^>]+>/g, ' ');
        }
      } catch (e) { /* Datei trotzdem als Anhang nutzbar */ }
    }
    const legs = await barcodeLegs(images);
    const textFlights = parseFlights(all);
    let flights = legs;
    if (legs.length) {
      // Uhrzeiten aus dem Text ergänzen
      for (const l of legs) {
        const t = textFlights.find((f) => f.flightNo.replace(' ', '') === l.flightNo.replace(' ', ''));
        if (t) { l.depTime = l.depTime || t.depTime; l.arrTime = l.arrTime || t.arrTime; if (!l.date) l.date = t.date; }
      }
    } else flights = textFlights;
    const hotel = parseHotel(all);
    return { flights, hotel, url, title, textFound: all.trim().length > 20 };
  }

  // ---------- Dialog ----------
  const dlg = $('#import-dialog');
  let pending = { files: [], url: '', title: '' };

  function showStart() {
    pending = { files: [], url: '', title: '' };
    $('#import-start').hidden = false;
    $('#import-result').replaceChildren();
    $('#import-status').textContent = '';
    $('#import-text').value = '';
    if (!dlg.open) dlg.showModal();
  }

  async function run(input) {
    pending = { files: input.files || [], url: input.url || '', title: input.title || '' };
    $('#import-start').hidden = true;
    $('#import-result').replaceChildren();
    $('#import-status').textContent = '⏳ Wird analysiert…';
    if (!dlg.open) dlg.showModal();
    let res;
    try { res = await analyse(input); } catch (e) { res = { flights: [], hotel: null, textFound: false }; }
    $('#import-status').textContent = '';
    renderResult(res);
  }

  function fileNote() {
    const n = pending.files.length;
    return n ? h('p', { class: 'hint', text: `📎 ${n === 1 ? pending.files[0].name : n + ' Dateien'} ${n === 1 ? 'wird' : 'werden'} an die Buchung angehängt.` }) : null;
  }

  function renderResult(res) {
    const P = window.TC.plan;
    const box = $('#import-result');
    const parts = [];

    if (res.flights.length) {
      parts.push(h('h3', { text: `✈️ ${res.flights.length === 1 ? 'Flug' : res.flights.length + ' Flüge'} erkannt` }),
        h('div', { class: 'check-list', id: 'import-flights' }, res.flights.map((f, i) => h('label', { class: 'check-row' },
          h('input', { type: 'checkbox', value: String(i), checked: true }),
          h('span', { class: 'check-text' },
            h('b', { text: `${f.flightNo} · ${f.from || '?'} → ${f.to || '?'}` }),
            h('small', { text: `${P.fmtDay(f.date)}${f.depTime ? ', ' + f.depTime : ''}${f.arrTime ? ' → ' + f.arrTime : ''}${f.pnr ? ' · ' + f.pnr : ''}` }))
        ))),
        h('button', {
          class: 'btn primary block', type: 'button',
          onclick: () => {
            const idx = [...$$('#import-flights input:checked')].map((x) => +x.value);
            if (!idx.length) { toast('Nichts ausgewählt'); return; }
            dlg.close();
            P.addFlights(idx.map((i) => res.flights[i]), pending.files);
          }
        }, 'Flüge übernehmen'));
    }

    if (res.hotel) {
      const ho = res.hotel;
      const rows = [
        ['Unterkunft', ho.name || '–'], ['Ort', ho.city],
        ['Check-in', P.fmtDay(ho.date) + (ho.checkinTime ? ' ab ' + ho.checkinTime : '')],
        ['Check-out', ho.endDate ? P.fmtDay(ho.endDate) + (ho.checkoutTime ? ' bis ' + ho.checkoutTime : '') : '–'],
        ['Adresse', ho.address], ['Telefon', ho.phone], ['Buchungsnr.', ho.ref]
      ].filter((r) => r[1]);
      parts.push(h('h3', { text: '🏨 Unterkunft erkannt' }),
        h('dl', { class: 'import-dl' }, rows.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])),
        h('button', {
          class: 'btn primary block', type: 'button',
          onclick: () => { dlg.close(); P.openForm('hotel', { ...ho, url: pending.url || '' }, pending.files, true); }
        }, 'Prüfen & speichern'));
    }

    if (!res.flights.length && !res.hotel) {
      parts.push(h('p', { class: 'import-none', text: res.textFound
        ? '🤔 Keine Buchungsdaten erkannt. Du kannst die Buchung unten selbst anlegen – die Datei wird angehängt.'
        : '🤔 In der Datei ist kein lesbarer Text (z. B. Foto oder Scan). Lege die Buchung unten an – die Datei wird angehängt.' }));
    }
    parts.push(fileNote());

    // Neu anlegen
    parts.push(h('h3', { text: res.flights.length || res.hotel ? 'Oder neu anlegen als …' : 'Neu anlegen als …' }),
      h('div', { class: 'add-grid' }, Object.entries(P.TYPES).map(([k, t]) => h('button', {
        class: 'add-tile', type: 'button',
        onclick: () => {
          dlg.close();
          const d = { url: pending.url || '' };
          if (k === 'hotel' && pending.title) d.name = pending.title;
          if (k === 'activity' && pending.title) d.title = pending.title;
          P.openForm(k, d, pending.files, true);
        }
      }, h('span', { text: t.icon }), t.label))));

    // An bestehende Buchung anhängen
    if (pending.files.length && P.all().length) {
      const sel = h('select', { id: 'import-attach' }, P.all().map((b) => h('option', { value: b.id, text: `${P.iconOf(b)} ${P.titleOf(b)} · ${P.fmtDay(b.date)}` })));
      parts.push(h('h3', { text: 'Oder nur an bestehende Buchung anhängen' }),
        h('div', { class: 'row-form form' }, sel,
          h('button', {
            class: 'btn', type: 'button',
            onclick: async () => { dlg.close(); await P.attachFiles(sel.value, pending.files); }
          }, 'Anhängen')));
    }
    box.replaceChildren(...parts.filter(Boolean));
  }

  $('#import-start-btn').addEventListener('click', showStart);
  $('#import-file').addEventListener('change', (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length) run({ files });
  });
  $('#import-analyse').addEventListener('click', () => {
    const text = $('#import-text').value.trim();
    if (!text) { toast('Bitte zuerst Text einfügen'); return; }
    run({ text });
  });
  $('#import-close').addEventListener('click', () => dlg.close());

  // ---------- Über "Teilen" empfangene Inhalte (Service Worker legt sie im Cache ab) ----------
  async function receiveShared() {
    if (location.hash !== '#import-shared' || !('caches' in window)) return;
    history.replaceState(null, '', '#plan');
    $('.tabbar [data-tab="plan"]').click();
    try {
      const cache = await caches.open('tc-share');
      const metaRes = await cache.match('shared/meta');
      if (!metaRes) return;
      const meta = await metaRes.json();
      const files = [];
      for (let i = 0; i < meta.files.length; i++) {
        const r = await cache.match('shared/file-' + i);
        if (r) files.push(new File([await r.blob()], meta.files[i].name, { type: meta.files[i].type }));
      }
      await caches.delete('tc-share');
      // Geteilter Text enthält oft den Link – getrennt erkennen
      let text = meta.text || '', url = meta.url || '';
      if (!url) { const m = /https?:\/\/\S+/.exec(text); if (m) url = m[0]; }
      run({ files, text, url, title: meta.title || '' });
    } catch (e) {
      toast('Geteilte Inhalte konnten nicht gelesen werden');
    }
  }
  receiveShared();
  window.addEventListener('hashchange', receiveShared);
})();
