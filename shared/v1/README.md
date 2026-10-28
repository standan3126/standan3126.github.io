# GameHub toolbox, version 1

Shared pieces any GameHub game can use. They are plain JavaScript modules served from
`https://standan3126.github.io/shared/v1/`, so a game in any repo can load them:

```html
<link rel="stylesheet" href="/shared/v1/kit.css" />
<script type="module">
  import { setupPage, addExitButton, tapToStart } from '/shared/v1/kit.js'
  import { gameStore, makeTransferCode, readTransferCode } from '/shared/v1/save.js'
  import { Sound } from '/shared/v1/sound/index.js'
</script>
```

`games/bubbles/` uses most pieces. Arrowhead (its own repo) is the example of the game frame and
launch page: see "The game frame" in `../CLAUDE.md` (private) for the rules.

| File | Gives you |
|---|---|
| `kit.css` | Calm colours (`--hub-*`), the game frame and launch page layout (`.hub-corner`, `.hub-launch`, `.hub-play`, `.hub-levels`), the old Exit button, Tap to Start, the iPhone home-screen sizing fix |
| `kit.js` | `setupPage()`, `gameFrame()` (Hub/Home top left, Settings gear top right; `setPage('launch'|'play')`), `addExitButton()` (older games, until they move to the frame), `tapToStart()`, `isInstalled()`, `warmOffline()` (save a whole game for offline in the background) |
| `save.js` | `gameStore(id)` (saves with the game's name in front), transfer codes, backup files |
| `panzoom.js` | `PanZoom`: pinch/drag/wheel zoom and pan for a board drawn on a canvas, taps told apart from drags (from Love To Color; used by Arrowhead) |
| `settings.js` + `settings.css` | `SettingsPanel`: the one Settings panel every game uses, kept short: open are Light (Day/Night/Auto), Sound (sliders, Music style as one row, Mute) and the game's own sections; Nature sounds, Move your progress and Credits fold into closed dropdowns; hidden grown-up tools. Saves settings and plays them through `Sound`. Music = Quiet Words' music or any Melody Garden style. Helpers `toggle`, `slider`, `choice`, `note`. Used by Arrowhead, Calm Bubbles and Love To Color |
| `secret.js` | `hiddenUnlock()`: 5 quick taps + the family code reveal grown-up tools (set progress by hand) |
| `sound/` | `Sound`: soft marimba notes, 7 nature sounds, gentle generated music (from Quiet Words), and music styles |
| `sound/styles.js` | `STYLES`: music recipes made in Melody Garden (lullaby, Japanese garden, Celtic harp, rainy café, island, canyon flute). A game plays one with `sound.setStyle(style, dials)` + `sound.setMusic(true)` |
| `sound/composer.js`, `sound/instruments.js` | The composer that plays a style live (never repeats) and its instruments: music box, kalimba, marimba, harp, koto, soft piano, pad, wooden flute, bass, soft drum, shaker, rattle, brushes |

## Rules

- **Version 1 never changes in a way that breaks a game.** Fixes and additions are fine. A
  change that would alter how existing games look, sound or save goes in `shared/v2/`, and each
  game moves over when it has been tested.
- If a piece doesn't fit a game, the game keeps its own copy and changes that. Note it in the
  game's CLAUDE.md under "Shared toolbox use".
- No sound or image files yet. When shared files arrive they go in `shared/sounds/` and
  `shared/images/`, with their source and licence noted next to them.
