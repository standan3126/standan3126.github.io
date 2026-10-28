# The GameHub contract

What GameHub gives every game, and what a game must do to plug in. Every game in GameHub follows
it, and every change to the toolbox keeps it. If a game needs something the contract doesn't
allow, change the contract first (and the toolbox with it), not just the game.

Contract version: **1** (2026-10-28), for toolbox `shared/v1/`.

## 1. What GameHub gives every game

| Piece | Where | What it does |
|---|---|---|
| The app | `/manifest.json`, `/sw.js` | The one installable app and its offline helper. A game is saved for offline the first time it's played (cache `game-<id>`); `warmOffline(list)` saves the rest in the background. "Free up space" deletes only `game-<id>`, never saves. |
| The frame | `shared/v1/kit.js` `gameFrame()`, `kit.css` | Hub (launch page) or Home (playing) top left; the Settings gear top right, never moving. A page that scrolls puts `hub-scrolls` on `<body>` so content fades out before the buttons. |
| The launch page | `kit.css` `.hub-launch`, `.hub-play`, `.hub-levels` | Title at the top, the game's own choices in the middle, Play and Levels pinned in the same spot in every game. |
| Tap to Start | `kit.js` `tapToStart()` | The first tap, which lets sound play on iPhone. |
| Phone layout | `kit.js` `setupPage()` | iPhone home-screen sizing (`html.ios-app`, `html.ios-solid-bar`, `--app-height`). |
| Saves | `shared/v1/save.js` `gameStore(id)` | Small saved values under `<id>:<key>`; transfer codes and backup files. |
| Settings | `shared/v1/settings.js` `SettingsPanel` | The one Settings panel: Light (Day/Night/Auto), sounds, music style, sleep timer, nature sounds, the game's own sections, Move your progress, Credits, Reset to GameHub settings, hidden grown-up tools. Its sliders and checkboxes are drawn in the game's colours, so Night has no blue. |
| GameHub settings | the gear on the start page | Every game's starting point for the shared settings (below). A game saves only what the player changed in that game; Reset goes back to GameHub's. |
| Sound | `shared/v1/sound/` `Sound` | Game sounds, nature sounds, music, the sleep timer's fade. The Music style list comes from the toolbox, so new music reaches every game at once. |
| Hidden tools | `shared/v1/secret.js` | 5 taps on the Settings heading + the family code reveal set-progress-by-hand. |
| Pan and zoom | `shared/v1/panzoom.js` | Pinch, drag and wheel zoom for a board on a canvas. |

**Shared settings** (set on GameHub, changeable per game): `light`, `nightStart`, `nightEnd`,
`volumes` (`notes`, `nature`, `music`), `muted`, `music`, `nature`. Layers, last one wins:
toolbox defaults → the game's defaults → changed on GameHub → changed in this game.

## 2. What a game must do

1. **Sit in the frame.** Use `gameFrame()`: Hub on the launch page, Home while playing, the gear
   top right on every page. Game information goes beside the gear, never in its place. A game
   with a launch page uses the `.hub-launch` layout; Play and Levels, when the game has them,
   are the toolbox's buttons in the toolbox's spot.
2. **Tap to Start** before any sound.
3. **Use the shared Settings panel.** Never build its own music, sound or light controls. Its
   own settings go in `sections`; choices that aren't settings (saved colors, the open tab) go in
   `keepOnReset`. Changes made outside the panel are saved with `panel.saveOwn()`. A game whose
   music or nature sounds *are* the game (Melody Garden) says so with `owns: ['music', 'nature']`;
   the panel then only sets how loud they are. A game whose nature sounds follow its places
   (Quiet Words) gives `placeNature` and `defaults: { nature: null }`; the player's own mix,
   or GameHub's, still wins.
4. **Have a warm night look.** Night uses warm light only (no blue), set through `data-theme` and
   the `--hub-*` colours, and follows `panel.night` (Night, or Auto at night).
5. **Keep saved data under its own name.** All games share one web address, so they share one
   storage area. A game:
   - saves small values only through `gameStore('<id>')` (keys start with `<id>:`);
   - names any IndexedDB database after itself (`<id>`), never a library's default database;
   - never reads, changes or clears another game's data, and never clears all storage;
   - uses an id from the table below; a new game adds its row first. `hub` is reserved.
6. **No manifest or service worker of its own.** GameHub's offline helper does this. A game that
   once had its own must replace it with one that removes itself and its caches.
7. **Let progress move.** Transfer code and backup file (in the panel), and hidden
   set-progress-by-hand tools if it has progress.
8. **Phones first.** Works from 360 px wide to 430×932, in the iPhone home-screen app and on
   Android; tap targets at least 44 px; plain words.
9. **Calm by design.** No ads, purchases, timers that push, fake urgency, random-prize rewards,
   or flashing. Sound goes through the toolbox `Sound` and pauses when the app is hidden.
10. **Sends nothing anywhere** and loads nothing from other servers while playing. Borrowed code,
    art and sounds are copied in, permissively licensed, and listed in `CREDITS.md`.
11. **Has tests** that `npm test` runs, against a local copy of the toolbox (`HUB_DIR` or
    `SHARED_DIR` pointing at the hub folder), covering: it starts, the frame, settings, saves.

## 3. How the toolbox changes

- **Fixes and additions** go in `shared/v1/`, as long as no game looks, sounds or saves
  differently because of them.
- **A change that alters games** goes in a new folder (`shared/v2/`). Each game moves over on its
  own, after it has been tested there. `v1` keeps working for games that haven't moved.
- **Before every push of the hub**, run `tools/test-all.sh` in the hub folder: it runs every
  game's tests against the toolbox on this computer. Push only when every game passes.
- A game that **bundles** the toolbox into its build (Quiet Words) only gets toolbox changes when
  it is rebuilt and published; test-all builds it too.
- A change to this contract gets a new contract version and a line in the log below.

## 4. Game ids and where they save

| Id | Game | Repo / path | Saves |
|---|---|---|---|
| `hub` | GameHub start page | `standan3126.github.io` | `hub:my-settings` (GameHub settings) |
| `bubbles` | Calm Bubbles | hub repo, `/games/bubbles/` | `bubbles:*` |
| `melody-garden` | Melody Garden | hub repo, `/games/melody-garden/` | `melody-garden:*` (the page's styles and songs in `garden`) |
| `arrowhead` | Arrowhead | `arrowhead` | `arrowhead:*` |
| `love-to-color` | Love To Color | `love-to-color` | `love-to-color:*` |
| `quiet-words` | Quiet Words | `quiet_words` | `quiet-words:*` (settings) and its own IndexedDB database `quiet-words` (progress, albums, photos). Saves in the shared default database were moved there on 2026-10-28. |
| `momahjong` | Momahjong | `momahjong` | `jadeSanctuary_*` in localStorage (shared on purpose with the old `momajong` site). **Not yet following rule 5**; moves under `momahjong:` when it joins the frame. |

## 5. Log

- 2026-10-28: Quiet Words joins (own database); the panel gets the sleep timer, `placeNature`,
  and drawn sliders/checkboxes (the phone's own were grey and white at night).
- 2026-10-28, version 1: first written down (the frame, the launch page, GameHub settings and
  Reset, saving under the game's name, test every game before a hub push).
