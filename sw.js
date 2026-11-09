// Service Worker: cached die App-Shell, damit alles offline läuft.
const CACHE = 'thailand-companion-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css?v=5',
  './js/data.js?v=5',
  './js/app.js?v=5',
  './js/files.js?v=5',
  './js/calendar.js?v=5',
  './js/plan.js?v=5',
  './js/importer.js?v=5',
  './js/links.js?v=5',
  './js/cash.js?v=5',
  './vendor/pdfjs/pdf.min.js',
  './vendor/pdfjs/pdf.worker.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== 'tc-share').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// "Teilen → Thailand Companion": Inhalte zwischenspeichern und die App zum Import öffnen.
async function receiveShare(req) {
  const form = await req.formData();
  const files = form.getAll('files').filter((f) => f && typeof f !== 'string' && f.size);
  const cache = await caches.open('tc-share');
  await Promise.all((await cache.keys()).map((k) => cache.delete(k)));
  const meta = {
    title: form.get('title') || '', text: form.get('text') || '', url: form.get('url') || '',
    files: files.map((f) => ({ name: f.name, type: f.type }))
  };
  await cache.put('shared/meta', new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }));
  await Promise.all(files.map((f, i) => cache.put('shared/file-' + i, new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream' } }))));
  return Response.redirect(new URL('./index.html#import-shared', self.registration.scope).href, 303);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    event.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Fremde Hosts (Wechselkurs-API) nicht cachen – die App speichert den Kurs selbst.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Netzwerk zuerst (immer aktuell), offline aus dem Cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
