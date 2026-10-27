// A hidden door for grown-up tools, like setting progress by hand when a save is lost.
// Tap the trigger (e.g. a "Settings" heading) 5 times quickly, enter the family code, and
// onUnlock runs. Nothing is remembered: the door closes again when the game reloads.
//
//   import { hiddenUnlock } from '/shared/v1/secret.js'
//   hiddenUnlock(document.querySelector('#settings h2'), { onUnlock: () => (manual.hidden = false) })
//
// Only a fingerprint (SHA-256) of the code is stored here, not the code itself. That keeps
// players from finding it by accident; it is not real security, since the site is public.
const CODE_HASH = '0a4e3e70597a358b9447fa8a647aadf5b76dde95c8e4ab02e5f8cee6caa1cd28'
const TAPS = 5
const WITHIN_MS = 2500

async function fingerprint(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.trim()))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

export const checkCode = async (code) => (await fingerprint(code)) === CODE_HASH

export function hiddenUnlock(trigger, { onUnlock }) {
  let taps = []
  let box
  trigger.addEventListener('click', () => {
    const now = Date.now()
    taps = [...taps.filter((t) => now - t < WITHIN_MS), now]
    if (taps.length < TAPS || box) return
    taps = []
    box = document.createElement('form')
    box.className = 'hub-secret'
    box.innerHTML = `
      <input type="password" inputmode="numeric" autocomplete="off" aria-label="Code" placeholder="Code" />
      <button type="submit" class="hub-button">OK</button>`
    trigger.after(box)
    const input = box.querySelector('input')
    input.focus()
    box.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (await checkCode(input.value)) {
        box.remove()
        box = undefined
        onUnlock()
      } else {
        input.value = ''
        input.placeholder = 'Not quite. Try again'
      }
    })
  })
}
