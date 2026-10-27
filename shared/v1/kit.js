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
