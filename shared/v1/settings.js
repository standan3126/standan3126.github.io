// One Settings panel for every GameHub game, so they all look and work alike. Kept short on
// purpose: what people change often is open, what they rarely need is folded away.
//
//   Light            Day / Night / Auto (night by the clock); Night is warm light only.
//                    The game may add its own look options here (look).
//   [game sections]  place: 'look'
//   Sound            Game sounds, Nature sounds, Music sliders; Music style; Mute everything
//   [game sections]  e.g. how play works (place: 'play', the default)
//   ▸ Nature sounds        folded: one slider per sound
//   ▸ Move your progress   folded: transfer code and backup file
//   ▸ Credits              folded
//   Reset to GameHub settings
//   Grown-up tools   hidden: 5 taps on the heading + the family code
//
// GameHub settings (decided by the user 2026-10-28): the GameHub start page has its own panel
// (global: true) for the shared settings (Light, volumes, mute, music style, nature sounds).
// Those are every game's starting point; the game has the final say. Each game saves only what
// the player changed in that game ("my-settings"), so everything else keeps following GameHub,
// even when GameHub's settings change later. Layers, last one wins:
//   toolbox defaults → the game's defaults → changed on GameHub → changed in this game
// A game's own settings (Arrowhead's colors...) are never global. "Reset to GameHub settings"
// forgets everything changed in this game, except keepOnReset (things that aren't really
// settings, like Love To Color's saved colors). It never touches progress.
//
// (Before 2026-10-27 Music and Nature sounds were open sections, as in Quiet Words, which keeps
// that longer layout for now so the user can compare.)
//
// It saves the settings (in the game's store, key "my-settings"; before 2026-10-28 the whole
// object went in "settings", which is carried over once) and plays the sound settings through
// the toolbox Sound by itself. Use with settings.css.
//
//   import { SettingsPanel, toggle } from '/shared/v1/settings.js'
//   const panel = new SettingsPanel({
//     gameId: 'arrowhead', store, sound,
//     defaults: { calm: false },               // the game's own settings
//     onChange: (settings, patch) => { ... },  // after every change (and when Auto turns night)
//     sections: [{ title: 'Play', build: (el, panel) => el.append(toggle({ ... })) }],
//     manual: { fields: [{ id: 'level', label: 'Level', get: () => 3 }], onSet: (values) => ... },
//     beforeExport: () => saveNow(),           // write the latest save before a code or backup
//     onRestore: (data) => { ... },            // after a code or backup file replaced the save
//     credits: ['Made for GameHub.', ...],     // lines (text or elements), or a function giving
//                                              // them (called when the dropdown opens)
//     exportData: () => store.all(),           // what a code or backup holds (default: everything)
//     keepOnReset: ['myColors'],               // the game's own keys Reset leaves alone
//   })
//   panel.open()
//   panel.settings.section = 'easy'; panel.saveOwn()  // a game's own choice changed outside the panel

import { hiddenUnlock } from './secret.js'
import { gameStore, makeTransferCode, openBackupFile, readTransferCode, saveBackupFile } from './save.js'
import { LAYER_LABELS, LAYERS, STYLES } from './sound/index.js'

// "quiet-words" is the gentle music first made for Quiet Words (Sound with no style).
export const QUIET_WORDS_MUSIC = 'quiet-words'

export const SHARED_DEFAULTS = {
  light: 'day', // 'day' | 'night' | 'auto'
  nightStart: '20:00',
  nightEnd: '07:00',
  volumes: { notes: 0.7, nature: 0.5, music: 0.35 },
  muted: false,
  music: QUIET_WORDS_MUSIC,
  nature: {}, // { rain: 0.5, ... }
}

// Where GameHub's own settings live (the start page's panel), and each game's changes.
export const HUB_ID = 'hub'
const MINE = 'my-settings'
const SHARED_KEYS = Object.keys(SHARED_DEFAULTS)

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Puts one layer of changes over another. Volumes count one by one: changing Music in a game
// leaves its Game sounds and Nature sounds following GameHub.
function layer(base, top) {
  return { ...base, ...top, volumes: { ...base.volumes, ...top.volumes } }
}

