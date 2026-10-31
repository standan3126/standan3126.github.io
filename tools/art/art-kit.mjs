// The art kit: every icon, button, tile, sprite and picture in every GameHub game, captured from the
// live site at phone size, in the day and night looks, so the user can draw their own and replace
// them one by one (user, 2026-10-30). Run from the hub folder:
//
//   node tools/art/art-kit.mjs            # every game
//   node tools/art/art-kit.mjs momahjong  # one game
//
// Writes ../art-kit/ (next to the game folders, on this computer only): a picture of each item
// (<game>/<id>-day.png and -night.png, at 3× = the size to draw at), one sprite sheet a game
// (<game>/sheet.png) and index.html to browse them. It also writes the list, shared/ART.md
// (public): sizes, what each is made of now, and the colours each look allows.
//
// A new game adds its section to CATALOGUE below (GOALS.md: every game has an art list and sheet).

import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const SITE = 'https://standan3126.github.io'
const KIT = new URL('../../../art-kit/', import.meta.url)
const LIST = new URL('../../shared/ART.md', import.meta.url)
const SCALE = 3 // iPhones show 3 screen pixels per CSS pixel: draw at 3× the size on screen
const PHONE = { width: 390, height: 844 }

// --- Steps the captures use ----------------------------------------------------------------------

const tapStart = async (page, choice) => {
  // The game's own question (Quiet Numbers' Finger / Stylus), else its plain Tap to Start.
  const asked = page.locator('.hub-start button', { hasText: choice })
  const b = choice && (await asked.count()) ? asked : page.locator('.hub-start button, button:has-text("Tap to Start"), button:has-text("Tap to start")').first()
  if (await b.count()) await b.click().catch(() => {})
  await page.waitForTimeout(600)
}
// Clicks when it's there (a one-time card such as the rules may already have been seen).
const click = async (page, selector, wait = 700) => {
  const el = page.locator(selector).first()
  try {
    await el.waitFor({ state: 'visible', timeout: 4000 })
  } catch {
    return
  }
  await el.click()
  await page.waitForTimeout(wait)
}

// --- The catalogue ---------------------------------------------------------------------------------
// Each game: where it lives, its colour tokens (read from the page to show the allowed colours),
// and its items. An item: id, name, made (what it is now), notes, and either a capture (a page
// state + a selector) or a file (a picture file, shown as it is).
// `scales: true` = its size follows the screen (draw it as SVG or big; the size given is at 390 px).

