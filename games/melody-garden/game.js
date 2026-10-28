// Melody Garden: a music toy, and where the user and Claude shape the music styles GameHub's
// games use. Pick a style (shared/v1/sound/styles.js), turn the dials, let players rest, add
// nature sounds. The music is made up live by the toolbox's composer, so it never repeats.
//
// My songs: a style with its sliders, resting players and nature sounds, saved under a name.
// A song's code can go to another phone, or to Claude to add to the toolbox (styles.js SONGS),
// so any game can play it.
import { gameFrame, setupPage, tapToStart } from '/shared/v1/kit.js'
import { gameStore, makeTransferCode, readTransferCode } from '/shared/v1/save.js'
import { SettingsPanel } from '/shared/v1/settings.js'
import { DIALS, LAYER_LABELS, LAYERS, Sound, STYLES } from '/shared/v1/sound/index.js'

const GAME_ID = 'melody-garden'
const store = gameStore(GAME_ID)
// The garden: what's on the page, saved under "garden". styles: per style, the dials and the
// players resting, so each style keeps its own sound. song: the id of the chosen song in songs
// (null when a style is chosen). Before 2026-10-28 it was saved under "settings" with a volume;
// that key now belongs to the shared Settings panel, and the volume became its Music slider.
const old = store.get('settings', null)
if (!store.get('garden', null) && old && ('style' in old || 'songs' in old)) {
  const { volume, ...rest } = old
  store.set('garden', rest)
  if (volume === undefined) store.remove('settings')
  else store.set('settings', { volumes: { music: volume } })
}
const NEW_GARDEN = () => ({ style: STYLES[0].id, styles: {}, nature: null, playing: true, song: null, songs: [] })
let garden = { ...NEW_GARDEN(), ...store.get('garden', {}) }
const saveGarden = () => store.set('garden', garden)

const sound = new Sound({ notes: 0, nature: 0.8, music: 0.7 })
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

// A style that's no longer in the toolbox (Canyon Flute, retired 2026-10-27) falls back to the first.
if (!STYLES.some((s) => s.id === garden.style)) garden.style = STYLES[0].id
const song = () => garden.songs.find((s) => s.id === garden.song)
const current = () => STYLES.find((s) => s.id === (song()?.from ?? garden.style)) || STYLES[0]
garden.nature ||= { ...current().nature }
// What the dials and players change: the chosen song, or this style's own garden.
function mine(style) {
  if (song()) return song()
  garden.styles[style.id] ||= { dials: { ...DIALS, ...style.dials }, off: style.parts.filter((p) => p.off).map((p) => p.id) }
  return garden.styles[style.id]
}

// --- Styles ------------------------------------------------------------------------------------

function renderStyles() {
  $('styles').replaceChildren(
    ...STYLES.map((style) => {
      const card = el('button', { type: 'button', className: 'style-card' })
      card.setAttribute('role', 'radio')
      card.setAttribute('aria-checked', String(!song() && style.id === garden.style))
      card.style.setProperty('--tint', style.color)
      card.append(el('span', { className: 'style-icon', textContent: style.icon, ariaHidden: 'true' }), el('strong', { textContent: style.name }), el('span', { className: 'style-blurb', textContent: style.blurb }))
      card.addEventListener('click', () => pickStyle(style))
      return card
    }),
  )
}

function pickStyle(style) {
  const changed = style.id !== garden.style || song()
  garden.style = style.id
  garden.song = null
  // Each style brings its own nature sounds along; the player can change them after.
  if (changed) garden.nature = { ...style.nature }
  garden.playing = true
  saveGarden()
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
        saveGarden()
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
        saveGarden()
      }),
    ),
  )
}

function renderNature() {
  const mix = garden.nature
  $('nature').replaceChildren(
    ...LAYERS.map((name) =>
      chip(LAYER_LABELS[name], !!mix[name], (on) => {
        if (on) garden.nature[name] = 0.35
        else delete garden.nature[name]
        if (song()) song().nature = { ...garden.nature }
        sound.setNature(garden.nature)
        saveGarden()
      }),
    ),
  )
}

$('reset').addEventListener('click', () => {
  const style = current()
  delete garden.styles[style.id]
  saveGarden()
  render()
  play()
})

// --- Playing -----------------------------------------------------------------------------------

function play() {
  const style = current()
  const my = mine(style)
  sound.unlock()
  sound.setMutedParts(my.off)
  sound.setStyle(style, my.dials)
  sound.setNature(garden.nature)
  sound.setMusic(garden.playing)
  showPlaying()
}

function showPlaying() {
  $('play').classList.toggle('playing', garden.playing)
  $('play').setAttribute('aria-label', garden.playing ? 'Pause' : 'Play')
  const { volumes, muted } = panel.settings
  const quiet = muted || volumes.music === 0
  $('nowLabel').textContent = !garden.playing ? 'Paused' : quiet ? 'Music is turned down in Settings' : 'Playing'
  $('nowName').textContent = song()?.name ?? current().name
  $('reset').hidden = !!song()
}

$('play').addEventListener('click', () => {
  garden.playing = !garden.playing
  saveGarden()
  play()
})

