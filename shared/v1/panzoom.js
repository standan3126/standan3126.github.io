// Zoom and pan for a game board drawn on a canvas, with taps told apart from drags.
// The gesture handling is Love To Color's (js/stage.js), made general: the game draws,
// this only keeps track of where the board is on screen.
//
//   one finger tap      onTap(x, y) in board units
//   one finger drag     move around (when zoomed in)
//   two fingers         pinch to zoom, drag to move
//   mouse wheel         zoom (on a computer)
//
//   import { PanZoom } from '/shared/v1/panzoom.js'
//   const view = new PanZoom(canvas, { width: 20, height: 30, onTap, onChange: draw })
//   view.resize(canvas.clientWidth, canvas.clientHeight)
//   // when drawing: ctx.setTransform(dpr * view.s, 0, 0, dpr * view.s, dpr * view.tx, dpr * view.ty)
//
// The canvas needs `touch-action: none` in CSS so the browser leaves the fingers to us.

const TAP_MOVE = 10 // pixels a finger may move and still count as a tap
const TAP_TIME = 600 // ms

export class PanZoom {
  // width, height: the board's size in its own units (cells, pixels: the game decides).
  // maxZoom: times the fitted size. maxScale (optional): screen pixels per board unit at most,
  // whichever allows more. pad: how far past the board's edge you may drag, in screen pixels.
  constructor(el, { width, height, maxZoom = 14, maxScale = 0, pad = 40, margin = 0.96, onTap, onChange }) {
    this.el = el
    this.width = width
    this.height = height
    this.maxZoom = maxZoom
    this.maxScale = maxScale
    this.pad = pad
    this.margin = margin
    this.onTap = onTap
    this.onChange = onChange
    this.vw = 0
    this.vh = 0
    this.s = 1
    this.tx = 0
    this.ty = 0
    this.fitScale = 0
    this.pointers = new Map()
    this.listen()
  }

  // A new board (e.g. the next level): shows all of it.
  setContent(width, height) {
    this.width = width
    this.height = height
    this.fitScale = 0
    if (this.vw) this.resize(this.vw, this.vh)
  }

  // The canvas's size on screen, in CSS pixels. Call on start and whenever it changes.
  resize(vw, vh) {
    if (!vw || !vh) return
    this.vw = vw
    this.vh = vh
    const fitBefore = this.fitScale
    this.fitScale = Math.min(vw / this.width, vh / this.height) * this.margin
    if (!fitBefore || this.s <= fitBefore * 1.001) this.fit()
    else this.clamp()
    this.changed()
  }

  get maxS() {
    return Math.max(this.fitScale * this.maxZoom, this.maxScale)
  }

  get zoom() {
    return this.s / this.fitScale
  }

  fit() {
    this.s = this.fitScale
    this.tx = (this.vw - this.width * this.s) / 2
    this.ty = (this.vh - this.height * this.s) / 2
    this.changed()
  }

  // Zoom by a factor around a point on screen (default: the middle).
  zoomBy(f, cx = this.vw / 2, cy = this.vh / 2) {
    const s = Math.min(this.maxS, Math.max(this.fitScale, this.s * f))
    const ix = (cx - this.tx) / this.s
    const iy = (cy - this.ty) / this.s
    this.s = s
    this.tx = cx - ix * s
    this.ty = cy - iy * s
    this.clamp()
    this.changed()
  }

  // Keep the board on screen: centered while it's smaller than the view, edge to edge after.
  clamp() {
    const iw = this.width * this.s
    const ih = this.height * this.s
    const pad = this.pad
    this.tx = iw <= this.vw ? (this.vw - iw) / 2 : Math.min(pad, Math.max(this.vw - iw - pad, this.tx))
    this.ty = ih <= this.vh ? (this.vh - ih) / 2 : Math.min(pad, Math.max(this.vh - ih - pad, this.ty))
  }

  // Centers a point of the board, zoomed in to at least `scale` screen pixels per unit.
  show(x, y, scale = this.s) {
    this.s = Math.min(this.maxS, Math.max(this.s, scale, this.fitScale))
    this.tx = this.vw / 2 - x * this.s
    this.ty = this.vh / 2 - y * this.s
    this.clamp()
    this.changed()
  }

  // Screen (client) position → board units, and back.
  toBoard(clientX, clientY) {
    const r = this.el.getBoundingClientRect()
    return [(clientX - r.left - this.tx) / this.s, (clientY - r.top - this.ty) / this.s]
  }

  toScreen(x, y) {
    const r = this.el.getBoundingClientRect()
    return [r.left + this.tx + x * this.s, r.top + this.ty + y * this.s]
  }

  changed() {
    this.onChange?.()
  }

  listen() {
    const el = this.el
    const local = (e) => {
      const r = el.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture?.(e.pointerId)
      const [x, y] = local(e)
      this.pointers.set(e.pointerId, { x, y })
      if (this.pointers.size === 1) this.tap = { x, y, t: performance.now(), ok: true }
      else this.tap = null
      this.gesture = null
    })
    el.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId)
      if (!p) return
      const [x, y] = local(e)
      if (this.pointers.size === 1) {
        if (this.tap && Math.hypot(x - this.tap.x, y - this.tap.y) > TAP_MOVE) this.tap.ok = false
        if (!this.tap?.ok) {
          this.tx += x - p.x
          this.ty += y - p.y
          this.clamp()
          this.changed()
        }
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()]
        if (!this.gesture) {
          this.gesture = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, s: this.s, tx: this.tx, ty: this.ty }
        }
        p.x = x
        p.y = y
        const [a2, b2] = [...this.pointers.values()]
        const g = this.gesture
        const d = Math.hypot(a2.x - b2.x, a2.y - b2.y)
        const mx = (a2.x + b2.x) / 2
        const my = (a2.y + b2.y) / 2
        const s = Math.min(this.maxS, Math.max(this.fitScale, (g.s * d) / Math.max(1, g.d)))
        const ix = (g.mx - g.tx) / g.s
        const iy = (g.my - g.ty) / g.s
        this.s = s
        this.tx = mx - ix * s
        this.ty = my - iy * s
        this.clamp()
        this.changed()
        return
      }
      p.x = x
      p.y = y
    })
    const end = (e) => {
      if (!this.pointers.has(e.pointerId)) return
      this.pointers.delete(e.pointerId)
      if (this.pointers.size === 0) {
        const t = this.tap
        this.tap = null
        if (e.type === 'pointerup' && t?.ok && performance.now() - t.t < TAP_TIME) {
          const [x, y] = this.toBoard(e.clientX, e.clientY)
          this.onTap?.(x, y, e)
        }
      }
      if (this.pointers.size < 2) this.gesture = null
    }
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const [x, y] = local(e)
        this.zoomBy(Math.exp(-e.deltaY * 0.0025), x, y)
      },
      { passive: false },
    )
  }
}
