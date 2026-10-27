// The calm sound kit: one audio graph any game can use.
//   notes ───┐
//   nature ──┼─> master (mute) ─> gentle compressor ─> speakers
//   music ───┘     ^
//   notes + music ──> shared reverb ┘
// Everything is generated live (no sound files), adapted from Quiet Words' engine.
//
//   import { Sound } from '/shared/v1/sound/index.js'
//   const sound = new Sound()
//   startButton.onclick = () => { sound.unlock(); sound.setNature({ creek: 0.5, birds: 0.3 }) }
//   sound.step(3); sound.chime(); sound.celebrate()
import { createLayer, LAYERS } from './ambience.js'
import { Music } from './music.js'
import { gain, impulseResponse } from './noise.js'
import { Notes } from './notes.js'

export { LAYERS, LAYER_LABELS } from './ambience.js'

const LOOKAHEAD = 1.5 // seconds scheduled ahead; covers timer throttling when the tab is hidden
const TICK_MS = 250
const LAYER_FADE = 1.5 // time constant for crossfading nature layers

// Sliders feel even when gain follows the square of their position.
const curve = (v) => v * v

export class Sound {
  constructor({ notes = 0.8, nature = 0.6, music = 0.5 } = {}) {
    this.volumes = { notes, nature, music }
    this.muted = false
    this.musicOn = false
    this.mix = {}
    this.layers = new Map()
    this.layerStops = new Map()
  }

  // Browsers only allow audio to start from a tap, so call this from the first one
  // (the kit's tapToStart does). iOS also reports 'interrupted' after a call or Siri.
  unlock() {
    if (!this.ctx) this.build()
    if (this.ctx.state !== 'running' && document.visibilityState === 'visible') this.ctx.resume().catch(() => {})
  }

  // Pause all sound while the game is out of sight. Otherwise iOS freezes the app with its audio
  // still "playing", and it starts up again when another home-screen web app opens.
  followVisibility(ctx) {
    const pause = () => ctx.suspend().catch(() => {})
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') pause()
      else ctx.resume().catch(() => {}) // if the browser refuses without a tap, the next tap resumes it
    })
    window.addEventListener('pagehide', pause)
    // A tap anywhere resumes sound that iOS interrupted.
    document.addEventListener('pointerdown', () => this.unlock(), { passive: true })
  }

  build() {
    const ctx = new AudioContext({ latencyHint: 'interactive' })
    this.ctx = ctx
    this.followVisibility(ctx)
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -12
    limiter.ratio.value = 4
    limiter.connect(ctx.destination)
    this.master = gain(ctx, 0)
    this.master.connect(limiter)

    const reverb = ctx.createConvolver()
    reverb.buffer = impulseResponse(ctx)
    reverb.connect(gain(ctx, 0.35)).connect(this.master)

    this.buses = { notes: gain(ctx, 0), nature: gain(ctx, 0), music: gain(ctx, 0) }
    for (const [name, bus] of Object.entries(this.buses)) {
      bus.connect(this.master)
      if (name !== 'nature') bus.connect(gain(ctx, name === 'music' ? 0.6 : 0.3)).connect(reverb)
    }
    this.notes = new Notes(ctx, this.buses.notes)
    this.music = new Music(ctx, this.buses.music)

    setInterval(() => {
      const t = ctx.currentTime
      for (const layer of this.layers.values()) layer.schedule(t, t + LOOKAHEAD)
      this.music.schedule(t, t + LOOKAHEAD)
    }, TICK_MS)
    this.refresh()
  }

  // Volumes are 0..1: { notes, nature, music }. Only the ones given change.
  setVolumes(volumes) {
    Object.assign(this.volumes, volumes)
    this.refresh()
  }

  setMuted(muted) {
    this.muted = muted
    this.refresh()
  }

  // Which nature sounds play, and how loud: e.g. { rain: 0.5, fire: 0.3 }. {} for none.
  setNature(mix) {
    this.mix = { ...mix }
    this.refresh()
  }

  setMusic(on) {
    this.musicOn = on
    this.refresh()
  }

  refresh() {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const v = this.volumes
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, t, 0.3)
    this.buses.notes.gain.setTargetAtTime(curve(v.notes), t, 0.1)
    this.buses.nature.gain.setTargetAtTime(curve(v.nature), t, 0.3)
    this.buses.music.gain.setTargetAtTime(curve(v.music), t, 0.3)
    // Don't spend battery generating what can't be heard.
    if (this.musicOn && v.music > 0 && !this.muted) this.music.start()
    else this.music.stop()
    this.crossfade(this.muted || v.nature === 0 ? {} : this.mix)
  }

  // Fades each nature layer to its new level; silent layers are torn down once faded out.
  crossfade(mix) {
    const t = this.ctx.currentTime
    for (const name of LAYERS) {
      const level = mix[name] ?? 0
      let layer = this.layers.get(name)
      if (level > 0) {
        clearTimeout(this.layerStops.get(name))
        this.layerStops.delete(name)
        if (!layer) {
          layer = createLayer(this.ctx, name, this.buses.nature)
          this.layers.set(name, layer)
        }
        layer.out.gain.setTargetAtTime(level, t, LAYER_FADE)
      } else if (layer && !this.layerStops.has(name)) {
        layer.out.gain.setTargetAtTime(0, t, LAYER_FADE)
        this.layerStops.set(
          name,
          setTimeout(() => {
            layer.stop()
            this.layers.delete(name)
            this.layerStops.delete(name)
          }, LAYER_FADE * 5000),
        )
      }
    }
  }

  // Game sounds, all in one gentle key so they always fit together.
  // Safe to call before unlock(); they simply don't play.
  step = (index) => this.notes?.letter(index) // climbs a scale: index 0, 1, 2...
  chime = () => this.notes?.word() // something good happened
  sparkle = () => this.notes?.bonus() // a little extra
  soft = () => this.notes?.repeat() // "not quite" / already done
  ping = () => this.notes?.reveal() // a hint or reveal
  celebrate = () => this.notes?.levelComplete() // level or puzzle finished
}
