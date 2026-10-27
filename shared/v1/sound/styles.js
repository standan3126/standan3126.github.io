// Music styles for the composer (composer.js): recipes, not recordings. Made together with the
// user in Melody Garden (games/melody-garden). A game plays one with
//   sound.setStyle(STYLES.find((s) => s.id === 'garden')); sound.setMusic(true)
//
// Each style: a key (root, as a midi note), a sunny and a dreamy scale (the Mood dial picks),
// chords as scale degrees (0 = the key's own chord), tempo, beats per bar, and parts. A part
// with off: true starts switched off. dials are the style's starting dial positions.
// Never change a style a game uses without checking that game still sounds right.

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const DORIAN = [0, 2, 3, 5, 7, 9, 10]
const MAJOR_PENTATONIC = [0, 2, 4, 7, 9]
const MINOR_PENTATONIC = [0, 3, 5, 7, 10]
const YO = [0, 2, 5, 7, 9] // Japanese folk scale, bright
const IN = [0, 1, 5, 7, 8] // Japanese "in" scale, wistful

export const STYLES = [
  {
    id: 'lullaby',
    name: 'Music Box Lullaby',
    icon: '🌙',
    color: '#b7b1d8',
    blurb: 'A sleepy music box, rocking slowly',
    tempo: 66,
    meter: 3,
    root: 60,
    sunny: MAJOR,
    dreamy: DORIAN,
    chords: [0, 5, 3, 4],
    dials: { speed: 0.45, busy: 0.45, bright: 0.55, echo: 0.45, mood: 0 },
    nature: { crickets: 0.25 },
    parts: [
      { id: 'tune', label: 'Music box', kind: 'melody', instrument: 'musicBox', octave: 1, density: 0.45 },
      { id: 'rock', label: 'Harp', kind: 'arp', instrument: 'harp', octave: -1, pattern: 'waltz', density: 0.9, level: 0.7 },
      { id: 'pad', label: 'Soft pad', kind: 'chords', instrument: 'pad', octave: 0, level: 0.4 },
    ],
  },
  {
    id: 'garden',
    name: 'Japanese Garden',
    icon: '🌸',
    color: '#e3a9b5',
    blurb: 'Koto and bamboo flute by a quiet pond',
    tempo: 64,
    meter: 4,
    root: 62,
    sunny: YO,
    dreamy: IN,
    chords: [0, 0, 3, 0],
    barsPerChord: 2,
    dials: { speed: 0.45, busy: 0.45, bright: 0.5, echo: 0.55, mood: 0 },
    nature: { creek: 0.35 },
    parts: [
      { id: 'koto', label: 'Koto', kind: 'melody', instrument: 'koto', octave: 1, density: 0.45 },
      { id: 'flute', label: 'Bamboo flute', kind: 'melody', instrument: 'flute', octave: 1, density: 0.35, free: true, phrase: 8, level: 0.75 },
      { id: 'low', label: 'Low koto', kind: 'arp', instrument: 'koto', octave: -1, pattern: 'up', density: 0.3, level: 0.6 },
      { id: 'drone', label: 'Hum', kind: 'drone', instrument: 'pad', octave: -1, bars: 4, level: 0.45 },
    ],
  },
  {
    id: 'celtic',
    name: 'Celtic Harp',
    icon: '🍀',
    color: '#9cc39a',
    blurb: 'Flowing harp, like a green hillside',
    tempo: 84,
    meter: 3,
    root: 62,
    sunny: MAJOR,
    dreamy: DORIAN,
    chords: [0, 4, 5, 3],
    dials: { speed: 0.5, busy: 0.55, bright: 0.55, echo: 0.4, mood: 0 },
    nature: { birds: 0.25 },
    parts: [
      { id: 'tune', label: 'Harp tune', kind: 'melody', instrument: 'harp', octave: 1, density: 0.55 },
      { id: 'flow', label: 'Harp flow', kind: 'arp', instrument: 'harp', octave: -1, pattern: 'updown', density: 1, level: 0.75 },
      { id: 'whistle', label: 'Tin whistle', kind: 'melody', instrument: 'flute', octave: 1, density: 0.35, phrase: 8, level: 0.7, off: true },
    ],
  },
  {
    id: 'cafe',
    name: 'Rainy Café',
    icon: '☕',
    color: '#c6a383',
    blurb: 'Soft piano and brushes on a rainy day',
    tempo: 78,
    meter: 4,
    swing: 0.35,
    root: 65,
    sunny: MAJOR,
    dreamy: DORIAN,
    chords: [1, 4, 0, 5],
    dials: { speed: 0.5, busy: 0.45, bright: 0.45, echo: 0.3, mood: 0 },
    nature: { rain: 0.4 },
    parts: [
      { id: 'keys', label: 'Piano chords', kind: 'chords', instrument: 'piano', octave: 0, size: 4, hits: [0, 3], level: 0.5 },
      { id: 'tune', label: 'Piano tune', kind: 'melody', instrument: 'piano', octave: 1, density: 0.4 },
      { id: 'bass', label: 'Bass', kind: 'bass', instrument: 'bass', octave: -2, hits: [0, 4] },
      { id: 'brushes', label: 'Brushes', kind: 'beat', instrument: 'brushes', pattern: [0, 0, 1, 0.5, 0, 0, 1, 0.5] },
    ],
  },
  {
    id: 'island',
    name: 'Island Breeze',
    icon: '🌴',
    color: '#8fc6c4',
    blurb: 'Kalimba and marimba in the sunshine',
    tempo: 98,
    meter: 4,
    root: 60,
    sunny: MAJOR,
    dreamy: DORIAN,
    chords: [0, 3, 4, 3],
    dials: { speed: 0.5, busy: 0.5, bright: 0.6, echo: 0.3, mood: 0 },
    nature: { waves: 0.35 },
    parts: [
      { id: 'tune', label: 'Kalimba', kind: 'melody', instrument: 'kalimba', octave: 1, density: 0.5 },
      { id: 'bounce', label: 'Marimba', kind: 'arp', instrument: 'marimba', octave: 0, pattern: 'up', density: 0.6, level: 0.7 },
      { id: 'bass', label: 'Bass', kind: 'bass', instrument: 'bass', octave: -2, hits: [0, 3, 6] },
      { id: 'shaker', label: 'Shaker', kind: 'beat', instrument: 'shaker', pattern: [1, 0.5, 0.8, 0.5, 1, 0.5, 0.8, 0.5] },
    ],
  },
  {
    id: 'canyon',
    name: 'Canyon Flute',
    icon: '🌄',
    color: '#d9a77c',
    blurb: 'A gentle wooden flute, inspired by Native American flute music',
    tempo: 56,
    meter: 4,
    root: 66,
    sunny: MAJOR_PENTATONIC,
    dreamy: MINOR_PENTATONIC,
    chords: [0],
    dials: { speed: 0.45, busy: 0.4, bright: 0.5, echo: 0.6, mood: 1 },
    nature: { wind: 0.3 },
    parts: [
      { id: 'flute', label: 'Wooden flute', kind: 'melody', instrument: 'flute', octave: 0, density: 0.5, free: true, grace: true },
      { id: 'drone', label: 'Hum', kind: 'drone', instrument: 'pad', octave: -1, bars: 4, level: 0.45 },
      { id: 'drum', label: 'Heartbeat drum', kind: 'beat', instrument: 'frameDrum', pattern: [1, 0, 0.7, 0, 0, 0, 0, 0], level: 0.55 },
      { id: 'rattle', label: 'Rattle', kind: 'beat', instrument: 'rattle', pattern: [0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0], off: true },
    ],
  },
]
