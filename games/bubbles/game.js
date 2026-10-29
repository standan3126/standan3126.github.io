// Calm Bubbles: a calm popping toy for little ones (and grown-ups). It started as the hub's test
// game, proving every shared piece works on a real phone (the game frame, Tap to Start, sound,
// saves, transfer codes, offline), so it uses the toolbox for everything and adds only the pond.
import { gameFrame, setupPage, tapToStart } from '/shared/v1/kit.js'
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
// The toolbox frame: Hub top left, the Settings gear top right. No launch page, so always Hub.
gameFrame({ onSettings: () => panel.open(), beforeExit: saveProgress })

// --- The pond -----------------------------------------------------------------------------------
// Version 1 (2026-10-28): lots of bubbles in many sizes and colors, a big one that pops into
// little ones, a rare shimmery one, a soft splash of droplets on every pop, and softer sounds.

const canvas = $('pond')
const ctx = canvas.getContext('2d')
const bubbles = []
const ripples = []
const drops = []
// Soft pastel colors by day. Night: warm light only (amber, orange, rose, gold), no blue.
const DAY = {
  tints: ['#8ec5d6', '#8fc7a4', '#e3bf86', '#e7a39b', '#b4a8dc', '#e8d77e', '#f0a8c4', '#86c9bf', '#c4a0d6', '#a9c97f'],
  shine: '255,255,255',
  ripple: '111,148,128',
  shimmer: [0, 360], // every hue
}
const NIGHT = {
  tints: ['#c98742', '#e0883a', '#b8693a', '#d9a066', '#a8573a', '#e6b450', '#cf7a5c', '#d4935f'],
  shine: '255,214,170',
  ripple: '224,136,58',
  shimmer: [10, 50], // red-orange to gold
}
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

// How many bubbles the pond holds: about 22 on a phone, more on a bigger screen.
const crowd = () => Math.round(Math.min(40, Math.max(16, (width * height) / 16000)))

// Sizes from tiny to big. Tiny ones are still easy to hit: a tap reaches a little past the edge.
const SIZES = [
  { min: 12, max: 18, weight: 3 }, // tiny
  { min: 20, max: 30, weight: 4 },
  { min: 30, max: 42, weight: 3 },
  { min: 44, max: 58, weight: 2 }, // big
]
function pickSize() {
  let n = Math.random() * SIZES.reduce((t, s) => t + s.weight, 0)
  const s = SIZES.find((s) => (n -= s.weight) < 0)
  return s.min + Math.random() * (s.max - s.min)
}

const BIG_ONE = 0.05 // a big bubble that pops into little ones
const SHIMMER = 0.04 // the rare shimmery one

function addBubble(anywhere = false) {
  const roll = Math.random()
  const kind = roll < SHIMMER ? 'shimmer' : roll < SHIMMER + BIG_ONE ? 'cluster' : 'plain'
  const r = kind === 'cluster' ? 58 + Math.random() * 12 : kind === 'shimmer' ? 34 + Math.random() * 10 : pickSize()
  bubbles.push(bubble(r + Math.random() * Math.max(1, width - 2 * r), anywhere ? Math.random() * height : height + r, r, kind))
}

function bubble(x, y, r, kind = 'plain') {
  return {
    x,
    y,
    r,
    kind,
    speed: 16 + Math.random() * 22 + (40 - Math.min(40, r)) * 0.25, // slow and lazy; little ones a touch quicker
    sway: Math.random() * Math.PI * 2,
    swayWidth: 6 + Math.random() * 10,
    tint: Math.floor(Math.random() * 10),
    drift: 0, // sideways push for the little ones a big bubble lets go of
  }
}

function bubbleColor(b, now) {
  if (b.kind === 'shimmer') {
    const [from, to] = look.shimmer
    const hue = from + (((now / 40 + b.sway * 50) % (to - from)) + (to - from)) % (to - from)
    return `hsl(${hue.toFixed(0)} 75% 72%)`
  }
  return look.tints[b.tint % look.tints.length]
}

