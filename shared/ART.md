# GameHub art list

Every icon, button, tile, sprite and picture in GameHub, so new art can replace it piece by piece.
Made by `tools/art/art-kit.mjs` from the live site (do not edit by hand; run it again). The
pictures and sprite sheets are in `art-kit/` on the computer that ran it (`index.html`).

## Rules for new art

- **Sizes.** Sizes are CSS pixels on a 390 px wide phone; phones run 360 to 430 px wide. iPhones
  show 3 screen pixels per CSS pixel, so **draw at 3×** ("draw at" below). Anything that says
  *scales* changes size with the screen or the zoom: draw it as **SVG** (sharp at any size), or
  at least at 3× its biggest size.
- **Formats.** SVG for icons, buttons, tiles and sprites (small, sharp, and its colours can follow
  day and night). PNG (or WebP) for paintings and photos. One file per item, named by its id
  (`corner-gear.svg`, `tile-b1.svg`).
- **Touch.** A button is at least **44×44 CSS px** (132×132 to draw). Icons sit in a 24×24 box
  inside it (72×72 to draw), lines about 2 px (6 px at 3×), with space around them.
- **Day and night.** Every game has a day look and a warm night look. **Night has no blue light:**
  every colour must have at least as much red as blue (tests check this). Give night versions
  of pictures, or draw icons in one colour so the game can tint them.
- **Emoji are the first things to replace.** They look different on every phone (Apple, Google,
  Samsung) and are coloured, often blue at night.
- **Same thing, same look.** The frame (Hub, Home, gear, ?), the coin and the Play button are shared
  by every game: one drawing each, in the toolbox.