const CATALOGUE = [
  {
    game: 'hub',
    name: 'GameHub (start page and app icon)',
    repo: 'standan3126.github.io',
    path: '/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-soft', '--hub-panel', '--hub-accent', '--hub-line'],
    items: [
      { id: 'app-icon-512', name: 'App icon (home screen, Android)', made: 'PNG file', file: '/icons/icon-512.png', notes: 'Sage square, four cream tiles. Also icon-192.png (192×192).' },
      { id: 'app-icon-maskable', name: 'App icon, Android round crop', made: 'PNG file', file: '/icons/icon-maskable-512.png', notes: 'Keep the picture inside the middle 80% circle: Android crops the edges.' },
      { id: 'app-icon-apple', name: 'App icon, iPhone', made: 'PNG file', file: '/icons/apple-touch-icon.png', notes: 'No see-through parts (iPhone fills them black).' },
      { id: 'game-card', name: 'A game on the start page', made: 'CSS + emoji', capture: { selector: '.game' } },
      ...['Calm Bubbles', 'Melody Garden', 'Momahjong', 'Quiet Words', 'Love To Color', 'Arrowhead', 'Quiet Numbers'].map((g, k) => ({
        id: `game-icon-${g.toLowerCase().replace(/ /g, '-')}`,
        name: `${g}'s icon on the start page`,
        made: 'emoji (games.js)',
        notes: 'Emoji look different on every phone and are coloured (blue at night). Top pick to replace.',
        capture: { selector: '.game-art', nth: k },
      })),
      { id: 'start-play', name: 'Play link on a game card', made: 'CSS', capture: { selector: 'a.play' } },
    ],
  },
  {
    game: 'toolbox',
    name: 'Shared frame and buttons (every game)',
    repo: 'standan3126.github.io (shared/v1)',
    path: '/quiet_numbers/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-panel', '--hub-accent', '--hub-line'],
    items: [
      { id: 'tap-to-start', name: 'Tap to Start card', made: 'CSS', capture: { selector: '.hub-start-card', before: true } },
      { id: 'start-button', name: 'Tap to Start button', made: 'CSS', capture: { selector: '.hub-start-card .hub-button', before: true } },
      { id: 'corner-hub', name: 'Hub button (top left, launch page)', made: 'SVG in code (kit.js ICONS.hub) + text', capture: { selector: '.hub-corner-left:visible' }, notes: 'Icon drawn in a 24×24 box, 2 px lines.' },
      { id: 'corner-gear', name: 'Settings gear (top right, every page)', made: 'SVG in code (kit.js ICONS.gear)', capture: { selector: '.hub-gear' }, notes: 'Never moves or changes look.' },
      { id: 'launch-play', name: 'Play button (bottom, the main action)', made: 'CSS', capture: { selector: '#play' } },
      { id: 'book-arrow-first', name: 'Book: first page arrow', made: 'SVG in code (book.js)', capture: { steps: [['#play']], selector: '.hub-book-arrow', nth: 0 } },
      { id: 'book-arrow-prev', name: 'Book: previous page arrow', made: 'SVG in code (book.js)', capture: { steps: [['#play']], selector: '.hub-book-arrow', nth: 1 } },
      { id: 'book-arrow-next', name: 'Book: next page arrow', made: 'SVG in code (book.js)', capture: { steps: [['#play']], selector: '.hub-book-arrow', nth: 2 } },
      { id: 'book-arrow-last', name: 'Book: last page arrow', made: 'SVG in code (book.js)', capture: { steps: [['#play']], selector: '.hub-book-arrow', nth: 3 } },
      { id: 'book-tile', name: 'Book: one puzzle tile (picked)', made: 'CSS (the game draws the picture)', capture: { steps: [['#play']], selector: '.hub-book-tile' } },
      { id: 'corner-home', name: 'Home button (top left, while playing)', made: 'SVG in code (kit.js ICONS.home) + text', capture: { steps: [['#play']], selector: '.hub-corner-left:visible' } },
      { id: 'corner-help', name: 'Rules ? (under the gear, while playing)', made: 'SVG in code (kit.js ICONS.help)', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: '.hub-help' } },
      { id: 'settings-panel', name: 'Settings panel', made: 'CSS (settings.js)', capture: { steps: [['.hub-gear']], selector: 'dialog.hub-settings' }, notes: 'Sliders and switches are drawn in the theme colours.' },
      { id: 'coin', name: 'Gold coin (games with coins)', made: 'CSS (kit.css .hub-coin)', capture: { path: '/momahjong/', steps: [['.hub-play', 2000], ['text=Skip the tips', 1000]], selector: '.hub-coin:visible' }, notes: 'One coin look for every game (user, 2026-10-28). Shown 11-18 px.' },
    ],
  },
  {
    game: 'bubbles',
    name: 'Calm Bubbles',
    repo: 'standan3126.github.io (games/bubbles)',
    path: '/games/bubbles/',
    tokens: ['--hub-bg', '--hub-ink'],
    items: [
      { id: 'pond', name: 'The pond with bubbles (whole screen)', made: 'drawn in code on a canvas', capture: { selector: '#pond', wait: 2500 }, notes: 'Bubbles are drawn, not pictures: radius 12-70 px, 10 day pastels, 8 warm night tints, a big "cluster" bubble that pops into little ones, a rare rainbow "shimmer" bubble, ripple and droplets on a pop. Replacing them means bubble pictures in 4 sizes (SVG best).' },
    ],
  },
  {
    game: 'melody-garden',
    name: 'Melody Garden',
    repo: 'standan3126.github.io (games/melody-garden)',
    path: '/games/melody-garden/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-accent'],
    items: [
      ...['lullaby (🌙)', 'garden (🌸)', 'celtic (🍀)', 'cafe (☕)', 'island (🌴)', 'meadow (🌼)'].map((s, k) => ({
        id: `style-card-${s.split(' ')[0]}`,
        name: `Music style card: ${s}`,
        made: 'CSS + emoji',
        notes: k === 0 ? 'The emoji is the picture: a small style icon (about 28 px) would replace it.' : undefined,
        capture: { selector: '.style-card', nth: k },
      })),
      { id: 'play-button', name: 'Play / Pause (round)', made: 'CSS + text glyph', capture: { selector: '#play' } },
      { id: 'chip', name: 'Player or nature-sound chip', made: 'CSS', capture: { selector: '.chip' } },
      { id: 'page', name: 'The whole page', made: 'CSS', capture: { selector: 'body', viewport: true } },
    ],
  },
  {
    game: 'arrowhead',
    name: 'Arrowhead',
    repo: 'arrowhead',
    path: '/arrowhead/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-accent'],
    items: [
      { id: 'path-card-simple', name: 'Path card: Simple Arrows', made: 'CSS', capture: { selector: '#pick-simple' } },
      { id: 'path-card-arrowhead', name: 'Path card: Arrowhead', made: 'CSS', capture: { selector: '#pick-native' } },
      { id: 'board', name: 'The board with arrows (whole screen)', made: 'drawn in code on a canvas', capture: { steps: [['#play-path', 1500], ['#coach-ok']], selector: '#board', wait: 800 }, notes: 'Arrows are drawn lines with heads (draw-simple.js / board-view.js), sized by the zoom. Replacing: an arrow head and a line style, as SVG.' },
      { id: 'tool-undo', name: 'Undo tool', made: 'text glyph ↶', capture: { steps: [['#play-path', 1500]], selector: '#undo' } },
      { id: 'tool-hint', name: 'Hint tool', made: 'text glyph ✦', capture: { steps: [['#play-path', 1500]], selector: '#hint' } },
      { id: 'tool-burn', name: 'Burn tool', made: 'emoji 🔥', capture: { steps: [['#play-path', 1500]], selector: '#burn' } },
      { id: 'tool-fit', name: 'See all tool', made: 'text glyph ⤢', capture: { steps: [['#play-path', 1500]], selector: '#fit' } },
    ],
  },
  {
    game: 'love-to-color',
    name: 'Love To Color',
    repo: 'love-to-color',
    path: '/love-to-color/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-accent'],
    items: [
      { id: 'section-tab', name: 'Section tab (Easy / Cozy / Detailed)', made: 'CSS', capture: { selector: '.section-tab' } },
      { id: 'chip', name: 'Topic chip', made: 'CSS', capture: { selector: '.chip' } },
      { id: 'picture-card', name: 'Picture card', made: 'CSS + the picture', capture: { selector: '.picture-card' }, notes: 'The 30 pictures themselves are PNG files (art/<name>/lines.png + colors.png; photos have easy/cozy/detailed). They are the game: listed in art/art.json.' },
      { id: 'mode-choice', name: 'Color by Number / Free Color choice', made: 'CSS', capture: { steps: [['.picture-card']], selector: '.choice' } },
      { id: 'start-coloring', name: 'Start coloring button', made: 'CSS', capture: { steps: [['.picture-card']], selector: '#startColoring' } },
      ...[['undo', 'Undo'], ['savePhoto', 'Save to Photos'], ['zoomOut', 'Zoom out'], ['zoomFit', 'Whole picture'], ['zoomIn', 'Zoom in']].map(([id, name]) => ({
        id: `icon-${id}`,
        name: `${name} button`,
        made: 'SVG in code (index.html), 24×24 box',
        notes: id === 'undo' ? 'Shows only after the first color, so it has no picture here; same style as the zoom buttons.' : undefined,
        capture: { steps: [['.picture-card'], ['#startColoring', 1500]], selector: `#${id}` },
      })),
      { id: 'coloring', name: 'Coloring screen (whole screen)', made: 'drawn in code on a canvas + CSS palette', capture: { steps: [['.picture-card'], ['#startColoring', 1500]], selector: 'body', viewport: true } },
    ],
  },
  {
    game: 'quiet-words',
    name: 'Quiet Words',
    repo: 'quiet_words',
    path: '/quiet_words/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-accent'],
    items: [
      { id: 'home', name: 'Home with painted scenery (whole screen)', made: 'SVG drawn in code (src/theme/places: coast, desert, forest, meadow, mountain, night sky)', capture: { selector: 'body', viewport: true }, notes: 'The scenery is drawn by code for each place, full screen (up to 430×932 CSS px = 1290×2796 to draw). Little animals float over it.' },
      { id: 'sprite-bird', name: 'Bird', made: 'SVG in code', notes: 'Day only: the night sky has fireflies instead.', capture: { selector: '.bird-shape' } },
      { id: 'sprite-bee', name: 'Bee', made: 'SVG in code', capture: { selector: '.bee-shape' } },
      { id: 'sprite-fluff', name: 'Dandelion fluff', made: 'SVG in code', capture: { selector: '.fluff-shape' } },
      { id: 'level', name: 'A level (whole screen)', made: 'CSS + SVG wheel', capture: { steps: [['.hub-play', 1800]], selector: 'body', viewport: true } },
      { id: 'cell', name: 'Letter square', made: 'CSS', capture: { steps: [['.hub-play', 1800]], selector: 'button.cell' }, scales: true },
      { id: 'wheel', name: 'Letter wheel', made: 'SVG in code (wheel.tsx)', capture: { steps: [['.hub-play', 1800]], selector: 'svg.wheel' } },
      ...['Shuffle', 'Bonus words', 'Reveal a letter', 'Reveal a square', 'Reveal 5 letters', 'Skip'].map((name, k) => ({
        id: `tool-${name.toLowerCase().replace(/ /g, '-')}`,
        name: `${name} tool`,
        made: 'SVG in code (ui/icons.tsx)',
        capture: { steps: [['.hub-play', 1800]], selector: 'button.tool', nth: k },
      })),
    ],
  },
  {
    game: 'momahjong',
    name: 'Momahjong',
    repo: 'momahjong',
    path: '/momahjong/',
    tokens: ['--hub-bg', '--hub-ink', '--hub-accent'],
    tiles: true, // every tile face, drawn from the game's own getTileSVG
    items: [
      { id: 'board', name: 'A board (whole screen)', made: 'CSS tiles with SVG faces', capture: { steps: [['.hub-play', 2000], ['text=Skip the tips', 1000]], selector: 'body', viewport: true } },
      { id: 'tool-hint', name: 'Hint tool', made: 'emoji 💡 + coin', capture: { steps: [['.hub-play', 2000]], selector: '#btnHint' } },
      { id: 'tool-shuffle', name: 'Shuffle tool', made: 'emoji 🌪️ + coin', capture: { steps: [['.hub-play', 2000]], selector: '#btnShuffle' } },
      { id: 'tool-undo', name: 'Undo tool', made: 'emoji 📜 + coin', capture: { steps: [['.hub-play', 2000]], selector: '#btnUndo' } },
    ],
  },
  {
    game: 'quiet-numbers',
    name: 'Quiet Numbers (Sudoku and Sum Cross)',
    repo: 'quiet_numbers',
    path: '/quiet_numbers/',
    tokens: ['--bg', '--paper', '--ink', '--grid-bold', '--given', '--pen', '--note', '--wrong', '--whiteout', '--sign', '--lit'],
    items: [
      { id: 'game-card', name: 'Game card on the launch page (open)', made: 'CSS', capture: { selector: '#card-sudoku' } },
      { id: 'level-row', name: 'Difficulty tile', made: 'CSS', capture: { selector: '#sudoku-body .level-row' } },
      { id: 'sudoku-tile', name: 'Book tile: Sudoku', made: 'CSS', capture: { steps: [['#play']], selector: '.hub-book-tile' } },
      { id: 'sudoku-board', name: 'Sudoku play screen (whole screen)', made: 'CSS', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: 'body', viewport: true } },
      { id: 'sudoku-number', name: 'Number button (1-9)', made: 'CSS + text', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: '.number' } },
      { id: 'tool-erase', name: 'Erase tool', made: 'text glyph ⌫', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: '#erase' } },
      { id: 'tool-whiteout', name: 'White-out tool', made: 'CSS shape', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: '#whiteout' } },
      { id: 'tool-hint', name: 'Hint tool', made: 'text glyph ◯', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: '#hint' } },
      { id: 'tool-look', name: 'Look tool (answer key)', made: 'text glyph ▤', capture: { steps: [['#play'], ['#start'], ['#rules']], selector: '#look' } },
      { id: 'rules', name: 'Rules card', made: 'CSS', capture: { steps: [['#play'], ['#start'], ['#rules'], ['.hub-help']], selector: '#rules-sudoku' } },
      { id: 'sumcross-tile', name: 'Book tile: Sum Cross', made: 'CSS', capture: { steps: [['#open-sumcross'], ['#play']], selector: '.hub-book-tile' } },
      { id: 'sumcross-board', name: 'Sum Cross play screen (whole screen)', made: 'CSS boxes', capture: { steps: [['#open-sumcross'], ['#play'], ['#start'], ['#rules']], selector: 'body', viewport: true }, notes: 'Boxes: number (blank or printed), sign (+ − × ÷ = √, tinted), dark hole, squared (² in the corner). Box lines 2 px. Boxes scale with the zoom.' },
      { id: 'sumcross-bank-tile', name: 'Number bank tile', made: 'CSS + text', capture: { steps: [['#open-sumcross'], ['#play'], ['#start'], ['#rules']], selector: '.bank-tile' } },
    ],
  },
]

