// Conserva tutti i file dell'app per l'uso senza internet. Non tocca mai i dati delle voci.
const VERSIONE = 'b26a8a0cf423';
const FILE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/diario.css',
  'js/app.js',
  'js/archivio.js',
  'js/aspetto.js',
  'js/avvio.js',
  'js/comuni.js',
  'js/dati.js',
  'js/home.js',
  'js/impostazioni.js',
  'js/logica.js',
  'js/nav.js',
  'js/nuova.js',
  'js/seduta.js',
  'js/ui.js',
  'js/voce.js',
  'font/atkinson-hyperlegible-next.woff2',
  'font/instrument-serif-400.woff2',
  'icone/apertura-chiaro.png',
  'icone/apertura-scuro.png',
  'icone/icona-180.png',
  'icone/icona-192.png',
  'icone/icona-512.png',
  'icone/icona.svg',
];

const CACHE = `diario-${VERSIONE}`;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n.startsWith('diario-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const pagina = e.request.mode === 'navigate';
  e.respondWith(
    caches.match(pagina ? './' : e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)),
  );
});
