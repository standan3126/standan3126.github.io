# GameHub

Calm, ad-free games in one installable app: **https://standan3126.github.io/**

Open it on a phone and add it to the home screen (iPhone: Share → Add to Home Screen; Android: ⋮ → Install app). Every game opens inside the same app window and works offline after it has been played once.

## What's here

| Path | What it is |
|---|---|
| `index.html`, `style.css`, `app.js` | The launchpad |
| `games.js` | The list of games (the one place to add a game) |
| `manifest.json`, `sw.js`, `icons/` | What makes GameHub an installable, offline app |
| `shared/v1/` | The shared toolbox every game can use (see its README) |
| `games/bubbles/` | Calm Bubbles, a tiny test game built only from the toolbox |
| `tests/` | Phone-sized browser tests (`npm install`, then `npm test`) |
| `tools/make_icons.py` | Draws the placeholder icons |

Games too big for this repo live in their own repos and are served at `standan3126.github.io/<repo>/`, which is still inside GameHub.

## Publishing

Every push to `main` publishes through GitHub Actions (`.github/workflows/deploy.yml`). Run `npm test` first. To try it locally: `npm run serve`, then open http://localhost:8000.