// --- Capturing ---------------------------------------------------------------------------------

const only = process.argv[2]
const games = CATALOGUE.filter((g) => !only || g.game === only)
const browser = await chromium.launch()
const results = {}

for (const g of games) {
  const dir = new URL(`${g.game}/`, KIT)
  mkdirSync(dir, { recursive: true })
  results[g.game] = { items: [], tokens: {} }
  for (const look of ['day', 'night']) {
    const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: SCALE, hasTouch: true, isMobile: true })
    // GameHub's own settings: every game following them shows this look.
    await context.addInitScript((look) => {
      try {
        localStorage.setItem('hub:my-settings', JSON.stringify({ light: look }))
      } catch {}
    }, look)
    const page = await context.newPage()
    for (const item of g.items) {
      const out = results[g.game].items.find((r) => r.id === item.id) ?? { ...item }
      if (!results[g.game].items.includes(out)) results[g.game].items.push(out)
      try {
        if (item.file) {
          if (look === 'night') continue
          const res = await page.request.get(SITE + item.file)
          const bytes = await res.body()
          writeFileSync(new URL(`${item.id}-day.png`, dir), bytes)
          out.px = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)]
          continue
        }
        const c = item.capture
        await page.goto(SITE + (c.path ?? g.path))
        await page.waitForTimeout(1500)
        if (!c.before) await tapStart(page, 'Finger')
        for (const [selector, wait] of c.steps ?? []) await click(page, selector, wait)
        if (c.wait) await page.waitForTimeout(c.wait)
        const file = new URL(`${item.id}-${look}.png`, dir)
        if (c.viewport) {
          await page.screenshot({ path: file.pathname })
          out.css = [PHONE.width, PHONE.height]
        } else {
          const el = page.locator(c.selector).nth(c.nth ?? 0)
          const box = await el.boundingBox()
          await el.screenshot({ path: file.pathname, animations: 'disabled' })
          out.css = [Math.round(box.width), Math.round(box.height)]
        }
        out[look] = true
      } catch (e) {
        out.error = `${look}: ${e.message.split('\n')[0]}`
        console.log(`  ! ${g.game}/${item.id} ${out.error}`)
      }
    }
    // The colours of this look.
    try {
      await page.goto(SITE + g.path)
      await page.waitForTimeout(1200)
      await tapStart(page, 'Finger')
      results[g.game].tokens[look] = await page.evaluate((names) => {
        const s = getComputedStyle(document.documentElement)
        return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n).trim()]))
      }, g.tokens)
    } catch {}
    // Every Momahjong tile face, drawn by the game's own code.
    if (g.tiles) {
      await page.goto(SITE + g.path)
      await page.waitForTimeout(1500)
      const tiles = await page.evaluate(() => TILE_CATALOG.map((t) => ({ id: t.id, name: t.name, suit: t.suit })))
      await page.evaluate(() => {
        document.body.innerHTML = `<div id="faces" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px;background:#f3ead7">${TILE_CATALOG.map((t) => `<div class="face" style="width:64px;height:78px;background:#fffaf0;border-radius:8px;box-shadow:0 0 0 1px #b9a77f">${getTileSVG(t.id)}</div>`).join('')}</div>`
      })
      const faces = page.locator('#faces .face')
      for (let k = 0; k < tiles.length; k++) {
        const id = `tile-${tiles[k].id}`
        await faces.nth(k).screenshot({ path: new URL(`${id}-${look}.png`, dir).pathname })
        let out = results[g.game].items.find((r) => r.id === id)
        if (!out) results[g.game].items.push((out = { id, name: `Tile: ${tiles[k].name} (${tiles[k].suit})`, made: 'SVG in code (tiles.js getTileSVG), 64×76 box', css: [50, 67], scales: true, notes: k === 0 ? 'A tile face is drawn in a 64×76 box; on screen about 50×67 at 390 px wide (smaller on big boards). Draw faces at 192×228 or as SVG.' : undefined }))
        out[look] = true
      }
    }
    await context.close()
    console.log(`${g.game} ${look}: done`)
  }
}
await browser.close()

