// GameHub's offline helper (service worker). The only one on standan3126.github.io once games
// move in. It keeps three kinds of saved copies:
//   hub-core-<version>  the launchpad, saved as soon as GameHub is installed
//   hub-shared          the shared toolbox (/shared/...), saved as games use it
//   game-<id>           each ready game, saved the first time it's played
// Anything else (including games still marked 'soon') is left completely alone.
//
// Saved copies are shown first, then refreshed in the background, so a new version appears
// on the launch after the first online one.
importScripts('/games.js')

const VERSION = 'dev' // replaced with the commit id when deployed
const CORE = `hub-core-${VERSION}`
const SHARED = 'hub-shared'
const CORE_FILES = [
  '/',
  '/style.css',
  '/app.js',
  '/games.js',
  '/manifest.json',
  '/version.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CORE)
      .then((cache) => cache.addAll(CORE_FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('hub-core-') && n !== CORE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

// Which saved-copy bucket a path belongs to, or null to leave it alone.
function bucketFor(path) {
  if (path === '/' || path === '/index.html' || CORE_FILES.includes(path) || path.startsWith('/icons/')) return CORE
  if (path.startsWith('/shared/')) return SHARED
  const game = self.GAMES.find((g) => g.status === 'ready' && path.startsWith(g.path))
  return game ? `game-${game.id}` : null
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return
  const bucket = bucketFor(url.pathname)
  if (!bucket) return
  event.respondWith(fromCache(request, bucket, event))
})

async function fromCache(request, bucket, event) {
  const cache = await caches.open(bucket)
  const navigate = request.mode === 'navigate'
  const saved = await cache.match(request, { ignoreSearch: navigate })
  const fresh = fetch(request).then((response) => {
    if (response.ok && response.type === 'basic') cache.put(request, response.clone())
    return response
  })
  if (saved) {
    event.waitUntil(fresh.catch(() => {}))
    return saved
  }
  try {
    return await fresh
  } catch {
    if (navigate) return offlinePage()
    return Response.error()
  }
}

// Shown when a game was never opened online, so there's no saved copy yet.
function offlinePage() {
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Not saved yet</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f4efe4;color:#3b3a34;font:17px/1.5 system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box">
<div><h1 style="font-size:1.4rem">This game isn't saved for offline yet</h1>
<p>Connect to the internet and open it once. After that it works anywhere.</p>
<p><a href="/" style="color:#4f7a64;font-weight:600">Back to GameHub</a></p></div>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
