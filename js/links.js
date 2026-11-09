// Nützliche Links, eigene Links und Datensicherung.
(() => {
  'use strict';
  const { $, h, store, uid, toast } = window.TC;

  const LINKS = [
    { cat: 'Einreise & Formalitäten', items: [
      { name: 'TDAC – Thailand Digital Arrival Card', url: 'https://tdac.immigration.go.th/', desc: 'Pflicht: online innerhalb von 3 Tagen vor Ankunft ausfüllen. Kostenlos – Vorsicht vor kostenpflichtigen Fake-Seiten.' },
      { name: 'Thailand e-Visa', url: 'https://www.thaievisa.go.th/', desc: 'Offizielles Visa-Portal, falls der Aufenthalt länger als visumfrei erlaubt ist.' },
      { name: 'Reiseinformation Thailand (BMEIA)', url: 'https://www.bmeia.gv.at/reise-services/reiseinformation/land/thailand', desc: 'Sicherheitslage und Einreisebestimmungen des österreichischen Außenministeriums.' },
      { name: 'Reiseregistrierung', url: 'https://www.reiseregistrierung.at/', desc: 'Beim Außenministerium registrieren – damit man dich im Krisenfall erreicht.' }
    ]},
    { cat: 'Bus, Zug, Fähre & Taxi', items: [
      { name: '12Go', url: 'https://12go.asia/de', desc: 'Busse, Minivans, Züge und Fähren in ganz Südostasien buchen.' },
      { name: 'Grab', url: 'https://www.grab.com/th/en/', desc: 'Taxi- und Essens-App – Fixpreis statt Verhandeln.' },
      { name: 'Bolt', url: 'https://bolt.eu/', desc: 'Günstige Alternative zu Grab in Bangkok, Phuket, Pattaya, Chiang Mai.' },
      { name: 'Staatsbahn – Tickets (SRT D-Ticket)', url: 'https://dticket.railway.co.th/', desc: 'Offizielle Zugtickets, z. B. Nachtzug Bangkok – Chiang Mai.' },
      { name: 'BTS Skytrain Bangkok', url: 'https://www.bts.co.th/', desc: 'Hochbahn in Bangkok.' },
      { name: 'MRT Bangkok', url: 'https://metro.bemplc.co.th/', desc: 'U-Bahn in Bangkok.' },
      { name: 'Lomprayah', url: 'https://www.lomprayah.com/', desc: 'Schnellfähren nach Koh Samui, Koh Phangan und Koh Tao.' }
    ]},
    { cat: 'Flüge & Flughäfen', items: [
      { name: 'Flightradar24', url: 'https://www.flightradar24.com/', desc: 'Live-Flugstatus und Verspätungen.' },
      { name: 'Flughafen Suvarnabhumi (BKK)', url: 'https://suvarnabhumi.airportthai.co.th/', desc: 'Hauptflughafen Bangkok, internationale Flüge.' },
      { name: 'Flughafen Don Mueang (DMK)', url: 'https://donmueang.airportthai.co.th/', desc: 'Zweiter Flughafen Bangkok, v. a. Billigflieger (AirAsia, Nok Air).' },
      { name: 'Thai Airways', url: 'https://www.thaiairways.com/', desc: 'Nationale Airline.' },
      { name: 'Bangkok Airways', url: 'https://www.bangkokair.com/', desc: 'U. a. Koh Samui, Lounge auch in der Economy.' },
      { name: 'AirAsia', url: 'https://www.airasia.com/', desc: 'Inlandsflüge (meist ab DMK).' },
      { name: 'Nok Air', url: 'https://www.nokair.com/', desc: 'Inlandsflüge ab DMK.' },
      { name: 'Thai Lion Air', url: 'https://www.lionairthai.com/', desc: 'Inlandsflüge ab DMK.' },
      { name: 'Thai Vietjet', url: 'https://www.vietjetair.com/', desc: 'Inlandsflüge ab BKK.' }
    ]},
    { cat: 'Unterkünfte', items: [
      { name: 'Agoda', url: 'https://www.agoda.com/', desc: 'In Asien oft die größte Auswahl.' },
      { name: 'Booking.com', url: 'https://www.booking.com/', desc: 'Hotels und Gästehäuser.' }
    ]},
    { cat: 'Unterwegs', items: [
      { name: 'Google Maps', url: 'https://www.google.com/maps', desc: 'Tipp: Gebiete vorab offline herunterladen.' },
      { name: 'Google Übersetzer (Deutsch → Thai)', url: 'https://translate.google.com/?sl=de&tl=th', desc: 'Auch Kamera-Übersetzung für Speisekarten.' },
      { name: 'Tourism Authority of Thailand', url: 'https://www.tourismthailand.org/', desc: 'Offizielle Tourismus-Infos und Feste.' },
      { name: 'Wetter (Thai Meteorological Dept.)', url: 'https://www.tmd.go.th/en', desc: 'Offizielle Wettervorhersage.' },
      { name: 'Luftqualität (IQAir)', url: 'https://www.iqair.com/thailand', desc: 'Wichtig im Norden in der Smog-Saison (ca. Feb–Apr).' }
    ]},
    { cat: 'Gesundheit', items: [
      { name: 'Bumrungrad International Hospital', url: 'https://www.bumrungrad.com/', desc: 'Große Privatklinik in Bangkok, englischsprachig.' },
      { name: 'Bangkok Hospital', url: 'https://www.bangkokhospital.com/', desc: 'Privatkliniken-Netz in vielen Touristenorten.' }
    ]}
  ];

  let custom = store.get('links', []);
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } };

  function linkCard(l, onDelete) {
    return h('div', { class: 'link-item' },
      h('a', { class: 'link-main', href: l.url, target: '_blank', rel: 'noopener' },
        h('b', { text: l.name }),
        l.desc ? h('span', { text: l.desc }) : null,
        h('small', { text: host(l.url) + ' ↗' })
      ),
      onDelete ? h('button', { class: 'del-btn', type: 'button', 'aria-label': l.name + ' löschen', onclick: onDelete }, '✕') : null
    );
  }

  function render() {
    const groups = [];
    if (custom.length) {
      groups.push(h('div', { class: 'card link-group' }, h('h2', { text: '⭐ Meine Links' }),
        custom.map((l) => linkCard(l, () => {
          if (!confirm(`„${l.name}“ löschen?`)) return;
          custom = custom.filter((x) => x.id !== l.id); store.set('links', custom); render();
        }))));
    }
    for (const g of LINKS) {
      groups.push(h('div', { class: 'card link-group' }, h('h2', { text: g.cat }), g.items.map((l) => linkCard(l))));
    }
    $('#links-list').replaceChildren(h('p', { class: 'hint', style: 'margin:0', text: 'Links öffnen sich im Browser und brauchen Internet.' }), ...groups);
  }

  $('#link-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let url = $('#link-url').value.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    custom.push({ id: uid(), name: $('#link-name').value.trim(), url });
    store.set('links', custom);
    $('#link-name').value = ''; $('#link-url').value = '';
    render();
    toast('Link gespeichert');
  });

  // ---------- Datensicherung ----------
  $('#backup-export').addEventListener('click', async () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('tc.')) data[k] = localStorage.getItem(k);
    }
    let files = [];
    try { files = await window.TC.files.exportAll(); } catch (e) { toast('Dateien konnten nicht gesichert werden'); }
    const blob = new Blob([JSON.stringify({ app: 'thailand-companion', version: 2, data, files })], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `thailand-companion-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sicherung heruntergeladen');
  });

  $('#backup-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (json.app !== 'thailand-companion' || !json.data) throw new Error('format');
      if (!confirm('Sicherung wiederherstellen? Die aktuellen Daten werden ersetzt.')) return;
      Object.keys(localStorage).filter((k) => k.startsWith('tc.')).forEach((k) => localStorage.removeItem(k));
      for (const [k, v] of Object.entries(json.data)) if (k.startsWith('tc.')) localStorage.setItem(k, v);
      if (json.files) await window.TC.files.importAll(json.files);
      location.reload();
    } catch (err) {
      toast('Keine gültige Sicherungsdatei');
    }
  });

  render();
})();
