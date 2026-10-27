// The composer: plays a style (styles.js) as endless, never-repeating music, made up as it goes.
//
// A style is a recipe: a key, two scales (sunny and dreamy), a chord progression, a tempo, and
// a few parts, each played by an instrument (instruments.js). Parts:
//   melody    a little tune: a one-bar idea, played three times over the changing chords,
//             then a gentle ending, and a new idea for the next four bars
//   arp       the chord's notes one after another (harp-style)
//   chords    the chord's notes together, held or on a rhythm
//   bass      the chord's root, low
//   drone     a low, steady root and fifth under everything
//   beat      soft percussion on a pattern
//
// Five dials shape any style live, each 0..1: speed, busy (how many notes), bright (high and
// clear vs low and warm), echo, and mood (sunny vs dreamy).
import { INSTRUMENTS } from './instruments.js'
import { filter, gain, mtof, pick, rand } from './noise.js'

const AHEAD = 0.35 // seconds scheduled ahead, short so the dials answer quickly
export const DIALS = { speed: 0.5, busy: 0.5, bright: 0.5, echo: 0.4, mood: 0 }

export class Composer {
  constructor(ctx, dest) {
    this.ctx = ctx
    this.out = gain(ctx, 0)
    this.tone = filter(ctx, 'lowpass', 6000)
    this.out.connect(this.tone)
    this.tone.connect(dest)
    // Echo: a delay feeding back into itself through a darkening filter.
    this.delay = ctx.createDelay(2)
    this.feedback = gain(ctx, 0.3)
    this.wet = gain(ctx, 0.2)
    const darken = filter(ctx, 'lowpass', 2500)
    this.tone.connect(this.delay)
    this.delay.connect(darken).connect(this.feedback).connect(this.delay)
    this.delay.connect(this.wet).connect(dest)
    this.playing = false
    this.style = null
    this.dials = { ...DIALS }
    this.muted = new Set() // parts switched off
  }

  setStyle(style) {
    if (style === this.style) return
    this.style = style
    this.reset()
    this.applyDials()
  }

  setDials(dials) {
    Object.assign(this.dials, dials)
    this.applyDials()
  }

  // Parts switched off by the player: a Set of part ids.
  setMuted(ids) {
    this.muted = new Set(ids)
  }

  start() {
    if (this.playing || !this.style) return
    this.playing = true
    this.reset()
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setTargetAtTime(1, t, 0.3)
  }