// A whole settings object saved before 2026-10-28 → only what differs from the game's defaults.
function changesFrom(saved, defaults) {
  const out = {}
  for (const [key, value] of Object.entries(saved ?? {})) {
    if (key === 'volumes') {
      const volumes = Object.fromEntries(Object.entries(value ?? {}).filter(([k, v]) => v !== defaults.volumes[k]))
      if (Object.keys(volumes).length) out.volumes = volumes
    } else if (!same(value, defaults[key])) out[key] = value
  }
  return out
}

const minutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Night window may wrap past midnight (20:00 → 07:00).
export function isNight(settings, now = new Date()) {
  if (settings.light !== 'auto') return settings.light === 'night'
  const t = now.getHours() * 60 + now.getMinutes()
  const start = minutes(settings.nightStart)
  const end = minutes(settings.nightEnd)
  return start <= end ? t >= start && t < end : t >= start || t < end
}

// --- Building blocks, for a game's own sections ---------------------------------------------------

const make = (tag, props = {}, ...children) => {
  const el = Object.assign(document.createElement(tag), props)
  el.append(...children.filter((c) => c != null))
  return el
}

function labelWithHint(label, hint) {
  return make('span', {}, label, hint ? make('small', { className: 'hub-hint', textContent: hint }) : null)
}

export function toggle({ label, hint, checked, onToggle }) {
  const input = make('input', { type: 'checkbox', checked })
  input.addEventListener('change', () => onToggle(input.checked))
  return make('label', { className: 'hub-row' }, labelWithHint(label, hint), input)
}

export function slider({ label, hint, value, min = 0, max = 1, step = 0.05, onInput }) {
  const input = make('input', { type: 'range', min, max, step, value })
  input.addEventListener('input', () => onInput(Number(input.value)))
  return make('label', { className: 'hub-row' }, labelWithHint(label, hint), input)
}

// A row of buttons where one is chosen: options [{ value, label }].
export function choice({ label, options, value, onPick }) {
  const group = make('div', { className: 'hub-choice' })
  group.setAttribute('role', 'radiogroup')
  if (label) group.setAttribute('aria-label', label)
  const buttons = options.map((o) => {
    const b = make('button', { type: 'button', textContent: o.label })
    b.setAttribute('role', 'radio')
    b.dataset.value = o.value
    b.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-checked', String(other === b))
      onPick(o.value)
    })
    b.setAttribute('aria-checked', String(o.value === value))
    return b
  })
  group.append(...buttons)
  return group
}

export function note(text) {
  return make('p', { className: 'hub-note', textContent: text })
}

// --- The panel ------------------------------------------------------------------------------------

export class SettingsPanel {
  constructor({ gameId, title = 'Settings', store, sound, notesLabel = 'Game sounds', defaults = {}, look, sections = [], manual, credits, onChange, beforeExport, onRestore, exportData, keepOnReset = [], global = false, intro }) {
    this.gameId = gameId
    this.store = store
    this.sound = sound
    this.onChange = onChange
    this.onRestore = onRestore
    this.beforeExport = beforeExport
    this.exportData = exportData ?? (() => store.all())
    this.keepOnReset = keepOnReset
    this.global = global
    this.parts = { notesLabel, look, sections, manual, credits, intro }
    this.defaults = layer(SHARED_DEFAULTS, defaults)
    this.settings = {}
    this.load()
    this.night = isNight(this.settings)

    const dialog = make('dialog', { className: 'hub-settings' })
    this.dialog = dialog
    const heading = make('h2', { textContent: title })
    const close = make('button', { type: 'button', className: 'hub-settings-close', textContent: '✕' })
    close.setAttribute('aria-label', 'Close settings')
    close.addEventListener('click', () => this.close())
    dialog.append(make('header', { className: 'hub-settings-head' }, heading, close))
    this.body = make('div', { className: 'hub-settings-body' })
    dialog.append(this.body)
    dialog.addEventListener('click', (e) => e.target === dialog && this.close()) // tap outside
    if (manual)
      hiddenUnlock(heading, {
        onUnlock: () => {
          this.unlocked = true
          this.refreshManual()
          this.manualSection.hidden = false
          this.manualSection.scrollIntoView({ block: 'nearest' })
        },
      })
    this.render()
    document.body.append(dialog)

    this.applySound()
    // Auto light: look at the clock every minute.
    setInterval(() => this.checkNight(), 60000)
    document.addEventListener('visibilitychange', () => this.checkNight())
  }

