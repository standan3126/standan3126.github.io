// The book: a game's levels as pages of a puzzle book (made for Quiet Numbers' Sudoku, 2026-10-30).
// A few tiles a page, each a small picture of that level and how it went; arrows to the first,
// previous, next and last page; Start in Play's spot, greyed until a tile on this page is picked.
// Any page can be played, like a real book. The idea and its rules: ../PATTERNS.md "The book".
// Use with book.css (and kit.css for the Start button's look and spot).
//
//   import { Book } from '/shared/v1/book.js'
//   const book = new Book({
//     root: document.getElementById('book'),      // the book fills this element
//     perPage: 6,                                 // tiles a page (3 across)
//     count: () => 600,                           // how many levels the book has (may grow)
//     buildTile: (tile) => { ... },               // once per tile: put in its parts
//     drawTile: (tile, n, picked) => { ... },     // level n's picture and state
//     startLabel: (n) => `Start puzzle ${n}`,     // the Start button for the picked level
//     onStart: (n) => play(n),
//   })
//   book.open(12)     // show the page with level 12, picked
//   book.render()     // after a level changed
//   book.page, book.pages, book.picked

const ARROWS = {
  first: 'M5 6v12M14 6l-6 6 6 6M20 6l-6 6 6 6',
  prev: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
  last: 'M19 6v12M10 6l6 6-6 6M4 6l6 6-6 6',
}
const LABELS = { first: 'First page', prev: 'Previous page', next: 'Next page', last: 'Last page' }

export class Book {
  constructor({ root, perPage = 6, count, buildTile, drawTile, startLabel = (n) => `Start ${n}`, emptyLabel = 'Pick a puzzle', onStart }) {
    Object.assign(this, { root, perPage, count, drawTile, startLabel, emptyLabel, onStart })
    this.page = 1
    this.picked = null
    root.classList.add('hub-book')

    this.tiles = Array.from({ length: perPage }, () => {
      const tile = Object.assign(document.createElement('button'), { type: 'button', className: 'hub-book-tile' })
      buildTile?.(tile)
      tile.addEventListener('click', () => {
        this.picked = Number(tile.dataset.n)
        this.render()
      })
      return tile
    })
    const grid = Object.assign(document.createElement('div'), { className: 'hub-book-tiles' })
    grid.append(...this.tiles)

    const pager = Object.assign(document.createElement('nav'), { className: 'hub-book-pager' })
    pager.setAttribute('aria-label', 'Pages')
    this.arrows = {}
    for (const key of ['first', 'prev', 'label', 'next', 'last']) {
      if (key === 'label') {
        this.label = Object.assign(document.createElement('p'), { className: 'hub-book-page' })
        pager.append(this.label)
        continue
      }
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'hub-book-arrow' })
      b.setAttribute('aria-label', LABELS[key])
      // Drawn arrows: arrow characters show as coloured emoji on phones (blue at night).
      b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROWS[key]}"/></svg>`
      b.addEventListener('click', () => this.flip(key))
      this.arrows[key] = b
      pager.append(b)
    }

    const actions = Object.assign(document.createElement('div'), { className: 'hub-launch-actions' })
    this.start = Object.assign(document.createElement('button'), { type: 'button', className: 'hub-play' })
    this.start.addEventListener('click', () => this.picked && this.onStart?.(this.picked))
    actions.append(this.start)

    root.append(grid, pager, actions)
  }

  get pages() {
    return Math.max(1, Math.ceil(this.count() / this.perPage))
  }

  pageOf(n) {
    return Math.ceil(n / this.perPage)
  }

  // Shows the page with level n, with n picked.
  open(n) {
    this.picked = n
    this.page = this.pageOf(n)
    this.render()
  }

  // Flipping away from the picked level lets go of it, so Start greys until one is picked here.
  flip(where) {
    const to = { first: 1, prev: this.page - 1, next: this.page + 1, last: this.pages }[where]
    this.page = Math.min(Math.max(1, to), this.pages)
    if (this.picked && this.pageOf(this.picked) !== this.page) this.picked = null
    this.render()
  }

  render() {
    const count = this.count()
    this.page = Math.min(Math.max(1, this.page), this.pages)
    this.tiles.forEach((tile, k) => {
      const n = (this.page - 1) * this.perPage + k + 1
      tile.hidden = n > count
      if (tile.hidden) return
      tile.dataset.n = n
      tile.setAttribute('aria-pressed', String(n === this.picked))
      this.drawTile(tile, n, n === this.picked)
    })
    this.label.textContent = `Page ${this.page} of ${this.pages}`
    this.arrows.first.disabled = this.arrows.prev.disabled = this.page === 1
    this.arrows.next.disabled = this.arrows.last.disabled = this.page === this.pages
    this.start.disabled = !this.picked
    this.start.textContent = this.picked ? this.startLabel(this.picked) : this.emptyLabel
  }
}
