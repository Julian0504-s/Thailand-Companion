(() => {
  'use strict';

  // ---------- Hilfsfunktionen ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('tc.' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('tc.' + key, JSON.stringify(value)); } catch (e) { toast('Speichern fehlgeschlagen'); }
    }
  };

  // Element-Builder, setzt Text immer über textContent (kein HTML-Injection-Risiko).
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  const parseNum = (str) => {
    if (typeof str !== 'string') return NaN;
    let s = str.trim().replace(/\s/g, '');
    if (!s) return NaN;
    // "1.234,56" oder "1234,56" oder "1234.56"
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    return Number(s);
  };
  const fmt = (n, digits = 2) => n.toLocaleString('de-AT', { minimumFractionDigits: 0, maximumFractionDigits: digits });

  // ---------- Farbmodus ----------
  const THEMES = ['auto', 'light', 'dark'];
  const THEME_ICONS = { auto: '🌓', light: '☀️', dark: '🌙' };
  const THEME_NAMES = { auto: 'Automatisch', light: 'Hell', dark: 'Dunkel' };
  function applyTheme(mode) {
    if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);
    $('#theme-btn').textContent = THEME_ICONS[mode];
  }
  let theme = store.get('theme', 'auto');
  applyTheme(theme);
  $('#theme-btn').addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    store.set('theme', theme);
    applyTheme(theme);
    toast('Farbmodus: ' + THEME_NAMES[theme]);
  });

  // ---------- Tabs ----------
  const TABS = ['countdown', 'pack', 'money', 'phrases', 'plan', 'sos'];
  function showTab(name) {
    if (!TABS.includes(name)) name = 'countdown';
    for (const t of TABS) $('#tab-' + t).hidden = t !== name;
    for (const b of $$('.tabbar button')) {
      if (b.dataset.tab === name) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    }
    $('#page-title').textContent = $('#tab-' + name).dataset.title;
    store.set('tab', name);
    window.scrollTo(0, 0);
  }
  for (const b of $$('.tabbar button')) {
    b.addEventListener('click', () => {
      history.replaceState(null, '', '#' + b.dataset.tab);
      showTab(b.dataset.tab);
    });
  }
  showTab(location.hash.slice(1) || store.get('tab', 'countdown'));

  // ---------- 1. Countdown ----------
  const trip = store.get('trip', { start: '', end: '' });
  $('#trip-start').value = trip.start;
  $('#trip-end').value = trip.end;

  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = (a, b) => Math.round((dayStart(b) - dayStart(a)) / 86400000);

  function renderCountdown() {
    const label = $('#cd-label'), sub = $('#cd-sub'), grid = $('#cd-grid'), tripDay = $('#trip-day');
    if (!trip.start) {
      label.textContent = 'Wann geht es los?';
      grid.hidden = false; tripDay.hidden = true;
      ['#cd-days', '#cd-hours', '#cd-mins'].forEach((s) => { $(s).textContent = '–'; });
      sub.textContent = 'Trag unten dein Abflugdatum ein.';
      return;
    }
    const now = new Date();
    const start = new Date(trip.start);
    const end = trip.end ? new Date(trip.end) : null;

    if (now < start) {
      const mins = Math.floor((start - now) / 60000);
      $('#cd-days').textContent = Math.floor(mins / 1440);
      $('#cd-hours').textContent = Math.floor((mins % 1440) / 60);
      $('#cd-mins').textContent = mins % 60;
      label.textContent = 'Bis zum Abflug';
      grid.hidden = false; tripDay.hidden = true;
      sub.textContent = 'Abflug: ' + start.toLocaleString('de-AT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      return;
    }

    grid.hidden = true; tripDay.hidden = false;
    if (end && now > end) {
      label.textContent = 'Reise beendet';
      $('#trip-day-text').textContent = 'Willkommen zurück! 🙏';
      $('#trip-progress').style.width = '100%';
      sub.textContent = 'Die Reise dauerte ' + (dayDiff(start, end) + 1) + ' Tage.';
      return;
    }
    const x = dayDiff(start, now) + 1;
    label.textContent = 'Du bist in Thailand 🌴';
    if (end) {
      const y = dayDiff(start, end) + 1;
      $('#trip-day-text').textContent = `Tag ${x} von ${y}`;
      $('#trip-progress').style.width = Math.min(100, (x / y) * 100) + '%';
      const left = y - x;
      sub.textContent = left === 0 ? 'Heute ist der letzte Tag.' : `Noch ${left} ${left === 1 ? 'Tag' : 'Tage'}.`;
    } else {
      $('#trip-day-text').textContent = `Tag ${x}`;
      $('#trip-progress').style.width = '0';
      sub.textContent = 'Trag den Rückflug ein, um „Tag X von Y“ zu sehen.';
    }
  }

  $('#trip-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const s = $('#trip-start').value, en = $('#trip-end').value;
    if (en && s && new Date(en) <= new Date(s)) { toast('Rückflug muss nach dem Abflug liegen'); return; }
    trip.start = s; trip.end = en;
    store.set('trip', trip);
    renderCountdown();
    toast('Reisedaten gespeichert');
  });
  renderCountdown();
  setInterval(renderCountdown, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderCountdown(); });

  // ---------- 2. Packliste ----------
  function defaultPack() {
    const items = [];
    for (const [cat, list] of Object.entries(window.PACK_DEFAULTS)) {
      for (const text of list) items.push({ id: uid(), cat, text, done: false });
    }
    return items;
  }
  let pack = store.get('pack', null) || defaultPack();
  const collapsed = store.get('packCollapsed', {});
  const savePack = () => store.set('pack', pack);

  function packCategories() {
    const cats = Object.keys(window.PACK_DEFAULTS);
    for (const i of pack) if (!cats.includes(i.cat)) cats.push(i.cat);
    return cats;
  }

  function renderPack() {
    const done = pack.filter((i) => i.done).length;
    const pct = pack.length ? Math.round((done / pack.length) * 100) : 0;
    $('#pack-count').textContent = `${done} / ${pack.length} gepackt`;
    $('#pack-percent').textContent = pct + ' %';
    $('#pack-progress').style.width = pct + '%';

    const sel = $('#pack-cat');
    const prev = sel.value;
    sel.replaceChildren(...packCategories().map((c) => h('option', { value: c, text: c })));
    if (prev) sel.value = prev;

    const list = $('#pack-list');
    list.replaceChildren();
    for (const cat of packCategories()) {
      const items = pack.filter((i) => i.cat === cat);
      if (!items.length) continue;
      const catDone = items.filter((i) => i.done).length;
      const section = h('div', { class: 'card pack-cat' + (collapsed[cat] ? ' collapsed' : ''), style: 'padding:0' },
        h('div', {
          class: 'pack-cat-head', role: 'button', tabindex: '0', 'aria-expanded': String(!collapsed[cat]),
          onclick: () => { collapsed[cat] = !collapsed[cat]; store.set('packCollapsed', collapsed); renderPack(); }
        },
          h('span', { text: (collapsed[cat] ? '▸ ' : '▾ ') + cat }),
          h('span', { class: 'count', text: `${catDone}/${items.length}${catDone === items.length ? ' ✓' : ''}` })
        ),
        h('ul', {}, items.map((item) =>
          h('li', { class: 'pack-item' + (item.done ? ' done' : '') },
            h('label', {},
              h('input', {
                type: 'checkbox', checked: item.done,
                onchange: (e) => { item.done = e.target.checked; savePack(); renderPack(); }
              }),
              h('span', { text: item.text })
            ),
            h('button', {
              class: 'del-btn', type: 'button', 'aria-label': item.text + ' löschen',
              onclick: () => {
                pack = pack.filter((i) => i.id !== item.id); savePack(); renderPack();
                toast('„' + item.text + '“ gelöscht');
              }
            }, '✕')
          )
        ))
      );
      list.append(section);
    }
  }

  $('#pack-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#pack-input').value.trim();
    if (!text) return;
    const cat = $('#pack-cat').value;
    pack.push({ id: uid(), cat, text, done: false });
    collapsed[cat] = false; store.set('packCollapsed', collapsed);
    savePack(); renderPack();
    $('#pack-input').value = '';
    toast('Hinzugefügt');
  });
  $('#pack-uncheck').addEventListener('click', () => {
    if (!confirm('Alle Haken entfernen?')) return;
    pack.forEach((i) => { i.done = false; }); savePack(); renderPack();
  });
  $('#pack-reset').addEventListener('click', () => {
    if (!confirm('Packliste auf die Standardliste zurücksetzen? Eigene Einträge gehen verloren.')) return;
    pack = defaultPack(); savePack(); renderPack();
  });
  renderPack();

  // ---------- 3. Währungsrechner ----------
  const FALLBACK_RATE = 38.0;
  let rate = store.get('rate', null); // { value, updated, source }
  let lastEdited = 'thb';
  const eurIn = $('#eur-input'), thbIn = $('#thb-input');
  const currentRate = () => (rate && rate.value) || FALLBACK_RATE;

  function renderRate() {
    $('#rate-display').textContent = fmt(currentRate(), 4);
    const meta = $('#rate-meta');
    if (!rate) {
      meta.textContent = 'Noch kein Kurs gespeichert – Richtwert. Mit Internet aktualisieren oder manuell setzen.';
    } else {
      const when = new Date(rate.updated).toLocaleString('de-AT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      meta.textContent = `${rate.source === 'manual' ? 'Manuell gesetzt' : 'Online (' + rate.source + ')'} · ${when}`;
    }
  }
  function convert(from) {
    if (from) lastEdited = from;
    const r = currentRate();
    if (lastEdited === 'eur') {
      const v = parseNum(eurIn.value);
      thbIn.value = isNaN(v) ? '' : fmt(v * r, 2);
    } else {
      const v = parseNum(thbIn.value);
      eurIn.value = isNaN(v) ? '' : fmt(v / r, 2);
    }
  }
  eurIn.addEventListener('input', () => convert('eur'));
  thbIn.addEventListener('input', () => convert('thb'));
  for (const f of [eurIn, thbIn]) f.addEventListener('focus', () => f.select());
  $('#money-clear').addEventListener('click', () => { eurIn.value = ''; thbIn.value = ''; });
  for (const b of $$('#quick-thb .chip')) b.addEventListener('click', () => { thbIn.value = b.dataset.thb; convert('thb'); });
  for (const b of $$('#quick-eur .chip')) b.addEventListener('click', () => { eurIn.value = b.dataset.eur; convert('eur'); });

  function setRate(value, source) {
    rate = { value, updated: Date.now(), source };
    store.set('rate', rate);
    renderRate(); convert();
  }

  async function fetchJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  const RATE_SOURCES = [
    { name: 'EZB via Frankfurter', url: 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=THB', pick: (j) => j.rates && j.rates.THB },
    { name: 'EZB via Frankfurter', url: 'https://api.frankfurter.app/latest?from=EUR&to=THB', pick: (j) => j.rates && j.rates.THB },
    { name: 'open.er-api.com', url: 'https://open.er-api.com/v6/latest/EUR', pick: (j) => j.rates && j.rates.THB }
  ];
  async function refreshRate(manual) {
    if (!navigator.onLine) { if (manual) toast('Offline – gespeicherter Kurs wird verwendet'); return; }
    const btn = $('#rate-refresh');
    btn.disabled = true; btn.textContent = 'Lade Kurs…';
    try {
      for (const src of RATE_SOURCES) {
        try {
          const v = Number(src.pick(await fetchJson(src.url)));
          if (v > 0) { setRate(v, src.name); if (manual) toast('Kurs aktualisiert'); return; }
        } catch (e) { /* nächste Quelle */ }
      }
      if (manual) toast('Kurs konnte nicht geladen werden');
    } finally {
      btn.disabled = false; btn.textContent = 'Kurs online aktualisieren';
    }
  }
  $('#rate-refresh').addEventListener('click', () => refreshRate(true));
  $('#rate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseNum($('#rate-input').value);
    if (!(v > 0)) { toast('Bitte gültigen Kurs eingeben'); return; }
    setRate(v, 'manual');
    $('#rate-input').value = '';
    toast('Kurs gesetzt: 1 € = ' + fmt(v, 4) + ' ฿');
  });
  renderRate();
  // Automatisch aktualisieren, wenn online und Kurs älter als 6 Stunden (manuelle Kurse bleiben).
  const autoRefreshRate = () => {
    if (!rate || (rate.source !== 'manual' && Date.now() - rate.updated > 6 * 3600 * 1000)) refreshRate(false);
  };
  autoRefreshRate();

  // ---------- 4. Thai-Sprachhilfe ----------
  let gender = store.get('gender', 'm');
  const favs = new Set(store.get('favs', []));
  let phraseCat = store.get('phraseCat', window.PHRASES[0].cat);
  const FAV_CAT = '★ Favoriten';

  function phraseText(p) {
    const g = window.GENDER_FORMS[gender];
    let th = p.th.replace(/\{I\}/g, g.I_th);
    let tr = p.tr.replace(/\{I\}/g, g.I_tr);
    if (p.pol) { th += g[p.pol + '_th']; tr += ' ' + g[p.pol + '_tr']; }
    return { th, tr };
  }

  let thaiVoice = null;
  const hasTTS = 'speechSynthesis' in window;
  function pickVoice() {
    if (!hasTTS) return;
    const voices = speechSynthesis.getVoices();
    thaiVoice = voices.find((v) => /^th(-|_|$)/i.test(v.lang)) || null;
    const hint = $('#tts-hint');
    if (voices.length && !thaiVoice) {
      hint.hidden = false;
      hint.textContent = 'Keine Thai-Stimme gefunden. Am Android: Einstellungen → Sprachausgabe (Text-in-Sprache) → Google → Sprachdaten → Thai installieren.';
    } else hint.hidden = true;
  }
  if (hasTTS) {
    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
  } else {
    const hint = $('#tts-hint');
    hint.hidden = false;
    hint.textContent = 'Vorlesen wird von diesem Browser nicht unterstützt.';
  }

  function speak(text, btn) {
    if (!hasTTS) { toast('Vorlesen nicht verfügbar'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/…/g, ' '));
    u.lang = 'th-TH';
    if (thaiVoice) u.voice = thaiVoice;
    u.rate = 0.85;
    btn.classList.add('speaking');
    const done = () => btn.classList.remove('speaking');
    u.onend = done; u.onerror = () => { done(); toast('Vorlesen fehlgeschlagen – Thai-Stimme installiert?'); };
    speechSynthesis.speak(u);
  }

  function renderGender() {
    for (const b of $$('.segmented button')) b.setAttribute('aria-checked', String(b.dataset.gender === gender));
  }
  for (const b of $$('.segmented button')) {
    b.addEventListener('click', () => { gender = b.dataset.gender; store.set('gender', gender); renderGender(); renderPhrases(); });
  }

  function renderPhraseCats() {
    const cats = [FAV_CAT, ...window.PHRASES.map((c) => c.cat)];
    $('#phrase-cats').replaceChildren(...cats.map((c) => h('button', {
      class: 'chip' + (c === FAV_CAT ? '' : ' alt'), type: 'button', role: 'tab', 'aria-selected': String(c === phraseCat),
      onclick: (e) => {
        phraseCat = c; store.set('phraseCat', c); renderPhraseCats(); renderPhrases();
        e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }, c === FAV_CAT ? `${c} (${favs.size})` : c)));
  }

  function renderPhrases() {
    let items;
    if (phraseCat === FAV_CAT) {
      items = window.PHRASES.flatMap((c) => c.items.filter((p) => favs.has(p.id)).map((p) => ({ ...p, catName: c.cat })));
    } else {
      const c = window.PHRASES.find((x) => x.cat === phraseCat) || window.PHRASES[0];
      items = c.items;
    }
    const list = $('#phrase-list');
    if (!items.length) {
      list.replaceChildren(h('div', { class: 'card empty' },
        h('span', { class: 'big', text: '☆' }),
        'Noch keine Favoriten. Tippe bei einem Satz auf den Stern.'));
      return;
    }
    list.replaceChildren(...items.map((p) => {
      const { th, tr } = phraseText(p);
      const isFav = favs.has(p.id);
      return h('div', { class: 'card phrase' },
        h('div', { class: 'phrase-body' },
          h('div', { class: 'phrase-de', text: p.de }),
          h('div', { class: 'phrase-th', lang: 'th', text: th }),
          h('div', { class: 'phrase-tr', text: tr }),
          p.catName ? h('div', { class: 'phrase-cat', text: p.catName }) : null
        ),
        h('div', { class: 'phrase-actions' },
          h('button', {
            class: 'round-btn speak', type: 'button', 'aria-label': 'Vorlesen',
            onclick: (e) => speak(th, e.currentTarget)
          }, '🔊'),
          h('button', {
            class: 'round-btn fav', type: 'button', 'aria-label': 'Favorit', 'aria-pressed': String(isFav),
            onclick: () => {
              if (favs.has(p.id)) favs.delete(p.id); else favs.add(p.id);
              store.set('favs', [...favs]);
              renderPhraseCats(); renderPhrases();
            }
          }, isFav ? '★' : '☆')
        )
      );
    }));
  }
  renderGender(); renderPhraseCats(); renderPhrases();

  // ---------- 5. Reiseplan ----------
  let plan = store.get('plan', []);
  let editingId = null;
  const dlg = $('#plan-dialog');
  const fmtDate = (s) => new Date(s + 'T00:00').toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short' });

  function renderPlan() {
    plan.sort((a, b) => a.from.localeCompare(b.from));
    const list = $('#plan-list');
    if (!plan.length) {
      list.replaceChildren(h('div', { class: 'card empty' },
        h('span', { class: 'big', text: '🗺️' }),
        'Noch keine Stationen. Füge deine erste Station hinzu.'));
      return;
    }
    const d = new Date();
    const todayLocal = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    list.replaceChildren(...plan.map((s) => {
      const to = s.to || s.from;
      const state = todayLocal > to ? 'past' : (todayLocal >= s.from ? 'now' : '');
      const nights = s.to ? Math.round((new Date(s.to) - new Date(s.from)) / 86400000) : 0;
      let dateText = fmtDate(s.from) + (s.to && s.to !== s.from ? ' – ' + fmtDate(s.to) : '');
      if (nights > 0) dateText += ` · ${nights} ${nights === 1 ? 'Nacht' : 'Nächte'}`;
      if (state === 'now') dateText = '● Jetzt · ' + dateText;
      return h('div', { class: 'card stop ' + state },
        h('div', { class: 'stop-date', text: dateText }),
        h('div', { class: 'stop-place', text: s.place }),
        s.stay ? h('div', { class: 'stop-stay', text: '🏨 ' + s.stay }) : null,
        s.notes ? h('div', { class: 'stop-notes', text: s.notes }) : null,
        h('div', { class: 'stop-actions' },
          h('button', { class: 'btn', type: 'button', onclick: () => openPlan(s) }, '✎ Bearbeiten'),
          h('button', {
            class: 'btn ghost danger', type: 'button',
            onclick: () => {
              if (!confirm(`„${s.place}“ löschen?`)) return;
              plan = plan.filter((x) => x.id !== s.id); store.set('plan', plan); renderPlan();
            }
          }, '🗑 Löschen')
        )
      );
    }));
  }

  function openPlan(stop) {
    editingId = stop ? stop.id : null;
    $('#plan-dialog-title').textContent = stop ? 'Station bearbeiten' : 'Neue Station';
    $('#plan-place').value = stop ? stop.place : '';
    $('#plan-from').value = stop ? stop.from : (plan.length ? (plan[plan.length - 1].to || plan[plan.length - 1].from) : (trip.start || '').slice(0, 10));
    $('#plan-to').value = stop ? (stop.to || '') : '';
    $('#plan-stay').value = stop ? (stop.stay || '') : '';
    $('#plan-notes').value = stop ? (stop.notes || '') : '';
    dlg.showModal();
  }
  $('#plan-add').addEventListener('click', () => openPlan(null));
  $('#plan-cancel').addEventListener('click', () => dlg.close());
  $('#plan-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      place: $('#plan-place').value.trim(),
      from: $('#plan-from').value,
      to: $('#plan-to').value,
      stay: $('#plan-stay').value.trim(),
      notes: $('#plan-notes').value.trim()
    };
    if (!data.place || !data.from) return;
    if (data.to && data.to < data.from) { toast('„Bis“ liegt vor „Von“'); return; }
    if (editingId) Object.assign(plan.find((x) => x.id === editingId), data);
    else plan.push({ id: uid(), ...data });
    store.set('plan', plan);
    renderPlan();
    dlg.close();
    toast('Station gespeichert');
  });
  renderPlan();

  // ---------- 6. Notfall ----------
  const ins = store.get('insurance', { name: '', number: '', phone: '' });
  $('#ins-name').value = ins.name;
  $('#ins-number').value = ins.number;
  $('#ins-phone').value = ins.phone;
  function renderIns() {
    const link = $('#ins-call');
    const tel = (ins.phone || '').replace(/[^\d+]/g, '');
    link.hidden = !tel;
    link.href = 'tel:' + tel;
    $('#ins-call-num').textContent = ins.phone;
  }
  $('#ins-form').addEventListener('submit', (e) => {
    e.preventDefault();
    ins.name = $('#ins-name').value.trim();
    ins.number = $('#ins-number').value.trim();
    ins.phone = $('#ins-phone').value.trim();
    store.set('insurance', ins);
    renderIns();
    toast('Versicherungsdaten gespeichert');
  });
  renderIns();

  // ---------- Online/Offline & Service Worker ----------
  function renderOnline() { $('#offline-badge').hidden = navigator.onLine; }
  window.addEventListener('online', () => { renderOnline(); autoRefreshRate(); });
  window.addEventListener('offline', renderOnline);
  renderOnline();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* z. B. file:// */ });
    });
  }
})();
