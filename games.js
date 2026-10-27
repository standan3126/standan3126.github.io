// The list of games on the launchpad. Read by both the launchpad (app.js) and the offline
// helper (sw.js), so this is the one place to add a game.
//
//   id      short name, used for its offline cache ("game-<id>") and its save keys
//   path    where the game lives; a game in its own repo is "/<repo>/"
//   status  'ready'  playable, and saved for offline by the hub
//           'soon'   shown as Coming soon; the hub leaves its address completely alone
//   test    true for the hub's own test game
self.GAMES = [
  {
    id: 'bubbles',
    name: 'Calm Bubbles',
    path: '/games/bubbles/',
    blurb: 'A tiny test game. Pop bubbles and hear soft notes.',
    icon: '🫧',
    color: '#9cc3c9',
    status: 'ready',
    test: true,
  },
  {
    id: 'momahjong',
    name: 'Momahjong',
    path: '/momahjong/',
    blurb: 'Match the tiles and clear the board.',
    icon: '🀄',
    color: '#8fb39a',
    status: 'ready',
  },
  {
    id: 'quiet-words',
    name: 'Quiet Words',
    path: '/quiet_words/',
    blurb: 'Swipe letters to fill a calm crossword.',
    icon: '🌿',
    color: '#c9b48f',
    status: 'ready',
  },
  {
    id: 'love-to-color',
    name: 'Love To Color',
    path: '/love-to-color/',
    blurb: 'Tap to fill: color by number or in your own colors.',
    icon: '🎨',
    color: '#d6a7a0',
    status: 'ready',
  },
]
