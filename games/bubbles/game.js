// Calm Bubbles: the hub's test game. It exists to prove every shared piece works on a real
// phone (Exit to Hub, Tap to Start, sound, saves, transfer codes, offline), so it uses the
// toolbox for everything and adds only the bubbles.
import { addExitButton, setupPage, tapToStart } from '/shared/v1/kit.js'
import { gameStore } from '/shared/v1/save.js'
import { SettingsPanel } from '/shared/v1/settings.js'
import { Sound } from '/shared/v1/sound/index.js'

const GAME_ID = 'bubbles'
const store = gameStore(GAME_ID)

let progress = store.get('progress', { popped: 0 })

// Settings from before the shared panel (music on/off) move to its names: music plays when the
// Music slider is above 0.
const oldSettings = store.get('settings', null)
if (oldSettings && typeof oldSettings.music === 'boolean') {
  const volumes = { notes: 0.8, nature: 0.6, ...oldSettings.volumes, music: oldSettings.music ? 0.35 : 0 }
  store.set('settings', { ...oldSettings, volumes, music: 'quiet-words' })
}

const sound = new Sound({ notes: 0.8, nature: 0.6, music: 0.35 })

const $ = (id) => document.getElementById(id)
const poppedLabel = $('popped')
const showProgress = () => (poppedLabel.textContent = progress.popped)
const saveProgress = () => store.set('progress', progress)
showProgress()

setupPage()
addExitButton({ beforeExit: saveProgress })

// --- The pond -----------------------------------------------------------------------------------

const canvas = $('pond')
const ctx = canvas.getContext('2d')
const bubbles = []
const ripples = []
const DAY = { tints: ['#9cc3c9', '#8fb39a', '#c9b48f', '#d6a7a0', '#a9a6cf'], shine: '255,255,255', ripple: '111,148,128' }
// Night: warm light only (amber, orange, rose), no blue.
const NIGHT = { tints: ['#c98742', '#e0883a', '#b8693a', '#d9a066', '#a8573a'], shine: '255,214,170', ripple: '224,136,58' }
let look = DAY
let width = 0
let height = 0
let streak = 0
let lastPop = 0

function resize() {
  const ratio = devicePixelRatio || 1
  width = canvas.clientWidth
  height = canvas.clientHeight
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
}
addEventListener('resize', resize)
resize()

function addBubble(anywhere = false) {
  const r = 22 + Math.random() * 26 // finger-sized
  bubbles.push({
    x: r + Math.random() * Math.max(1, width - 2 * r),
    y: anywhere ? Math.random() * height : height + r,
    r,
    speed: 18 + Math.random() * 22, // pixels a second: slow and lazy
    sway: Math.random() * Math.PI * 2,
    tint: Math.floor(Math.random() * 5),
  })
}
for (let i = 0; i < 9; i++) addBubble(true)

let last = performance.now()
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  ctx.clearRect(0, 0, width, height)
  if (bubbles.length < 10 && Math.random() < dt * 1.2) addBubble()

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]
    b.y -= b.speed * dt
    b.sway += dt * 0.8
    const x = b.x + Math.sin(b.sway) * 10
    if (b.y < -b.r) {
      bubbles.splice(i, 1)
      continue
    }
    b.drawX = x
    const g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r)
    const tint = look.tints[b.tint]
    g.addColorStop(0, `rgba(${look.shine},0.95)`)
    g.addColorStop(0.55, tint + '88')
    g.addColorStop(1, tint + 'cc')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const p = ripples[i]
    p.age += dt
    if (p.age > 0.6) {
      ripples.splice(i, 1)
      continue
    }
    ctx.strokeStyle = `rgba(${look.ripple},${0.6 * (1 - p.age / 0.6)})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r + p.age * 60, 0, Math.PI * 2)
    ctx.stroke()
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

canvas.addEventListener('pointerdown', (e) => {
  // The nearest bubble under the finger, with a little extra reach for small fingers' sake.
  let hit = -1
  let best = Infinity
  bubbles.forEach((b, i) => {
    const d = Math.hypot(e.clientX - b.drawX, e.clientY - b.y)
    if (d < b.r + 12 && d < best) {
      best = d
      hit = i
    }
  })
  if (hit < 0) return
  const [b] = bubbles.splice(hit, 1)
  ripples.push({ x: b.drawX, y: b.y, r: b.r, age: 0 })
  // Quick pops climb the scale; a pause starts it again.
  const now = performance.now()
  streak = now - lastPop < 1500 ? streak + 1 : 0
  lastPop = now
  sound.step(streak % 10)
  progress.popped++
  showProgress()
  saveProgress()
  if (progress.popped % 25 === 0) sound.celebrate()
})

// --- Settings (the shared panel, like every GameHub game) ---------------------------------------

const panel = new SettingsPanel({
  gameId: GAME_ID,
  store,
  sound,
  notesLabel: 'Pop sounds',
  defaults: { volumes: { notes: 0.8, nature: 0.6, music: 0.35 }, nature: { creek: 0.5, birds: 0.35 } },
  onChange: applyLight,
  beforeExport: saveProgress,
  onRestore: () => {
    progress = store.get('progress', { popped: 0 })
    showProgress()
  },
  // A checkpoint typed in by hand, for when a save is lost: what a "checkpoint" holds is up to
  // each game. Hidden so nobody is tempted to cheat: tap "Settings" 5 times and enter the code.
  manual: {
    fields: [{ id: 'popped', label: 'Bubbles popped', get: () => progress.popped }],
    onSet: ({ popped }) => {
      progress = { ...progress, popped }
      saveProgress()
      showProgress()
      return `Set to ${popped} popped.`
    },
  },
  credits: ['Calm Bubbles was made for GameHub.', 'Every sound and all the music are made in code by the GameHub toolbox. Nothing is borrowed.'],
})

function applyLight() {
  look = panel.night ? NIGHT : DAY
  document.documentElement.dataset.theme = panel.night ? 'night' : 'day'
}
applyLight()

$('open-settings').addEventListener('click', () => panel.open())

// --- Start --------------------------------------------------------------------------------------

tapToStart({
  title: 'Calm Bubbles',
  subtitle: 'Tap the bubbles as they drift up. There is no rush.',
  onStart: () => {
    sound.unlock()
    panel.applySound()
  },
})

window.bubbles = { panel, sound }