// --- The sprite sheets and the browser page ----------------------------------------------------

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const size = (r) => (r.px ? `${r.px[0]}×${r.px[1]} px file` : r.css ? `${r.css[0]}×${r.css[1]} CSS px` : '?')
const drawAt = (r) => (r.px ? `${r.px[0]}×${r.px[1]}` : r.css ? `${r.css[0] * SCALE}×${r.css[1] * SCALE}` : '?')

function sheetHtml(g, r) {
  const card = (it) => `<figure>
    <div class="pics">${['day', 'night'].filter((l) => it[l] || (l === 'day' && it.px)).map((l) => `<img src="${it.id}-${l}.png" style="width:${Math.min(it.px ? it.px[0] / SCALE : it.css?.[0] ?? 100, 200)}px" alt="${l}">`).join('')}</div>
    <figcaption><b>${esc(it.id)}</b><br>${esc(it.name)}<br><span>${size(it)} · draw at ${drawAt(it)}${it.scales ? ' · scales' : ''}</span><br><i>${esc(it.made)}</i></figcaption></figure>`
  return `<!doctype html><meta charset="utf-8"><title>${esc(g.name)} art</title><style>
    body{font:13px system-ui,sans-serif;background:#ece8e0;color:#222;margin:16px}
    h1{font-size:20px;margin:0 0 4px} p{margin:0 0 12px;color:#555}
    .grid{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}
    figure{margin:0;padding:8px;background:#fff;border-radius:8px;max-width:430px}
    .pics{display:flex;gap:6px;align-items:flex-start;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/16px 16px;padding:4px}
    img{display:block;height:auto} figcaption{margin-top:6px;line-height:1.35} span{color:#555} i{color:#777}
  </style><h1>${esc(g.name)}</h1><p>Left: day look. Right: night look. Pictures are at 3× (the size to draw at), shown here at phone size.</p>
  <div class="grid">${r.items.filter((it) => it.day || it.night || it.px).map(card).join('')}</div>`
}

