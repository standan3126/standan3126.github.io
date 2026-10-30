// A free-form crossword: lines of pieces (letters, numbers, signs...) laid across and down so they
// cross each other and touch nowhere else, the grid only as big as the lines need. Made general
// from Quiet Words' word layout (tools/crossword.ts, which keeps its own copy) for Sum Cross,
// 2026-10-30. Pure code, no browser needed, so puzzle makers can run it in Node.
//
//   import { Crossword } from '/shared/v1/crossword.js'
//   const cw = new Crossword({ canCross: (piece) => typeof piece === 'number' })
//   cw.place([3, '+', 4, '=', 7], 0, 0, 'h')
//   cw.fit([7, '−', 2, '=', 5], 4, 0, 'v', { maxWidth: 9, maxHeight: 9 })  // crossings, or -1
//   cw.lines        // [{ pieces, x, y, dir }]
//   cw.normalized() // the same with the top-left corner at 0,0, plus width and height
//
// A line may only touch the grid where it crosses another, so no accidental extra lines appear:
// the squares just before and after it, and the squares beside it, must be empty, except at
// crossings. Crossing squares must hold the same piece, and only pieces canCross allows.

const H = 1
const V = 2
const key = (x, y) => `${x},${y}`
export const step = (dir) => (dir === 'h' ? [1, 0] : [0, 1])

export class Crossword {
  constructor({ canCross = () => true, same = (a, b) => a === b } = {}) {
    this.canCross = canCross
    this.same = same
    this.cells = new Map() // "x,y" -> piece
    this.dirs = new Map() // "x,y" -> which directions pass through (H | V)
    this.lines = []
    this.minX = this.minY = Infinity
    this.maxX = this.maxY = -Infinity
  }

  get width() {
    return this.lines.length ? this.maxX - this.minX + 1 : 0
  }

  get height() {
    return this.lines.length ? this.maxY - this.minY + 1 : 0
  }

  at(x, y) {
    return this.cells.get(key(x, y))
  }

  has(x, y) {
    return this.cells.has(key(x, y))
  }

  // True when the square is crossed by lines both ways.
  crossed(x, y) {
    return this.dirs.get(key(x, y)) === (H | V)
  }

  // How many squares the line would share with the grid, or -1 if it can't go there.
  fit(pieces, x, y, dir, limits = { maxWidth: Infinity, maxHeight: Infinity }) {
    const [dx, dy] = step(dir)
    const bit = dir === 'h' ? H : V
    const end = pieces.length - 1
    if (this.has(x - dx, y - dy) || this.has(x + dx * (end + 1), y + dy * (end + 1))) return -1
    let crossings = 0
    for (let i = 0; i <= end; i++) {
      const cx = x + dx * i
      const cy = y + dy * i
      if (this.has(cx, cy)) {
        const there = this.at(cx, cy)
        if (!this.same(there, pieces[i]) || !this.canCross(pieces[i]) || this.dirs.get(key(cx, cy)) & bit) return -1
        crossings++
      } else if (this.has(cx + dy, cy + dx) || this.has(cx - dy, cy - dx)) {
        return -1
      }
    }
    if (this.lines.length > 0 && crossings === 0) return -1
    const width = Math.max(this.maxX, x + dx * end) - Math.min(this.minX, x) + 1
    const height = Math.max(this.maxY, y + dy * end) - Math.min(this.minY, y) + 1
    if (width > limits.maxWidth || height > limits.maxHeight) return -1
    return crossings
  }

  place(pieces, x, y, dir) {
    const [dx, dy] = step(dir)
    const bit = dir === 'h' ? H : V
    pieces.forEach((piece, i) => {
      const k = key(x + dx * i, y + dy * i)
      this.cells.set(k, piece)
      this.dirs.set(k, (this.dirs.get(k) ?? 0) | bit)
    })
    this.lines.push({ pieces, x, y, dir })
    this.minX = Math.min(this.minX, x)
    this.minY = Math.min(this.minY, y)
    this.maxX = Math.max(this.maxX, x + dx * (pieces.length - 1))
    this.maxY = Math.max(this.maxY, y + dy * (pieces.length - 1))
  }

  // The lines with the top-left corner at 0,0.
  normalized() {
    return {
      lines: this.lines.map((l) => ({ ...l, x: l.x - this.minX, y: l.y - this.minY })),
      width: this.width,
      height: this.height,
    }
  }
}

// Every run of 2+ filled squares across and down in a set of lines. A sound layout has exactly
// one run per line and nothing else (a check for tests).
export function runs(lines) {
  const cells = new Map()
  for (const l of lines) {
    const [dx, dy] = step(l.dir)
    l.pieces.forEach((p, i) => cells.set(key(l.x + dx * i, l.y + dy * i), p))
  }
  const out = []
  for (const dir of ['h', 'v']) {
    const [dx, dy] = step(dir)
    for (const k of cells.keys()) {
      const [x, y] = k.split(',').map(Number)
      if (cells.has(key(x - dx, y - dy))) continue
      const pieces = []
      for (let i = 0; cells.has(key(x + dx * i, y + dy * i)); i++) pieces.push(cells.get(key(x + dx * i, y + dy * i)))
      if (pieces.length >= 2) out.push({ pieces, x, y, dir })
    }
  }
  return out
}
