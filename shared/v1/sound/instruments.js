// Instruments for the composer (composer.js), all made from simple waves and noise, live.
// Each one plays a single note: play(ctx, out, { freq, when, vel, len }), where len is how long
// the note is held in seconds (plucked and struck instruments ring on past it by themselves).
//
// Plucked, struck and rung sounds (music box, kalimba, harp, koto, marimba) come out most like
// the real thing; the flute and pads are softer impressions.
import { burst, filter, gain, noiseBuffer } from './noise.js'

// A sine partial with a quick attack and an exponential fade.
function partial(ctx, out, freq, when, peak, decay, attack = 0.004, type = 'sine') {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, when)
  env.gain.linearRampToValueAtTime(peak, when + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay)
  osc.connect(env).connect(out)
  osc.start(when)
  osc.stop(when + attack + decay + 0.05)
  return osc
}

// A short, filtered tap of noise: mallets, tine clicks, plucks.
function click(ctx, out, when, freq, level, length = 0.02) {
  const f = filter(ctx, 'bandpass', freq, 1.2)
  const g = gain(ctx, level)
  f.connect(g).connect(out)
  burst(ctx, when, f, length)
}

const vary = (vel) => vel * (0.9 + Math.random() * 0.2) // no two notes quite the same

export const INSTRUMENTS = {
  musicBox: {
    name: 'Music box',
    play(ctx, out, { freq, when, vel }) {
      const v = vary(vel) * 0.22
      partial(ctx, out, freq, when, v, 2.6, 0.002)
      partial(ctx, out, freq * 2, when, v * 0.25, 0.9, 0.002)
      partial(ctx, out, freq * 4.2, when, v * 0.08, 0.25, 0.002)
      click(ctx, out, when, Math.min(9000, freq * 6), v * 0.15, 0.008)
    },
  },

  kalimba: {
    name: 'Kalimba',
    play(ctx, out, { freq, when, vel }) {
      const v = vary(vel) * 0.24
      partial(ctx, out, freq, when, v, 1.5, 0.002)
      partial(ctx, out, freq * 5.95, when, v * 0.18, 0.12, 0.001)
      partial(ctx, out, freq * 2.01, when, v * 0.12, 0.4, 0.002)
      click(ctx, out, when, freq * 3, v * 0.2, 0.012)
    },
  },

  marimba: {
    name: 'Marimba',
    play(ctx, out, { freq, when, vel }) {
      const v = vary(vel) * 0.26
      partial(ctx, out, freq, when, v, 0.9)
      partial(ctx, out, freq * 3.93, when, v * 0.2, 0.16)
      partial(ctx, out, freq * 9.2, when, v * 0.04, 0.035)
    },
  },

  harp: {
    name: 'Harp',
    play(ctx, out, { freq, when, vel }) {
      const v = vary(vel) * 0.2
      // Higher harmonics fade sooner, like a real string.
      const harmonics = [
        [1, 1, 2.4],
        [2, 0.42, 1.5],
        [3, 0.22, 0.9],
        [4, 0.1, 0.5],
      ]
      for (const [n, level, decay] of harmonics) partial(ctx, out, freq * n, when, v * level, decay, 0.003)
      click(ctx, out, when, freq * 4, v * 0.12, 0.01)
    },
  },

  koto: {
    name: 'Koto',
    play(ctx, out, { freq, when, vel }) {
      const v = vary(vel) * 0.32
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      // A plucked koto string settles onto its note, and sometimes bends up a little after.
      osc.frequency.setValueAtTime(freq * 1.006, when)
      osc.frequency.exponentialRampToValueAtTime(freq, when + 0.05)
      if (Math.random() < 0.2) osc.frequency.setTargetAtTime(freq * 1.03, when + 0.35, 0.12)
      const tone = filter(ctx, 'lowpass', freq * 6, 1.5)
      tone.frequency.setValueAtTime(freq * 8, when)
      tone.frequency.exponentialRampToValueAtTime(freq * 1.6, when + 0.5)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.003)
      env.gain.exponentialRampToValueAtTime(0.0001, when + 1.8)
      osc.connect(tone).connect(env).connect(out)
      osc.start(when)
      osc.stop(when + 1.9)
      click(ctx, out, when, freq * 5, v * 0.3, 0.01)
    },
  },

  piano: {
    name: 'Soft piano',
    // An electric piano: a sine "bent" by a second sine (FM), mellowing as it fades.
    play(ctx, out, { freq, when, vel, len }) {
      const v = vary(vel) * 0.17
      const ring = Math.max(1.2, Math.min(3.5, len + 1))
      const car = ctx.createOscillator()
      car.frequency.value = freq
      const mod = ctx.createOscillator()
      mod.frequency.value = freq
      const depth = ctx.createGain()
      depth.gain.setValueAtTime(freq * 1.6, when)
      depth.gain.exponentialRampToValueAtTime(freq * 0.15, when + 0.8)
      mod.connect(depth).connect(car.frequency)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.006)
      env.gain.exponentialRampToValueAtTime(v * 0.35, when + 0.6)
      env.gain.exponentialRampToValueAtTime(0.0001, when + ring)
      car.connect(env).connect(out)
      for (const o of [car, mod]) {
        o.start(when)
        o.stop(when + ring + 0.05)
      }
      partial(ctx, out, freq * 14, when, v * 0.04, 0.12, 0.002) // the tine's little bell
    },
  },

  pad: {
    name: 'Soft pad',
    play(ctx, out, { freq, when, vel, len }) {
      const v = vel * 0.06
      const attack = Math.min(2, len * 0.4)
      const release = Math.min(3, len * 0.5)
      const tone = filter(ctx, 'lowpass', Math.min(2400, freq * 3))
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + attack)
      env.gain.setValueAtTime(v, when + len)
      env.gain.linearRampToValueAtTime(0, when + len + release)
      tone.connect(env).connect(out)
      for (const [type, cents] of [['sine', 0], ['triangle', -6], ['triangle', 6]]) {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.value = freq
        osc.detune.value = cents
        osc.connect(tone)
        osc.start(when)
        osc.stop(when + len + release + 0.1)
      }
    },
  },

  flute: {
    name: 'Wooden flute',
    // A breathy wooden flute: a soft tone that slides up into the note, gentle vibrato once it
    // settles, and a little air in the sound.
    play(ctx, out, { freq, when, vel, len }) {
      const v = vary(vel) * 0.13
      const hold = Math.max(0.2, len)
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(freq * 0.97, when)
      osc.frequency.exponentialRampToValueAtTime(freq, when + 0.09)
      const overtone = ctx.createOscillator()
      overtone.type = 'triangle'
      overtone.frequency.value = freq
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 4.8
      const wobble = ctx.createGain()
      wobble.gain.setValueAtTime(0, when)
      wobble.gain.linearRampToValueAtTime(freq * 0.006, when + Math.min(0.6, hold))
      lfo.connect(wobble)
      wobble.connect(osc.frequency)
      wobble.connect(overtone.frequency)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.12)
      env.gain.setValueAtTime(v * 0.85, when + hold)
      env.gain.linearRampToValueAtTime(0, when + hold + 0.3)
      osc.connect(env)
      overtone.connect(gain(ctx, 0.12)).connect(env)
      env.connect(out)
      // Breath: noise around the note, strongest as the note starts.
      const air = ctx.createBufferSource()
      air.buffer = noiseBuffer(ctx, 'pink')
      const band = filter(ctx, 'bandpass', freq * 1.5, 1.4)
      const breath = ctx.createGain()
      breath.gain.setValueAtTime(0, when)
      breath.gain.linearRampToValueAtTime(v * 0.5, when + 0.05)
      breath.gain.linearRampToValueAtTime(v * 0.12, when + 0.3)
      breath.gain.setValueAtTime(v * 0.12, when + hold)
      breath.gain.linearRampToValueAtTime(0, when + hold + 0.3)
      air.connect(band).connect(breath).connect(out)
      const end = when + hold + 0.35
      for (const o of [osc, overtone, lfo]) {
        o.start(when)
        o.stop(end)
      }
      air.start(when, Math.random() * 6)
      air.stop(end)
    },
  },

  whistle: {
    name: 'Tin whistle',
    // A small, bright, pure-toned whistle: quick to speak, a touch of air, a light vibrato on
    // longer notes only.
    play(ctx, out, { freq, when, vel, len }) {
      const v = vary(vel) * 0.11
      const hold = Math.max(0.08, len * 0.9)
      const osc = ctx.createOscillator()
      osc.frequency.value = freq
      const second = ctx.createOscillator()
      second.frequency.value = freq * 2
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 5.5
      const wobble = ctx.createGain()
      wobble.gain.setValueAtTime(0, when)
      wobble.gain.setValueAtTime(0, when + 0.25)
      wobble.gain.linearRampToValueAtTime(hold > 0.4 ? freq * 0.005 : 0, when + 0.5)
      lfo.connect(wobble).connect(osc.frequency)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.025)
      env.gain.setValueAtTime(v * 0.9, when + hold)
      env.gain.linearRampToValueAtTime(0, when + hold + 0.08)
      osc.connect(env)
      second.connect(gain(ctx, 0.18)).connect(env)
      env.connect(out)
      const air = ctx.createBufferSource()
      air.buffer = noiseBuffer(ctx, 'pink')
      const band = filter(ctx, 'bandpass', freq * 2, 2)
      const breath = ctx.createGain()
      breath.gain.setValueAtTime(0, when)
      breath.gain.linearRampToValueAtTime(v * 0.25, when + 0.02)
      breath.gain.linearRampToValueAtTime(v * 0.05, when + 0.12)
      breath.gain.linearRampToValueAtTime(0, when + hold + 0.08)
      air.connect(band).connect(breath).connect(out)
      const end = when + hold + 0.12
      for (const o of [osc, second, lfo]) {
        o.start(when)
        o.stop(end)
      }
      air.start(when, Math.random() * 6)
      air.stop(end)
    },
  },

  bass: {
    name: 'Soft bass',
    play(ctx, out, { freq, when, vel, len }) {
      const v = vary(vel) * 0.15
      const ring = Math.max(0.3, len)
      const tone = filter(ctx, 'lowpass', 600)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.01)
      env.gain.exponentialRampToValueAtTime(v * 0.5, when + 0.3)
      env.gain.exponentialRampToValueAtTime(0.0001, when + ring + 0.3)
      tone.connect(env).connect(out)
      for (const [type, level] of [['sine', 1], ['triangle', 0.4]]) {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.value = freq
        osc.connect(gain(ctx, level)).connect(tone)
        osc.start(when)
        osc.stop(when + ring + 0.35)
      }
    },
  },

  // --- Percussion: freq is ignored ----------------------------------------------------------

  frameDrum: {
    name: 'Soft drum',
    play(ctx, out, { when, vel }) {
      const v = vary(vel) * 0.45
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(95, when)
      osc.frequency.exponentialRampToValueAtTime(52, when + 0.18)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.008)
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.7)
      osc.connect(env).connect(out)
      osc.start(when)
      osc.stop(when + 0.75)
      const thump = filter(ctx, 'lowpass', 400)
      thump.connect(gain(ctx, v * 0.5)).connect(out)
      burst(ctx, when, thump, 0.05)
    },
  },

  bodhran: {
    name: 'Bodhrán',
    // The Irish frame drum: a soft, round thump with a little skin in it.
    play(ctx, out, { when, vel }) {
      const v = vary(vel) * 0.35
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(140, when)
      osc.frequency.exponentialRampToValueAtTime(80, when + 0.12)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.005)
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.35)
      osc.connect(env).connect(out)
      osc.start(when)
      osc.stop(when + 0.4)
      click(ctx, out, when, 900, v * 0.5, 0.03)
    },
  },

  shaker: {
    name: 'Shaker',
    play(ctx, out, { when, vel }) {
      const v = vary(vel) * 0.4
      const f = filter(ctx, 'highpass', 5000)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.015)
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.09)
      f.connect(env).connect(out)
      burst(ctx, when, f, 0.1)
    },
  },

  rattle: {
    name: 'Rattle',
    // Seeds in a gourd: a few quick taps close together.
    play(ctx, out, { when, vel }) {
      const v = vary(vel) * 0.2
      for (let i = 0; i < 4; i++) click(ctx, out, when + i * 0.018 + Math.random() * 0.01, 3500 + Math.random() * 2500, v * (1 - i * 0.2), 0.02)
    },
  },

  brushes: {
    name: 'Brushes',
    play(ctx, out, { when, vel }) {
      const v = vary(vel) * 0.3
      const f = filter(ctx, 'bandpass', 3200, 0.8)
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, when)
      env.gain.linearRampToValueAtTime(v, when + 0.04)
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.22)
      f.connect(env).connect(out)
      burst(ctx, when, f, 0.25)
    },
  },
}
