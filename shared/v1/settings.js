// One Settings panel for every GameHub game, so they all look and work alike. The order follows
// Quiet Words:
//
//   Light            Day / Night / Auto (night by the clock); Night is warm light only.
//                    The game may add its own look options here (look).
//   [game sections]  e.g. Love To Color's sections (place: 'look')
//   Sound            Game sounds, Nature sounds, Music sliders; Mute everything
//   Music            Quiet Words' music or a Melody Garden style
//   Nature sounds    one slider per sound
//   [game sections]  e.g. how play works, little games (place: 'play', the default)
//   Move your progress   transfer code and backup file
//   Grown-up tools   hidden: 5 taps on the heading + the family code
//
// It saves the settings (in the game's store, key "settings") and plays the sound settings
// through the toolbox Sound by itself. Use with settings.css.
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
//   })
//   panel.open()

import { hiddenUnlock } from './secret.js'
import { makeTransferCode, openBackupFile, readTransferCode, saveBackupFile } from './save.js'
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
  constructor({ gameId, title = 'Settings', store, sound, notesLabel = 'Game sounds', defaults = {}, look, sections = [], manual, onChange, beforeExport, onRestore }) {
    this.gameId = gameId
    this.store = store
    this.sound = sound
    this.onChange = onChange
    this.onRestore = onRestore
    this.beforeExport = beforeExport
    this.defaults = { ...SHARED_DEFAULTS, ...defaults }
    this.settings = this.load()
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

    this.addLight(look)
    for (const s of sections.filter((s) => s.place === 'look')) this.addSection(s)
    this.addSound(notesLabel)
    this.addMusic()
    this.addNature()
    for (const s of sections.filter((s) => s.place !== 'look')) this.addSection(s)
    this.addProgress()
    if (manual) this.addManual(manual, heading)
    document.body.append(dialog)

    this.applySound()
    // Auto light: look at the clock every minute.
    setInterval(() => this.checkNight(), 60000)
    document.addEventListener('visibilitychange', () => this.checkNight())
  }

  load() {
    const saved = this.store.get('settings', {})
    const s = { ...this.defaults, ...saved }
    s.volumes = { ...this.defaults.volumes, ...saved.volumes }
    s.nature = { ...this.defaults.nature, ...saved.nature }
    return s
  }

  // Change settings: saves, plays the sound settings, tells the game.
  set(patch) {
    Object.assign(this.settings, patch)
    this.store.set('settings', this.settings)
    this.applySound()
    this.night = isNight(this.settings)
    this.onChange?.(this.settings, patch)
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
      slider({ label, value: this.settings.volumes[key], onInput: (v) => this.set({ volumes: { ...this.settings.volumes, [key]: v } }) })
    el.append(
      vol('notes', notesLabel),
      vol('nature', 'Nature sounds'),
      vol('music', 'Music'),
      toggle({ label: 'Mute everything', checked: this.settings.muted, onToggle: (muted) => this.set({ muted }) }),
    )
  }

  addMusic() {
    const el = this.section('Music')
    const options = [{ value: QUIET_WORDS_MUSIC, label: 'Quiet Words' }, ...STYLES.map((s) => ({ value: s.id, label: s.name }))]
    const value = options.some((o) => o.value === this.settings.music) ? this.settings.music : QUIET_WORDS_MUSIC
    const picker = choice({ label: 'Music', options, value, onPick: (music) => this.set({ music }) })
    picker.classList.add('hub-choice-wrap')
    el.append(picker, note('Slide Music up to hear it. More styles come from Melody Garden.'))
  }

  addNature() {
    const el = this.section('Nature sounds')
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
    const el = this.section('Move your progress')
    const code = make('textarea', { className: 'hub-code', rows: 3, placeholder: 'Transfer code', hidden: true })
    const use = make('button', { type: 'button', className: 'hub-small-button', textContent: 'Use this code', hidden: true })
    const button = (text, onClick) => {
      const b = make('button', { type: 'button', className: 'hub-small-button', textContent: text })
      b.addEventListener('click', onClick)
      return b
    }
    const restore = (data) => {
      this.store.replaceAll(data)
      this.settings = this.load()
      this.store.set('settings', this.settings)
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
          code.value = makeTransferCode(this.gameId, this.store.all())
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
          saveBackupFile(this.gameId, this.store.all())
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
    this.message = make('p', { className: 'hub-message' })
    this.message.setAttribute('role', 'status')
    el.append(this.message)
  }

  // Setting progress by hand (hidden). fields: [{ id, label, min, get }]; onSet({ id: number }).
  addManual({ fields, onSet }, heading) {
    const el = this.section('Set progress by hand')
    el.hidden = true
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
    hiddenUnlock(heading, {
      onUnlock: () => {
        this.refreshManual()
        el.hidden = false
        el.scrollIntoView({ block: 'nearest' })
      },
    })
  }
}