  // (Re)builds the sections, so every control shows the current settings (after a reset).
  render() {
    const { notesLabel, look, sections, manual, credits, intro } = this.parts
    this.body.replaceChildren()
    if (intro) this.body.append(note(intro))
    this.addLight(look)
    for (const s of sections.filter((s) => s.place === 'look')) this.addSection(s)
    this.addSound(notesLabel)
    for (const s of sections.filter((s) => s.place !== 'look')) this.addSection(s)
    this.addNature()
    if (!this.global) this.addProgress()
    if (credits) this.addCredits(credits)
    if (!this.global) this.addReset()
    if (manual) this.addManual(manual)
    // Messages (code copied, progress restored...) show at the bottom, even with a section folded.
    this.message = make('p', { className: 'hub-message' })
    this.message.setAttribute('role', 'status')
    this.body.append(this.message)
  }

  // What GameHub's panel changed: only the shared settings, never a game's own.
  hubChanges() {
    if (this.global) return {}
    const saved = gameStore(HUB_ID).get(MINE, {})
    return Object.fromEntries(Object.entries(saved).filter(([k]) => SHARED_KEYS.includes(k)))
  }

  load() {
    let mine = this.store.get(MINE, null)
    if (!mine) {
      mine = changesFrom(this.store.get('settings', null), this.defaults)
      this.store.set(MINE, mine)
      this.store.remove('settings')
    }
    this.mine = mine
    this.refresh()
  }

  // panel.settings is the same object all along (games may keep it); its values are rebuilt.
  refresh() {
    const settings = layer(layer(this.defaults, this.hubChanges()), this.mine)
    for (const key of Object.keys(this.settings)) delete this.settings[key]
    Object.assign(this.settings, settings)
  }

  save() {
    this.store.set(MINE, this.mine)
    this.refresh()
  }

  // Change settings: saves them as changed in this game, plays the sound settings, tells the game.
  set(patch) {
    const { volumes, ...rest } = patch
    Object.assign(this.mine, rest)
    if (volumes) this.mine.volumes = { ...this.mine.volumes, ...volumes }
    this.save()
    this.applySound()
    this.night = isNight(this.settings)
    this.onChange?.(this.settings, patch)
  }

  // For a game's own choices changed straight on panel.settings (not the shared ones): saves the
  // ones that differ from the game's defaults.
  saveOwn() {
    for (const key of Object.keys(this.settings)) {
      if (SHARED_KEYS.includes(key)) continue
      if (same(this.settings[key], this.defaults[key])) delete this.mine[key]
      else this.mine[key] = this.settings[key]
    }
    this.save()
  }

  // Back to GameHub's settings: forgets what was changed in this game (except keepOnReset).
  reset() {
    this.mine = Object.fromEntries(Object.entries(this.mine).filter(([k]) => this.keepOnReset.includes(k)))
    this.save()
    this.applySound()
    this.night = isNight(this.settings)
    this.render()
    this.onChange?.(this.settings, {})
    this.say('Back to GameHub’s settings.')
  }

  checkNight() {
    const night = isNight(this.settings)
    if (night === this.night) return
    this.night = night
    this.onChange?.(this.settings, { night })
  }

  applySound() {
    const s = this.settings
    const sound = this.sound
    if (!sound) return
    sound.setVolumes(s.volumes)
    sound.setMuted(s.muted)
    sound.setNature(s.nature)
    const style = s.music === QUIET_WORDS_MUSIC ? null : STYLES.find((st) => st.id === s.music) ?? null
    sound.setStyle(style, style?.dials ?? {})
    sound.setMusic(s.volumes.music > 0)
  }

