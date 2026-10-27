// Saving, backups and moving progress between phones or apps.
//
// Every game on standan3126.github.io shares one browser storage area, so each game's keys
// start with its id ("bubbles:progress"). On iPhone every home-screen app has its own storage,
// which is why progress needs a way to travel: a transfer code, a backup file, or typing a
// checkpoint in by hand (the game decides what a checkpoint holds).
//
//   import { gameStore, makeTransferCode, readTransferCode } from '/shared/v1/save.js'
//   const store = gameStore('bubbles')
//   store.set('progress', { popped: 12 })
//   const code = makeTransferCode('bubbles', store.all())

// Small JSON values in localStorage under "<gameId>:<key>". Every access is wrapped, because
// storage can be full, blocked, or (in private browsing) missing.
export function gameStore(gameId) {
  const prefix = `${gameId}:`
  const keys = () => {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length))
    } catch {
      return []
    }
  }
  const store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(prefix + key)
        return raw === null ? fallback : JSON.parse(raw)
      } catch {
        return fallback
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(prefix + key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(prefix + key)
      } catch {}
    },
    keys,
    // Everything this game has saved, as one object (for backups and transfer codes).
    all() {
      return Object.fromEntries(keys().map((k) => [k, store.get(k)]))
    },
    // Replaces everything this game has saved. Used when restoring a backup.
    replaceAll(data) {
      for (const k of keys()) store.remove(k)
      for (const [k, v] of Object.entries(data)) store.set(k, v)
    },
  }
  return store
}

// --- Transfer codes: progress as text the player can copy and paste ---------------------------
// Format: GH1.<gameId>.<data as base64url JSON>.<checksum>. The checksum catches a code that
// was only partly copied.

const toBase64Url = (text) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (code) => {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

// FNV-1a, as 6 hex digits: plenty to notice a damaged code.
const checksum = (text) => {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6)
}

export function makeTransferCode(gameId, data) {
  const body = toBase64Url(JSON.stringify(data))
  return `GH1.${gameId}.${body}.${checksum(gameId + body)}`
}

// Returns the saved data, or throws an Error with a message fit to show the player.
export function readTransferCode(code, gameId) {
  const parts = code.replace(/\s+/g, '').split('.')
  if (parts.length !== 4 || parts[0] !== 'GH1') throw new Error("That doesn't look like a transfer code.")
  const [, id, body, sum] = parts
  if (id !== gameId) throw new Error(`That code is for a different game (${id}).`)
  if (checksum(id + body) !== sum) throw new Error('Part of the code is missing. Try copying it again.')
  try {
    return JSON.parse(fromBase64Url(body))
  } catch {
    throw new Error('Part of the code is missing. Try copying it again.')
  }
}

// --- Backup files ------------------------------------------------------------------------------

// Saves progress as a file. On phones that can share files (iPhone), opens the share sheet so
// it can go to Files, Messages or email; otherwise downloads it.
export async function saveBackupFile(gameId, data) {
  const date = new Date().toISOString().slice(0, 10)
  const name = `${gameId}-backup-${date}.json`
  const text = JSON.stringify({ game: gameId, saved: new Date().toISOString(), data }, null, 2)
  const file = new File([text], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return
    } catch (e) {
      if (e.name === 'AbortError') return // the player closed the share sheet
    }
  }
  const url = URL.createObjectURL(file)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Asks the player to pick a backup file; resolves with its data (or throws a friendly Error).
export function openBackupFile(gameId) {
  return new Promise((resolve, reject) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' })
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const backup = JSON.parse(await file.text())
        if (backup.game !== gameId) throw new Error()
        resolve(backup.data)
      } catch {
        reject(new Error("That file isn't a backup for this game."))
      }
    })
    input.click()
  })
}
