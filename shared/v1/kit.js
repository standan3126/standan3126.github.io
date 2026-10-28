// Pieces every GameHub game needs: the iPhone layout fix, the Exit to Hub button and the
// Tap to Start screen. Use with kit.css.
//
//   import { setupPage, addExitButton, tapToStart } from '/shared/v1/kit.js'
//   setupPage()
//   addExitButton({ beforeExit: () => saveNow() })
//   await tapToStart({ title: 'Calm Bubbles', onStart: () => sound.unlock() })

export const HUB_URL = '/'

// True inside the installed home-screen app (iPhone or Android), false in a browser tab.
export const isInstalled = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

// iOS 26 sizes a home-screen app short by the clock-bar height, leaving a strip at the bottom.
// html.ios-app (see kit.css) sizes by the full screen instead. Same fix as Quiet Words.
//
// GameHub icons added before 2026-10-27 keep a solid top bar, and iOS then starts the page below
// it, so the full-screen height is too tall and the bottom of the game falls off the screen.
// That case gets html.ios-solid-bar and --app-height (the height actually given); kit.css sizes
// by it, and a game can use var(--app-height) for its own full-height parts.
export function setupPage() {
  if (!navigator.standalone) return
  const root = document.documentElement
  root.classList.add('ios-app')
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;top:0;height:0;padding-top:env(safe-area-inset-top);visibility:hidden'
  document.body.append(probe)
  if (probe.offsetHeight === 0) {
    const fit = () => root.style.setProperty('--app-height', `${window.innerHeight}px`)
    fit()
    window.addEventListener('resize', fit)
    root.classList.add('ios-solid-bar')
  }
  probe.remove()
}

// Every game must show this: an installed app has no browser back button.
// beforeExit may return a promise (e.g. a final save); leaving waits for it.
export function addExitButton({ label = 'Hub', beforeExit } = {}) {
  const button = document.createElement('button')
  button.className = 'hub-exit'
  button.type = 'button'
  button.setAttribute('aria-label', 'Exit to GameHub')
  button.innerHTML = `<span aria-hidden="true">‹</span> ${label}`
  button.addEventListener('click', async () => {
    try {
      await beforeExit?.()
    } finally {
      location.href = HUB_URL
    }
  })
  document.body.append(button)
  return button
}

// The frame every game sits in, so the buttons around the game are the same in every game:
//   top left   Hub (on the launch page: leaves the game) or Home (while playing: back to the
//              game's launch page)
//   top right  the Settings gear, on every page, never moving
// A game without a launch page stays on 'launch' (Hub only). See kit.css for the launch page
// layout (.hub-launch, with Play and Levels always in the same spot).
//
//   const frame = gameFrame({ onSettings: () => panel.open(), beforeExit: saveNow, onHome: showHome })
//   frame.setPage('play')    // Home instead of Hub
//   frame.setPage('launch')  // Hub again
const ICONS = {
  hub: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 4.5l8 6.7"/><path d="M6.5 9.5V19.5h11V9.5"/><path d="M10.2 19.5v-5h3.6v5"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.7 7.7 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.7 7.7 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.7 7.7 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6Z"/></svg>',
}

const cornerButton = (className, label, icon, text) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.setAttribute('aria-label', label)
  button.innerHTML = ICONS[icon] + (text ? `<span>${text}</span>` : '')
  document.body.append(button)
  return button
}

// Just the Settings gear, top right (the GameHub start page uses it for GameHub's settings).
export function addSettingsGear(onSettings) {
  const gear = cornerButton('hub-corner hub-corner-right hub-gear', 'Settings', 'gear')
  gear.addEventListener('click', () => onSettings?.())
  return gear
}

export function gameFrame({ onSettings, beforeExit, onHome } = {}) {
  const hub = cornerButton('hub-corner hub-corner-left', 'Exit to GameHub', 'hub', 'Hub')
  const home = cornerButton('hub-corner hub-corner-left', 'Back to the game’s home', 'home', 'Home')
  const gear = addSettingsGear(onSettings)
  hub.addEventListener('click', async () => {
    try {
      await beforeExit?.()
    } finally {
      location.href = HUB_URL
    }
  })
  home.addEventListener('click', () => onHome?.())
  const setPage = (page) => {
    hub.hidden = page === 'play'
    home.hidden = page !== 'play'
  }
  setPage('launch')
  return { hub, home, gear, setPage }
}

// A full-screen "Tap to Start" card. Sound may only begin from a tap on iPhone, so onStart
// (called during that tap) is where to call sound.unlock(). Resolves once tapped.
export function tapToStart({ title, subtitle = '', button = 'Tap to Start', onStart } = {}) {
  return new Promise((resolve) => {
    const screen = document.createElement('div')
    screen.className = 'hub-start'
    screen.innerHTML = `
      <div class="hub-start-card">
        <h1></h1>
        <p></p>
        <button type="button" class="hub-button"></button>
      </div>`
    screen.querySelector('h1').textContent = title
    screen.querySelector('p').textContent = subtitle
    screen.querySelector('button').textContent = button
    screen.addEventListener('click', () => {
      onStart?.()
      screen.classList.add('hub-start-done')
      setTimeout(() => screen.remove(), 400)
      resolve()
    }, { once: true })
    document.body.append(screen)
  })
}

// Saves a whole game for offline play in the background, so parts it only loads later (level
// packs, pictures) are there without the internet too. listUrl is a JSON array of the game's
// file addresses. Only fetches what isn't saved yet, and only when GameHub's offline helper is
// running, so it costs nothing after the first time.
export async function warmOffline(listUrl) {
  if (!navigator.serviceWorker?.controller || !('caches' in self) || !navigator.onLine) return
  try {
    const files = await (await fetch(listUrl)).json()
    for (const file of files) {
      if (await caches.match(file)) continue
      await fetch(file).catch(() => {})
    }
  } catch {
    // Offline or the list is missing: the game still works, it just saves as it goes.
  }
}