- **Your art stays ours.** New art lives in the repos (shared pieces in the hub's `shared/art/`,
  a game's own in its repo), with a line in CREDITS.md.

## How to swap one in

Drop the new file in `art-kit/new/<game>/<id>.svg` (or .png) and ask Claude to put it in.
Replace as much or as little as you like; the rest keeps its current look.

## Every new game

Every new game adds its art to this list and gets a sprite sheet (a section in
`tools/art/art-kit.mjs`), before it ships (GOALS.md).

## GameHub (start page and app icon)

Repo `standan3126.github.io`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #f4efe4 | #1a0e06 |
| `--hub-ink` | #3b3a34 | #ffcf9a |
| `--hub-soft` | #77736a | #c98f5a |
| `--hub-panel` | rgba(255, 252, 245, 0.88) | rgba(42, 24, 12, 0.88) |
| `--hub-accent` | #6f9480 | #c9702c |
| `--hub-line` | rgba(59, 58, 52, 0.14) | rgba(255, 180, 106, 0.2) |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `app-icon-512` | App icon (home screen, Android) | PNG file | 512×512 (file) | 512×512 | Sage square, four cream tiles. Also icon-192.png (192×192). |
| `app-icon-maskable` | App icon, Android round crop | PNG file | 512×512 (file) | 512×512 | Keep the picture inside the middle 80% circle: Android crops the edges. |
| `app-icon-apple` | App icon, iPhone | PNG file | 180×180 (file) | 180×180 | No see-through parts (iPhone fills them black). |
| `game-card` | A game on the start page | CSS + emoji | 358×188 | 1074×564 |  |
| `game-icon-calm-bubbles` | Calm Bubbles's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `game-icon-melody-garden` | Melody Garden's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `game-icon-momahjong` | Momahjong's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `game-icon-quiet-words` | Quiet Words's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `game-icon-love-to-color` | Love To Color's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `game-icon-arrowhead` | Arrowhead's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `game-icon-quiet-numbers` | Quiet Numbers's icon on the start page | emoji (games.js) | 64×64 | 192×192 | Emoji look different on every phone and are coloured (blue at night). Top pick to replace. |
| `start-play` | Play link on a game card | CSS | 324×48 | 972×144 |  |

## Shared frame and buttons (every game)

Repo `standan3126.github.io (shared/v1)`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #f6f0e1 | #1a0e06 |
| `--hub-ink` | #161616 | #ffb46a |
| `--hub-panel` | rgba(251, 247, 238, 0.94) | rgba(48, 28, 14, 0.95) |
| `--hub-accent` | #161616 | #e8913f |
| `--hub-line` | rgba(60, 45, 20, 0.16) | rgba(255, 180, 106, 0.2) |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `tap-to-start` | Tap to Start card (with the Finger / Stylus question) | CSS | 342×234 | 1026×702 |  |
| `start-choice` | A choice on the start card | CSS | 138×84 | 414×252 |  |
| `corner-hub` | Hub button (top left, launch page) | SVG in code (kit.js ICONS.hub) + text | 88×44 | 264×132 | Icon drawn in a 24×24 box, 2 px lines. |
| `corner-gear` | Settings gear (top right, every page) | SVG in code (kit.js ICONS.gear) | 44×44 | 132×132 | Never moves or changes look. |
| `launch-play` | Play button (bottom, the main action) | CSS | 340×64 | 1020×192 |  |
| `book-arrow-first` | Book: first page arrow | SVG in code (book.js) | 44×44 | 132×132 |  |
| `book-arrow-prev` | Book: previous page arrow | SVG in code (book.js) | 44×44 | 132×132 |  |
| `book-arrow-next` | Book: next page arrow | SVG in code (book.js) | 44×44 | 132×132 |  |
| `book-arrow-last` | Book: last page arrow | SVG in code (book.js) | 44×44 | 132×132 |  |
| `book-tile` | Book: one puzzle tile (picked) | CSS (the game draws the picture) | 113×159 | 339×477 |  |
| `corner-home` | Home button (top left, while playing) | SVG in code (kit.js ICONS.home) + text | 100×44 | 300×132 |  |
| `corner-help` | Rules ? (under the gear, while playing) | SVG in code (kit.js ICONS.help) | 44×44 | 132×132 |  |
| `settings-panel` | Settings panel | CSS (settings.js) | 352×820 | 1056×2460 | Sliders and switches are drawn in the theme colours. |
| `coin` | Gold coin (games with coins) | CSS (kit.css .hub-coin) | 14×14 | 42×42 | One coin look for every game (user, 2026-10-28). Shown 11-18 px. |

## Calm Bubbles

Repo `standan3126.github.io (games/bubbles)`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #f4efe4 | #1a0e06 |
| `--hub-ink` | #3b3a34 | #ffcf9a |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `pond` | The pond with bubbles (whole screen) | drawn in code on a canvas | 390×844 | 1170×2532 | Bubbles are drawn, not pictures: radius 12-70 px, 10 day pastels, 8 warm night tints, a big "cluster" bubble that pops into little ones, a rare rainbow "shimmer" bubble, ripple and droplets on a pop. Replacing them means bubble pictures in 4 sizes (SVG best). |

## Melody Garden

Repo `standan3126.github.io (games/melody-garden)`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #f4efe4 | #1a0e06 |
| `--hub-ink` | #3b3a34 | #ffcf9a |
| `--hub-accent` | #6f9480 | #c9702c |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `style-card-lullaby` | Music style card: lullaby (🌙) | CSS + emoji | 174×138 | 522×414 | The emoji is the picture: a small style icon (about 28 px) would replace it. |
| `style-card-garden` | Music style card: garden (🌸) | CSS + emoji | 174×138 | 522×414 |  |
| `style-card-celtic` | Music style card: celtic (🍀) | CSS + emoji | 174×132 | 522×396 |  |
| `style-card-cafe` | Music style card: cafe (☕) | CSS + emoji | 174×132 | 522×396 |  |
| `style-card-island` | Music style card: island (🌴) | CSS + emoji | 174×133 | 522×399 |  |
| `style-card-meadow` | Music style card: meadow (🌼) | CSS + emoji | 174×133 | 522×399 |  |
| `play-button` | Play / Pause (round) | CSS + text glyph | 64×64 | 192×192 |  |
| `chip` | Player or nature-sound chip | CSS | 106×44 | 318×132 |  |
| `page` | The whole page | CSS | 390×844 | 1170×2532 |  |

## Arrowhead

Repo `arrowhead`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #faf8f3 | #1a0e06 |
| `--hub-ink` | #1c1c1c | #ffb46a |
| `--hub-accent` | #1c1c1c | #e8913f |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `path-card-simple` | Path card: Simple Arrows | CSS | 358×88 | 1074×264 |  |
| `path-card-arrowhead` | Path card: Arrowhead | CSS | 358×88 | 1074×264 |  |
| `board` | The board with arrows (whole screen) | drawn in code on a canvas | 390×844 | 1170×2532 | Arrows are drawn lines with heads (draw-simple.js / board-view.js), sized by the zoom. Replacing: an arrow head and a line style, as SVG. |
| `tool-undo` | Undo tool | text glyph ↶ | 58×67 | 174×201 |  |
| `tool-hint` | Hint tool | text glyph ✦ | 58×67 | 174×201 |  |
| `tool-burn` | Burn tool | emoji 🔥 | 58×67 | 174×201 |  |
| `tool-fit` | See all tool | text glyph ⤢ | 58×67 | 174×201 |  |

## Love To Color

Repo `love-to-color`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #f4efe4 | #1f140c |
| `--hub-ink` | #3b3a34 | #f3d2a8 |
| `--hub-accent` | #a8656a | #c9773a |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `section-tab` | Section tab (Easy / Cozy / Detailed) | CSS | 114×42 | 342×126 |  |
| `chip` | Topic chip | CSS | 93×37 | 279×111 |  |
| `picture-card` | Picture card | CSS + the picture | 173×196 | 519×588 | The 30 pictures themselves are PNG files (art/<name>/lines.png + colors.png; photos have easy/cozy/detailed). They are the game: listed in art/art.json. |
| `mode-choice` | Color by Number / Free Color choice | CSS | 174×79 | 522×237 |  |
| `start-coloring` | Start coloring button | CSS | 358×50 | 1074×150 |  |
| `icon-undo` | Undo button | SVG in code (index.html), 24×24 box | ? | ? | Shows only after the first color, so it has no picture here; same style as the zoom buttons. |
| `icon-savePhoto` | Save to Photos button | SVG in code (index.html), 24×24 box | 46×46 | 138×138 |  |
| `icon-zoomOut` | Zoom out button | SVG in code (index.html), 24×24 box | 46×46 | 138×138 |  |
| `icon-zoomFit` | Whole picture button | SVG in code (index.html), 24×24 box | 46×46 | 138×138 |  |
| `icon-zoomIn` | Zoom in button | SVG in code (index.html), 24×24 box | 46×46 | 138×138 |  |
| `coloring` | Coloring screen (whole screen) | drawn in code on a canvas + CSS palette | 390×844 | 1170×2532 |  |

## Quiet Words

Repo `quiet_words`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #efe9dc | #120800 |
| `--hub-ink` | #2e352c | #f0a000 |
| `--hub-accent` | #5f8a68 | #c86a00 |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `home` | Home with painted scenery (whole screen) | SVG drawn in code (src/theme/places: coast, desert, forest, meadow, mountain, night sky) | 390×844 | 1170×2532 | The scenery is drawn by code for each place, full screen (up to 430×932 CSS px = 1290×2796 to draw). Little animals float over it. |
| `sprite-bird` | Bird | SVG in code | 23×12 | 69×36 |  |
| `sprite-bee` | Bee | SVG in code | 27×22 | 81×66 |  |
| `sprite-fluff` | Dandelion fluff | SVG in code | 17×17 | 51×51 |  |
| `level` | A level (whole screen) | CSS + SVG wheel | 390×844 | 1170×2532 |  |
| `cell` | Letter square | CSS | 54×54 | 162×162 (scales) |  |
| `wheel` | Letter wheel | SVG in code (wheel.tsx) | 296×296 | 888×888 |  |
| `tool-shuffle` | Shuffle tool | SVG in code (ui/icons.tsx) | 55×60 | 165×180 |  |
| `tool-bonus-words` | Bonus words tool | SVG in code (ui/icons.tsx) | 55×60 | 165×180 |  |
| `tool-reveal-a-letter` | Reveal a letter tool | SVG in code (ui/icons.tsx) | 55×60 | 165×180 |  |
| `tool-reveal-a-square` | Reveal a square tool | SVG in code (ui/icons.tsx) | 55×60 | 165×180 |  |
| `tool-reveal-5-letters` | Reveal 5 letters tool | SVG in code (ui/icons.tsx) | 55×60 | 165×180 |  |
| `tool-skip` | Skip tool | SVG in code (ui/icons.tsx) | 55×60 | 165×180 |  |

## Momahjong

Repo `momahjong`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--hub-bg` | #07291e | #1a0e06 |
| `--hub-ink` | #fef3c7 | #ffcf9a |
| `--hub-accent` | #fbbf24 | #c9702c |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `board` | A board (whole screen) | CSS tiles with SVG faces | 390×844 | 1170×2532 |  |
| `tool-hint` | Hint tool | emoji 💡 + coin | 119×75 | 357×225 |  |
| `tool-shuffle` | Shuffle tool | emoji 🌪️ + coin | 119×75 | 357×225 |  |
| `tool-undo` | Undo tool | emoji 📜 + coin | 119×75 | 357×225 |  |
| `tile-b1` | Tile: 1 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) | A tile face is drawn in a 64×76 box; on screen about 50×67 at 390 px wide (smaller on big boards). Draw faces at 192×228 or as SVG. |
| `tile-b2` | Tile: 2 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b3` | Tile: 3 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b4` | Tile: 4 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b5` | Tile: 5 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b6` | Tile: 6 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b7` | Tile: 7 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b8` | Tile: 8 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-b9` | Tile: 9 Bamboo (bamboo) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w1` | Tile: Giant Panda (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w2` | Tile: Red Panda (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w3` | Tile: Golden Koi (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w4` | Tile: Sacred Crane (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w5` | Tile: Bengal Tiger (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w6` | Tile: Jade Dragon (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w7` | Tile: Lotus Bloom (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w8` | Tile: Bonsai Pine (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-w9` | Tile: Sakura Blossom (wildlife) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a1` | Tile: Imperial Pagoda (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a2` | Tile: Torii Gate (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a3` | Tile: Great Wall (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a4` | Tile: Mountain Temple (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a5` | Tile: Stone Lantern (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a6` | Tile: Moon Bridge (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a7` | Tile: Jade Pavilion (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a8` | Tile: Forbidden Palace (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-a9` | Tile: Yin-Yang Sanctuary (arch) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t1` | Tile: Festival Lantern (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t2` | Tile: Silk Fan (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t3` | Tile: Jade Teapot (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t4` | Tile: Lucky Coin (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t5` | Tile: Jade Pendant (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t6` | Tile: Wind Chime (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t7` | Tile: Origami Crane (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t8` | Tile: Wisdom Scroll (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |
| `tile-t9` | Tile: Golden Bao (treasure) | SVG in code (tiles.js getTileSVG), 64×76 box | 50×67 | 150×201 (scales) |  |

## Quiet Numbers (Sudoku and Sum Cross)

Repo `quiet_numbers`. Colours each look uses now (the page's theme tokens):

| Token | Day | Night |
|---|---|---|
| `--bg` | #f6f0e1 | #1a0e06 |
| `--paper` | #f6f0e1 | #22140a |
| `--ink` | #161616 | #ffb46a |
| `--grid-bold` | #111111 | #e0a060 |
| `--given` | #111111 | #f4d3a6 |
| `--pen` | #1f4f8f | #f0913a |
| `--note` | #6d6b66 | #b98a5c |
| `--wrong` | #c62828 | #ff5a3c |
| `--whiteout` | #ffffff | #3a2a1a |
| `--sign` | #ebe3cf | #3a2412 |
| `--lit` | #f2e2ac | #5a3a14 |

| Id | What | Made of now | On screen (CSS px) | Draw at | Notes |
|---|---|---|---|---|---|
| `game-card` | Game card on the launch page (open) | CSS | 358×387 | 1074×1161 |  |
| `level-row` | Difficulty tile | CSS | 154×58 | 462×174 |  |
| `sudoku-tile` | Book tile: Sudoku | CSS | 113×159 | 339×477 |  |
| `sudoku-board` | Sudoku play screen (whole screen) | CSS | 390×844 | 1170×2532 |  |
| `sudoku-number` | Number button (1-9) | CSS + text | 38×52 | 114×156 |  |
| `tool-erase` | Erase tool | text glyph ⌫ | 58×54 | 174×162 |  |
| `tool-whiteout` | White-out tool | CSS shape | 67×54 | 201×162 |  |
| `tool-hint` | Hint tool | text glyph ◯ | 58×54 | 174×162 |  |
| `tool-look` | Look tool (answer key) | text glyph ▤ | 58×54 | 174×162 |  |
| `rules` | Rules card | CSS | 362×715 | 1086×2145 |  |
| `sumcross-tile` | Book tile: Sum Cross | CSS | 113×159 | 339×477 |  |
| `sumcross-board` | Sum Cross play screen (whole screen) | CSS boxes | 390×844 | 1170×2532 | Boxes: number (blank or printed), sign (+ − × ÷ = √, tinted), dark hole, squared (² in the corner). Box lines 2 px. Boxes scale with the zoom. |
| `sumcross-bank-tile` | Number bank tile | CSS + text | 70×48 | 210×144 |  |