// --- My songs ----------------------------------------------------------------------------------

const note = (text) => ($('songNote').textContent = text)
const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 100) / 100]))

function renderSongs() {
  $('songs').replaceChildren(
    ...garden.songs.map((s) => {
      const style = STYLES.find((x) => x.id === s.from) || STYLES[0]
      const card = el('div', { className: 'song-card' })
      card.style.setProperty('--tint', style.color)
      const open = el('button', { type: 'button', className: 'song-open' })
      open.setAttribute('aria-pressed', String(s.id === garden.song))
      open.append(el('span', { className: 'style-icon', textContent: style.icon }), el('strong', { textContent: s.name }), el('span', { className: 'style-blurb', textContent: style.name }))
      open.addEventListener('click', () => pickSong(s))
      const copy = el('button', { type: 'button', className: 'small-button', textContent: 'Copy code' })
      copy.addEventListener('click', () => copyCode(s))
      const remove = el('button', { type: 'button', className: 'song-delete', textContent: '✕' })
      remove.setAttribute('aria-label', `Delete ${s.name}`)
      remove.addEventListener('click', () => {
        if (!confirm(`Delete “${s.name}”?`)) return
        garden.songs = garden.songs.filter((x) => x !== s)
        if (garden.song === s.id) garden.song = null
        saveGarden()
        render()
        play()
      })
      card.append(open, copy, remove)
      return card
    }),
  )
}

function pickSong(s) {
  garden.song = s.id
  garden.style = s.from
  garden.nature = { ...s.nature }
  garden.playing = true
  saveGarden()
  render()
  play()
}

$('saveForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const name = $('songName').value.trim()
  if (!name) return note('Give your song a name first.')
  const style = current()
  const my = mine(style)
  const s = { id: `song-${Date.now()}`, name, from: style.from ?? style.id, dials: round(my.dials), off: [...my.off], nature: round(garden.nature) }
  garden.songs.push(s)
  garden.song = s.id
  $('songName').value = ''
  saveGarden()
  render()
  note(`Saved “${name}”.`)
})

async function copyCode(s) {
  const code = makeTransferCode(GAME_ID, { name: s.name, from: s.from, dials: s.dials, off: s.off, nature: s.nature })
  $('codeArea').hidden = false
  $('pasteAdd').hidden = true
  $('codeBox').value = code
  $('codeBox').select()
  try {
    await navigator.clipboard.writeText(code)
    note(`The code for “${s.name}” is copied. Send it to Claude to add it to the toolbox, or paste it into Melody Garden on another phone.`)
  } catch {
    note(`Copy this code for “${s.name}”, then send it to Claude or paste it into Melody Garden on another phone.`)
  }
}

$('pasteOpen').addEventListener('click', () => {
  $('codeArea').hidden = false
  $('pasteAdd').hidden = false
  $('codeBox').value = ''
  $('codeBox').focus()
  note('Paste a song code, then tap Add this song.')
})

$('pasteAdd').addEventListener('click', () => {
  try {
    const data = readTransferCode($('codeBox').value, GAME_ID)
    const style = STYLES.find((x) => x.id === data?.from)
    if (!style || typeof data.name !== 'string') throw new Error("That song's style isn't here yet.")
    const s = { id: `song-${Date.now()}`, name: data.name.slice(0, 30), from: style.from ?? style.id, dials: { ...DIALS, ...style.dials, ...data.dials }, off: Array.isArray(data.off) ? data.off : [], nature: data.nature || {} }
    garden.songs.push(s)
    $('codeArea').hidden = true
    note(`Added “${s.name}”.`)
    pickSong(s)
  } catch (e) {
    note(e.message || "That code didn't work.")
  }
})

function render() {
  renderStyles()
  renderSongs()
  renderDials()
  renderPlayers()
  renderNature()
  showPlaying()
}

// --- Settings (the shared panel, like every GameHub game) ----------------------------------

// The page plays the music and nature sounds itself, so the panel only sets how loud (and Light).
const panel = new SettingsPanel({
  gameId: GAME_ID,
  store,
  sound,
  owns: ['music', 'nature'],
  notesLabel: null,
  defaults: { volumes: { notes: 0, nature: 0.8, music: 0.7 } },
  onChange: () => {
    applyLight()
    showPlaying()
  },
  beforeExport: saveGarden,
  onRestore: () => {
    garden = { ...NEW_GARDEN(), ...store.get('garden', {}) }
    render()
    play()
  },
  credits: ['Melody Garden was made for GameHub.', 'Every sound and all the music are made in code by the GameHub toolbox. Nothing is borrowed.'],
})

function applyLight() {
  document.documentElement.dataset.theme = panel.night ? 'night' : 'day'
  document.querySelector('meta[name="theme-color"]').content = panel.night ? '#1a0e06' : '#f4efe4'
}
applyLight()

// For the browser tests.
window.melodyGarden = { sound, panel }

setupPage()
// The toolbox frame: Hub top left, the Settings gear top right. No launch page, so always Hub.
gameFrame({ onSettings: () => panel.open(), beforeExit: saveGarden })
render()
tapToStart({ title: 'Melody Garden', subtitle: 'Make your own calm music.', onStart: play })