const page = await (await chromium.launch()).newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 900 } })
for (const g of games) {
  const r = results[g.game]
  const html = new URL(`${g.game}/sheet.html`, KIT)
  writeFileSync(html, sheetHtml(g, r))
  await page.goto(html.href)
  await page.waitForTimeout(500)
  await page.screenshot({ path: new URL(`${g.game}/sheet.png`, KIT).pathname, fullPage: true })
  writeFileSync(new URL(`${g.game}/items.json`, KIT), JSON.stringify(r, null, 1))
}
await page.context().browser().close()

// The list (shared/ART.md) is made from every game's items.json, so running one game keeps the rest.
const { readFileSync, existsSync } = await import('node:fs')
const all = CATALOGUE.map((g) => {
  const f = new URL(`${g.game}/items.json`, KIT)
  return { g, r: existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { items: [], tokens: {} } }
})
writeFileSync(LIST, listMarkdown(all))
writeFileSync(new URL('index.html', KIT), `<!doctype html><meta charset="utf-8"><title>GameHub art kit</title><style>body{font:16px system-ui,sans-serif;margin:24px;background:#f6f0e1}a{display:block;margin:8px 0}</style><h1>GameHub art kit</h1><p>Each game's sprite sheet (day and night). The list with sizes and colours is hub/shared/ART.md.</p>${all.map(({ g }) => `<a href="${g.game}/sheet.html">${esc(g.name)}</a>`).join('')}`)
console.log('Wrote', KIT.pathname, 'and', LIST.pathname)