  stop() {
    if (!this.playing) return
    this.playing = false
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5)
  }

  reset() {
    this.step = 0
    this.nextAt = this.ctx.currentTime + 0.15
    this.memory = {} // each part's ideas and position
  }

  applyDials() {
    const t = this.ctx.currentTime
    const d = this.dials
    this.tone.frequency.setTargetAtTime(900 * 2 ** (d.bright * 3.6), t, 0.2)
    this.feedback.gain.setTargetAtTime(0.15 + d.echo * 0.45, t, 0.2)
    this.wet.gain.setTargetAtTime(d.echo * 0.5, t, 0.2)
    if (this.style) this.delay.delayTime.setTargetAtTime(this.beat * 0.75, t, 0.2)
  }

  // --- Time and harmony ------------------------------------------------------------------------

  get beat() {
    return 60 / (this.style.tempo * (0.7 + this.dials.speed * 0.6))
  }

  get stepsPerBar() {
    return this.style.meter * 2 // eighth notes
  }

  get scale() {
    return this.dials.mood > 0.5 ? this.style.dreamy : this.style.sunny
  }

  // The midi note for a scale degree (0 = the key note; can go past an octave or below zero).
  note(degree, octave = 0) {
    const s = this.scale
    const oct = Math.floor(degree / s.length)
    return this.style.root + 12 * (oct + octave) + s[degree - oct * s.length]
  }

  chordAt(step) {
    const bar = Math.floor(step / this.stepsPerBar)
    const p = this.style.chords
    return p[Math.floor(bar / (this.style.barsPerChord || 1)) % p.length]
  }

  // Chord notes as scale degrees: every other note of the scale, stacked up from the root.
  chordTones(root, size = 3) {
    return Array.from({ length: size }, (_, i) => root + 2 * i)
  }

  // --- Playing ---------------------------------------------------------------------------------

  schedule(from, to) {
    if (!this.playing || !this.style) return
    const until = Math.min(to, from + AHEAD)
    if (this.nextAt < from) this.nextAt = from + 0.02 // after a pause, carry on from now
    while (this.nextAt < until) {
      const swing = this.step % 2 ? (this.style.swing || 0) * this.beat * 0.5 : 0
      for (const part of this.style.parts) {
        if (this.muted.has(part.id)) continue
        this.playPart(part, this.step, this.nextAt + swing)
      }
      this.nextAt += this.beat / 2
      this.step++
    }
  }

  sound(part, midi, when, vel, len) {
    INSTRUMENTS[part.instrument].play(this.ctx, this.out, { freq: mtof(midi), when, vel: vel * (part.level ?? 1), len })
  }

  playPart(part, step, when) {
    const spb = this.stepsPerBar
    const inBar = step % spb
    const chord = this.chordAt(step)
    const busy = Math.max(0.05, Math.min(1, (part.density ?? 0.5) * (0.4 + this.dials.busy * 1.2)))
    const octave = (part.octave ?? 0) + (part.kind === 'melody' ? Math.round((this.dials.bright - 0.5) * 1.2) : 0)
    switch (part.kind) {
      case 'melody':
        return this.melody(part, step, when, chord, busy, octave)
      case 'arp': {
        if (inBar && Math.random() > busy + 0.2) return
        const tones = this.chordTones(chord, 4)
        const order = part.pattern === 'updown' ? [0, 1, 2, 3, 2, 1] : part.pattern === 'waltz' ? [0, 2, 1, 2, 1, 2] : [0, 1, 2, 3]
        const degree = tones[order[inBar % order.length]]
        return this.sound(part, this.note(degree, octave), when, inBar ? 0.75 : 1, this.beat)
      }
      case 'chords': {
        const hits = part.hits || [0]
        if (!hits.includes(inBar)) return
        const length = part.hits ? this.beat * 1.5 : (spb / 2) * this.beat * (this.style.barsPerChord || 1)
        if (!part.hits && (step / spb) % (this.style.barsPerChord || 1)) return
        for (const d of this.chordTones(chord, part.size || 3)) this.sound(part, this.note(d, octave), when, inBar ? 0.7 : 1, length)
        return
      }
      case 'bass': {
        const hits = part.hits || [0]
        const at = hits.indexOf(inBar)
        if (at === -1) return
        // Root first, then the fifth or another chord note.
        const degree = at === 0 ? chord : chord + pick([2, 4, 4])
        return this.sound(part, this.note(degree, octave), when, at === 0 ? 1 : 0.8, this.beat * 1.5)
      }
      case 'drone': {
        const bars = part.bars || 2
        if (step % (spb * bars)) return
        const length = spb * bars * (this.beat / 2) + 1.5
        this.sound(part, this.note(0, octave), when, 1, length)
        // The fifth is the 4th note of a five-note scale, the 5th of a seven-note one.
        this.sound(part, this.note(this.scale.length === 5 ? 3 : 4, octave), when, 0.7, length)
        return
      }
      case 'beat': {
        const v = part.pattern[step % part.pattern.length]
        if (!v) return
        // Light hits are extras: fewer of them when the music is less busy.
        if (v < 1 && Math.random() > busy + 0.25) return
        return this.sound(part, 0, when, v, 0.1)
      }
    }
  }

  // A tune made of small ideas: a one-bar motif, played three times as the chords change,
  // then a gentle ending note and a rest. Then a new motif.
  melody(part, step, when, chord, busy, octave) {
    const spb = this.stepsPerBar
    const bar = Math.floor(step / spb)
    const inBar = step % spb
    const mem = (this.memory[part.id] ||= {})
    const phraseBars = part.phrase || 4
    const inPhrase = bar % phraseBars
    if (inBar === 0 && inPhrase === 0) mem.motif = this.motif(part, busy)
    if (!mem.motif) return
    if (inPhrase === phraseBars - 1) {
      // The ending: one long note on the chord, then quiet.
      if (inBar === 0) this.sound(part, this.note(pick(this.chordTones(chord)), octave), when, 0.85, this.beat * (part.free ? 3 : 2))
      return
    }
    const hit = mem.motif.find((n) => n.at === inBar)
    if (!hit) return
    // The idea follows the chords: the same shape, starting from this chord's notes.
    const degree = chord + hit.offset
    if (part.grace && hit.len > 1.5 && Math.random() < 0.4) {
      // A quick flick from the note above, as wooden flutes do.
      this.sound(part, this.note(degree + 1, octave), when - 0.07, 0.5, 0.06)
    }
    this.sound(part, this.note(degree, octave), when, hit.at === 0 ? 1 : 0.8, this.beat * hit.len)
  }

  motif(part, busy) {
    const spb = this.stepsPerBar
    const notes = []
    let offset = pick([0, 2, 4])
    for (let at = 0; at < spb; ) {
      // Long notes for a free, singing part; otherwise mostly quarter and eighth notes.
      const len = part.free ? pick([2, 3, 4]) : Math.random() < busy * 0.6 ? 0.5 : pick([1, 1, 1.5])
      const strong = at % 2 === 0
      if (at === 0 || Math.random() < (strong ? busy + 0.2 : busy * 0.7)) {
        notes.push({ at, offset, len })
        // Mostly small steps, sometimes a leap.
        offset += Math.random() < 0.75 ? pick([-1, 1, 1, -1, 0]) : pick([-3, -2, 2, 3])
        offset = Math.max(-2, Math.min(7, offset))
      }
      at += Math.max(1, Math.round(len * 2))
    }
    return notes
  }
}
