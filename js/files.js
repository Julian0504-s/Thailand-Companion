// Dateiablage (PDFs, Bilder) in IndexedDB – offline verfügbar – plus Viewer und PDF-Hilfen.
(() => {
  'use strict';
  const { $, h, uid, toast } = window.TC;

  // ---------- IndexedDB ----------
  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('thailand-companion', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('files', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction('files', mode);
      const result = fn(t.objectStore('files'));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  let persistAsked = false;
  // Speichert eine Datei und gibt die Metadaten für die Buchung zurück.
  async function put(file) {
    const meta = { id: uid(), name: file.name || 'Datei', type: file.type || guessType(file.name), size: file.size };
    await tx('readwrite', (s) => s.put({ ...meta, blob: file }));
    if (!persistAsked && navigator.storage && navigator.storage.persist) {
      persistAsked = true;
      navigator.storage.persist().catch(() => {});
    }
    return meta;
  }
  const get = (id) => tx('readonly', (s) => s.get(id));
  const remove = (id) => tx('readwrite', (s) => s.delete(id));
  const all = () => tx('readonly', (s) => s.getAll());
  const clear = () => tx('readwrite', (s) => s.clear());
  const restore = (records) => tx('readwrite', (s) => { for (const r of records) s.put(r); });

  function guessType(name) {
    const n = (name || '').toLowerCase();
    if (n.endsWith('.pdf')) return 'application/pdf';
    if (/\.(jpe?g)$/.test(n)) return 'image/jpeg';
    if (n.endsWith('.png')) return 'image/png';
    if (n.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
  }
  const isPdf = (f) => (f.type || '').includes('pdf') || /\.pdf$/i.test(f.name || '');
  const isImage = (f) => (f.type || '').startsWith('image/');
  const sizeText = (n) => (n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  const iconFor = (f) => (isPdf(f) ? '📄' : isImage(f) ? '🖼' : '📎');

  // ---------- pdf.js (wird erst bei Bedarf geladen) ----------
  let pdfPromise = null;
  function pdf() {
    if (!pdfPromise) {
      pdfPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'vendor/pdfjs/pdf.min.js';
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        };
        s.onerror = () => { pdfPromise = null; reject(new Error('pdf.js konnte nicht geladen werden')); };
        document.head.append(s);
      });
    }
    return pdfPromise;
  }
  async function openPdf(blob) {
    const lib = await pdf();
    return lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  }
  // Text eines PDFs mit Zeilenumbrüchen
  async function pdfText(blob) {
    const doc = await openPdf(blob);
    let out = '';
    for (let p = 1; p <= Math.min(doc.numPages, 15); p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      for (const item of content.items) out += item.str + (item.hasEOL ? '\n' : (item.str.endsWith(' ') ? '' : ' '));
      out += '\n';
    }
    return out.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ');
  }
  async function renderPage(doc, p, width) {
    const page = await doc.getPage(p);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas;
  }
  // Seiten als Bilder (für die Barcode-Erkennung)
  async function pdfCanvases(blob, maxPages = 4) {
    const doc = await openPdf(blob);
    const out = [];
    for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) out.push(await renderPage(doc, p, 1600));
    return out;
  }

  // ---------- Viewer ----------
  const dlg = $('#file-dialog');
  let current = null, currentUrl = null;

  async function view(meta) {
    const rec = await get(meta.id);
    if (!rec) { toast('Datei nicht gefunden'); return; }
    current = rec;
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(rec.blob);
    $('#file-name').textContent = rec.name;
    const box = $('#file-view');
    box.replaceChildren(h('p', { class: 'hint', text: 'Wird geladen…' }));
    dlg.showModal();
    try {
      if (isImage(rec)) {
        box.replaceChildren(h('img', { src: currentUrl, alt: rec.name }));
      } else if (isPdf(rec)) {
        const doc = await openPdf(rec.blob);
        const width = Math.min(1600, Math.round(box.clientWidth * (window.devicePixelRatio || 1)));
        box.replaceChildren();
        for (let p = 1; p <= doc.numPages; p++) {
          if (!dlg.open || current !== rec) return;
          box.append(await renderPage(doc, p, width));
        }
      } else {
        box.replaceChildren(h('p', { class: 'hint', text: 'Vorschau nicht möglich – mit „Öffnen / Teilen“ in einer anderen App öffnen.' }));
      }
    } catch (e) {
      box.replaceChildren(h('p', { class: 'hint', text: 'Vorschau fehlgeschlagen – mit „Öffnen / Teilen“ in einer anderen App öffnen.' }));
    }
  }

  $('#file-share').addEventListener('click', async () => {
    if (!current) return;
    const file = new File([current.blob], current.name, { type: current.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: current.name }); } catch (e) { /* abgebrochen */ }
    } else {
      const a = h('a', { href: currentUrl, download: current.name });
      document.body.append(a); a.click(); a.remove();
    }
  });
  $('#file-download').addEventListener('click', () => {
    if (!current) return;
    const a = h('a', { href: currentUrl, download: current.name });
    document.body.append(a); a.click(); a.remove();
  });
  $('#file-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { current = null; $('#file-view').replaceChildren(); });

  // ---------- Datensicherung ----------
  const toDataUrl = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  async function exportAll() {
    const records = await all();
    return Promise.all(records.map(async (r) => ({ id: r.id, name: r.name, type: r.type, size: r.size, data: await toDataUrl(r.blob) })));
  }
  async function importAll(list) {
    await clear();
    const records = await Promise.all((list || []).map(async (r) => ({
      id: r.id, name: r.name, type: r.type, size: r.size, blob: await (await fetch(r.data)).blob()
    })));
    await restore(records);
  }

  window.TC.files = { put, get, remove, view, isPdf, isImage, sizeText, iconFor, pdfText, pdfCanvases, exportAll, importAll };
})();