function listMarkdown(all) {
  const swatches = (tokens) =>
    Object.keys(tokens.day ?? {})
      .map((n) => `| \`${n}\` | ${tokens.day?.[n] || '-'} | ${tokens.night?.[n] || '-'} |`)
      .join('\n')
  const rows = (items) =>
    items
      .map((it) => `| \`${it.id}\` | ${it.name} | ${it.made} | ${it.px ? `${it.px[0]}×${it.px[1]} (file)` : it.css ? `${it.css[0]}×${it.css[1]}` : '?'} | ${drawAt(it)}${it.scales ? ' (scales)' : ''} | ${it.notes ?? ''} |`)
      .join('\n')
  return `# GameHub art list

Every icon, button, tile, sprite and picture in GameHub, so new art can replace it piece by piece.
Made by \`tools/art/art-kit.mjs\` from the live site (do not edit by hand; run it again). The
pictures and sprite sheets are in \`art-kit/\` on the computer that ran it (\`index.html\`).

## Rules for new art

- **Sizes.** Sizes are CSS pixels on a 390 px wide phone; phones run 360 to 430 px wide. iPhones
  show 3 screen pixels per CSS pixel, so **draw at 3×** ("draw at" below). Anything that says
  *scales* changes size with the screen or the zoom: draw it as **SVG** (sharp at any size), or
  at least at 3× its biggest size.
- **Formats.** SVG for icons, buttons, tiles and sprites (small, sharp, and its colours can follow
  day and night). PNG (or WebP) for paintings and photos. One file per item, named by its id
  (\`corner-gear.svg\`, \`tile-b1.svg\`).
- **Touch.** A button is at least **44×44 CSS px** (132×132 to draw). Icons sit in a 24×24 box
  inside it (72×72 to draw), lines about 2 px (6 px at 3×), with space around them.
- **Day and night.** Every game has a day look and a warm night look. **Night has no blue light:**
  every colour must have at least as much red as blue (tests check this). Give night versions
  of pictures, or draw icons in one colour so the game can tint them.
- **Emoji are the first things to replace.** They look different on every phone (Apple, Google,
  Samsung) and are coloured, often blue at night.
- **Same thing, same look.** The frame (Hub, Home, gear, ?), the coin and the Play button are shared
  by every game: one drawing each, in the toolbox.
- **Your art stays ours.** New art lives in the repos (shared pieces in the hub's \`shared/art/\`,
  a game's own in its repo), with a line in CREDITS.md.

## How to swap one in

Drop the new file in \`art-kit/new/<game>/<id>.svg\` (or .png) and ask Claude to put it in.
Replace as much or as little as you like; the rest keeps its current look.

## Every new game

Every new game adds its art to this list and gets a sprite sheet (a section in
\`tools/art/art-kit.mjs\`), before it ships (GOALS.md).

${all
  .map(
    ({ g, r }) => `## ${g.name}

Repo \`${g.repo}\`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
${swatches(r.tokens)}

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
${rows(r.items)}
`,
  )
  .join('\n')}`
}