function drawBubble(b, x, now) {
  const tint = bubbleColor(b, now)
  ctx.beginPath()
  ctx.arc(x, b.y, b.r, 0, Math.PI * 2)
  if (b.kind === 'shimmer') {
    // A slowly turning rainbow sheen (warm hues only at night), shine on top.
    const [from, to] = look.shimmer
    const a = now / 1500 + b.sway
    const sheen = ctx.createLinearGradient(x - Math.cos(a) * b.r, b.y - Math.sin(a) * b.r, x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r)
    for (let i = 0; i <= 4; i++) {
      const hue = from + ((((now / 30 + i * (to - from) / 4) % (to - from)) + (to - from)) % (to - from))
      sheen.addColorStop(i / 4, `hsl(${hue.toFixed(0)} 80% 72% / 0.85)`)
    }
    ctx.fillStyle = sheen
    ctx.fill()
    const shine = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r)
    shine.addColorStop(0, `rgba(${look.shine},0.9)`)
    shine.addColorStop(0.6, `rgba(${look.shine},0.1)`)
    shine.addColorStop(1, `rgba(${look.shine},0)`)
    ctx.fillStyle = shine
  } else {
    const g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, x, b.y, b.r)
    g.addColorStop(0, `rgba(${look.shine},0.95)`)
    g.addColorStop(0.55, withAlpha(tint, 0.55))
    g.addColorStop(1, withAlpha(tint, 0.85))
    ctx.fillStyle = g
  }
  ctx.fill()
  // A thin rim and a soft shine, like a real bubble.
  ctx.strokeStyle = `rgba(${look.shine},0.5)`
  ctx.lineWidth = Math.max(1, b.r / 22)
  ctx.stroke()
  ctx.fillStyle = `rgba(${look.shine},0.6)`
  ctx.beginPath()
  ctx.ellipse(x - b.r * 0.38, b.y - b.r * 0.42, b.r * 0.18, b.r * 0.1, -0.6, 0, Math.PI * 2)
  ctx.fill()
  if (b.kind === 'cluster') {
    // Little bubbles inside, a hint of what it pops into.
    ctx.fillStyle = `rgba(${look.shine},0.45)`
    for (let i = 0; i < 4; i++) {
      const a = b.sway * 0.6 + i * 1.6
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * b.r * 0.42, b.y + Math.sin(a) * b.r * 0.42, b.r * 0.13, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (b.kind === 'shimmer') {
    // Three slow twinkles around it.
    for (let i = 0; i < 3; i++) {
      const a = now / 900 + (i * Math.PI * 2) / 3
      const twinkle = 0.5 + 0.5 * Math.sin(now / 400 + i * 2)
      star(x + Math.cos(a) * b.r * 1.2, b.y + Math.sin(a) * b.r * 1.2, 4 + twinkle * 4, withAlpha(tint, 0.5 + 0.4 * twinkle))
    }
  }
}

function star(x, y, size, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const r = i % 2 ? size * 0.35 : size
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  ctx.fill()
}

// '#rrggbb' or 'hsl(...)' with an alpha.
function withAlpha(color, alpha) {
  if (color.startsWith('hsl')) return color.replace(')', ` / ${alpha})`)
  const n = parseInt(color.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`
}

for (let i = 0; i < crowd(); i++) addBubble(true)

let last = performance.now()
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  ctx.clearRect(0, 0, width, height)
  // New bubbles come up often (about three a second) until the pond is full.
  if (bubbles.length < crowd() && Math.random() < dt * 3) addBubble()

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]
    b.y -= b.speed * dt
    b.sway += dt * 0.8
    b.x += b.drift * dt
    b.drift *= 1 - Math.min(1, dt * 1.5)
    const x = b.x + Math.sin(b.sway) * b.swayWidth
    if (b.y < -b.r) {
      bubbles.splice(i, 1)
      continue
    }
    b.drawX = x
    drawBubble(b, x, now)
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    const p = ripples[i]
    p.age += dt
    if (p.age > 0.6) {
      ripples.splice(i, 1)
      continue
    }
    ctx.strokeStyle = `rgba(${look.ripple},${0.5 * (1 - p.age / 0.6)})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r + p.age * 50, 0, Math.PI * 2)
    ctx.stroke()
  }

  // The soft splash: droplets drift out, sink a little and fade.
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]
    d.age += dt
    if (d.age > d.life) {
      drops.splice(i, 1)
      continue
    }
    d.vx *= 1 - dt * 2
    d.vy = d.vy * (1 - dt * 2) + 60 * dt
    d.x += d.vx * dt
    d.y += d.vy * dt
    const fade = 1 - d.age / d.life
    if (d.sparkle) star(d.x, d.y, d.size * (0.6 + 0.4 * fade), withAlpha(d.color, 0.9 * fade))
    else {
      ctx.fillStyle = withAlpha(d.color, 0.75 * fade)
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.size * (0.5 + 0.5 * fade), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

function splash(b, now) {
  const color = bubbleColor(b, now)
  const count = Math.round(6 + b.r / 5)
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const speed = 30 + Math.random() * 50 + b.r
    drops.push({
      x: b.drawX + Math.cos(a) * b.r * 0.7,
      y: b.y + Math.sin(a) * b.r * 0.7,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      size: 2 + Math.random() * (b.r / 12),
      color: b.kind === 'shimmer' ? `hsl(${look.shimmer[0] + Math.random() * (look.shimmer[1] - look.shimmer[0])} 75% 72%)` : color,
      sparkle: b.kind === 'shimmer',
      age: 0,
      life: 0.6 + Math.random() * 0.4,
    })
  }
}

