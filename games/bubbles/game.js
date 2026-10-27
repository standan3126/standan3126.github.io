// Calm Bubbles: the hub's test game. It exists to prove every shared piece works on a real
// phone (Exit to Hub, Tap to Start, sound, saves, transfer codes, offline), so it uses the
// toolbox for everything and adds only the bubbles.
import { addExitButton, setupPage, tapToStart } from '/shared/v1/kit.js'
import { gameStore, makeTransferCode, openBackupFile, readTransferCode, saveBackupFile } from '/shared/v1/save.js'
import { LAYER_LABELS, LAYERS, Sound } from '/shared/v1/sound/index.js'

const GAME_ID = 'bubbles'
const store = gameStore(GAME_ID)
const DEFAULTS = { volumes: { notes: 0.8, nature: 0.6 }, music: false, nature: { creek: 0.5, birds: 0.35 } }

let progress = store.get('progress', { popped: 0 })
const settings = { ...DEFAULTS, ...store.get('settings', {}) }
const sound = new Sound({ ...settings.volumes, music: 0.5 })

const $ = (id) => document.getElementById(id)
const poppedLabel = $('popped')
const showProgress = () => (poppedLabel.textContent = progress.popped)
const saveProgress = () => store.set('progress', progress)
const saveSettings = () => store.set('settings', settings)
showProgress()

setupPage()
addExitButton({ beforeExit: saveProgress })

// --- The pond -----------------------------------------------------------------------------------

const canvas = $('pond')
const ctx = canvas.getContext('2d')
const bubbles = []
const ripples = []
const TINTS = ['#9cc3c9', '#8fb39a', '#c9b48f', '#d6a7a0', '#a9a6cf']
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
    tint: TINTS[Math.floor(Math.random() * TINTS.length)],
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
    g.addColorStop(0, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.55, b.tint + '88')
    g.addColorStop(1, b.tint + 'cc')
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
    ctx.strokeStyle = `rgba(111,148,128,${0.6 * (1 - p.age / 0.6)})`
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

// --- Settings -----------------------------------------------------------------------------------

const dialog = $('settings')
const message = $('message')
const say = (text) => (message.textContent = text)

$('open-settings').addEventListener('click', () => {
  say('')
  dialog.showModal()
})

for (const name of ['notes', 'nature']) {
  const slider = $(`vol-${name}`)
  slider.value = settings.volumes[name]
  slider.addEventListener('input', () => {
    settings.volumes[name] = Number(slider.value)
    sound.setVolumes({ [name]: settings.volumes[name] })
    saveSettings()
  })
}

$('music').checked = settings.music
$('music').addEventListener('change', () => {
  settings.music = $('music').checked
  sound.setMusic(settings.music)
  saveSettings()
})

const chips = $('nature')
for (const layer of LAYERS) {
  const chip = Object.assign(document.createElement('button'), { type: 'button', textContent: LAYER_LABELS[layer] })
  chip.setAttribute('aria-pressed', String(Boolean(settings.nature[layer])))
  chip.addEventListener('click', () => {
    if (settings.nature[layer]) delete settings.nature[layer]
    else settings.nature[layer] = 0.45
    chip.setAttribute('aria-pressed', String(Boolean(settings.nature[layer])))
    sound.setNature(settings.nature)
    saveSettings()
  })
  chips.append(chip)
}

// Moving progress: everything this game saved travels together.
function restore(data) {
  store.replaceAll(data)
  progress = store.get('progress', { popped: 0 })
  showProgress()
}

const codeBox = $('code')
const useCode = $('use-code')

$('make-code').addEventListener('click', async () => {
  codeBox.hidden = false
  useCode.hidden = true
  codeBox.value = makeTransferCode(GAME_ID, store.all())
  codeBox.select()
  try {
    await navigator.clipboard.writeText(codeBox.value)
    say('Code copied. Paste it into the game on the other phone or app.')
  } catch {
    say('Copy this code, then paste it into the game on the other phone or app.')
  }
})

$('enter-code').addEventListener('click', () => {
  codeBox.hidden = false
  useCode.hidden = false
  codeBox.value = ''
  codeBox.focus()
  say('')
})

useCode.addEventListener('click', () => {
  try {
    restore(readTransferCode(codeBox.value, GAME_ID))
    say('Progress restored.')
  } catch (e) {
    say(e.message)
  }
})

$('save-file').addEventListener('click', () => saveBackupFile(GAME_ID, store.all()))

$('load-file').addEventListener('click', async () => {
  try {
    restore(await openBackupFile(GAME_ID))
    say('Progress restored.')
  } catch (e) {
    say(e.message)
  }
})

// A checkpoint typed in by hand: what a "checkpoint" holds is up to each game.
$('manual').value = progress.popped
$('set-manual').addEventListener('click', () => {
  const n = Math.max(0, Math.floor(Number($('manual').value) || 0))
  progress = { ...progress, popped: n }
  saveProgress()
  showProgress()
  say(`Set to ${n} popped.`)
})

// --- Start --------------------------------------------------------------------------------------

tapToStart({
  title: 'Calm Bubbles',
  subtitle: 'Tap the bubbles as they drift up. There is no rush.',
  onStart: () => {
    sound.unlock()
    sound.setNature(settings.nature)
    sound.setMusic(settings.music)
  },
})
