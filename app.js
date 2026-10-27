// The launchpad: draws a card per game, and manages each game's offline copy.

const list = document.getElementById('games')
const confirmBox = document.getElementById('confirm')

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})

// Ask the phone not to clear GameHub's saved data when space runs low.
navigator.storage?.persist?.().catch(() => {})

const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
document.getElementById('install').hidden = installed

const formatSize = (bytes) => (bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(1)} MB`)

// How much space a game's offline copy takes, or 0 if it has none.
async function savedSize(id) {
  if (!('caches' in self) || !(await caches.has(`game-${id}`))) return 0
  const cache = await caches.open(`game-${id}`)
  let total = 0
  for (const request of await cache.keys()) {
    const response = await cache.match(request)
    total += (await response.clone().blob()).size
  }
  return total
}

function card(game) {
  const ready = game.status === 'ready'
  const li = document.createElement('li')
  li.className = `game${ready ? '' : ' game-soon'}`
  li.style.setProperty('--tint', game.color)
  li.innerHTML = `
    <div class="game-art" aria-hidden="true"></div>
    <div class="game-text">
      <h2></h2>
      <p class="game-blurb"></p>
      <p class="game-saved"></p>
    </div>
    <div class="game-actions"></div>`
  li.querySelector('.game-art').textContent = game.icon
  li.querySelector('h2').textContent = game.name
  li.querySelector('.game-blurb').textContent = game.blurb
  const actions = li.querySelector('.game-actions')

  if (!ready) {
    actions.innerHTML = '<span class="soon">Coming soon</span>'
    return li
  }

  const play = Object.assign(document.createElement('a'), { href: game.path, className: 'play', textContent: 'Play' })
  play.setAttribute('aria-label', `Play ${game.name}`)
  const free = Object.assign(document.createElement('button'), { type: 'button', className: 'free', textContent: 'Free up space' })
  free.hidden = true
  actions.append(play, free)

  const saved = li.querySelector('.game-saved')
  const showSize = async () => {
    const size = await savedSize(game.id)
    free.hidden = size === 0
    saved.textContent = size ? `Saved for offline · ${formatSize(size)}` : 'Not saved for offline yet'
  }
  showSize()

  free.addEventListener('click', async () => {
    document.getElementById('confirm-title').textContent = `Free up space from ${game.name}?`
    confirmBox.returnValue = 'cancel'
    confirmBox.showModal()
    confirmBox.addEventListener(
      'close',
      async () => {
        if (confirmBox.returnValue !== 'ok') return
        await caches.delete(`game-${game.id}`)
        showSize()
        showStorage()
      },
      { once: true },
    )
  })
  return li
}

list.append(...self.GAMES.map(card))

async function showStorage() {
  const estimate = await navigator.storage?.estimate?.().catch(() => null)
  if (estimate?.usage) document.getElementById('storage').textContent = `GameHub is using ${formatSize(estimate.usage)} on this device.`
}
showStorage()

// The version line helps tell whether an update has arrived.
fetch('/version.json')
  .then((r) => r.json())
  .then((v) => {
    if (v.version !== 'dev') document.getElementById('version').textContent = `Version ${v.version} · ${v.date}`
  })
  .catch(() => {})
