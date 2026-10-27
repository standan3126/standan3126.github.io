// Adds a song from Melody Garden to the toolbox, so every game can play it.
//
//   node tools/add-song.mjs "GH1.melody-garden.…"  [id]
//
// The code comes from Melody Garden's "Copy code". The song is appended to SONGS in
// shared/v1/sound/styles.js with an id made from its name (or the id given).
import { readFileSync, writeFileSync } from 'node:fs'
import { readTransferCode } from '../shared/v1/save.js'
import { BASE_STYLES, STYLES } from '../shared/v1/sound/styles.js'

const [code, wantId] = process.argv.slice(2)
if (!code) {
  console.error('Usage: node tools/add-song.mjs "<song code>" [id]')
  process.exit(1)
}
const song = readTransferCode(code.trim(), 'melody-garden')
if (!BASE_STYLES.some((s) => s.id === song.from)) throw new Error(`No style called "${song.from}" in the toolbox.`)
const id = wantId || song.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
if (STYLES.some((s) => s.id === id)) throw new Error(`There's already a style with the id "${id}". Give another id.`)

const entry = { id, name: song.name, from: song.from, dials: song.dials, off: song.off, nature: song.nature }
const file = new URL('../shared/v1/sound/styles.js', import.meta.url)
const text = readFileSync(file, 'utf8')
const marker = /const SONGS = \[(.*?)\]\n/s
const [, inside] = text.match(marker)
const items = inside.trim() ? `${inside.trimEnd().replace(/,?$/, ',')}\n  ${JSON.stringify(entry)},\n` : `\n  ${JSON.stringify(entry)},\n`
writeFileSync(file, text.replace(marker, `const SONGS = [${items}]\n`))
console.log(`Added "${song.name}" as the style "${id}" (from ${song.from}).`)
