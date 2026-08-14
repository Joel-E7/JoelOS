importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Must match FIREBASE_CONFIG in index.html
firebase.initializeApp({
  apiKey: "AIzaSyB5QdQaXq72UNK1oCRDfZPZHm2-31LBsz0",
  authDomain: "joelos.firebaseapp.com",
  projectId: "joelos",
  storageBucket: "joelos.firebasestorage.app",
  messagingSenderId: "571313050682",
  appId: "1:571313050682:web:fadbacf90a567891891103"
});

const _messaging = firebase.messaging();

const APP_ORIGIN = 'https://joelos.web.app';

// Energy buttons on the notification itself. The check-in pushes were firing and being
// read, and nothing was getting logged — the gap was the several taps between seeing the
// reminder and having an entry saved. Three buttons collapse that to one.
//
// The service worker has no Firebase auth session of its own, so it can't write to
// Firestore directly. Instead the choice rides along in the URL and the app commits it
// on boot, which keeps a single write path and needs no credentials out here.
const ENERGY_ACTIONS = [
  { action: 'energy-3', title: '😔 Low' },
  { action: 'energy-6', title: '😐 OK' },
  { action: 'energy-9', title: '🔥 Good' }
];

_messaging.onBackgroundMessage(payload => {
  // Pushes are data-only so this handler always runs and can attach action buttons.
  // The `notification` fallback keeps older or manually-sent payloads working.
  const d = payload.data || {};
  const title = d.title || payload.notification?.title;
  const body = d.body || payload.notification?.body;
  const label = d.label;
  self.registration.showNotification(title || 'JE OS', {
    body: body || 'Time to log your energy!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: label ? `jeos-${label}` : 'jeos',
    // Drift is a "go look at this" nudge, not a one-tap log — buttons would be noise.
    actions: label === 'drift' ? [] : ENERGY_ACTIONS,
    data: { url: APP_ORIGIN, label }
  });
});

// Tap notification → log the chosen energy if a button was used, else just open the app.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const base = e.notification.data?.url || APP_ORIGIN;
  const match = /^energy-(\d+)$/.exec(e.action || '');
  const url = match ? `${base}/?log_energy=${match[1]}` : base;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(all => {
      const existing = all.find(c => c.url.startsWith(APP_ORIGIN));
      if (existing) {
        // An open tab won't re-read the URL, so hand it the value directly.
        if (match) existing.postMessage({ type: 'log_energy', value: Number(match[1]) });
        return existing.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// ── ASSET CACHING ─────────────────────────
// Bump this when the cached shell must be discarded — the activate handler deletes
// every cache whose name doesn't match, so a new name is what forces the refresh.
const CACHE = 'jeos-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
    ])
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname !== self.location.hostname) return;
  const dest = e.request.destination;
  const isDoc = e.request.mode === 'navigate' || dest === 'document' ||
    url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.webmanifest');
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      // HTML/JS must be network-first or deploys look like they didn't land.
      return isDoc ? net : (cached || net);
    })
  );
});

// Background sync → notify main thread to flush IDB queue
self.addEventListener('sync', e => {
  if (e.tag === 'jeos-sync') e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(all => all.forEach(c => c.postMessage({ type: 'jeos-sync' })))
  );
});