  open() {
    this.say('')
    this.refreshManual?.()
    this.dialog.showModal()
    this.dialog.scrollTop = 0
  }

  close() {
    this.dialog.close()
  }

  section(title) {
    const el = make('section', { className: 'hub-settings-section' }, make('h3', { textContent: title }))
    this.body.append(el)
    return el
  }

  addSection({ title, build }) {
    build(this.section(title), this)
  }

  // A closed dropdown section, for things people rarely need. onOpen runs each time it opens.
  fold(title, onOpen) {
    const inner = make('div', { className: 'hub-fold-body' })
    const box = make('details', { className: 'hub-fold' }, make('summary', { textContent: title }), inner)
    if (onOpen) box.addEventListener('toggle', () => box.open && onOpen(inner))
    this.body.append(make('section', { className: 'hub-settings-section' }, box))
    return inner
  }

  addLight(look) {
    const el = this.section('Light')
    const times = make('div', { className: 'hub-row' })
    const start = make('input', { type: 'time', value: this.settings.nightStart })
    const end = make('input', { type: 'time', value: this.settings.nightEnd })
    start.addEventListener('change', () => this.set({ nightStart: start.value || this.defaults.nightStart }))
    end.addEventListener('change', () => this.set({ nightEnd: end.value || this.defaults.nightEnd }))
    times.append(make('span', { textContent: 'Night from' }), make('span', { className: 'hub-times' }, start, make('span', { textContent: 'to' }), end))
    times.hidden = this.settings.light !== 'auto'
    el.append(
      choice({
        label: 'Light',
        value: this.settings.light,
        options: [
          { value: 'day', label: 'Day' },
          { value: 'night', label: 'Night' },
          { value: 'auto', label: 'Auto' },
        ],
        onPick: (light) => {
          times.hidden = light !== 'auto'
          this.set({ light })
        },
      }),
      times,
      note('Night uses only warm light, no blue.'),
    )
    look?.(el, this)
  }

  addSound(notesLabel) {
    const el = this.section('Sound')
    const vol = (key, label) =>
      slider({ label, value: this.settings.volumes[key], onInput: (v) => this.set({ volumes: { [key]: v } }) })
    el.append(
      vol('notes', notesLabel),
      vol('nature', 'Nature sounds'),
      vol('music', 'Music'),
      this.musicStyle(),
      toggle({ label: 'Mute everything', checked: this.settings.muted, onToggle: (muted) => this.set({ muted }) }),
    )
  }

  // One row: the phone's own picker, with Quiet Words' music and every Melody Garden style.
  musicStyle() {
    const options = [{ value: QUIET_WORDS_MUSIC, label: 'Quiet Words' }, ...STYLES.map((s) => ({ value: s.id, label: s.name }))]
    const value = options.some((o) => o.value === this.settings.music) ? this.settings.music : QUIET_WORDS_MUSIC
    const select = make('select', { className: 'hub-select' }, ...options.map((o) => make('option', { value: o.value, textContent: o.label })))
    select.value = value
    select.addEventListener('change', () => this.set({ music: select.value }))
    return make('label', { className: 'hub-row' }, make('span', { textContent: 'Music style' }), select)
  }

  addNature() {
    const el = this.fold('Nature sounds')
    el.append(note('Slide any of them up to hear it.'))
    for (const layer of LAYERS) {
      el.append(
        slider({
          label: LAYER_LABELS[layer],
          value: this.settings.nature[layer] ?? 0,
          onInput: (v) => {
            const nature = { ...this.settings.nature, [layer]: v }
            if (!v) delete nature[layer]
            this.set({ nature })
          },
        }),
      )
    }
  }

  say(text) {
    if (this.message) this.message.textContent = text
  }

