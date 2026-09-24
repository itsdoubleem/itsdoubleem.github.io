// Offline. The whole app is precached on first load, so after that it opens with
// the network off — which is the condition it is actually used in.
//
// The two placeholders below are filled in by tools/build.mjs. Do not write their
// names anywhere else in this file, comments included: the build stamps them by
// text, and an earlier version of this comment spelled them out, so the build
// replaced the comment and left the code holding raw placeholders. The service
// worker then failed to parse and the app quietly stopped working offline.

const VERSION = '3e52bc10c2';
const CACHE = `hangil-${VERSION}`;
const FILES = [
  "./",
  "content/images/manifest.json",
  "content/listening/manifest.json",
  "css/app.css",
  "data/course-1.json",
  "data/course-2.json",
  "data/course-3.json",
  "data/course-4.json",
  "data/exam-drills.json",
  "data/exam-mock-1.json",
  "data/exam-mock-2.json",
  "data/guide.json",
  "data/hangeul.json",
  "data/pictures.json",
  "data/tags.json",
  "data/trades-1.json",
  "data/trades-2.json",
  "data/vocab-1.json",
  "data/vocab-2.json",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "index.html",
  "js/alphabet.js",
  "js/app.js",
  "js/data.js",
  "js/deck.js",
  "js/hangul.js",
  "js/i18n.js",
  "js/mock.js",
  "js/quiz.js",
  "js/store.js",
  "js/tts.js",
  "js/util.js",
  "js/views.js",
  "manifest.webmanifest"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ignoreVary is not optional, and this cost an afternoon. A module script is
// fetched in CORS mode and therefore carries an Origin header; the precache
// request does not. A host that answers static files with `Vary: Origin` — astro
// preview does, and it is a common enough header — makes those two requests fail
// to match, so js/app.js missed the cache, fell through to the network, and was
// answered with the index.html fallback. Offline then looked like a page stuck on
// "Loading…" with one MIME-type error, which points nowhere near the real cause.
const MATCH = { ignoreVary: true, ignoreSearch: false };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Content added after install (listening audio) is cached the first time it
  // is played, so a file dropped in later still works offline afterwards.
  e.respondWith(
    caches.match(req, MATCH).then(hit => hit || fetch(req).then(res => {
      if (res.ok && (url.pathname.includes('/content/') || url.pathname.includes('/data/'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() =>
      // Only a navigation may fall back to the shell. Answering a missing script
      // or JSON file with HTML is what turned a cache miss into a silent failure.
      req.mode === 'navigate' ? caches.match('index.html', MATCH) : Response.error()
    ))
  );
});
