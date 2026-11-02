// Reisekasse: Ausgaben in THB/EUR, Kategorien, Tagesbudget und Ausgleich zwischen Reisenden.
(() => {
  'use strict';
  const { $, $$, h, store, uid, fmt, parseNum, toast } = window.TC;

  const CATS = [
    { id: 'food', icon: '🍜', label: 'Essen & Trinken' },
    { id: 'transport', icon: '🚕', label: 'Transport' },
    { id: 'stay', icon: '🏨', label: 'Unterkunft' },
    { id: 'activity', icon: '🎟️', label: 'Ausflüge' },
    { id: 'shopping', icon: '🛍️', label: 'Einkaufen' },
    { id: 'wellness', icon: '💆', label: 'Massage & Wellness' },
    { id: 'other', icon: '💸', label: 'Sonstiges' }
  ];
  const SETTLE = { id: 'settle', icon: '↔️', label: 'Ausgleich' };
  const catOf = (id) => CATS.find((c) => c.id === id) || (id === SETTLE.id ? SETTLE : CATS[CATS.length - 1]);

  let expenses = store.get('expenses', []);
  let persons = store.get('cashPersons', [{ id: 'p1', name: 'Ich' }, { id: 'p2', name: 'Begleitung' }]);
  let budget = store.get('cashBudget', 0);
  let cur = store.get('cashCur', 'THB');
  let cat = 'food';
  let editingId = null;

  const saveExpenses = () => store.set('expenses', expenses);
  const savePersons = () => store.set('cashPersons', persons);
  const localISO = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const personName = (id) => (persons.find((p) => p.id === id) || { name: '?' }).name;
  const multi = () => persons.length > 1;

  // Beträge werden mit dem Kurs zum Zeitpunkt der Eingabe gespeichert.
  const thbOf = (e) => (e.cur === 'THB' ? e.amount : e.amount * e.rate);
  const eurOf = (e) => (e.cur === 'EUR' ? e.amount : e.amount / e.rate);
  const eur2 = (n) => n.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- Ansicht umschalten (Rechner / Reisekasse) ----------
  let view = store.get('moneyView', 'calc');
  function renderView() {
    $('#money-calc').hidden = view !== 'calc';
    $('#money-cash').hidden = view !== 'cash';
    for (const b of $$('[data-money-view]')) b.setAttribute('aria-selected', String(b.dataset.moneyView === view));
  }
  for (const b of $$('[data-money-view]')) {
    b.addEventListener('click', () => { view = b.dataset.moneyView; store.set('moneyView', view); renderView(); });
  }

  // ---------- Formular ----------
  function renderCats() {
    $('#cash-cats').replaceChildren(...CATS.map((c) => h('button', {
      type: 'button', role: 'radio', class: 'cat-btn', 'aria-checked': String(c.id === cat),
      onclick: () => { cat = c.id; renderCats(); }
    }, h('span', { text: c.icon }), c.label)));
  }
  function renderCur() {
    for (const b of $$('[data-cur]')) b.setAttribute('aria-checked', String(b.dataset.cur === cur));
    renderConvert();
  }
  for (const b of $$('[data-cur]')) b.addEventListener('click', () => { cur = b.dataset.cur; store.set('cashCur', cur); renderCur(); });

  function renderConvert() {
    const v = parseNum($('#cash-amount').value);
    const r = window.TC.rate();
    $('#cash-convert').textContent = v > 0
      ? (cur === 'THB' ? `≈ ${fmt(v / r, 2)} €` : `≈ ${fmt(v * r, 0)} ฿`) + ` (Kurs ${fmt(r, 2)})`
      : '';
  }
  $('#cash-amount').addEventListener('input', renderConvert);

  function renderPersonSelects() {
    const payer = $('#cash-payer'), split = $('#cash-split');
    const pv = payer.value, sv = split.value;
    payer.replaceChildren(...persons.map((p) => h('option', { value: p.id, text: p.name })));
    split.replaceChildren(
      h('option', { value: 'all', text: 'Gemeinsam (alle teilen)' }),
      ...persons.map((p) => h('option', { value: p.id, text: 'Nur für ' + p.name }))
    );
    if (pv && persons.some((p) => p.id === pv)) payer.value = pv;
    if (sv && (sv === 'all' || persons.some((p) => p.id === sv))) split.value = sv;
    for (const el of $$('.persons-only')) el.hidden = !multi();
  }

  function resetForm() {
    editingId = null;
    $('#cash-form-title').textContent = 'Neue Ausgabe';
    $('#cash-submit').textContent = 'Ausgabe speichern';
    $('#cash-edit-actions').hidden = true;
    $('#cash-amount').value = '';
    $('#cash-desc').value = '';
    $('#cash-date').value = localISO(new Date());
    $('#cash-split').value = 'all';
    renderConvert();
  }

  function editExpense(e) {
    if (e.cat === SETTLE.id) {
      if (confirm('Diesen Ausgleich löschen?')) { expenses = expenses.filter((x) => x.id !== e.id); saveExpenses(); render(); }
      return;
    }
    editingId = e.id;
    cur = e.cur; cat = e.cat;
    $('#cash-form-title').textContent = 'Ausgabe bearbeiten';
    $('#cash-submit').textContent = 'Änderung speichern';
    $('#cash-edit-actions').hidden = false;
    $('#cash-amount').value = fmt(e.amount, 2);
    $('#cash-desc').value = e.desc || '';
    $('#cash-date').value = e.date;
    $('#cash-payer').value = e.paidBy;
    $('#cash-split').value = e.split;
    renderCats(); renderCur();
    $('#cash-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#cash-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const amount = parseNum($('#cash-amount').value);
    if (!(amount > 0)) { toast('Bitte einen Betrag eingeben'); return; }
    const data = {
      amount, cur, cat,
      desc: $('#cash-desc').value.trim(),
      date: $('#cash-date').value || localISO(new Date()),
      paidBy: multi() ? $('#cash-payer').value : persons[0].id,
      split: multi() ? $('#cash-split').value : 'all'
    };
    if (editingId) {
      const e = expenses.find((x) => x.id === editingId);
      // Kurs nur neu setzen, wenn sich Betrag oder Währung geändert haben
      if (e.amount !== amount || e.cur !== cur) data.rate = window.TC.rate();
      Object.assign(e, data);
      toast('Ausgabe geändert');
    } else {
      expenses.push({ id: uid(), rate: window.TC.rate(), ...data });
      toast(`${catOf(cat).icon} ${fmt(amount, 2)} ${cur === 'THB' ? '฿' : '€'} gespeichert`);
    }
    saveExpenses(); resetForm(); render();
  });
  $('#cash-cancel').addEventListener('click', resetForm);
  $('#cash-delete').addEventListener('click', () => {
    if (!confirm('Diese Ausgabe löschen?')) return;
    expenses = expenses.filter((x) => x.id !== editingId);
    saveExpenses(); resetForm(); render();
  });

  // ---------- Auswertung ----------
  function renderSummary() {
    const real = expenses.filter((e) => e.cat !== SETTLE.id);
    const box = $('#cash-summary');
    if (!real.length) {
      box.replaceChildren(h('div', { class: 'card empty' }, h('span', { class: 'big', text: '👛' }),
        'Noch keine Ausgaben. Trag unten die erste ein – Betrag, Kategorie, fertig.'));
      return;
    }
    const today = localISO(new Date());
    const sum = (list) => list.reduce((a, e) => [a[0] + thbOf(e), a[1] + eurOf(e)], [0, 0]);
    const [tThb, tEur] = sum(real);
    const [dThb, dEur] = sum(real.filter((e) => e.date === today));
    const first = real.reduce((m, e) => (e.date < m ? e.date : m), real[0].date);
    const last = real.reduce((m, e) => (e.date > m ? e.date : m), real[0].date);
    const end = today > last && today >= first ? today : last;
    const days = Math.max(1, Math.round((new Date(end + 'T00:00') - new Date(first + 'T00:00')) / 86400000) + 1);

    const byCat = CATS.map((c) => ({ c, thb: sum(real.filter((e) => e.cat === c.id))[0] })).filter((x) => x.thb > 0)
      .sort((a, b) => b.thb - a.thb);
    const max = byCat.length ? byCat[0].thb : 1;

    let budgetEl = null;
    if (budget > 0) {
      const pct = Math.min(100, (dThb / budget) * 100);
      const over = dThb > budget;
      budgetEl = h('div', { class: 'budget' },
        h('div', { class: 'progress-head' },
          h('span', { text: 'Heute' }),
          h('span', { class: over ? 'over' : '', text: `${fmt(Math.round(dThb), 0)} / ${fmt(budget, 0)} ฿` })),
        h('div', { class: 'progress big' }, h('div', { class: 'progress-bar' + (over ? ' over-bar' : ''), style: `width:${pct}%` })),
        h('p', { class: 'hint', text: over ? `${fmt(Math.round(dThb - budget), 0)} ฿ über dem Tagesbudget` : `Noch ${fmt(Math.round(budget - dThb), 0)} ฿ übrig heute` })
      );
    }

    box.replaceChildren(h('div', { class: 'card cash-summary' },
      h('div', { class: 'stat-grid' },
        h('div', { class: 'stat' }, h('small', { text: 'Gesamt' }), h('b', { text: `${fmt(Math.round(tThb), 0)} ฿` }), h('span', { text: `${eur2(tEur)} €` })),
        h('div', { class: 'stat' }, h('small', { text: 'Heute' }), h('b', { text: `${fmt(Math.round(dThb), 0)} ฿` }), h('span', { text: `${eur2(dEur)} €` })),
        h('div', { class: 'stat' }, h('small', { text: days > 1 ? `Ø/Tag (${days} T.)` : 'Ø/Tag' }), h('b', { text: `${fmt(Math.round(tThb / days), 0)} ฿` }), h('span', { text: `${eur2(tEur / days)} €` }))
      ),
      budgetEl,
      h('div', { class: 'cat-bars' }, byCat.map(({ c, thb }) => h('div', { class: 'cat-bar' },
        h('span', { class: 'cat-bar-label', text: `${c.icon} ${c.label}` }),
        h('span', { class: 'cat-bar-val', text: `${fmt(Math.round(thb), 0)} ฿` }),
        h('div', { class: 'progress' }, h('div', { class: 'progress-bar', style: `width:${(thb / max) * 100}%` }))
      )))
    ));
  }

  // Salden in EUR: Zahler +Betrag, Begünstigte −Anteil
  function balances() {
    const bal = Object.fromEntries(persons.map((p) => [p.id, 0]));
    for (const e of expenses) {
      const eur = eurOf(e);
      if (bal[e.paidBy] === undefined) continue;
      bal[e.paidBy] += eur;
      const who = e.split === 'all' ? persons.map((p) => p.id) : [e.split];
      for (const id of who) if (bal[id] !== undefined) bal[id] -= eur / who.length;
    }
    return bal;
  }
  function settlements() {
    const bal = balances();
    const debt = Object.entries(bal).filter(([, v]) => v < -0.005).map(([id, v]) => ({ id, v: -v })).sort((a, b) => b.v - a.v);
    const cred = Object.entries(bal).filter(([, v]) => v > 0.005).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
    const out = [];
    let i = 0, j = 0;
    while (i < debt.length && j < cred.length) {
      const x = Math.min(debt[i].v, cred[j].v);
      out.push({ from: debt[i].id, to: cred[j].id, eur: x });
      debt[i].v -= x; cred[j].v -= x;
      if (debt[i].v < 0.005) i++;
      if (cred[j].v < 0.005) j++;
    }
    return out;
  }

  function renderBalance() {
    const box = $('#cash-balance');
    if (!multi() || !expenses.length) { box.replaceChildren(); return; }
    const list = settlements().filter((s) => s.eur >= 0.01);
    const r = window.TC.rate();
    box.replaceChildren(h('div', { class: 'card' },
      h('h2', { text: '⚖️ Wer schuldet wem?' }),
      list.length
        ? list.map((s) => h('div', { class: 'settle' },
          h('div', {},
            h('b', { text: `${personName(s.from)} → ${personName(s.to)}` }),
            h('span', { text: `${eur2(s.eur)} € · ≈ ${fmt(Math.round(s.eur * r), 0)} ฿` })),
          h('button', {
            class: 'btn small', type: 'button',
            onclick: () => {
              if (!confirm(`${personName(s.from)} hat ${personName(s.to)} ${eur2(s.eur)} € gegeben?`)) return;
              expenses.push({ id: uid(), amount: Math.round(s.eur * 100) / 100, cur: 'EUR', rate: r, cat: SETTLE.id, desc: 'Ausgleich', date: localISO(new Date()), paidBy: s.from, split: s.to });
              saveExpenses(); render(); toast('Ausgleich erfasst');
            }
          }, '✓ Erledigt')))
        : h('p', { class: 'hint', style: 'margin:0', text: 'Alles ausgeglichen 🎉' })
    ));
  }

  function renderList() {
    const box = $('#cash-list');
    if (!expenses.length) { box.replaceChildren(); return; }
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || 0);
    const out = [];
    let day = null, group = null;
    for (const e of sorted) {
      if (e.date !== day) {
        day = e.date;
        const dayReal = sorted.filter((x) => x.date === day && x.cat !== SETTLE.id);
        const total = dayReal.reduce((a, x) => a + thbOf(x), 0);
        group = h('div', { class: 'card exp-day' },
          h('div', { class: 'exp-day-head' },
            h('span', { text: new Date(day + 'T00:00').toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' }) }),
            h('span', { text: `${fmt(Math.round(total), 0)} ฿` })));
        out.push(group);
      }
      const c = catOf(e.cat);
      const who = !multi() ? '' : e.cat === SETTLE.id
        ? `${personName(e.paidBy)} → ${personName(e.split)}`
        : `${personName(e.paidBy)} bezahlt${e.split === 'all' ? '' : ' · für ' + personName(e.split)}`;
      group.append(h('button', { class: 'exp-row', type: 'button', onclick: () => editExpense(e) },
        h('span', { class: 'exp-icon', text: c.icon }),
        h('span', { class: 'exp-text' }, h('b', { text: e.desc || c.label }), who ? h('small', { text: who }) : null),
        h('span', { class: 'exp-amount' },
          h('b', { text: e.cur === 'THB' ? `${fmt(e.amount, 2)} ฿` : `${eur2(e.amount)} €` }),
          h('small', { text: e.cur === 'THB' ? `${eur2(eurOf(e))} €` : `${fmt(Math.round(thbOf(e)), 0)} ฿` }))
      ));
    }
    box.replaceChildren(...out);
  }

  // ---------- Einstellungen ----------
  function renderPersons() {
    $('#cash-persons').replaceChildren(h('p', { class: 'hint', style: 'margin:0 0 8px', text: 'Reisende (Namen antippen zum Ändern)' }),
      ...persons.map((p) => h('div', { class: 'person-row' },
        h('input', {
          type: 'text', value: p.name, 'aria-label': 'Name',
          onchange: (e) => { const v = e.target.value.trim(); if (v) { p.name = v; savePersons(); render(); } else e.target.value = p.name; }
        }),
        h('button', {
          class: 'del-btn', type: 'button', 'aria-label': p.name + ' entfernen',
          onclick: () => {
            if (persons.length === 1) { toast('Mindestens eine Person nötig'); return; }
            if (expenses.some((e) => e.paidBy === p.id || e.split === p.id)) { toast(p.name + ' hat schon Ausgaben – nicht entfernbar'); return; }
            persons = persons.filter((x) => x.id !== p.id); savePersons(); render();
          }
        }, '✕')
      )));
  }
  $('#person-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#person-name').value.trim();
    if (!name) return;
    persons.push({ id: uid(), name }); savePersons();
    $('#person-name').value = '';
    render();
  });
  $('#cash-budget').value = budget ? fmt(budget, 0) : '';
  $('#cash-budget').addEventListener('change', (e) => {
    const v = parseNum(e.target.value);
    budget = v > 0 ? v : 0;
    store.set('cashBudget', budget);
    e.target.value = budget ? fmt(budget, 0) : '';
    render();
    toast(budget ? `Tagesbudget: ${fmt(budget, 0)} ฿` : 'Tagesbudget entfernt');
  });

  $('#cash-csv').addEventListener('click', () => {
    if (!expenses.length) { toast('Noch keine Ausgaben'); return; }
    const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const num = (n) => n.toFixed(2).replace('.', ',');
    const rows = [['Datum', 'Kategorie', 'Beschreibung', 'Betrag', 'Währung', 'THB', 'EUR', 'Kurs', 'Bezahlt von', 'Für']];
    for (const e of [...expenses].sort((a, b) => a.date.localeCompare(b.date))) {
      rows.push([e.date, catOf(e.cat).label, e.desc || '', num(e.amount), e.cur, num(thbOf(e)), num(eurOf(e)), num(e.rate),
        personName(e.paidBy), e.split === 'all' ? 'alle' : personName(e.split)]);
    }
    const csv = '﻿' + rows.map((r) => r.map(q).join(';')).join('\r\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: 'reisekasse.csv' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  function render() {
    renderPersonSelects(); renderPersons();
    renderSummary(); renderBalance(); renderList();
  }

  document.addEventListener('tc:rate', renderConvert);
  renderView(); renderCats(); renderCur(); render(); resetForm();
})();