  addProgress() {
    const el = this.fold('Move your progress')
    const code = make('textarea', { className: 'hub-code', rows: 3, placeholder: 'Transfer code', hidden: true })
    const use = make('button', { type: 'button', className: 'hub-small-button', textContent: 'Use this code', hidden: true })
    const button = (text, onClick) => {
      const b = make('button', { type: 'button', className: 'hub-small-button', textContent: text })
      b.addEventListener('click', onClick)
      return b
    }
    const restore = (data) => {
      this.store.replaceAll(data)
      this.load() // a code from before 2026-10-28 holds whole settings; load() keeps the changes
      this.applySound()
      this.night = isNight(this.settings)
      this.onRestore?.(data)
      this.onChange?.(this.settings, {})
      this.say('Progress restored.')
    }
    el.append(
      note('Carry your progress to another phone, or into GameHub on this one.'),
      make(
        'div',
        { className: 'hub-buttons' },
        button('Get transfer code', async () => {
          this.beforeExport?.()
          code.hidden = false
          use.hidden = true
          code.value = makeTransferCode(this.gameId, this.exportData())
          code.select()
          try {
            await navigator.clipboard.writeText(code.value)
            this.say('Code copied. Paste it into the game on the other phone or app.')
          } catch {
            this.say('Copy this code, then paste it into the game on the other phone or app.')
          }
        }),
        button('Enter a code', () => {
          code.hidden = false
          use.hidden = false
          code.value = ''
          code.focus()
          this.say('')
        }),
        button('Save backup file', () => {
          this.beforeExport?.()
          saveBackupFile(this.gameId, this.exportData())
        }),
        button('Load backup file', async () => {
          try {
            restore(await openBackupFile(this.gameId))
          } catch (e) {
            this.say(e.message)
          }
        }),
      ),
      code,
      use,
    )
    use.addEventListener('click', () => {
      try {
        restore(readTransferCode(code.value, this.gameId))
      } catch (e) {
        this.say(e.message)
      }
    })

  }

  // Its lines are filled in each time it opens (they may come from a file).
  addCredits(credits) {
    this.fold('Credits', async (list) => {
      list.classList.add('hub-credits-list')
      const lines = typeof credits === 'function' ? await credits() : credits
      list.replaceChildren(...[].concat(lines).map((line) => (typeof line === 'string' ? make('p', { textContent: line }) : line)))
    })
  }

  // A plain button at the bottom: for when settings got confusing. Tap twice, so a stray tap
  // doesn't undo someone's choices.
  addReset() {
    const el = make('section', { className: 'hub-settings-section hub-reset' })
    this.body.append(el)
    const button = make('button', { type: 'button', className: 'hub-small-button', textContent: 'Reset to GameHub settings' })
    let armed = 0
    button.addEventListener('click', () => {
      if (Date.now() - armed < 4000) return this.reset()
      armed = Date.now()
      button.textContent = 'Tap again to reset'
      setTimeout(() => (button.textContent = 'Reset to GameHub settings'), 4000)
    })
    el.append(note('Puts every setting in this game back to how GameHub is set. Progress is kept.'), button)
  }

  // Setting progress by hand (hidden). fields: [{ id, label, min, get }]; onSet({ id: number }).
  addManual({ fields, onSet }) {
    const el = this.section('Set progress by hand')
    el.hidden = !this.unlocked
    this.manualSection = el
    const inputs = fields.map((f) => {
      const input = make('input', { type: 'number', min: f.min ?? 0, inputMode: 'numeric' })
      input.dataset.id = f.id
      el.append(make('label', { className: 'hub-row' }, make('span', { textContent: f.label }), input))
      return input
    })
    this.refreshManual = () => fields.forEach((f, i) => (inputs[i].value = f.get()))
    const set = make('button', { type: 'button', className: 'hub-small-button', textContent: 'Set' })
    set.addEventListener('click', () => {
      const values = {}
      fields.forEach((f, i) => (values[f.id] = Math.max(f.min ?? 0, Math.floor(Number(inputs[i].value) || 0))))
      this.say(onSet(values) ?? 'Set.')
    })
    el.append(set)
  }
}
