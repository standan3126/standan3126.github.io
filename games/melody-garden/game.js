// Melody Garden: a music toy, and where the user and Claude shape the music styles GameHub's
// games use. Pick a style (shared/v1/sound/styles.js), turn the dials, let players rest, add
// nature sounds. The music is made up live by the toolbox's composer, so it never repeats.
import { addExitButton, setupPage, tapToStart } from '/shared/v1/kit.js'
import { gameStore } from '/shared/v1/save.js'
import { DIALS, LAYER_LABELS, LAYERS, Sound, STYLES } from '/shared/v1/sound/index.js'

const GAME_ID = 'melody-garden'
const store = gameStore(GAME_ID)
// styles: per style, the dials and the players resting, so each style keeps its own sound.
const settings = { style: STYLES[0].id, styles: {}, nature: null, volume: 0.7, playing: true, ...store.get('settings', {}) }
const saveSettings = () => store.set('settings', settings)

const sound = new Sound({ notes: 0, nature: 0.8, music: settings.volume })
const $ = (id) => document.getElementById(id)
const el = (tag, props = {}) => Object.assign(document.createElement(tag), props)

// The dials, with words for each end instead of numbers.
const DIAL_LABELS = [
  { id: 'speed', name: 'Speed', ends: ['Slow', 'Quick'] },
  { id: 'busy', name: 'Notes', ends: ['A few', 'Lots'] },
  { id: 'bright', name: 'Sound', ends: ['Warm', 'Bright'] },
  { id: 'echo', name: 'Echo', ends: ['Close', 'Far away'] },
  { id: 'mood', name: 'Mood', ends: ['Sunny', 'Dreamy'] },
]

const current = () => STYLES.find((s) => s.id === settings.style) || STYLES[0]
settings.nature ||= { ...current().nature }
function mine(style) {
  settings.styles[style.id] ||= { dials: { ...DIALS, ...style.dials }, off: style.parts.filter((p) => p.off).map((p) => p.id) }
  return settings.styles[style.id]
}

// --- Styles ------------------------------------------------------------------------------------

function renderStyles() {
  $('styles').replaceChildren(
    ...STYLES.map((style) => {
      const card = el('button', { type: 'button', className: 'style-card' })
      card.setAttribute('role', 'radio')
      card.setAttribute('aria-checked', String(style.id === settings.style))
      card.style.setProperty('--tint', style.color)
      card.append(el('span', { className: 'style-icon', textContent: style.icon, ariaHidden: 'true' }), el('strong', { textContent: style.name }), el('span', { className: 'style-blurb', textContent: style.blurb }))
      card.addEventListener('click', () => pickStyle(style))
      return card
    }),
  )
}

function pickStyle(style) {
  const changed = style.id !== settings.style
  settings.style = style.id
  // Each style brings its own nature sounds along; the player can change them after.
  if (changed) settings.nature = { ...style.nature }
  settings.playing = true
  saveSettings()
  render()
  play()
}

// --- Dials, players, nature ----------------------------------------------------------------

function dial(label, value, ends, onInput) {
  const row = el('label', { className: 'dial' })
  row.append(el('span', { className: 'dial-name', textContent: label }))
  const input = el('input', { type: 'range', min: 0, max: 1, step: 0.01, value })
  input.setAttribute('aria-label', label)
  input.addEventListener('input', () => onInput(Number(input.value)))
  const words = el('span', { className: 'ends' })
  words.append(el('span', { textContent: ends[0] }), el('span', { textContent: ends[1] }))
  row.append(words, input)
  return row
}

function renderDials() {
  const style = current()
  const my = mine(style)
  $('dials').replaceChildren(
    ...DIAL_LABELS.map((d) =>
      dial(d.name, my.dials[d.id], d.ends, (v) => {
        my.dials[d.id] = v
        sound.setDials({ [d.id]: v })
        saveSettings()
      }),
    ),
  )
}

function chip(label, on, onToggle) {
  const b = el('button', { type: 'button', className: 'chip', textContent: label })
  b.setAttribute('aria-pressed', String(on))
  b.addEventListener('click', () => {
    const now = b.getAttribute('aria-pressed') !== 'true'
    b.setAttribute('aria-pressed', String(now))
    onToggle(now)
  })
  return b
}

function renderPlayers() {
  const style = current()
  const my = mine(style)
  $('players').replaceChildren(
    ...style.parts.map((part) =>
      chip(part.label, !my.off.includes(part.id), (on) => {
        my.off = on ? my.off.filter((id) => id !== part.id) : [...my.off, part.id]
        sound.setMutedParts(my.off)
        saveSettings()
      }),
    ),
  )
}

function renderNature() {
  const mix = settings.nature
  $('nature').replaceChildren(
    ...LAYERS.map((name) =>
      chip(LAYER_LABELS[name], !!mix[name], (on) => {
        if (on) settings.nature[name] = 0.35
        else delete settings.nature[name]
        sound.setNature(settings.nature)
        saveSettings()
      }),
    ),
  )
}

$('reset').addEventListener('click', () => {
  const style = current()
  delete settings.styles[style.id]
  saveSettings()
  render()
  play()
})

$('volume').value = settings.volume
$('volume').addEventListener('input', (e) => {
  settings.volume = Number(e.target.value)
  sound.setVolumes({ music: settings.volume })
  saveSettings()
})

// --- Playing -----------------------------------------------------------------------------------

function play() {
  const style = current()
  const my = mine(style)
  sound.unlock()
  sound.setMutedParts(my.off)
  sound.setStyle(style, my.dials)
  sound.setNature(settings.nature)
  sound.setMusic(settings.playing)
  showPlaying()
}

function showPlaying() {
  $('play').classList.toggle('playing', settings.playing)
  $('play').setAttribute('aria-label', settings.playing ? 'Pause' : 'Play')
  $('nowLabel').textContent = settings.playing ? 'Playing' : 'Paused'
  $('nowName').textContent = current().name
}

$('play').addEventListener('click', () => {
  settings.playing = !settings.playing
  saveSettings()
  play()
})

function render() {
  renderStyles()
  renderDials()
  renderPlayers()
  renderNature()
  showPlaying()
}

// For the browser tests.
window.melodyGarden = { sound }

setupPage()
addExitButton({ beforeExit: saveSettings })
render()
tapToStart({ title: 'Melody Garden', subtitle: 'Make your own calm music.', onStart: play })