// --- Softer sounds for little ears --------------------------------------------------------------
// Rounder than the toolbox's marimba (no mallet knock) and quieter, with a little upward
// "bloop". Played through the shared notes bus, so the Pop sounds slider and mute still work.
const POP_SCALE = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88].map((m) => 440 * 2 ** ((m - 69) / 12))

function bloop(freq, when, peak, decay = 0.7) {
  const c = sound.ctx
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq * 0.82, when)
  osc.frequency.exponentialRampToValueAtTime(freq, when + 0.05)
  env.gain.setValueAtTime(0, when)
  env.gain.linearRampToValueAtTime(peak, when + 0.02)
  env.gain.exponentialRampToValueAtTime(0.0001, when + decay)
  osc.connect(env).connect(sound.buses.notes)
  osc.start(when)
  osc.stop(when + decay + 0.05)
}

function popSound(b, step) {
  if (!sound.ctx || !sound.buses) return
  const t = sound.ctx.currentTime + 0.005
  // Bigger bubbles sound a little lower.
  const freq = POP_SCALE[step % POP_SCALE.length] * (b.r > 44 ? 0.5 : 1)
  bloop(freq, t, 0.2)
  bloop(freq * 2, t, 0.04, 0.3)
  if (b.kind === 'shimmer') [1.25, 1.5, 2].forEach((k, i) => bloop(freq * k, t + 0.08 * (i + 1), 0.08, 0.9))
}

function celebrate() {
  if (!sound.ctx || !sound.buses) return
  const t = sound.ctx.currentTime + 0.005
  ;[72, 76, 79, 84].forEach((m, i) => bloop(440 * 2 ** ((m - 69) / 12), t + i * 0.16, 0.1, 1.6))
}

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
  pop(hit)
})

function pop(index) {
  const now = performance.now()
  const [b] = bubbles.splice(index, 1)
  ripples.push({ x: b.drawX, y: b.y, r: b.r, age: 0 })
  splash(b, now)
  // The big one lets go of a few little bubbles, which float off on their own.
  if (b.kind === 'cluster') {
    const n = 4 + Math.floor(Math.random() * 2)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const little = bubble(b.drawX + Math.cos(a) * b.r * 0.4, b.y + Math.sin(a) * b.r * 0.4, 14 + Math.random() * 8)
      little.drift = Math.cos(a) * 70
      little.y += Math.sin(a) * 10
      bubbles.push(little)
    }
  }
  // Quick pops climb the scale; a pause starts it again.
  streak = now - lastPop < 1500 ? streak + 1 : 0
  lastPop = now
  popSound(b, streak)
  progress.popped++
  showProgress()
  saveProgress()
  if (progress.popped % 25 === 0) celebrate()
}

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

// --- Start --------------------------------------------------------------------------------------

tapToStart({
  title: 'Calm Bubbles',
  subtitle: 'Tap the bubbles as they drift up. There is no rush.',
  onStart: () => {
    sound.unlock()
    panel.applySound()
  },
})

window.bubbles = { panel, sound, pond: bubbles, drops, pop, bubble, pickSize, look: () => look }
